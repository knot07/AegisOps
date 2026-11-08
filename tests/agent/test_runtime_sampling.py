from types import SimpleNamespace
from unittest.mock import AsyncMock
import pytest
from aegisops.provider import options
from aegisops.agent import scheduling
from aegisops.agent.agent import AgentInfo
from aegisops.storage.storage import Storage

@pytest.mark.parametrize('mode',['legacy','superagent'])
async def test_saved_router_and_worker_parameters_are_independent(mode,monkeypatch):
    monkeypatch.setattr(Storage,'read',AsyncMock(return_value={'rex':{'temperature':0.15},'explore':{'temperature':0.4}}))
    token=scheduling._mode.set(mode)
    original=AgentInfo(name='rex',mode='primary',temperature=0.7,tools=['shell'])
    worker=AgentInfo(name='explore',mode='subagent',temperature=0.8,tools=['read'])
    try:
        router=await scheduling.configured_runtime_agent(original,'parent')
        child=await scheduling.configured_runtime_agent(worker,'child')
        assert router.temperature==0.15 and child.temperature==0.4
        assert original.temperature==0.7 and worker.temperature==0.8
        if mode=='superagent':assert set(router.tools)==scheduling.ROUTER_TOOLS
        else:assert router.tools==['shell']
        assert child.tools==['read']
    finally:scheduling._mode.reset(token)

@pytest.mark.parametrize('value',[0.0,0.15,0.7,2.0])
def test_agent_sampling_enters_request_options(value,monkeypatch):
    monkeypatch.setattr(options,'_lookup_raw_model_metadata',lambda *_:None)
    original={'max_tokens':128}
    actual=options.apply_agent_temperature(original,SimpleNamespace(temperature=value),'custom','chat-model')
    assert actual['temperature']==value and original=={'max_tokens':128}

@pytest.mark.parametrize('blocked',[{'supports_temperature':False},SimpleNamespace(supports_temperature=False)])
def test_unsupported_models_do_not_receive_temperature(blocked,monkeypatch):
    monkeypatch.setattr(options,'_lookup_raw_model_metadata',lambda *_:SimpleNamespace(capabilities=blocked))
    actual=options.apply_agent_temperature({'temperature':0.7},SimpleNamespace(temperature=0.2),'custom','model')
    assert 'temperature' not in actual

def test_reasoning_request_preserves_thinking_without_sampling(monkeypatch):
    monkeypatch.setattr(options,'_lookup_raw_model_metadata',lambda *_:None)
    actual=options.apply_agent_temperature({'thinking':{'type':'enabled'},'temperature':0.7},SimpleNamespace(temperature=0.2),'anthropic','claude-model')
    assert actual['thinking']=={'type':'enabled'} and 'temperature' not in actual

@pytest.mark.parametrize('value',[None,float('nan'),float('inf'),-1,3,True,'0.2'])
def test_invalid_agent_values_are_not_forwarded(value,monkeypatch):
    monkeypatch.setattr(options,'_lookup_raw_model_metadata',lambda *_:None)
    assert 'temperature' not in options.apply_agent_temperature({},SimpleNamespace(temperature=value),'custom','model')
