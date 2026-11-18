"""Administrator grants and observable optional investigation jobs."""
import asyncio,json,time,uuid,subprocess,sys,os,signal
from pathlib import Path
from aegisops.server.auth import require_admin

async def payload(request):
 from fastapi import HTTPException
 try:
  data=await request.json()
  if not isinstance(data,dict):raise ValueError()
  return data
 except Exception:raise HTTPException(422,'请求格式无效')

def initialize():
 from . import incident as ir
 with ir.db() as db:
  db.execute('CREATE TABLE IF NOT EXISTS optional_grants(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,case_id TEXT,host_id TEXT,expires REAL,used INTEGER DEFAULT 0)')
  db.execute('CREATE TABLE IF NOT EXISTS optional_jobs(id TEXT PRIMARY KEY,owner TEXT,kind TEXT,status TEXT,result TEXT,updated TEXT)')
  db.execute("UPDATE optional_jobs SET status='interrupted' WHERE status IN ('queued','running')")

def authorize(owner,kind,cid='',hid=''):
 from . import incident as ir
 if kind not in {'rea_install','solar_collect'}:raise ValueError('不支持此操作')
 if kind=='solar_collect':
  from .incident_solar import validate_target
  validate_target(cid,hid)
 ident=uuid.uuid4().hex
 with ir.db() as db:db.execute('INSERT INTO optional_grants VALUES(?,?,?,?,?,?,0)',(ident,owner,kind,cid,hid,time.time()+900))
 return {'authorization_id':ident,'operation':kind,'case_id':cid,'host_id':hid,'expires_in':900}

def consume(owner,ident,kind):
 from . import incident as ir
 with ir.db() as db:
  db.execute('BEGIN IMMEDIATE');row=db.execute('SELECT * FROM optional_grants WHERE id=?',(ident,)).fetchone()
  if not row or row['owner']!=owner or row['kind']!=kind or row['used'] or row['expires']<time.time():raise ValueError('授权无效或已过期，请回到工作台重新确认')
  db.execute('UPDATE optional_grants SET used=1 WHERE id=?',(ident,));return dict(row)

def save(ident,owner,kind,status,result):
 from . import incident as ir
 with ir.db() as db:db.execute('INSERT OR REPLACE INTO optional_jobs VALUES(?,?,?,?,?,?)',(ident,owner,kind,status,json.dumps(result,ensure_ascii=False),ir.now()))

def jobs(owner):
 from . import incident as ir
 with ir.db() as db:rows=db.execute('SELECT * FROM optional_jobs WHERE owner=? ORDER BY updated DESC LIMIT 20',(owner,)).fetchall()
 return [{**dict(r),'result':json.loads(r['result'])} for r in rows]

def enqueue(owner,kind,authorization_id):
 from . import incident as ir
 with ir.db() as db:
  if db.execute("SELECT 1 FROM optional_jobs WHERE kind=? AND status IN ('running','queued')",(kind,)).fetchone():raise ValueError('同类任务正在处理，请查看进度')
 grant=consume(owner,authorization_id,kind);ident=uuid.uuid4().hex
 save(ident,owner,kind,'queued',{'message':'任务已排队'})
 async def execute():
  save(ident,owner,kind,'running',{'message':'正在下载并验证运行环境' if kind=='rea_install' else '正在采集，原始输出将归档'})
  try:
   if kind=='rea_install':result=await install_rea(ident)
   else:
    from .incident_solar import collect
    result=await collect(grant['case_id'],grant['host_id'],owner)
   save(ident,owner,kind,'completed' if not result.get('partial') else 'partial',result)
  except Exception as exc:save(ident,owner,kind,'failed',{'message':str(exc)[:500] if isinstance(exc,ValueError) else '执行未完成，请检查安装日志或主机连接；已有证据保留'})
 task=asyncio.create_task(execute());ir.tasks.add(task);task.add_done_callback(ir.tasks.discard)
 return {'job_id':ident,'status':'queued'}

async def install_rea(ident):
 from . import incident as ir
 if sys.platform!='linux' or not hasattr(os,'geteuid') or os.geteuid()!=0:raise ValueError('此隔离 REA worker 需要 Linux x64/WSL2 管理员环境；请由 Atlas 检查部署方式，原生 Windows 暂不能直接安装')
 script=Path(__file__).with_name('rea_online_install.py');folder=ir.root()/'install-jobs';folder.mkdir(exist_ok=True)
 log=folder/(ident+'.log')
 with log.open('wb') as stream:
  proc=await asyncio.create_subprocess_exec(sys.executable,str(script),stdout=stream,stderr=stream,start_new_session=True)
  try:code=await asyncio.wait_for(proc.wait(),2400)
  except asyncio.TimeoutError:
   os.killpg(proc.pid,signal.SIGTERM)
   try:await asyncio.wait_for(proc.wait(),10)
   except asyncio.TimeoutError:os.killpg(proc.pid,signal.SIGKILL);await proc.wait()
   raise ValueError('REA 安装超时，可重试；已校验下载会缓存复用')
 if code:raise ValueError('REA 安装未完成，请查看安装日志；不会报告为已安装')
 from aegis_rea.engine import status
 state=status()
 if not state['ready']:raise ValueError('安装命令结束但运行环境自检未通过')
 return {'message':'REA 已安装并通过环境自检','environment':state,'log_id':ident}

def register(router):
 from fastapi import Request,HTTPException
 from . import incident as ir
 initialize()
 @router.get('/api/scenes/incident/optional/jobs')
 async def list_jobs(request:Request):return jobs(require_admin(request).username)
 @router.get('/api/scenes/incident/optional/jobs/{jid}/log')
 async def installation_log(jid:str,request:Request):
  owner=require_admin(request).username
  if not any(x['id']==jid for x in jobs(owner)):raise HTTPException(404,'安装任务不存在')
  if len(jid)!=32 or not all(c in '0123456789abcdef' for c in jid):raise HTTPException(404,'无效编号')
  p=ir.root()/'install-jobs'/(jid+'.log')
  return {'text':p.read_text(errors='replace')[-24000:] if p.is_file() else '尚无安装日志'}
 @router.post('/api/scenes/incident/optional/authorize')
 async def grant(request:Request):
  user=require_admin(request);data=await payload(request)
  if data.get('confirmed') is not True:raise HTTPException(422,'需要明确授权')
  try:return authorize(user.username,data.get('operation'),data.get('case_id',''),data.get('host_id',''))
  except ValueError as exc:raise HTTPException(422,str(exc))
 @router.post('/api/scenes/incident/optional/run')
 async def run(request:Request):
  user=require_admin(request);data=await payload(request)
  if data.get('operation') not in {'rea_install','solar_collect'}:raise HTTPException(422,'无效操作')
  try:return enqueue(user.username,data['operation'],data.get('authorization_id',''))
  except ValueError as exc:raise HTTPException(422,str(exc))
