import time,hashlib
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from aegis_scenes import incident as ir
from aegis_scenes import incident_lifecycle as lc
from aegisops.auth.context import AuthUser

@pytest.fixture
def env(tmp_path,monkeypatch):
 monkeypatch.setenv('AEGIS_IR_DATA',str(tmp_path));ir.initialize();app=FastAPI()
 @app.middleware('http')
 async def identity(request,call_next):
  role=request.headers.get('x-test-role','admin')
  if role!='anonymous':request.state.auth_user=AuthUser(id='test-'+role,username=role,role=role)
  return await call_next(request)
 lc.register(app);client=TestClient(app)
 cid=ir.create_manual({'title':'生命周期隔离验证','description':'用于测试事件状态，不连接主机','target':'192.0.2.10','first_time':int(time.time())},'admin')
 return client,cid

def post(c,cid,action,note='核实当前调查结果并记录依据',status=None):
 return c.post(f'/api/scenes/incident/cases/{cid}/status',json={'action':action,'note':note,'expected_status':status or ir.case(cid)['status']})

def test_full_lifecycle_archive_reopen_and_audit(env):
 c,cid=env
 assert post(c,cid,'start').status_code==200
 assert ir.case(cid)['status']=='investigating'
 assert post(c,cid,'submit_review').status_code==409
 report='# 隔离验证报告\n\n证据不足，需要人工复核。'
 with ir.db() as con:con.execute('UPDATE cases SET report=? WHERE id=?',(report,cid))
 assert post(c,cid,'submit_review').status_code==200
 assert post(c,cid,'close').status_code==200
 item=ir.case(cid);assert item['status']=='closed' and item['closed_at'] and item['closed_by']=='admin'
 assert item['closed_report_sha256']==hashlib.sha256(report.encode()).hexdigest()
 with pytest.raises(ValueError,match='归档'):lc.require_writable(cid)
 assert post(c,cid,'close').status_code==409
 assert post(c,cid,'reopen').status_code==200
 assert ir.case(cid)['closed_at'] is None
 lc.require_writable(cid)
 with ir.db() as con:events=con.execute("SELECT * FROM events WHERE case_id=? AND stage='lifecycle'",(cid,)).fetchall()
 assert len(events)==4 and all(e['actor']=='admin' for e in events)
 assert any('归档报告 SHA-256' in e['message'] for e in events)

def test_permission_validation_stale_and_busy(env):
 c,cid=env
 for role,code in [('anonymous',401),('user',403)]:
  assert c.post(f'/api/scenes/incident/cases/{cid}/status',headers={'x-test-role':role},json={'action':'start','note':'确认开始调查','expected_status':'new'}).status_code==code
 assert post(c,cid,'start',note='   ').status_code==422
 assert post(c,cid,'close').status_code==409
 ir.running.add(cid)
 try:assert post(c,cid,'start').status_code==409
 finally:ir.running.discard(cid)
 assert post(c,cid,'start').status_code==200
 assert post(c,cid,'submit_review',status='new').status_code==409
 assert ir.case(cid)['status']=='investigating'

def test_automatic_followup_does_not_claim_completion(env):
 _,cid=env;lc.begin_followup(cid,'collector');assert ir.case(cid)['status']=='investigating'
 lc.begin_followup(cid,'collector')
 with ir.db() as c:assert c.execute("SELECT COUNT(*) FROM events WHERE case_id=? AND stage='lifecycle'",(cid,)).fetchone()[0]==1
 assert not next(a for a in lc.available(ir.case(cid)) if a['action']=='submit_review')['enabled']

