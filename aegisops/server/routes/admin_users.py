"""
Admin-only user management routes.
"""

from __future__ import annotations

from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from aegisops.auth.service import AuthService, TEMP_PASSWORD_TTL_HOURS
from aegisops.server.auth import require_admin

router = APIRouter()


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    status: str
    must_reset_password: bool
    tenant_ids: tuple[str, ...] = Field(default_factory=tuple)
    asset_groups: tuple[str, ...] = Field(default_factory=tuple)
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["admin", "member"] = "member"

    @field_validator("username", mode="before")
    @classmethod
    def trim_username(cls, value):
        return value.strip() if isinstance(value, str) else value


@router.post("/users", response_model=UserResponse, status_code=201, summary="管理员新增用户")
async def create_user(payload: CreateUserRequest, request: Request) -> UserResponse:
    admin = require_admin(request)
    creator = getattr(AuthService.get_backend(), "create_user", None)
    if creator is None:
        raise HTTPException(status_code=501, detail="当前账号后端不支持新增用户")
    try:
        user = await creator(username=payload.username, password=payload.password, role=payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=409 if str(exc) == "用户名已存在" else 400, detail=str(exc)) from exc
    from aegisops.server.routes.auth import _emit_auth_audit
    await _emit_auth_audit("account.created", {
        "actor_id": admin.username, "user_id": user.id,
        "username": user.username, "role": user.role,
    })
    return UserResponse(**user.model_dump())


class ResetPasswordRequest(BaseModel):
    new_password: Optional[str] = Field(None, min_length=8, max_length=128)
    force_reset: bool = True


class ContractScopeRequest(BaseModel):
    tenant_ids: list[str] = Field(default_factory=list)
    asset_groups: list[str] = Field(default_factory=list)


@router.get("/users", response_model=List[UserResponse], summary="管理员获取用户列表")
async def list_users(request: Request) -> List[UserResponse]:
    _admin = require_admin(request)
    users = await AuthService.list_users()
    return [UserResponse(**u.model_dump()) for u in users]


@router.put("/users/{user_id}/contract-scope", response_model=UserResponse, summary="管理员更新用户契约范围")
async def update_user_contract_scope(user_id: str, payload: ContractScopeRequest, request: Request) -> UserResponse:
    require_admin(request)
    setter = getattr(AuthService.get_backend(), "set_user_contract_scope", None)
    if setter is None:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="当前账号后端不支持契约范围管理")
    try:
        user = await setter(
            target_user_id=user_id,
            tenant_ids=payload.tenant_ids,
            asset_groups=payload.asset_groups,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return UserResponse(**user.model_dump())


@router.post("/users/{user_id}/reset-password", summary="管理员重置密码")
async def reset_user_password(user_id: str, payload: ResetPasswordRequest, request: Request) -> dict:
    require_admin(request)
    target_user = await AuthService.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    new_password = payload.new_password
    if not new_password:
        import secrets

        new_password = secrets.token_urlsafe(10)

    expires_at = None
    if payload.force_reset:
        from datetime import UTC, datetime, timedelta

        expires_at = (datetime.now(UTC) + timedelta(hours=TEMP_PASSWORD_TTL_HOURS)).isoformat()

    try:
        await AuthService.set_password(
            target_user_id=user_id,
            new_password=new_password,
            must_reset_password=payload.force_reset,
            temp_password_expires_at=expires_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {
        "success": True,
        "temporary_password": new_password if payload.force_reset else None,
        "must_reset_password": payload.force_reset,
    }
