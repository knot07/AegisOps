from __future__ import annotations


def test_internal_sdk_client_module_imports():
    import aegisops.server.client as client

    assert client.AegisOpsClient
    assert client.SessionClient
