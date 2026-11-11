import json,hashlib,time
import pytest,httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from aegisops.auth.context import AuthUser
from aegis_scenes import incident as ir

@pytest.fixture
def env(tmp_path,monkeypatch):
 monkeypatch.setenv('AEGIS_IR_DATA',str(tmp_path));app=FastAPI()
 @app.middleware('http')
 async def auth(request,call_next):request.state.auth_user=AuthUser(id='test',username='admin',role='admin');return await call_next(request)
 ir.register(app);c=TestClient(app)
 cid=ir.create_manual({'title':'隔离VT接口验证','target':'192.0.2.5','source':'198.51.100.5','description':'不外发的单元测试','first_time':int(time.time())-60},'admin')
 data=b'harmless-static-fixture';eid=ir.add_evidence(cid,'sample','fixture.bin',data)
 monkeypatch.setattr(ir,'secret',lambda k:'test-key' if k=='virustotal_api_key' else None)
 calls=[];control={'status':200,'data':{'data':{'id':hashlib.sha256(data).hexdigest(),'type':'file','attributes':{'last_analysis_stats':{'malicious':2,'undetected':70}}}}}
 class FakeClient:
  def __init__(self,**kwargs):pass
  async def __aenter__(self):return self
  async def __aexit__(self,*args):pass
  async def get(self,url,**kwargs):calls.append(('GET',url,kwargs));return httpx.Response(control['status'],json=control['data'])
  async def post(self,url,**kwargs):calls.append(('POST',url,kwargs));return httpx.Response(control['status'],json=control['data'])
 monkeypatch.setattr(httpx,'AsyncClient',FakeClient)
 return c,cid,eid,calls,control

def test_query_archives_real_response_and_correct_hash(env):
 c,cid,eid,calls,_=env;r=c.post(f'/api/scenes/incident/cases/{cid}/evidence/{eid}/sandbox',json={'provider':'virustotal'})
 assert r.status_code==200,r.text
 assert r.json()['stats']['malicious']==2 and len(calls)==1
 assert calls[0][0]=='GET' and calls[0][1].startswith('https://www.virustotal.com/api/v3/files/')
 with ir.db() as db:row=db.execute("SELECT * FROM evidence WHERE kind='sandbox_report'").fetchone()
 assert json.loads(row['metadata'])['provider']=='virustotal';assert b'test-key' not in ir.verified_bytes(dict(row))

def test_upload_requires_confirmation_and_preserves_verified_bytes(env):
 c,cid,eid,calls,control=env;url=f'/api/scenes/incident/cases/{cid}/evidence/{eid}/sandbox'
 assert c.post(url,json={'provider':'virustotal','submit':True}).status_code==422;assert not calls
 control['data']={'data':{'type':'analysis','id':'job-1'}}
 r=c.post(url,json={'provider':'virustotal','submit':True,'external_upload_confirmed':True});assert r.status_code==200,r.text
 assert calls[0][2]['files']['file'][1]==b'harmless-static-fixture'
 assert '稍后' in r.json()['message']

@pytest.mark.parametrize('status,expected',[(404,'暂无'),(403,'权限'),(429,'额度')])
def test_provider_failures_never_record_success(env,status,expected):
 c,cid,eid,_,control=env;control['status']=status;control['data']={'error':{'message':'test-key'}}
 r=c.post(f'/api/scenes/incident/cases/{cid}/evidence/{eid}/sandbox',json={'provider':'virustotal'})
 assert r.status_code==422 and expected in r.text and 'test-key' not in r.text
 with ir.db() as db:assert db.execute("SELECT count(*) FROM evidence WHERE kind='sandbox_report'").fetchone()[0]==0

def test_unknown_provider_hash_mismatch_and_missing_key(env,monkeypatch):
 c,cid,eid,calls,control=env;url=f'/api/scenes/incident/cases/{cid}/evidence/{eid}/sandbox'
 assert c.post(url,json={'provider':'bad'}).status_code==422;assert not calls
 control['data']['data']['id']='0'*64
 assert c.post(url,json={'provider':'virustotal'}).status_code==422
 monkeypatch.setattr(ir,'secret',lambda k:None)
 assert c.post(url,json={'provider':'virustotal'}).status_code==422

def test_tampered_sample_cannot_be_uploaded(env):
 c,cid,eid,calls,control=env;row=ir.evidence(cid,eid)
 from pathlib import Path
 Path(row['path']).write_bytes(b'tampered')
 r=c.post(f'/api/scenes/incident/cases/{cid}/evidence/{eid}/sandbox',json={'provider':'virustotal','submit':True,'external_upload_confirmed':True})
 assert r.status_code==422 and not calls
