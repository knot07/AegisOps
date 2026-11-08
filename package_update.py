"""Verified package staging and transactional installation. Standard library only."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import time
import zipfile

VERSION_RE = re.compile(r'^v?(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\.(\d+))?$')
BLOCKED = {'runtime', '_runtime', '.venv', '.git', 'node_modules', '__pycache__'}

def version_key(value):
    match = VERSION_RE.fullmatch(str(value))
    if not match:
        raise ValueError('不支持的版本格式')
    return tuple(int(n or 0) for n in match.groups())

def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temp, path)

def safe_relative(name):
    relative = PurePosixPath(name)
    if (not name or '\\' in name or ':' in name or relative.is_absolute()
            or any(p in {'', '.', '..'} for p in name.split('/'))
            or any(p in BLOCKED or p.endswith('.egg-info') for p in relative.parts)):
        raise ValueError('更新包包含不允许的路径')
    return Path(*relative.parts)

def assert_plain_path(root, relative):
    cursor = Path(root)
    if cursor.is_symlink():
        raise ValueError('更新目录不能是符号链接')
    for part in relative.parts:
        cursor = cursor / part
        if cursor.is_symlink():
            raise ValueError('更新路径不能经过符号链接')

def read_manifest(root):
    data = json.loads((Path(root) / 'release.json').read_text(encoding='utf-8'))
    version_key(data['version'])
    if data.get('product') != 'AegisOps' or not isinstance(data.get('files'), dict) or not data['files']:
        raise ValueError('更新包标识或文件清单无效')
    for name, expected in data['files'].items():
        relative = safe_relative(name)
        assert_plain_path(root, relative)
        if not re.fullmatch('[a-f0-9]{64}', expected) or digest(Path(root) / relative) != expected:
            raise ValueError('更新文件完整性校验失败：' + name)
    for required in ['run.py', 'package_update.py', 'aegisops/server/app.py', 'webui/dist/index.html']:
        if required not in data['files']:
            raise ValueError('更新包缺少必要文件：' + required)
    return data

def extract_verified(archive, expected, destination, target):
    if not re.fullmatch('[a-f0-9]{64}', expected) or digest(archive) != expected:
        raise ValueError('下载包 SHA256 校验失败')
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=False)
    names = set()
    total = 0
    try:
        with zipfile.ZipFile(archive) as bundle:
            if len(bundle.infolist()) > 50000:
                raise ValueError('更新包文件过多')
            for info in bundle.infolist():
                if info.is_dir():
                    continue
                if not info.filename.startswith('AegisOps/'):
                    raise ValueError('更新包根目录无效')
                name = info.filename[len('AegisOps/'):]
                relative = safe_relative(name)
                mode = info.external_attr >> 16
                if stat.S_ISLNK(mode) or name.casefold() in names:
                    raise ValueError('更新包含符号链接或重复路径')
                names.add(name.casefold())
                total += info.file_size
                if total > 600_000_000 or info.file_size > 100_000_000:
                    raise ValueError('更新包解压大小超出限制')
                output = destination / relative
                output.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(info) as source, output.open('wb') as out:
                    shutil.copyfileobj(source, out)
        manifest = read_manifest(destination)
        if version_key(manifest['version']) != version_key(target):
            raise ValueError('更新包与所选版本不一致')
        if names != {n.casefold() for n in manifest['files']} | {'release.json'}:
            raise ValueError('更新包内容与清单不一致')
        return manifest
    except Exception:
        shutil.rmtree(destination)
        raise

def dependency_compatible(install, staged):
    for name in ('requirements.lock', 'requirements.windows.lock'):
        old, new = Path(install) / name, Path(staged) / name
        if not old.is_file() or not new.is_file() or digest(old) != digest(new):
            return False
    return True

def seed_plugins(install, runtime):
    """Refresh shipped files only if their previous shipped hash is unchanged."""
    source = Path(install) / 'defaults/plugins'
    target = Path(runtime) / 'plugins'
    record = Path(runtime) / 'config/bundled-files.json'
    try:
        previous = json.loads(record.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        previous = {}
    current = {}
    for path in source.rglob('*'):
        if not path.is_file() or path.is_symlink() or '__pycache__' in path.parts or any(p.endswith('.egg-info') for p in path.parts):
            continue
        relative = path.relative_to(source)
        if relative.parts[0] == 'aegis-scenes-runtime':
            continue
        dest = target / relative
        assert_plain_path(target, relative)
        key = relative.as_posix()
        value = digest(path)
        if not dest.exists() or (previous.get(key) and digest(dest) == previous[key]):
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)
            current[key] = value
        elif digest(dest) == value:
            current[key] = value
        elif key in previous:
            current[key] = previous[key]
    atomic_json(record, current)

def install_transaction(install, runtime, staged):
    """Called by the supervisor only after the server has stopped."""
    install, runtime, staged = map(Path, (install, runtime, staged))
    manifest = read_manifest(staged)
    if not dependency_compatible(install, staged):
        raise ValueError('依赖发生变化，请下载完整部署包更新')
    old = read_manifest(install)
    if version_key(manifest['version']) <= version_key(old['version']):
        raise ValueError('不能重复安装或降级')
    files = set(old['files']) | set(manifest['files']) | {'release.json'}
    for name in files:
        relative = safe_relative(name)
        assert_plain_path(install, relative)
    backup = runtime / 'updates/backups' / (old['version'] + '-' + time.strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True, exist_ok=False, mode=0o700)
    # Business files are copied after the process is stopped, including SQLite WALs.
    shutil.copytree(runtime, backup / 'data', ignore=shutil.ignore_patterns('updates', 'logs'), symlinks=True)
    existing = []
    for name in files:
        path = install / name
        if path.is_file():
            output = backup / 'app' / name
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, output)
            existing.append(name)
    atomic_json(backup / 'restore.json', {'existing': existing, 'files': sorted(files), 'version': old['version']})
    try:
        for name in manifest['files']:
            target = install / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(staged / name, target)
        for name in set(old['files']) - set(manifest['files']):
            (install / name).unlink(missing_ok=True)
        shutil.copy2(staged / 'release.json', install / 'release.json')
        seed_plugins(install, runtime)
    except Exception:
        restore_backup(install, runtime, backup)
        raise
    return backup

def restore_backup(install, runtime, backup):
    install, runtime, backup = map(Path, (install, runtime, backup))
    record = json.loads((backup / 'restore.json').read_text())
    for name in record['files']:
        relative = safe_relative(name)
        assert_plain_path(install, relative)
        path = install / relative
        if name in record['existing']:
            path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backup / 'app' / relative, path)
        else:
            path.unlink(missing_ok=True)
    # Keep recovery logs and backups themselves; restore pre-upgrade business data.
    for path in (backup / 'data').iterdir():
        output = runtime / path.name
        if output.is_symlink():
            raise ValueError('恢复路径不能是符号链接')
        if output.is_dir():
            shutil.rmtree(output)
        elif output.exists():
            output.unlink()
        if path.is_dir() and not path.is_symlink():
            shutil.copytree(path, output, symlinks=True)
        elif path.is_symlink():
            output.symlink_to(os.readlink(path))
        else:
            shutil.copy2(path, output)
