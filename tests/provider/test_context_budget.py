from types import SimpleNamespace
import pytest
from aegisops.provider.provider import Provider
from aegisops.provider import model_manager

@pytest.mark.parametrize("limit,expected", [(None,128000),(32768,32768),(4096,4096),(200000,128000),(True,128000),("32768",128000)])
def test_saved_context_budget_controls_real_runtime_limits(monkeypatch, limit, expected):
    model = SimpleNamespace(capabilities=SimpleNamespace(context_window=128000,max_tokens=16000),limits=SimpleNamespace(max_input_tokens=120000))
    monkeypatch.setattr(Provider, "resolve_model", classmethod(lambda cls,pid,mid:model))
    monkeypatch.setattr(model_manager, "get_model_manager", lambda: SimpleNamespace(get_effective_default_parameters=lambda *_:{"context_window_limit":limit}))
    window,output,inputs = Provider.resolve_model_info("fake","model")
    assert window == expected
    assert output < window
    if expected < 128000: assert inputs <= window-output
    else: assert output == 16000
