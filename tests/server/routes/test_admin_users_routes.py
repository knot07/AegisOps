from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.fixture(autouse=True)
async def _bootstrap_admin():
    """Every test in this module needs a bootstrapped admin user."""
    from aegisops.auth.service import AuthService

    if not await AuthService.has_users():
        await AuthService.bootstrap_admin(username="admin", password="Password123!")


@pytest.mark.asyncio
async def test_admin_routes_list_users(client: AsyncClient):
    response = await client.get("/api/admin/users")
    assert response.status_code == 200, response.text
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    admin_user = users[0]
    assert admin_user["role"] == "admin"
    assert admin_user["tenant_ids"] == []
    assert admin_user["asset_groups"] == []


@pytest.mark.asyncio
async def test_admin_routes_update_contract_scope(client: AsyncClient):
    from aegisops.auth.service import AuthService

    member = await AuthService._create_user_internal(
        username="analyst",
        password="Password123!",
        role="member",
    )

    response = await client.put(
        f"/api/admin/users/{member.id}/contract-scope",
        json={
            "tenant_ids": ["tenant-a", "tenant-a", " "],
            "asset_groups": ["core"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["tenant_ids"] == ["tenant-a"]
    assert response.json()["asset_groups"] == ["core"]

    stored = await AuthService.get_user_by_id(member.id)
    assert stored is not None
    assert stored.to_auth_user().tenant_ids == ("tenant-a",)
    assert stored.to_auth_user().asset_groups == ("core",)


@pytest.mark.asyncio
async def test_admin_routes_reset_password(client: AsyncClient):
    users = (await client.get("/api/admin/users")).json()
    assert users
    user_id = users[0]["id"]

    reset_response = await client.post(
        f"/api/admin/users/{user_id}/reset-password",
        json={"force_reset": True},
    )
    assert reset_response.status_code == 200, reset_response.text
    assert reset_response.json()["must_reset_password"] is True
    assert reset_response.json()["temporary_password"]


@pytest.mark.asyncio
async def test_admin_routes_create_user_and_login(client: AsyncClient):
    response = await client.post(
        "/api/admin/users",
        json={
            "username": "newuser",
            "password": "Password123!",
            "role": "member",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["username"] == "newuser" and data["role"] == "member"
    assert "password" not in data and "password_hash" not in data
    from httpx import ASGITransport
    from aegisops.server.app import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as member:
        login = await member.post('/api/auth/login', json={"username":"newuser", "password":"Password123!"})
        assert login.status_code == 200, login.text
        assert (await member.get('/api/auth/me')).json()['id'] == data['id']
        assert (await member.post('/api/session',json={"title":"member test"})).status_code == 200
        assert (await member.get('/api/admin/users')).status_code == 403
        assert (await member.post('/api/admin/users',json={"username":"evil", "password":"Password123!","role":"admin"})).status_code == 403


@pytest.mark.asyncio
async def test_admin_routes_audit_logs_not_available(client: AsyncClient):
    response = await client.get("/api/admin/audit-logs")
    assert response.status_code == 404, response.text


@pytest.mark.asyncio
async def test_admin_routes_delete_user_not_allowed(client: AsyncClient):
    users = (await client.get("/api/admin/users")).json()
    assert users
    user_id = users[0]["id"]

    response = await client.delete(f"/api/admin/users/{user_id}")
    assert response.status_code == 404, response.text


@pytest.mark.asyncio
async def test_service_owner_username_is_reserved():
    from aegisops.auth.context import API_TOKEN_SERVICE_USER_ID
    from aegisops.auth.service import AuthService

    with pytest.raises(ValueError, match="系统保留"):
        await AuthService._create_user_internal(
            username=API_TOKEN_SERVICE_USER_ID,
            password="Password123!",
            role="member",
        )


@pytest.mark.asyncio
async def test_create_user_duplicate_and_validation(client):
    payload={"username":"analyst", "password":"Password123!", "role":"member"}
    assert (await client.post('/api/admin/users',json=payload)).status_code==201
    assert (await client.post('/api/admin/users',json=payload)).status_code==409
    for changes in [{"username":"  "}, {"password":"short"}, {"role":"root"}, {"username":"bad name"}]:
        result=await client.post('/api/admin/users',json={**payload,**changes})
        assert result.status_code in {400,422},result.text


@pytest.mark.asyncio
async def test_create_user_requires_login_and_admin_role(client):
    from httpx import ASGITransport
    from aegisops.server.app import app
    async with AsyncClient(transport=ASGITransport(app=app),base_url="http://test") as anonymous:
        result=await anonymous.post('/api/admin/users',json={"username":"intruder", "password":"Password123!"})
        assert result.status_code==401
    result=await client.post('/api/admin/users',json={"username":"second-admin", "password":"Password123!", "role":"admin"})
    assert result.status_code==201
    from aegisops.auth.service import AuthService
    user,_=await AuthService.login('second-admin','Password123!')
    assert user.role=='admin'
