"""AegisOps package launcher with verified update handoff and automatic rollback."""
from pathlib import Path
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

def initialize(root):
    # Prefer the scene implementation shipped with this release over a bundled wheel.
    sys.path.insert(0, str(BASE/'defaults/plugins/aegis-scenes-runtime'))
    root.mkdir(parents=True, exist_ok=True)
    for key, value in {
        'AEGISOPS_ROOT': str(root), 'AEGISOPS_CONFIG_DIR': str(root/'config'),
        'AEGISOPS_DATA_DIR': str(root/'data'), 'AEGISOPS_WORKSPACE_DIR': str(root/'workspace'),
        'AEGISOPS_HUB_ROOT': str(BASE/'defaults/hub'),
        'AEGISOPS_WEBUI_DIST_DIR': str(BASE/'webui/dist'),
        'AEGISOPS_INSTALL_DIR': str(BASE),
    }.items():
        os.environ[key] = value
    for name in ['config','data','workspace','plugins']:
        (root/name).mkdir(exist_ok=True)
    from package_update import seed_plugins
    seed_plugins(BASE, root)
    config = root/'config/aegisops.json'
    if not config.exists():
        config.write_text(json.dumps({'provider': {}, 'mcp': {}, 'channels': {}, 'plugin': []}), encoding='utf-8')

def healthy(child, host, port, timeout=120):
    address = '127.0.0.1' if host in {'0.0.0.0','::'} else host
    until = time.monotonic()+timeout
    while time.monotonic()<until and child.poll() is None:
        try:
            with urllib.request.urlopen(f'http://{address}:{port}/api/health', timeout=2) as response:
                if json.load(response).get('status')=='healthy':
                    return True
        except Exception:
            pass
        time.sleep(.5)
    return False

def main():
    parser=argparse.ArgumentParser(description='御枢 · AegisOps')
    parser.add_argument('--host', default=os.getenv('AEGISOPS_HOST','127.0.0.1'))
    parser.add_argument('--port', type=int, default=int(os.getenv('AEGISOPS_PORT','5200')))
    parser.add_argument('--data-dir', default=os.getenv('AEGISOPS_ROOT',str(BASE/'runtime')))
    parser.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    args=parser.parse_args()
    root=Path(args.data_dir).expanduser().resolve()
    if args.worker:
        initialize(root)
        os.chdir(BASE)
        import uvicorn
        server=uvicorn.Server(uvicorn.Config('aegisops.server.app:app',host=args.host,port=args.port,workers=1,access_log=False))
        from aegisops.server.app import app
        app.state.request_update_shutdown=lambda:setattr(server,'should_exit',True)
        server.run()
        return 0
    from package_update import atomic_json, install_transaction, restore_backup
    root.mkdir(parents=True,exist_ok=True)
    os.environ['AEGISOPS_UPDATE_SUPERVISOR']='1'
    os.environ['AEGISOPS_INSTALL_DIR']=str(BASE)
    command=[sys.executable,'-P',str(BASE/'run.py'),'--worker','--host',args.host,'--port',str(args.port),'--data-dir',str(root)]
    child=subprocess.Popen(command,cwd=BASE)
    while True:
        try:
            code=child.wait()
        except KeyboardInterrupt:
            try:
                child.wait(timeout=20)
            except subprocess.TimeoutExpired:
                child.terminate();child.wait(timeout=10)
            return 0
        request=root/'updates/request.json'
        if not request.is_file():
            return code
        payload=json.loads(request.read_text())
        request.unlink()
        job=payload.get('job_id','')
        if len(job)!=24 or any(ch not in '0123456789abcdef' for ch in job):
            raise ValueError('Invalid update handoff')
        folder=root/'updates'/job
        state_path=root/'updates/state.json'
        state=json.loads(state_path.read_text())
        backup=None
        try:
            if state.get('job_id')!=job or state.get('phase')!='restarting':
                raise ValueError('Update handoff expired')
            atomic_json(state_path,{**state,'phase':'installing','message':'服务已停止，正在备份业务数据和安装新版本。'})
            backup=install_transaction(BASE,root,folder/'package')
            child=subprocess.Popen(command,cwd=BASE)
            if not healthy(child,args.host,args.port):
                raise RuntimeError('新版启动检查未通过')
            atomic_json(state_path,{**state,'phase':'completed','progress':100,'message':'更新完成，服务已恢复。','backup':str(backup)})
        except Exception as exc:
            if child.poll() is None:
                child.terminate()
                child.wait(timeout=20)
            if backup:
                restore_backup(BASE,root,backup)
            atomic_json(state_path,{**state,'phase':'rolled_back' if backup else 'failed','message':str(exc)+'；已恢复原版本。' if backup else str(exc),'backup':str(backup) if backup else None})
            child=subprocess.Popen(command,cwd=BASE)

if __name__=='__main__':
    sys.exit(main())
