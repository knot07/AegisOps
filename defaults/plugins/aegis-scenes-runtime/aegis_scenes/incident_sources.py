"""Bind each incident to its actual alert source; never choose another default device."""
import asyncio,hashlib,json,time,ipaddress,uuid
from datetime import datetime,timezone,timedelta
from fastapi import Request,HTTPException
from aegisops.server.auth import require_admin
from . import incident as ir

SERVICE_ID='service:triage-tdp'
TDP_KEYS={'tdp_api','tdp_api_v3_3_10'}

def signature(url):return hashlib.sha256(str(url).rstrip('/').encode()).hexdigest()

def source_for_connection(conn):
 name='态势感知服务连接';storage_key='tdp_api_v3_3_10'
 if conn.device_id:
  cfg,_=ir.tdp_modules();row=cfg._load_tdp_device_instance(cfg._default_device_db_path(),preferred_device_id=conn.device_id)
  name=row.get('_device_name') or '态势感知设备';storage_key=row.get('_storage_key') or storage_key
 return {'id':conn.device_id or SERVICE_ID,'name':name,'storage_key':storage_key,'adapter':'tdp','endpoint_sha256':signature(conn.base_url),'binding_origin':'alert_ingestion'}

def adapter(key):
 if key in TDP_KEYS:return 'tdp'
 if key=='360_waf_v5_5':return '360_waf'
 return None

async def devices():
 from aegisops.tool.device.store import list_devices
 rows=await list_devices()
 result=[{'id':d.id,'name':d.name,'storage_key':d.storage_key,'adapter':adapter(d.storage_key),'query_supported':adapter(d.storage_key) is not None} for d in rows if d.enabled]
 try:
  cfg,_=ir.tdp_modules()
  from aegisops.config.config import Config
  conn=await asyncio.to_thread(cfg.load_aegisops_connection,config_path=Config.get_config_file(),secret_getter=lambda key,default=None:ir.secret(key) or default)
  if not conn.device_id:result.insert(0,{**source_for_connection(conn),'query_supported':True})
 except Exception:pass
 return result

async def describe(did):
 if not did:raise ValueError('请明确选择本事件的来源设备')
 item=next((d for d in await devices() if d['id']==did),None)
 if not item:raise ValueError('来源设备不存在、已停用或连接配置无效，请重新选择')
 return {k:v for k,v in item.items() if k!='query_supported'}

def bound(item):
 source=json.loads(item['alert']).get('_source_device')
 if not isinstance(source,dict) or not source.get('id'):raise ValueError('本事件尚未明确来源设备，请先选择对应的态势感知或告警设备')
 return source

def tdp_connection(source):
 cfg,_=ir.tdp_modules()
 getter=lambda key,default=None:ir.secret(key) or default
 if source['id']==SERVICE_ID:
  from aegisops.config.config import Config
  conn=cfg.load_aegisops_connection(config_path=Config.get_config_file(),secret_getter=getter)
  if conn.device_id:raise ValueError('原态势感知服务连接已变化，请重新确认来源设备')
  if not source.get('endpoint_sha256') or signature(conn.base_url)!=source['endpoint_sha256']:raise ValueError('原设备连接地址已变化，请重新确认来源设备')
  return conn
 row=cfg._load_tdp_device_instance(cfg._default_device_db_path(),preferred_device_id=source['id'])
 if not row or row.get('_device_id')!=source['id']:raise ValueError('绑定的态势感知设备不存在或已停用')
 # Explicit device credentials only: never mix with global api_services credentials.
 try:return cfg.TdpConnection(base_url=cfg._resolved_field(row,('base_url','baseUrl'),getter),api_key=cfg._resolved_field(row,('apiKey','api_key'),getter),secret=cfg._resolved_field(row,('secret',),getter),proxy=str(row.get('proxy') or ''),verify_ssl=bool(row.get('_verify_ssl')),timeout=int(row.get('timeout') or 30),source='device_instance',device_id=source['id'])
 except Exception:raise ValueError('绑定设备的连接或凭据配置不完整，请在设备接入中检查') from None

async def waf_logs(source,item,start,end):
 from aegisops.tool.registry import ToolRegistry,ToolContext
 await ToolRegistry.init_async()
 args={'action':'waf_security_log_search','start':0,'limit':500,'time_start':datetime.fromtimestamp(start,timezone(timedelta(hours=8))).strftime('%Y/%m/%d %H:%M:%S'),'time_end':datetime.fromtimestamp(end,timezone(timedelta(hours=8))).strftime('%Y/%m/%d %H:%M:%S'),'server_ip':str(ipaddress.ip_address(item['target'])),'device_id':source['id']}
 if item['source']:args['client_ip']=str(ipaddress.ip_address(item['source']))
 result=await ToolRegistry.execute('360_waf_observability',ToolContext(session_id='',message_id='incident-'+uuid.uuid4().hex,agent='atlas'),**args)
 if not result.success:raise ValueError('绑定的360 WAF日志查询失败，请检查该设备连接、凭据及日志查询权限')
 raw=result.output
 if isinstance(raw,str):
  try:raw=json.loads(raw)
  except ValueError:raw={'raw_text':raw}
 return raw,args

def collect_logs(cid):
 item=ir.case(cid);alert=json.loads(item['alert']);source=bound(item)
 current=asyncio.run(describe(source['id']))
 if current['storage_key']!=source.get('storage_key'):raise ValueError('绑定设备类型已变化，请重新确认来源设备')
 kind=adapter(current['storage_key'])
 if not kind:raise ValueError('已绑定来源设备“'+current['name']+'”，当前尚无该型号的应急关联日志适配；不会改查其他设备')
 start=max(0,int(alert['first_time'])-1800);end=min(int(time.time()),max(int(alert.get('last_time') or alert['first_time'])+1800,start+1))
 if end<=start:raise ValueError('告警时间范围无效')
 ir.event(cid,'logs','running','查询绑定来源设备：'+current['name'])
 if kind=='tdp':
  _,clientmod=ir.tdp_modules();conn=tdp_connection(source)
  ips=list(dict.fromkeys(str(ipaddress.ip_address(item[k])) for k in ['source','target'] if item[k]))
  condition=' OR '.join(f"{field} = '{ip}'" for ip in ips for field in ['net.src_ip','net.dest_ip','net.real_src_ip'])
  query={'time_from':start,'time_to':end,'sql':'('+condition+')','net_data_type':['attack','risk','action'],'size':2000,'columns':clientmod.DEFAULT_COLUMNS}
  client=clientmod.TdpClient(conn,max_rows=2000);response=client._http_transport(query);rows,total=client._extract(response)
  metadata={'returned':len(rows),'total':total,'truncated':total>len(rows)}
 else:
  response,query=asyncio.run(waf_logs(current,item,start,end));metadata={'truncated':None,'page_limit':500,'coverage':'首批最多500条，可能存在后续分页，不能据此排除其他行为'}
 ir.add_evidence(cid,'device_logs',current['name']+' · 关联 IP 日志',json.dumps(response,ensure_ascii=False,indent=2).encode(),{'query':query,'device_id':source['id'],'device_name':current['name'],'storage_key':current['storage_key'],**metadata})
 ir.event(cid,'logs','partial' if metadata.get('truncated') or kind=='360_waf' else 'completed',current['name']+'：已归档原始日志响应与查询范围。'+('查询有分页或截断边界，请结合原始证据复核。' if metadata.get('truncated') or kind=='360_waf' else ''))

def register(router):
 @router.get('/api/scenes/incident/devices')
 async def list_sources(request:Request):require_admin(request);return await devices()
 @router.post('/api/scenes/incident/cases/{cid}/source')
 async def bind_source(cid:str,request:Request):
  user=require_admin(request)
  from .incident_lifecycle import require_writable
  try:
   require_writable(cid)
   if cid in ir.running:raise HTTPException(409,'事件正在处理，请稍后更改来源设备')
   data=await request.json();source=await describe(str(data.get('device_id') or ''));note=str(data.get('note') or '').strip()
   if len(note)<3 or len(note)>2000:raise ValueError('请填写3至2000字的来源绑定依据')
   source['binding_origin']='manual_confirmation'
   with ir.db() as c:
    c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT alert FROM cases WHERE id=? AND deleted_at IS NULL',(cid,)).fetchone()
    if not row:raise HTTPException(404,'事件不存在')
    alert=json.loads(row['alert']);old=alert.get('_source_device') or {}
    if old.get('id','')!=str(data.get('expected_device_id') or ''):raise HTTPException(409,'来源设备已变化，请刷新后重试')
    alert['_source_device']=source;c.execute('UPDATE cases SET alert=? WHERE id=?',(json.dumps(alert,ensure_ascii=False),cid))
    c.execute('INSERT INTO events(case_id,at,stage,status,message,actor) VALUES(?,?,?,?,?,?)',(cid,ir.now(),'lifecycle','source_bound','来源设备已明确为：'+source['name']+'。依据：'+note,user.username))
   ir.add_evidence(cid,'source_binding','来源设备绑定记录',json.dumps({'before':old,'after':source,'note':note,'actor':user.username},ensure_ascii=False).encode())
   return {'ok':True,'source_device':source}
  except ValueError as exc:raise HTTPException(422,str(exc))
