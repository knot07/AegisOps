"""AegisOps native Windows foreground launcher. No global installation required."""
from pathlib import Path
import argparse
import ctypes
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser

BASE = Path(__file__).resolve().parent

def main():
    parser = argparse.ArgumentParser(description="AegisOps Windows launcher")
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5200)
    parser.add_argument('--data-dir', default=str(BASE / 'runtime'))
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    python = BASE / '_runtime/python/python.exe'
    node = BASE / '_runtime/node/node.exe'
    if not python.is_file() or not node.is_file():
        raise RuntimeError('Bundled runtime is missing. Extract the complete Windows portable ZIP first.')
    git = BASE / '_runtime/git/cmd/git.exe'
    if not git.is_file():
        raise RuntimeError('Bundled Git is missing. Extract the complete Windows portable ZIP first.')
    try:
        ctypes.WinDLL('msvcp140.dll')
        ctypes.WinDLL('concrt140.dll')
    except OSError:
        raise RuntimeError('Microsoft Visual C++ x64 runtime is missing. Run _runtime\\vc_redist.x64.exe, complete the Microsoft installer, then run start.cmd again.')
    os.environ['PATH'] = os.pathsep.join([str(node.parent),str(python.parent),str(git.parent),os.environ.get('PATH','')])
    os.environ['PYTHONUTF8'] = '1'
    os.environ['PYTHONUNBUFFERED'] = '1'
    # Do not inherit another Python installation's module path.
    os.environ.pop('PYTHONHOME', None)
    os.environ.pop('PYTHONPATH', None)
    if args.check:
        subprocess.run([str(python), '-P', '-c', 'import fastapi,uvicorn,aiosqlite,litellm,aegis_scenes,numpy,onnxruntime,cv2,ddddocr; print("Python dependencies: OK")'],check=True)
        subprocess.run([str(node), '--version'],check=True)
        subprocess.run([str(git), '--version'],check=True)
        compiler = BASE / 'webui/node_modules/@esbuild/win32-x64/esbuild.exe'
        subprocess.run([str(compiler), '--version'],check=True)
        if not (BASE / 'webui/dist/index.html').is_file():
            raise RuntimeError('Built frontend is missing')
        print('AegisOps Windows self-check: OK')
        return 0
    data = Path(args.data_dir).expanduser().resolve()
    data.mkdir(parents=True,exist_ok=True)
    with socket.socket() as check:
        try:check.bind((args.host,args.port))
        except OSError:
            raise RuntimeError(f'Port {args.port} is already in use. Run start.cmd --port 5201 to choose another port.')
    browser_host = '127.0.0.1' if args.host in {'0.0.0.0','::'} else args.host
    url = f'http://{browser_host}:{args.port}'
    logs = data / 'logs';logs.mkdir(exist_ok=True)
    log_path = logs / 'windows-server.log'
    print('御枢 · AegisOps / Windows', flush=True)
    print(f'Open: {url}\nData: {data}\nLog: {log_path}\nKeep this window open. Press Ctrl+C to stop.',flush=True)
    cmd = [str(python), '-P', str(BASE/'run.py'), '--host', args.host, '--port', str(args.port), '--data-dir', str(data)]
    with log_path.open('a',encoding='utf-8') as log:
        child = subprocess.Popen(cmd,cwd=BASE,env=os.environ.copy(),stdout=log,stderr=subprocess.STDOUT)
        def ready():
            for _ in range(180):
                if child.poll() is not None:return
                try:
                    with urllib.request.urlopen(url+'/api/health',timeout=2) as r:
                        result=json.load(r)
                    if result.get('status')=='healthy':
                        print('Service ready: '+url,flush=True)
                        if not args.no_browser:webbrowser.open(url)
                        return
                except Exception:time.sleep(1)
            print('Startup is taking longer than expected. Check the log file above.',flush=True)
        threading.Thread(target=ready,daemon=True).start()
        try:
            code=child.wait()
        except KeyboardInterrupt:
            try:
                child.wait(timeout=20)
            except subprocess.TimeoutExpired:
                child.terminate();child.wait(timeout=10)
            return 0
    if code:
        print(log_path.read_text(encoding='utf-8',errors='replace')[-6000:],file=sys.stderr)
        raise RuntimeError('Service exited. See log: '+str(log_path))
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as exc:
        print('ERROR: '+str(exc),file=sys.stderr)
        sys.exit(1)
