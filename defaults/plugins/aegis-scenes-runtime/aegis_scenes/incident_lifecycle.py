"""Manual review lifecycle, separate from the state of actual investigation jobs."""
import hashlib
from typing import Literal
from pydantic import BaseModel,Field
from fastapi import HTTPException,Request
from aegisops.server.auth import require_admin
from . import incident as ir

ACTIONS={
 'start':({'new','queued'},'investigating','开始调查','登记开始跟进；设备查询与远程调查仍需在对应功能中启动。'),
 'submit_review':({'investigating'},'review','提交复核','提交当前报告供复核；需先生成响应报告。'),
 'continue':({'review','failed','interrupted'},'investigating','继续调查','退回或恢复调查，已有报告与证据保留，更新后可再次提交复核。'),
 'close':({'review'},'closed','复核通过并归档','确认已复核报告与证据，将事件归档；归档后保留查询和下载功能。'),
 'reopen':({'closed'},'investigating','重新打开','重新进入调查状态，保留此前的归档与复核记录。'),
}
NAMES={'new':'待启动','queued':'待调查','investigating':'调查中','running':'执行中','review':'待复核','failed':'执行失败','interrupted':'已中断','closed':'已归档'}

def available(item):
 if item['id'] in ir.running or item['status']=='running':return []
 return [{'action':key,'label':v[2],'description':v[3],'target':v[1],'needs_report':key in {'submit_review','close'},'enabled':bool(item.get('report')) or key not in {'submit_review','close'}} for key,v in ACTIONS.items() if item['status'] in v[0]]

def require_writable(cid):
 if ir.case(cid)['status']=='closed':raise ValueError('事件已归档，请先重新打开再开展调查或修改报告')

def begin_followup(cid,actor):
 with ir.db() as c:
  old=c.execute('SELECT status FROM cases WHERE id=? AND deleted_at IS NULL',(cid,)).fetchone()
  if old and old['status'] in {'new','queued','failed','interrupted'}:
   c.execute("UPDATE cases SET status='investigating',status_changed_at=? WHERE id=?",(ir.now(),cid))
   c.execute('INSERT INTO events(case_id,at,stage,status,message,actor) VALUES(?,?,?,?,?,?)',(cid,ir.now(),'lifecycle','investigating','已开始跟进取证或报告处理；不代表调查已完成。',actor))

def transition(cid,action,expected,note,actor):
 note=note.strip()
 if action not in ACTIONS:raise HTTPException(422,'不支持的状态操作')
 if not 3<=len(note)<=2000:raise HTTPException(422,'请填写3至2000字的操作说明')
 if cid in ir.running:raise HTTPException(409,'事件正在执行调查或处理证据，请等待任务结束')
 with ir.db() as c:
  c.execute('BEGIN IMMEDIATE')
  row=c.execute('SELECT * FROM cases WHERE id=? AND deleted_at IS NULL',(cid,)).fetchone()
  if row is None:raise HTTPException(404,'事件不存在')
  old=dict(row);allowed,target,label,_=ACTIONS[action]
  if old['status']!=expected:raise HTTPException(409,'状态已变化，请刷新后重试')
  if old['status'] not in allowed:raise HTTPException(409,'当前状态不允许该操作')
  if action in {'close','submit_review'} and not old['report'].strip():raise HTTPException(409,'请先按最新证据生成响应报告，再提交复核或归档')
  stamp=ir.now();digest=hashlib.sha256(old['report'].encode()).hexdigest() if target=='closed' else None
  c.execute('UPDATE cases SET status=?,status_changed_at=?,closed_at=?,closed_by=?,closed_report_sha256=? WHERE id=?',(target,stamp,stamp if target=='closed' else None,actor if target=='closed' else None,digest,cid))
  message=f'{label}：{NAMES[old["status"]]} → {NAMES[target]}。说明：{note}'
  if digest:message+='。归档报告 SHA-256：'+digest
  c.execute('INSERT INTO events(case_id,at,stage,status,message,actor) VALUES(?,?,?,?,?,?)',(cid,stamp,'lifecycle',target,message,actor))
 return {'ok':True,'status':target,'closed_at':stamp if target=='closed' else None}

class StatusChange(BaseModel):
 action:Literal['start','submit_review','continue','close','reopen']
 expected_status:str
 note:str=Field(min_length=3,max_length=2000)

def register(router):
 with ir.db() as c:
  columns={r[1] for r in c.execute('PRAGMA table_info(cases)')}
  for name in ['status_changed_at','closed_at','closed_by','closed_report_sha256']:
   if name not in columns:c.execute('ALTER TABLE cases ADD COLUMN '+name+' TEXT')
 @router.post('/api/scenes/incident/cases/{cid}/status')
 async def update_status(cid:str,data:StatusChange,request:Request):
  user=require_admin(request)
  return transition(cid,data.action,data.expected_status,data.note,user.username)
