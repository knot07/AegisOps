"""AegisOps-owned GitHub updates. Never call an upstream product updater."""
import asyncio
import json
import os
from pathlib import Path
import re
import secrets
import time

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from aegisops.server.auth import require_admin
from aegisops.config.config import get_aegisops_root
from package_update import atomic_json, digest, extract_verified, dependency_compatible, version_key

router = APIRouter(prefix='/api/system-update', tags=['System update'])
REPOSITORY = 'knot07/AegisOps'
API = 'https://api.github.com/repos/' + REPOSITORY
RELEASE_VERSION = '2026.11.08'
_lock = asyncio.Lock()
_task = None
_cache = None

def install_dir():
    return Path(os.environ.get('AEGISOPS_INSTALL_DIR') or Path(__file__).resolve().parents[2]).resolve()

def runtime_dir():
    return Path(get_aegisops_root()).resolve()

def current_version():
    try:
        return json.loads((install_dir() / 'release.json').read_text())['version']
    except (OSError, ValueError, KeyError):
        return RELEASE_VERSION

def support():
    if os.environ.get('AEGISOPS_CONTAINER') == '1' or Path('/.dockerenv').exists():
        return False, 'Docker 部署请下载 Linux 包并重新构建容器，复用原有数据卷。'
    if os.environ.get('AEGISOPS_UPDATE_SUPERVISOR') != '1' or not (install_dir() / 'release.json').is_file():
        return False, '当前服务未由新版启动器托管。请先使用新版 run.py 或 start.cmd 启动；开发环境可下载更新包手动部署。'
    return True, ''

def job_state():
    try:
        data = json.loads((runtime_dir() / 'updates/state.json').read_text())
        if data.get('phase') in {'downloading', 'verifying'} and (_task is None or _task.done()):
            data.update(phase='interrupted', message='上次下载已中断，可以重新下载。')
        return data
    except (OSError, ValueError):
        return {'phase': 'idle'}

def state(**data):
    value = {**job_state(), **data, 'updated_at': time.time()}
    atomic_json(runtime_dir() / 'updates/state.json', value)
    return value

def expected_digest(release, asset):
    value = str(asset.get('digest') or '')
    if re.fullmatch(r'sha256:[a-f0-9]{64}', value):
        return value[7:]
    match = re.search(r'^SHA256 ' + re.escape(asset['name']) + r' ([a-f0-9]{64})$', release.get('body') or '', re.M)
    if not match:
        raise ValueError('该版本缺少完整性校验信息，请使用手工部署。')
    return match.group(1)

async def latest(force=False):
    global _cache
    if not force and _cache and time.monotonic() - _cache[0] < 300:
        return _cache[1]
    async with httpx.AsyncClient(timeout=20, follow_redirects=False) as client:
        response = await client.get(API + '/releases/latest', headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'AegisOps-Updater'})
        response.raise_for_status()
        release = response.json()
    version_key(release['tag_name'])
    if release.get('draft') or release.get('prerelease'):
        raise ValueError('没有可用的稳定版本')
    _cache = (time.monotonic(), release)
    return release

@router.get('/status')
async def status(request: Request):
    require_admin(request)
    allowed, reason = support()
    return {'current_version': current_version(), 'repository': 'https://github.com/' + REPOSITORY,
            'can_install': allowed, 'reason': reason, 'job': job_state()}

@router.get('/check')
async def check(request: Request, force: bool = False):
    require_admin(request)
    try:
        release = await latest(force)
        allowed, reason = support()
        return {'current_version': current_version(), 'latest_version': release['tag_name'].lstrip('v'),
                'available': version_key(release['tag_name']) > version_key(current_version()),
                'release_url': release['html_url'], 'notes': release.get('body') or '',
                'published_at': release.get('published_at'), 'can_install': allowed, 'reason': reason}
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise HTTPException(502, '暂时无法获取 GitHub 更新信息，请检查网络后重试。') from exc

async def download_and_stage(release):
    updates = runtime_dir() / 'updates'
    job = secrets.token_hex(12)
    folder = updates / job
    folder.mkdir(parents=True)
    try:
        target = release['tag_name'].lstrip('v')
        name = 'AegisOps-' + target + '-Source.zip'
        asset = next(a for a in release['assets'] if a['name'] == name)
        if not isinstance(asset.get('id'), int) or asset.get('size', 0) > 150_000_000:
            raise ValueError('更新包信息无效或超出大小限制')
        checksum = expected_digest(release, asset)
        state(phase='downloading', progress=0, message='正在下载更新包', job_id=job, target_version=target)
        archive = folder / 'download.zip'
        async with httpx.AsyncClient(timeout=httpx.Timeout(60, connect=20), follow_redirects=False) as client:
            url = API + '/releases/assets/' + str(asset['id'])
            headers = {'Accept': 'application/octet-stream', 'User-Agent': 'AegisOps-Updater'}
            # GitHub's signed redirects are accepted only on its release CDN.
            for _ in range(4):
                async with client.stream('GET', url, headers=headers) as response:
                    if response.is_redirect:
                        url = response.headers['location']
                        parsed = httpx.URL(url)
                        if parsed.scheme != 'https' or parsed.host not in {'release-assets.githubusercontent.com', 'objects.githubusercontent.com'}:
                            raise ValueError('更新下载跳转地址无效')
                        continue
                    response.raise_for_status()
                    received = 0
                    last_progress = -1
                    with archive.open('wb') as output:
                        async for chunk in response.aiter_bytes(256 * 1024):
                            received += len(chunk)
                            if received > 150_000_000:
                                raise ValueError('更新包超出大小限制')
                            output.write(chunk)
                            progress = min(94, int(received / max(asset.get('size', 1), 1) * 94))
                            if progress // 5 != last_progress:
                                state(progress=progress)
                                last_progress = progress // 5
                    break
            else:
                raise ValueError('更新下载跳转次数过多')
        state(phase='verifying', progress=95, message='正在校验文件完整性与依赖兼容性')
        staged = folder / 'package'
        await asyncio.to_thread(extract_verified, archive, checksum, staged, target)
        if not await asyncio.to_thread(dependency_compatible, install_dir(), staged):
            state(phase='manual_required', progress=100, message='新版依赖发生变化，请下载完整部署包更新。业务数据未修改。')
            return
        atomic_json(folder / 'plan.json', {'job_id': job, 'version': target, 'sha256': checksum})
        state(phase='ready', progress=100, message='校验完成，可以备份并安装。', backup=None)
    except Exception as exc:
        state(phase='failed', message=('下载或校验失败：' + str(exc))[:400], progress=0)

@router.post('/stage')
async def stage(request: Request):
    global _task
    require_admin(request)
    async with _lock:
        if _task and not _task.done():
            raise HTTPException(409, '更新包正在准备，请稍候。')
        if job_state().get('phase') in {'ready', 'restarting', 'installing'}:
            raise HTTPException(409, '已有待安装更新，请先处理当前更新。')
        try:
            release = await latest(True)
        except Exception as exc:
            raise HTTPException(502, '无法连接 GitHub，请稍后重试。') from exc
        if version_key(release['tag_name']) <= version_key(current_version()):
            raise HTTPException(409, '当前已经是最新版本。')
        state(phase='downloading', progress=0, message='准备下载更新包')
        _task = asyncio.create_task(download_and_stage(release))
        return {'started': True}

class ApplyRequest(BaseModel):
    job_id: str = Field(pattern=r'^[a-f0-9]{24}$')

@router.post('/apply')
async def apply(request: Request, payload: ApplyRequest):
    require_admin(request)
    async with _lock:
        allowed, reason = support()
        if not allowed:
            raise HTTPException(409, reason)
        job = job_state()
        if job.get('phase') != 'ready' or job.get('job_id') != payload.job_id:
            raise HTTPException(409, '更新包尚未准备好或已失效。')
        from aegisops.session.runner import SessionRunner
        import sys
        incident_module = sys.modules.get('aegis_scenes.incident')
        if incident_module and (getattr(incident_module, 'tasks', set()) or getattr(incident_module, 'running', set())):
            raise HTTPException(409, '应急调查正在执行，请等待调查任务结束后更新。')
        if SessionRunner._active_sessions:
            raise HTTPException(409, '还有正在执行的会话，请待任务结束后更新。')
        shutdown = getattr(request.app.state, 'request_update_shutdown', None)
        if not callable(shutdown):
            raise HTTPException(409, '启动器不支持自动重启，请使用新版启动方式。')
        atomic_json(runtime_dir() / 'updates/request.json', {'job_id': payload.job_id})
        state(phase='restarting', message='正在停止服务、备份并安装更新。请保持启动器运行。')
        async def stop():
            await asyncio.sleep(2)
            shutdown()
        asyncio.create_task(stop())
        return {'restarting': True}
