import json,time
from types import SimpleNamespace
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from aegisops.auth.context import AuthUser
from aegis_scenes import incident as ir,incident_sources as src

@pytest.fixture
def env(tmp_path,monkeypatch):
 monkeypatch.setenv('AEGIS_IR_DATA',str(tmp_path))
 options=[{'id':'dev-waf-1','name':'测试WAF一号','storage_key':'360_waf_v5_5','adapter':'360_waf','query_supported':True},{'id':'dev-other','name':'其他厂商设备','storage_key':'unadapted_device','adapter':None,'query_supported':False}]
 async def devices():return options
 monkeypatch.setattr(src,'devices',devices)
 app=FastAPI()
 @app.middleware('http')
 async def auth(request,call_next):request.state.auth_user=AuthUser(id='test-admin',username='admin',role='admin');return await call_next(request)
 ir.register(app);c=TestClient(app)
 data={'title':'来源绑定隔离验证','description':'测试真实设备关联规则','target':'192.0.2.10','source':'198.51.100.10','first_time':int(time.time())-60,'source_device_id':'dev-waf-1','start_investigation':False}
 return c,data

def test_creation_requires_explicit_source_and_no_spoofed_snapshot(env):
 c,data=env
 r=c.post('/api/scenes/incident/cases',json={k:v for k,v in data.items() if k!='source_device_id'});assert r.status_code==422
 r=c.post('/api/scenes/incident/cases',json={**data,'_source_device':{'id':'attacker-device'}});assert r.status_code==200,r.text
 cid=r.json()['id'];item=c.get('/api/scenes/incident/cases/'+cid).json();source=json.loads(item['alert'])['_source_device'];assert source['id']=='dev-waf-1' and source['binding_origin']=='manual_creation'
 assert item['status_actions'][0]['action']=='start'

def test_binding_audit_stale_and_unknown_protection(env):
 c,data=env;cid=c.post('/api/scenes/incident/cases',json=data).json()['id'];url=f'/api/scenes/incident/cases/{cid}/source'
 assert c.post(url,json={'device_id':'dev-missing','note':'核对事件来源','expected_device_id':'dev-waf-1'}).status_code==422
 assert c.post(url,json={'device_id':'dev-other','note':'核对日志来源后重新绑定','expected_device_id':'old'}).status_code==409
 assert c.post(url,json={'device_id':'dev-other','note':'核对日志来源后重新绑定','expected_device_id':'dev-waf-1'}).status_code==200
 with pytest.raises(ValueError,match='尚无.*日志适配'):src.collect_logs(cid)
 with ir.db() as con:assert con.execute("SELECT count(*) FROM evidence WHERE case_id=? AND kind='source_binding'",(cid,)).fetchone()[0]==1

def test_waf_query_is_bound_to_device_and_event_window(env,monkeypatch):
 c,data=env;cid=c.post('/api/scenes/incident/cases',json=data).json()['id'];captured={}
 from aegisops.tool.registry import ToolRegistry,ToolResult
 async def init():pass
 async def execute(name,ctx,**kwargs):captured.update(name=name,**kwargs);return ToolResult(success=True,output={'data':[{'event':'test-only'}]})
 monkeypatch.setattr(ToolRegistry,'init_async',init);monkeypatch.setattr(ToolRegistry,'execute',execute)
 src.collect_logs(cid)
 assert captured['name']=='360_waf_observability' and captured['device_id']=='dev-waf-1'
 assert captured['server_ip']==data['target'] and captured['client_ip']==data['source'] and captured['limit']==500
 assert 'time_start' in captured and 'time_end' in captured
 with ir.db() as con:r=con.execute("SELECT * FROM evidence WHERE case_id=? AND kind='device_logs'",(cid,)).fetchone()
 assert json.loads(r['metadata'])['device_id']=='dev-waf-1' and '测试WAF一号' in r['label']

def test_unbound_legacy_case_does_not_query_default(env,monkeypatch):
 _,data=env;cid=ir.create_manual(data,'admin')
 with pytest.raises(ValueError,match='尚未明确来源设备'):src.collect_logs(cid)
 with ir.db() as con:assert con.execute("SELECT count(*) FROM evidence WHERE case_id=? AND kind='device_logs'",(cid,)).fetchone()[0]==0
