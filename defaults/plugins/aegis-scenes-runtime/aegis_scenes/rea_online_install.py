"""Pinned official upstream downloads. Invoked only by an admin-authorized task."""
from pathlib import Path
import os,sys,subprocess,hashlib,tarfile,zipfile,json,shutil
ROOT=Path('/opt/aegis-rea')
ARTIFACTS=[
 ('node.tar.xz','https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-x64.tar.xz','6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6','node'),
 ('jdk.tar.gz','https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.13_9.tar.gz','d7f5d5cf865a2902b70ff549b97586a7d3f234e016f041ab447ea740c7d66d1c','jdk'),
 ('ghidra.zip','https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.4_build/ghidra_12.1.4_PUBLIC_20260921.zip','ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db','ghidra')]
def download(url,path,digest):
 if path.is_file() and hashlib.file_digest(path.open('rb'),'sha256').hexdigest()==digest:return
 part=path.with_suffix(path.suffix+'.part');print('Downloading '+path.name,flush=True)
 subprocess.run(['curl','-fL','--proto','=https','--retry','3','--connect-timeout','25','--max-time','900','-o',str(part),url],check=True,stdout=subprocess.DEVNULL)
 if hashlib.file_digest(part.open('rb'),'sha256').hexdigest()!=digest:part.unlink();raise ValueError('下载文件 SHA-256 不匹配')
 part.replace(path)
def main():
 import platform
 if sys.platform!='linux' or os.geteuid()!=0 or platform.machine()!='x86_64':raise SystemExit('Requires root Linux x64/WSL2')
 cache=ROOT/'downloads';runtime=ROOT/'runtime';cache.mkdir(parents=True,exist_ok=True);runtime.mkdir(exist_ok=True)
 for name,url,digest,alias in ARTIFACTS:
  p=cache/name;download(url,p,digest)
  if not (runtime/alias).exists():
   dest=runtime/(alias+'-install');dest.mkdir(exist_ok=True)
   if name.endswith('.zip'):
    with zipfile.ZipFile(p) as z:
     for i in z.infolist():
      target=(dest/i.filename).resolve();target.relative_to(dest.resolve())
      if i.external_attr>>16&0o170000==0o120000:raise ValueError('Unexpected zip symlink')
     z.extractall(dest)
     for i in z.infolist():
      f=dest/i.filename
      if f.is_file() and i.external_attr>>16:f.chmod((i.external_attr>>16)&0o755)
   else:
    with tarfile.open(p) as t:t.extractall(dest,filter='data')
   directories=[d for d in dest.iterdir() if d.is_dir()]
   if len(directories)!=1:raise ValueError('Unexpected runtime layout')
   (runtime/alias).symlink_to(directories[0],target_is_directory=True)
 env=os.environ.copy();env['PATH']=str(runtime/'node/bin')+os.pathsep+env.get('PATH','')
 subprocess.run([str(runtime/'node/bin/npm'),'install','--prefix',str(runtime/'rea'),'--omit=dev','--ignore-scripts','--no-audit','--no-fund','rea-agents@6.8.0'],env=env,check=True,timeout=600)
 import pwd
 try:pwd.getpwnam('aegis-rea')
 except KeyError:subprocess.run(['useradd','--system','--create-home','--home-dir','/var/lib/aegis-rea','--shell','/usr/sbin/nologin','aegis-rea'],check=True)
 Path('/var/lib/aegis-rea/jobs').mkdir(parents=True,exist_ok=True,mode=0o750)
 setup=ROOT/'environment.py';setup.write_text("import subprocess\nfrom pathlib import Path\nif not Path('/run/netns/aegis-rea-analysis').exists():subprocess.run(['/usr/sbin/ip','netns','add','aegis-rea-analysis'],check=True)\nsubprocess.run(['/usr/sbin/ip','netns','exec','aegis-rea-analysis','/usr/sbin/ip','link','set','lo','up'],check=True)\n")
 subprocess.run([sys.executable,str(setup)],check=True)
 if Path('/run/systemd/system').is_dir():
  unit=Path('/etc/systemd/system/aegis-rea-environment.service');unit.write_text('[Unit]\nDescription=AegisOps REA worker environment\nAfter=local-fs.target\n[Service]\nType=oneshot\nExecStart=/usr/bin/python3 /opt/aegis-rea/environment.py\nRemainAfterExit=yes\n[Install]\nWantedBy=multi-user.target\n')
  subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','enable','--now',unit.name],check=True)
 (ROOT/'runtime-manifest.json').write_text(json.dumps({'artifacts':ARTIFACTS,'rea':'6.8.0'}));print('Environment installed; verify status before using',flush=True)
if __name__=='__main__':main()
