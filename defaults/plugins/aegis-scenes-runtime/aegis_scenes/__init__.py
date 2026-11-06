from pathlib import Path
from contextvars import ContextVar
import os
import secrets
import json

ROOT=Path(__file__).parent
identity=ContextVar('aegis_scene_user',default=None)

def register():
    from aegisops.hub.paths import register_hub_root
    from aegisops.server.route_extensions import register_route_provider
    from aegisops.server.auth import require_user
    from aegisops.contracts.webui.store import WebUIPagesStore
    from aegisops.config.config import get_user_plugins_root
    from fastapi import APIRouter, Depends, Request, HTTPException
    from aegisops.server.auth import require_admin
    from aegisops.auth.service import AuthService
    from pydantic import BaseModel, Field
    from typing import Literal
    from fastapi.responses import Response
    import httpx
    os.environ['VULNOPS_DATA']=str(get_user_plugins_root().parent/'data/vuln-ops')
    from .vulnops import app as native
    register_hub_root('aegis-local-scenes',ROOT/'hub')
    with native.db() as con:
        con.execute('CREATE TABLE IF NOT EXISTS aegis_users (host_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), host_admin INTEGER NOT NULL DEFAULT 0)')

    def linked_user(host, *, allow_inactive=False):
        with native.db() as con:
            mapping=con.execute('SELECT * FROM aegis_users WHERE host_id=?',(host.id,)).fetchone()
            if not mapping:
                # Create an identity linked to the real host account. No reusable local password.
                name=host.username
                existing=con.execute('SELECT id FROM users WHERE username=?',(name,)).fetchone()
                role='admin' if host.role=='admin' else 'viewer'
                if existing: uid=existing['id']
                else:
                    cursor=con.execute('INSERT INTO users(username,name,department,role,password_hash,active,created_at) VALUES(?,?,?,?,?,1,?)',(name,host.username,'',role,native.hash_password(secrets.token_urlsafe(36)),native.now()))
                    uid=cursor.lastrowid
                con.execute('INSERT INTO aegis_users VALUES(?,?,?)',(host.id,uid,int(host.role=='admin')))
                if host.role=='admin': con.execute("UPDATE users SET role='admin' WHERE id=?",(uid,))
            else:
                uid=mapping['user_id']
                if host.role=='admin': con.execute("UPDATE users SET role='admin' WHERE id=?",(uid,))
                elif mapping['host_admin']: con.execute("UPDATE users SET role='viewer' WHERE id=?",(uid,))
                con.execute('UPDATE aegis_users SET host_admin=? WHERE host_id=?',(int(host.role=='admin'),host.id))
            user=con.execute('SELECT * FROM users WHERE id=?' + ('' if allow_inactive else ' AND active=1'),(uid,)).fetchone()
        if not user: raise HTTPException(403,'此场景账号已停用')
        return dict(user)
    def scene_user():
        host=identity.get()
        if host is None: raise HTTPException(401,'请先登录御枢')
        return linked_user(host)
    native.app.dependency_overrides[native.current_user]=scene_user
    router=APIRouter()
    class ScenePermissionRequest(BaseModel):
        name: str = Field(min_length=1,max_length=60)
        department: str = Field(default='',max_length=80)
        role: Literal['admin','security','owner','viewer'] = 'viewer'
        active: bool = True

    def permission_result(host, row):
        return {**native.public_user(row), 'active':bool(row['active']), 'host_id':host.id}

    @router.get('/api/admin/vulnops-permissions')
    async def list_permissions(request: Request):
        require_admin(request)
        return [permission_result(host, linked_user(host.to_auth_user(),allow_inactive=True)) for host in await AuthService.list_users()]

    @router.put('/api/admin/users/{host_id}/vulnops-permission')
    async def save_permission(host_id: str, payload: ScenePermissionRequest, request: Request):
        actor=require_admin(request)
        host=await AuthService.get_user_by_id(host_id)
        if host is None: raise HTTPException(404,'用户不存在')
        if host.role=='admin' and (payload.role!='admin' or not payload.active):
            raise HTTPException(400,'系统管理员保留漏洞运营管理权限')
        row=linked_user(host.to_auth_user(),allow_inactive=True)
        actor_row=linked_user(actor)
        with native.db() as con:
            if (not payload.active or payload.role=='viewer') and con.execute("SELECT COUNT(*) FROM vulnerabilities WHERE owner_id=? AND status!='closed'",(row['id'],)).fetchone()[0]:
                raise HTTPException(409,'该成员还有未关闭漏洞，请先转派再停用或调整为只读')
            con.execute('UPDATE users SET name=?,department=?,role=?,active=? WHERE id=?',
                (payload.name.strip() or host.username,payload.department.strip(),payload.role,int(payload.active),row['id']))
            if not payload.active: con.execute('DELETE FROM sessions WHERE user_id=?',(row['id'],))
            native.event(con,actor_row['id'],'更新成员权限',f'{host.username} / {native.ROLES[payload.role]} / {"启用" if payload.active else "停用"}')
            updated=dict(con.execute('SELECT * FROM users WHERE id=?',(row['id'],)).fetchone())
        return permission_result(host,updated)

    async def forward(request: Request, path: str='', user=Depends(require_user)):
        workspaces=WebUIPagesStore().list_workspaces()
        if not any(w.id=='vuln_ops' and w.enabled for w in workspaces): raise HTTPException(404,'漏洞运营场景未启用')
        if path in {'api/setup','api/login','api/logout','api/password'} and request.method!='GET': raise HTTPException(403,'请在御枢账号管理中操作登录凭据')
        body=await request.body()
        if (path=='api/users' or path.startswith('api/users/')) and request.method not in {'GET','HEAD'}:
            raise HTTPException(403,'请在系统账号管理中维护成员与权限')
        token=identity.set(user)
        try:
            headers={k:v for k,v in request.headers.items() if k.lower() not in {'content-length','connection','accept-encoding'}}
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=native.app),base_url=str(request.base_url)) as client:
                reply=await client.request(request.method,'/'+path,params=request.query_params,headers=headers,content=body)
            outgoing={k:v for k,v in reply.headers.items() if k.lower() not in {'content-length','content-encoding','transfer-encoding','x-frame-options','content-security-policy','set-cookie'}}
            outgoing['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"
            outgoing['X-Frame-Options']='SAMEORIGIN'
            outgoing['Cache-Control']='no-store'
            return Response(reply.content,status_code=reply.status_code,headers=outgoing)
        finally: identity.reset(token)
    router.add_api_route('/api/scenes/vulnops/',forward,methods=['GET','POST','PUT','PATCH','DELETE'])
    router.add_api_route('/api/scenes/vulnops/{path:path}',forward,methods=['GET','POST','PUT','PATCH','DELETE'])
    from .alert_import import register_import_routes
    register_import_routes(router,native,scene_user,identity,require_user)
    from aegisops.session.superagent_dispatch import install
    install()
    register_route_provider(router,name='aegis-vuln-ops-scene')
