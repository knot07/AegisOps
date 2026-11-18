"""Verified, resumable first-run dependency setup for the Windows online package."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,urllib.request,zipfile,ctypes
BASE=Path(__file__).resolve().parent
NODE_VERSION='24.22.1'
DOWNLOADS={
 'node':('https://nodejs.org/dist/v24.22.1/node-v24.22.1-win-x64.zip','d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5'),
 'git':('https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/MinGit-2.56.1-64-bit.zip','4a92850b6e917da4fd010669b614b55dccf5b0ec333a534cc4be4700dfefdafd'),
 'pip':('https://files.pythonhosted.org/packages/44/3c/d717024885424591d5376220b5e836c2d5293ce2011523c9de23ff7bf068/pip-25.3-py3-none-any.whl','9655943313a94722b7774661c21049070f6bbb0a1516bf02f7c8d5d9201514cd'),
}

def download(kind):
    url,expected=DOWNLOADS[kind];cache=BASE/'_runtime/downloads';cache.mkdir(parents=True,exist_ok=True)
    target=cache/(url.rsplit('/',1)[1])
    if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==expected:return target
    temp=target.with_suffix(target.suffix+'.part');print('Downloading '+kind+' from official source...',flush=True)
    request=urllib.request.Request(url,headers={'User-Agent':'AegisOps-Setup/2026.11.18'})
    try:
        try:
            with urllib.request.urlopen(request,timeout=90) as response,temp.open('wb') as out:
                total=0
                while data:=response.read(1024*1024):
                    total+=len(data)
                    if total>200*1024*1024:raise RuntimeError(kind+' archive exceeded expected size limit')
                    out.write(data)
        except (OSError,TimeoutError):
            # Windows' system TLS/network stack can handle networks which reject urllib.
            curl=Path(os.environ.get('SystemRoot','C:/Windows'))/'System32/curl.exe'
            if not curl.is_file():raise
            print('Retrying '+kind+' with the Windows downloader...',flush=True)
            subprocess.run([str(curl),'--fail','--location','--retry','3','--connect-timeout','15','--max-time','240','--output',str(temp),url],check=True)
            if temp.stat().st_size>200*1024*1024:raise RuntimeError(kind+' archive exceeded expected size limit')
        if hashlib.sha256(temp.read_bytes()).hexdigest()!=expected:raise RuntimeError(kind+' SHA-256 mismatch; download was not executed')
        temp.replace(target);return target
    finally:
        if temp.exists():temp.unlink()

def extract(path,target,strip_root=False):
    target.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            parts=Path(info.filename.replace('\\','/')).parts
            if strip_root:parts=parts[1:]
            if not parts or info.is_dir():continue
            if any(p in {'..','.'} or ':' in p for p in parts):raise RuntimeError('Unsafe runtime archive path')
            dst=target.joinpath(*parts).resolve()
            if not dst.is_relative_to(target.resolve()):raise RuntimeError('Runtime archive path escaped destination')
            dst.parent.mkdir(parents=True,exist_ok=True)
            with archive.open(info) as src,dst.open('wb') as out:shutil.copyfileobj(src,out)

def ensure_runtime():
    runtime=BASE/'_runtime';python=runtime/'python/python.exe';node=runtime/'node/node.exe';git=runtime/'git/cmd/git.exe'
    if not python.is_file():raise RuntimeError('Python seed is missing. Extract the complete Windows ZIP.')
    # Embedded CPython deliberately ignores unrelated host Python installations.
    site=python.parent/'Lib/site-packages';site.mkdir(parents=True,exist_ok=True)
    (site/'aegisops-release.pth').write_text(str(BASE)+'\n'+str(BASE/'defaults/plugins/aegis-scenes-runtime')+'\n',encoding='utf-8')
    # Register the shipped source plugin without installing duplicate application code.
    metadata=site/'aegis_local_scenes-1.0.0.dist-info';metadata.mkdir(exist_ok=True)
    (metadata/'METADATA').write_text('Metadata-Version: 2.1\nName: aegis-local-scenes\nVersion: 1.0.0\n',encoding='utf-8')
    (metadata/'entry_points.txt').write_text('[aegisops.plugins]\naegis-scenes = aegis_scenes:register\naegis-rea = aegis_rea:register\n',encoding='utf-8')

    try:ctypes.WinDLL('msvcp140.dll');ctypes.WinDLL('concrt140.dll')
    except OSError:
        installer=runtime/'vc_redist.x64.exe'
        if not installer.is_file():raise RuntimeError('Microsoft VC++ runtime is required; install the official x64 runtime from https://aka.ms/vs/17/release/vc_redist.x64.exe')
        code=subprocess.run([str(installer),'/install','/passive','/norestart']).returncode
        if code not in {0,3010,1638}:raise RuntimeError('Microsoft runtime setup failed or was cancelled: '+str(code))
    if not node.is_file():extract(download('node'),node.parent,strip_root=True)
    if not git.is_file():extract(download('git'),runtime/'git')
    os.environ['PATH']=os.pathsep.join([str(node.parent),str(git.parent),str(python.parent),os.environ.get('PATH','')])
    fingerprint=hashlib.sha256((BASE/'requirements.windows.lock').read_bytes()+(BASE/'webui/package-lock.json').read_bytes()).hexdigest()
    marker=runtime/'dependencies-ready.json'
    try:ready=json.loads(marker.read_text()).get('fingerprint')==fingerprint
    except (OSError,ValueError):ready=False
    if ready:return
    print('Preparing dependencies (first run only). Progress and errors appear below; rerun start.cmd after a network interruption.',flush=True)
    pip=download('pip')
    command="import sys,runpy;sys.path.insert(0,sys.argv.pop(1));runpy.run_module('pip',run_name='__main__')"
    development={'ruff','pytest','pytest-asyncio','pytest-cov','coverage','iniconfig','pluggy'}
    requirements=runtime/'requirements-runtime.txt'
    requirements.write_text('\n'.join(line for line in (BASE/'requirements.windows.lock').read_text().splitlines() if line.split('==')[0].strip().lower() not in development)+'\n',encoding='utf-8')
    # ddddocr declares this transitive dependency separately from headless OpenCV.
    # Pin the release-tested version instead of resolving a newer untested build.
    constraints=runtime/'runtime-constraints.txt'
    constraints.write_text('opencv-python==5.0.0.93\n',encoding='utf-8')
    uv=runtime/'uv.exe'
    if uv.is_file():
        subprocess.run([str(uv),'pip','install','--python',str(python),'--target',str(site),'--index-url','https://pypi.org/simple','-r',str(requirements),'-c',str(constraints)],check=True,cwd=BASE)
    else:
        subprocess.run([str(python),'-I','-c',command,str(pip),'install','--target',str(site),'--upgrade','--disable-pip-version-check','--no-warn-script-location','--index-url','https://pypi.org/simple','-r',str(requirements),'-c',str(constraints)],check=True,cwd=BASE)
    npm=node.parent/'node_modules/npm/bin/npm-cli.js'
    subprocess.run([str(node),str(npm),'ci','--omit=dev','--no-audit','--no-fund'],cwd=BASE/'webui',check=True)
    subprocess.run([str(python),'-I','-c','import fastapi,uvicorn,aiosqlite,litellm,aegis_scenes,asyncssh,winrm,numpy,onnxruntime,cv2,ddddocr; print("Dependency imports: OK")'],check=True,cwd=BASE)
    subprocess.run([str(BASE/'webui/node_modules/@esbuild/win32-x64/esbuild.exe'),'--version'],check=True)
    marker.write_text(json.dumps({'fingerprint':fingerprint,'version':'2026.11.18'}),encoding='utf-8')
    print('Dependencies ready; subsequent launches use this local runtime.',flush=True)
