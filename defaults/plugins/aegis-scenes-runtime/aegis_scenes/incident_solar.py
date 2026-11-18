"""Optional official Solar collector. Fixed reviewed script, never model shell."""
import asyncio,hashlib,io,json,shlex,stat,uuid,zipfile
from pathlib import PurePosixPath
from . import incident as ir

DOWNLOAD='https://admin.solarert.com/api/forensic-tools/solar-forensics-linux/download'
ZIP_SHA='33d930c13de2196c499d17af448c345f9f8b9f29d38b4ba4035c928711cdfe7f'
SCRIPT_SHA='b9228be98545b3a3248b0eacb8f3be5cfb7975d1d11da18f223f5122f38961c8'
LIMIT=20*1024*1024
TEXT={'.txt','.log','.csv','.json','.xml','.efu'}

def validate_target(cid,hid):
 from .incident_lifecycle import require_writable
 require_writable(cid);item=ir.case(cid);host=ir.load_host(hid)
 if json.loads(item['alert']).get('_demo'):raise ValueError('演示事件不可调用真实取证')
 if host['address']!=item['target']:raise ValueError('主机必须对应事件目标')
 return item,host

def inspect_zip(data):
 if len(data)>LIMIT:raise ValueError('取证包最大20MB')
 results=[];total=0
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  if len(z.infolist())>300:raise ValueError('取证包文件数量超过300')
  for info in z.infolist():
   name=info.filename.replace('\\','/');p=PurePosixPath(name)
   if p.is_absolute() or '..' in p.parts or ':' in name or '\x00' in name:raise ValueError('取证包包含非法路径')
   if stat.S_ISLNK(info.external_attr>>16):raise ValueError('取证包不能包含符号链接')
   total+=info.file_size
   if total>LIMIT or info.file_size>2*1024*1024 or (info.file_size>1024*1024 and info.file_size>max(info.compress_size,1)*200):raise ValueError('取证包解压尺寸或压缩比超出限制')
   if info.is_dir():continue
   if p.suffix.lower() not in TEXT:continue
   raw=z.read(info)
   if b'\0' in raw[:2000]:continue
   results.append((name,raw))
 if not results:raise ValueError('未找到可分析的文本取证报告；不接收或运行工具程序')
 return results

def record(cid,hid,actor,data,files,provenance,partial=False):
 archive=ir.add_evidence(cid,'forensic_bundle','Solar 原始取证包',data,{'host_id':hid,'actor':actor,'provenance':provenance,'sha256':hashlib.sha256(data).hexdigest()})
 # Give the model bounded actual text and a complete per-file inventory.
 manifest=[];ids=[];remaining=100000
 for name,raw in files:
  manifest.append({'path':name,'size':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
  if remaining<=0:continue
  text=raw.decode('utf-8','replace')[:min(remaining,16000)];remaining-=len(text)
  payload={'tool':'Solar forensics','source_file':name,'provenance':provenance,'archive_evidence_id':archive,'text':text,'truncated':len(text)<len(raw.decode('utf-8','replace'))}
  ids.append(ir.add_evidence(cid,'host_followup','Solar / '+name[:120],json.dumps(payload,ensure_ascii=False).encode(),{'host_id':hid,'archive_evidence_id':archive,'actor':actor}))
 ir.add_evidence(cid,'forensic_manifest','Solar 文件与完整性清单',json.dumps({'archive_evidence_id':archive,'files':manifest,'provenance':provenance,'partial':partial},ensure_ascii=False,indent=2).encode(),{'host_id':hid,'actor':actor})
 ir.event(cid,'host','partial' if partial else 'completed',f'Solar 取证报告已归档：{len(files)} 个文本文件；原始包及 SHA-256 已保留。',actor)
 return {'archive_evidence_id':archive,'text_evidence_ids':ids,'file_count':len(files),'partial':partial,'message':'Solar 原始报告和可供 AI 分析的文本已归档'}

async def official_script():
 import httpx
 cache=ir.root()/'collector-cache';cache.mkdir(exist_ok=True);target=cache/(ZIP_SHA+'.zip')
 if target.is_file():data=target.read_bytes()
 else:
  # Only the official download endpoint and official OSS host may redirect.
  async with httpx.AsyncClient(timeout=30,follow_redirects=False) as client:
   url=DOWNLOAD
   for _ in range(4):
    from urllib.parse import urljoin,urlsplit
    parsed=urlsplit(url)
    if parsed.scheme!='https' or parsed.hostname not in {'admin.solarert.com','solar-www.oss-cn-qingdao.aliyuncs.com'}:raise ValueError('官方下载发生了非预期重定向')
    async with client.stream('GET',url) as response:
     if response.is_redirect:url=urljoin(url,response.headers['location']);continue
     response.raise_for_status();chunks=[];size=0
     async for chunk in response.aiter_bytes():
      size+=len(chunk)
      if size>2*1024*1024:raise ValueError('官方工具包超出已审核尺寸范围')
      chunks.append(chunk)
     data=b''.join(chunks);break
   else:raise ValueError('工具下载重定向次数过多')
  if hashlib.sha256(data).hexdigest()!=ZIP_SHA:raise ValueError('官方工具版本已变化，需重新审核后更新哈希；未执行下载内容')
  target.write_bytes(data)
 if hashlib.sha256(data).hexdigest()!=ZIP_SHA:raise ValueError('缓存工具完整性校验失败')
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  candidates=[z.read(i) for i in z.infolist() if i.filename.endswith('.sh') and i.file_size<100000]
 script=next((s for s in candidates if hashlib.sha256(s).hexdigest()==SCRIPT_SHA),None)
 if not script:raise ValueError('未找到已审核的官方采集脚本')
 return script

async def collect(cid,hid,actor,*,in_pipeline=False):
 item,host=validate_target(cid,hid)
 if host['protocol']!='ssh':raise ValueError('Solar Windows 官方版为图形工具，请本机采集后导入报告 ZIP；不宣称支持无界面运行')
 if not in_pipeline:
  if cid in ir.running:raise ValueError('事件正在调查，请稍后重试')
  ir.running.add(cid)
  from .incident_lifecycle import begin_followup
  begin_followup(cid,actor)
 try:
  script=await official_script();files=[];total=0;partial=False
  async with await ir.ssh_open(host) as conn:
   identity=await conn.run('id -u',check=True,timeout=15)
   if identity.stdout.strip()!='0':raise ValueError('官方全面取证脚本需要 root 调查账号；未自动提权')
   work='/tmp/aegis-solar-'+uuid.uuid4().hex
   await conn.run('mkdir -m 700 -- '+shlex.quote(work),check=True)
   async with conn.start_sftp_client() as sftp:
    async with sftp.open(work+'/collect.sh','wb') as f:await f.write(script)
    await sftp.chmod(work+'/collect.sh',0o500)
    ir.event(cid,'host','running','Solar 官方固定脚本开始取证，目标 '+host['address']+'；限时180秒，结果保留于 '+work,actor)
    result=await conn.run('cd '+shlex.quote(work)+' && timeout --kill-after=10 180 bash ./collect.sh </dev/null >runner.log 2>&1',check=False,timeout=205)
    partial=result.exit_status!=0
    async def walk(folder,depth=0):
     nonlocal total,partial
     if depth>5:return
     async for entry in sftp.scandir(folder):
      name=entry.filename
      if name in {'.','..'} or '/' in name or '\\' in name:continue
      path=folder+'/'+name;mode=entry.attrs.permissions or 0
      if stat.S_ISDIR(mode):await walk(path,depth+1)
      elif stat.S_ISREG(mode) and PurePosixPath(name).suffix.lower() in TEXT:
       if len(files)>=200:partial=True;return
       size=entry.attrs.size or 0
       if size>2*1024*1024 or total+size>LIMIT:partial=True;continue
       async with sftp.open(path,'rb') as f:raw=await f.read(2*1024*1024+1)
       if len(raw)>2*1024*1024:partial=True;continue
       remote=await conn.run('sha256sum -- '+shlex.quote(path),check=True,timeout=15)
       if remote.stdout.split()[0]!=hashlib.sha256(raw).hexdigest():raise ValueError('远程报告在采集期间变化，校验未通过')
       total+=len(raw);files.append((path[len(work)+1:],raw))
    await walk(work)
   if not files:raise ValueError('未取得可分析报告；远端目录已保留供检查')
   out=io.BytesIO()
   with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
    for name,raw in files:archive.writestr(name,raw)
   value=record(cid,hid,actor,out.getvalue(),files,{'type':'verified_ssh_collection','target':item['target'],'tool_zip_sha256':ZIP_SHA,'script_sha256':SCRIPT_SHA,'remote_directory':work,'exit_status':result.exit_status},partial)
  if not in_pipeline:await asyncio.to_thread(ir.report,cid)
  return value
 finally:
  if not in_pipeline:ir.running.discard(cid)

def register(router):
 from fastapi import Request,HTTPException
 from aegisops.server.auth import require_admin
 @router.post('/api/scenes/incident/cases/{cid}/solar/import')
 async def import_report(cid:str,request:Request):
  user=require_admin(request);hid=request.query_params.get('host_id','')
  if request.headers.get('x-evidence-confirmed')!='true':raise HTTPException(422,'请明确确认报告来源与目标主机')
  try:validate_target(cid,hid)
  except ValueError as e:raise HTTPException(422,str(e))
  if cid in ir.running:raise HTTPException(409,'事件正在处理证据')
  raw=bytearray()
  async for chunk in request.stream():
   raw.extend(chunk)
   if len(raw)>LIMIT:raise HTTPException(413,'取证报告包最大20MB')
  try:files=inspect_zip(bytes(raw))
  except (ValueError,zipfile.BadZipFile,RuntimeError) as e:raise HTTPException(422,str(e))
  ir.running.add(cid)
  try:
   from .incident_lifecycle import begin_followup
   begin_followup(cid,user.username)
   value=record(cid,hid,user.username,bytes(raw),files,{'type':'user_supplied_report','target':ir.case(cid)['target'],'source_verified':False,'note':'管理员手工提供报告；报告内容及来源需结合其他证据核实'})
   await asyncio.to_thread(ir.report,cid);return value
  finally:ir.running.discard(cid)
