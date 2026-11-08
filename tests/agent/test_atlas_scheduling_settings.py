import json
from pathlib import Path
import pytest
from fastapi import HTTPException
from starlette.requests import Request
from aegisops.server.routes import agent as routes
from aegisops.agent import scheduling

@pytest.fixture
def isolated(monkeypatch,tmp_path):
    monkeypatch.setattr(Path,'home',classmethod(lambda cls:tmp_path))
    monkeypatch.delenv('AEGIS_AGENT_SCHEDULING',raising=False)
    return tmp_path

@pytest.mark.asyncio
async def test_roundtrip_default_and_preserve_settings(isolated,monkeypatch):
    called=[]
    monkeypatch.setattr(routes,'_require_admin_for_agent_config',lambda request:called.append(True))
    target=isolated/'.aegisops/config/agent-scheduling.json';target.parent.mkdir(parents=True)
    target.write_text(json.dumps({'mode':'legacy','other':7}))
    request=Request({'type':'http','headers':[]})
    assert (await routes.get_atlas_scheduling())['mode']=='legacy'
    assert (await routes.set_atlas_scheduling(routes.AtlasSchedulingRequest(mode='superagent'),request))['mode']=='superagent'
    assert (await routes.get_atlas_scheduling())['mode']=='superagent'
    assert json.loads(target.read_text())['other']==7
    assert called==[True]
    assert target.stat().st_mode & 0o777 == 0o600

@pytest.mark.asyncio
async def test_nonadmin_cannot_change_default(isolated,monkeypatch):
    def reject(request):raise HTTPException(403,'Admin required')
    monkeypatch.setattr(routes,'_require_admin_for_agent_config',reject)
    with pytest.raises(HTTPException) as error:
        await routes.set_atlas_scheduling(routes.AtlasSchedulingRequest(mode='superagent'),Request({'type':'http','headers':[]}))
    assert error.value.status_code==403
    assert not (isolated/'.aegisops/config/agent-scheduling.json').exists()

@pytest.mark.asyncio
async def test_managed_mode_cannot_be_silently_overridden(isolated,monkeypatch):
    monkeypatch.setattr(routes,'_require_admin_for_agent_config',lambda request:None)
    monkeypatch.setenv('AEGIS_AGENT_SCHEDULING','legacy')
    with pytest.raises(HTTPException) as error:
        await routes.set_atlas_scheduling(routes.AtlasSchedulingRequest(mode='superagent'),Request({'type':'http','headers':[]}))
    assert error.value.status_code==409

def test_both_modes_have_evidence_and_authorization_rules():
    from aegisops.agent.agents.rex.prompt_builder import build_dynamic_rex_prompt
    for prompt in [build_dynamic_rex_prompt([],[],[],[]),scheduling.router_prompt([],[],[])]:
        assert '<SecurityOperations>' in prompt
        assert 'SHA-256' in prompt
        assert 'Never fabricate logs' in prompt
        assert 'Sandbox submission sends a file outside' in prompt
