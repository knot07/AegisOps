"""VulnOps: single-organization vulnerability tracking and remediation."""
from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

BASE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("VULNOPS_DATA", str(BASE / "data"))).resolve()
DATA.mkdir(parents=True, exist_ok=True)
(DATA / "attachments").mkdir(exist_ok=True)
DB = DATA / "vulnops.db"
ROLES = {"admin": "系统管理员", "security": "安全运营", "owner": "整改负责人", "viewer": "只读观察员"}
SEVERITIES = {"critical": "严重", "high": "高危", "medium": "中危", "low": "低危"}
STATES = {"new": "待分派", "assigned": "待整改", "fixing": "整改中", "retest": "待复测", "closed": "已关闭"}
SLA = {"critical": 1, "high": 7, "medium": 30, "low": 90}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def today():
    return datetime.now(timezone(timedelta(hours=8))).date()


@contextmanager
def db():
    con = sqlite3.connect(DB, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    try:
        con.execute("BEGIN IMMEDIATE")
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db():
    with sqlite3.connect(DB) as con:
        con.execute("PRAGMA journal_mode=WAL")
        con.executescript('''
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
          department TEXT NOT NULL DEFAULT '', role TEXT NOT NULL, password_hash TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS attempts (key TEXT NOT NULL, at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, address TEXT NOT NULL,
          department TEXT NOT NULL DEFAULT '', importance TEXT NOT NULL DEFAULT '普通', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS vulnerabilities (
          id INTEGER PRIMARY KEY, title TEXT NOT NULL, severity TEXT NOT NULL, category TEXT NOT NULL,
          source TEXT NOT NULL, asset_id INTEGER NOT NULL REFERENCES assets(id), location TEXT NOT NULL DEFAULT '',
          cve TEXT NOT NULL DEFAULT '', description TEXT NOT NULL, recommendation TEXT NOT NULL DEFAULT '',
          owner_id INTEGER REFERENCES users(id), status TEXT NOT NULL DEFAULT 'new',
          discovered_at TEXT NOT NULL, due_date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          closed_at TEXT, created_by INTEGER NOT NULL REFERENCES users(id),
          last_submitter INTEGER REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY, vuln_id INTEGER REFERENCES vulnerabilities(id),
          actor_id INTEGER NOT NULL REFERENCES users(id), action TEXT NOT NULL, note TEXT NOT NULL,
          created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS attachments (
          id INTEGER PRIMARY KEY, vuln_id INTEGER NOT NULL REFERENCES vulnerabilities(id),
          actor_id INTEGER NOT NULL REFERENCES users(id), filename TEXT NOT NULL,
          storage_name TEXT NOT NULL UNIQUE, size INTEGER NOT NULL, created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_vuln_owner ON vulnerabilities(owner_id);
        CREATE INDEX IF NOT EXISTS idx_vuln_status_due ON vulnerabilities(status,due_date);
        CREATE INDEX IF NOT EXISTS idx_events_vuln ON events(vuln_id,id);
        CREATE INDEX IF NOT EXISTS idx_attempts ON attempts(key,at);
        ''')


init_db()
app = FastAPI(title="VulnOps 漏洞运营", version="1.0.0", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]", "testserver"])


@app.middleware("http")
async def protections(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("origin")
        if request.headers.get("x-requested-with") != "VulnOps" or (origin and origin != str(request.base_url).rstrip("/")):
            return Response('连接来源校验失败', status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'"
    response.headers["Cache-Control"] = "no-store"
    return response


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Login(Model):
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=128)


class UserCreate(Login):
    name: str = Field(min_length=1, max_length=60)
    department: str = Field(default="", max_length=80)
    role: Literal["admin", "security", "owner", "viewer"] = "owner"

    @field_validator("password")
    @classmethod
    def strong_password(cls, value):
        if len(value) < 10:
            raise ValueError("密码至少 10 位")
        return value


class PasswordChange(Model):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


class ActiveUpdate(Model):
    active: bool


class AssetCreate(Model):
    name: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=300)
    department: str = Field(default="", max_length=80)
    importance: Literal["核心", "重要", "普通"] = "普通"


class VulnerabilityCreate(Model):
    title: str = Field(min_length=3, max_length=160)
    severity: Literal["critical", "high", "medium", "low"]
    category: str = Field(min_length=1, max_length=80)
    source: str = Field(min_length=1, max_length=80)
    asset_id: int = Field(gt=0)
    location: str = Field(default="", max_length=1000)
    cve: str = Field(default="", max_length=100)
    description: str = Field(min_length=3, max_length=20000)
    recommendation: str = Field(default="", max_length=10000)
    owner_id: int | None = Field(default=None, gt=0)
    discovered_at: date
    due_date: date | None = None


class VulnerabilityUpdate(VulnerabilityCreate):
    version: int = Field(gt=0)
    reason: str = Field(min_length=3, max_length=2000)


class Action(Model):
    action: Literal["assign", "start", "submit", "pass", "reject", "reopen", "comment"]
    note: str = Field(default="", max_length=10000)
    owner_id: int | None = Field(default=None, gt=0)
    version: int = Field(gt=0)


def hash_password(password):
    salt = secrets.token_hex(16)
    result = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310000)
    return f"{salt}:{result.hex()}"


def check_password(password, stored):
    salt, digest = stored.split(":")
    return hmac.compare_digest(hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310000).hex(), digest)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def public_user(user):
    return {k: user[k] for k in ("id", "username", "name", "department", "role", "active")}


def current_user(request: Request):
    token = request.cookies.get("vulnops_session", "")
    with db() as con:
        user = con.execute("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1", (token_hash(token), now())).fetchone()
    if not user:
        raise HTTPException(401, "请先登录")
    return dict(user)


def manager(user):
    if user["role"] not in {"admin", "security"}:
        raise HTTPException(403, "仅安全运营或管理员可执行")


def admin(user):
    if user["role"] != "admin":
        raise HTTPException(403, "仅管理员可执行")


def event(con, user_id, action, note, vuln_id=None):
    con.execute("INSERT INTO events(vuln_id,actor_id,action,note,created_at) VALUES(?,?,?,?,?)", (vuln_id, user_id, action, note, now()))


def ensure_owner(con, owner_id):
    if owner_id is not None:
        row = con.execute("SELECT * FROM users WHERE id=? AND active=1 AND role!='viewer'", (owner_id,)).fetchone()
        if not row:
            raise HTTPException(422, "责任人不存在、已停用或为只读角色")


VULN_SELECT = '''SELECT v.*, a.name AS asset_name,a.address AS asset_address,a.department,
 u.name AS owner_name FROM vulnerabilities v JOIN assets a ON a.id=v.asset_id
 LEFT JOIN users u ON u.id=v.owner_id'''


def get_vuln(con, vuln_id, user):
    row = con.execute(VULN_SELECT + " WHERE v.id=?", (vuln_id,)).fetchone()
    if not row or (user["role"] == "owner" and row["owner_id"] != user["id"]):
        raise HTTPException(404, "漏洞不存在或无访问权限")
    return dict(row)


def present(row):
    item = dict(row)
    item["code"] = f"VUL-{item['id']:05d}"
    item["overdue_days"] = max(0, (today() - date.fromisoformat(item["due_date"])).days) if item["status"] != "closed" else 0
    return item


@app.get("/api/setup")
def setup_status():
    with db() as con:
        return {"required": con.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0}


@app.get("/api/health")
def health():
    with db() as con:
        con.execute("SELECT 1").fetchone()
    return {"service": "VulnOps", "status": "ok", "version": "1.0.0"}


@app.post("/api/setup", status_code=201)
def setup(data: UserCreate):
    password_hash = hash_password(data.password)
    with db() as con:
        if con.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
            raise HTTPException(409, "系统已经初始化")
        uid = con.execute("INSERT INTO users(username,name,department,role,password_hash,created_at) VALUES(?,?,?,?,?,?)", (data.username, data.name, data.department, "admin", password_hash, now())).lastrowid
        event(con, uid, "初始化系统", "创建首位管理员")
    return {"ok": True}


@app.post("/api/login")
def login(data: Login, request: Request, response: Response):
    key = f"{request.client.host}:{data.username}"
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(timespec="seconds")
    with db() as con:
        con.execute("DELETE FROM attempts WHERE at<?", (cutoff,))
        if con.execute("SELECT COUNT(*) FROM attempts WHERE key=?", (key,)).fetchone()[0] >= 10:
            raise HTTPException(429, "尝试次数过多，请 15 分钟后再试")
        user = con.execute("SELECT * FROM users WHERE username=? AND active=1", (data.username,)).fetchone()
        # Always run a password derivation to reduce account enumeration through timing.
        valid = check_password(data.password, user["password_hash"] if user else "0" * 32 + ":" + "0" * 64)
        if not user or not valid:
            con.execute("INSERT INTO attempts(key,at) VALUES(?,?)", (key, now()))
            user = None
        else:
            con.execute("DELETE FROM attempts WHERE key=?", (key,))
            con.execute("DELETE FROM sessions WHERE expires_at<?", (now(),))
            token = secrets.token_urlsafe(32)
            expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat(timespec="seconds")
            con.execute("INSERT INTO sessions VALUES(?,?,?)", (token_hash(token), user["id"], expiry))
            event(con, user["id"], "登录", "登录系统")
    if not user:
        raise HTTPException(401, "用户名或密码错误")
    response.set_cookie("vulnops_session", token, max_age=28800, httponly=True, samesite="strict", secure=os.environ.get("VULNOPS_SECURE_COOKIE") == "1")
    return public_user(user)


@app.post("/api/logout")
def logout(request: Request, response: Response, user=Depends(current_user)):
    with db() as con:
        con.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(request.cookies.get("vulnops_session", "")),))
    response.delete_cookie("vulnops_session")
    return {"ok": True}


@app.get("/api/me")
def me(user=Depends(current_user)):
    return public_user(user)


@app.post("/api/password")
def change_password(data: PasswordChange, response: Response, user=Depends(current_user)):
    if not check_password(data.old_password, user["password_hash"]):
        raise HTTPException(400, "原密码错误")
    with db() as con:
        con.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(data.new_password), user["id"]))
        con.execute("DELETE FROM sessions WHERE user_id=?", (user["id"],))
        event(con, user["id"], "修改密码", "已注销该用户全部会话")
    response.delete_cookie("vulnops_session")
    return {"ok": True}


@app.get("/api/users")
def users(user=Depends(current_user)):
    with db() as con:
        rows = con.execute("SELECT * FROM users ORDER BY active DESC,id").fetchall()
    return [public_user(r) for r in rows]


@app.post("/api/users", status_code=201)
def create_user(data: UserCreate, user=Depends(current_user)):
    admin(user)
    try:
        with db() as con:
            uid = con.execute("INSERT INTO users(username,name,department,role,password_hash,created_at) VALUES(?,?,?,?,?,?)", (data.username, data.name, data.department, data.role, hash_password(data.password), now())).lastrowid
            event(con, user["id"], "创建成员", f"{data.name} / {ROLES[data.role]}")
    except sqlite3.IntegrityError:
        raise HTTPException(409, "用户名已存在")
    return {"id": uid}


@app.patch("/api/users/{uid}")
def update_user(uid: int, data: ActiveUpdate, user=Depends(current_user)):
    admin(user)
    if uid == user["id"]:
        raise HTTPException(400, "不能停用当前登录账号")
    with db() as con:
        target = con.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        if not target:
            raise HTTPException(404, "成员不存在")
        if not data.active and con.execute("SELECT COUNT(*) FROM vulnerabilities WHERE owner_id=? AND status!='closed'", (uid,)).fetchone()[0]:
            raise HTTPException(409, "请先转派该成员未关闭的漏洞")
        con.execute("UPDATE users SET active=? WHERE id=?", (int(data.active), uid))
        if not data.active:
            con.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
        event(con, user["id"], "启用成员" if data.active else "停用成员", target["name"])
    return {"ok": True}


@app.get("/api/assets")
def assets(q: str = Query(default="", max_length=200), user=Depends(current_user)):
    scope = " AND v.owner_id=?" if user["role"] == "owner" else ""
    with db() as con:
        rows = con.execute(f"SELECT a.*,COUNT(v.id) AS total,COALESCE(SUM(v.status!='closed'),0) AS open_count FROM assets a LEFT JOIN vulnerabilities v ON v.asset_id=a.id{scope} WHERE instr(lower(a.name || ' ' || a.address || ' ' || a.department),lower(?))>0 GROUP BY a.id ORDER BY a.id DESC", ((user["id"],) if scope else ()) + (q.strip(),)).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/assets", status_code=201)
def create_asset(data: AssetCreate, user=Depends(current_user)):
    manager(user)
    try:
        with db() as con:
            aid = con.execute("INSERT INTO assets(name,address,department,importance,created_at) VALUES(?,?,?,?,?)", (data.name, data.address, data.department, data.importance, now())).lastrowid
            event(con, user["id"], "登记资产", data.name)
    except sqlite3.IntegrityError:
        raise HTTPException(409, "资产名称已存在")
    return {"id": aid}


@app.put("/api/assets/{asset_id}")
def edit_asset(asset_id: int, data: AssetCreate, user=Depends(current_user)):
    manager(user)
    try:
        with db() as con:
            old=con.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
            if not old: raise HTTPException(404,"资产不存在")
            con.execute("UPDATE assets SET name=?,address=?,department=?,importance=? WHERE id=?",(data.name,data.address,data.department,data.importance,asset_id))
            changed=[key for key,value in data.model_dump().items() if old[key]!=value]
            event(con,user['id'],"编辑资产",f"资产 #{asset_id} / {data.name} / 字段：{', '.join(changed) or '无变更'}")
    except sqlite3.IntegrityError:
        raise HTTPException(409,"资产名称已存在")
    return {"id":asset_id}


@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: int, user=Depends(current_user)):
    manager(user)
    with db() as con:
        asset=con.execute("SELECT * FROM assets WHERE id=?",(asset_id,)).fetchone()
        if not asset: raise HTTPException(404,"资产不存在")
        if con.execute("SELECT COUNT(*) FROM vulnerabilities WHERE asset_id=?",(asset_id,)).fetchone()[0]:
            raise HTTPException(409,"资产仍有关联漏洞，请先将漏洞关联到其他资产后再删除")
        con.execute("DELETE FROM assets WHERE id=?",(asset_id,))
        event(con,user['id'],"删除资产",f"资产 #{asset_id} / {asset['name']} / {asset['address']}")
    return {"ok":True}


def selection(user, q="", severity="", status="", owner_id=None, overdue=False, mine=False, asset_id=None):
    where, args = ["1=1"], []
    if user["role"] == "owner" or mine:
        where.append("v.owner_id=?")
        args.append(user["id"])
    if q:
        where.append("(v.title LIKE ? OR a.name LIKE ? OR v.cve LIKE ? OR printf('VUL-%05d',v.id) LIKE ?)")
        args.extend([f"%{q}%"] * 4)
    for column, value in (("severity", severity), ("status", status), ("owner_id", owner_id), ("asset_id", asset_id)):
        if value:
            if column == "severity" and value == "critical_high":
                where.append("v.severity IN ('critical','high') AND v.status!='closed'")
                continue
            where.append(f"v.{column}=?")
            args.append(value)
    if overdue:
        where.append("v.status!='closed' AND v.due_date<?")
        args.append(today().isoformat())
    return " WHERE " + " AND ".join(where), args


@app.get("/api/vulnerabilities")
def vulnerabilities(q: str = "", severity: str = "", status: str = "", owner_id: int | None = None, overdue: bool = False, mine: bool = False, asset_id: int | None = None, page: int = 1, page_size: int = 10, user=Depends(current_user)):
    page, page_size = max(1, page), min(100, max(1, page_size))
    where, args = selection(user, q, severity, status, owner_id, overdue, mine, asset_id)
    with db() as con:
        total = con.execute("SELECT COUNT(*) FROM vulnerabilities v JOIN assets a ON a.id=v.asset_id" + where, args).fetchone()[0]
        rows = con.execute(VULN_SELECT + where + " ORDER BY CASE WHEN v.status='closed' THEN 1 ELSE 0 END, v.due_date,v.id DESC LIMIT ? OFFSET ?", [*args, page_size, (page - 1) * page_size]).fetchall()
    return {"items": [present(r) for r in rows], "total": total, "page": page, "page_size": page_size}


def validate_vuln(con, data):
    if not con.execute("SELECT id FROM assets WHERE id=?", (data.asset_id,)).fetchone():
        raise HTTPException(422, "资产不存在")
    ensure_owner(con, data.owner_id)
    if data.discovered_at > today():
        raise HTTPException(422, "发现日期不能晚于今天")
    due = data.due_date or (data.discovered_at + timedelta(days=SLA[data.severity]))
    if due < data.discovered_at:
        raise HTTPException(422, "整改期限不能早于发现日期")
    return due.isoformat()


@app.post("/api/vulnerabilities", status_code=201)
def create_vuln(data: VulnerabilityCreate, user=Depends(current_user)):
    manager(user)
    with db() as con:
        due = validate_vuln(con, data)
        values = data.model_dump(mode="json")
        values["due_date"] = due
        values.update(status="assigned" if data.owner_id else "new", created_at=now(), updated_at=now(), created_by=user["id"])
        columns = list(values)
        vid = con.execute(f"INSERT INTO vulnerabilities({','.join(columns)}) VALUES({','.join('?' for _ in columns)})", list(values.values())).lastrowid
        event(con, user["id"], "登记漏洞", f"{data.title}；等级：{SEVERITIES[data.severity]}；期限：{due}" + (f"；责任人 ID：{data.owner_id}" if data.owner_id else "；待分派"), vid)
    return {"id": vid}


@app.get("/api/vulnerabilities/{vid}")
def vulnerability(vid: int, user=Depends(current_user)):
    with db() as con:
        result = present(get_vuln(con, vid, user))
        result["events"] = [dict(r) for r in con.execute("SELECT e.*,u.name AS actor FROM events e JOIN users u ON u.id=e.actor_id WHERE vuln_id=? ORDER BY e.id DESC", (vid,))]
        result["attachments"] = [dict(r) for r in con.execute("SELECT a.id,a.filename,a.size,a.created_at,u.name AS actor FROM attachments a JOIN users u ON u.id=a.actor_id WHERE vuln_id=? ORDER BY a.id DESC", (vid,))]
    return result


@app.put("/api/vulnerabilities/{vid}")
def edit_vuln(vid: int, data: VulnerabilityUpdate, user=Depends(current_user)):
    manager(user)
    with db() as con:
        old = get_vuln(con, vid, user)
        if old["version"] != data.version:
            raise HTTPException(409, "记录已更新，请刷新后重试")
        if old["status"] == "closed":
            raise HTTPException(409, "请先重新打开漏洞再修改")
        if data.owner_id != old["owner_id"]:
            raise HTTPException(422, "请使用分派操作变更责任人")
        values = data.model_dump(mode="json", exclude={"version", "reason"})
        values["due_date"] = validate_vuln(con, data)
        changes = {k: {"原值": old[k], "新值": v} for k, v in values.items() if old[k] != v}
        values.update(updated_at=now(), version=old["version"] + 1)
        con.execute(f"UPDATE vulnerabilities SET {','.join(k+'=?' for k in values)} WHERE id=?", [*values.values(), vid])
        event(con, user["id"], "修改信息", data.reason + "\n" + json.dumps(changes, ensure_ascii=False), vid)
    return {"ok": True}


@app.post("/api/vulnerabilities/{vid}/actions")
def act(vid: int, data: Action, user=Depends(current_user)):
    if user["role"] == "viewer":
        raise HTTPException(403, "只读角色不能修改漏洞")
    with db() as con:
        item = get_vuln(con, vid, user)
        if item["version"] != data.version:
            raise HTTPException(409, "记录已更新，请刷新后重试")
        state, action = item["status"], data.action
        update = {"version": item["version"] + 1, "updated_at": now()}
        names = {"assign": "分派责任人", "start": "开始整改", "submit": "提交复测", "pass": "复测通过", "reject": "复测退回", "reopen": "重新打开", "comment": "补充记录"}
        if action in {"assign", "pass", "reject", "reopen"}:
            manager(user)
        if action != "start" and len(data.note.strip()) < 3:
            raise HTTPException(422, "请填写至少 3 个字的处理说明")
        if action == "assign":
            if state in {"closed", "retest"} or not data.owner_id:
                raise HTTPException(409, "当前状态不允许分派，或未选择责任人")
            ensure_owner(con, data.owner_id)
            update.update(owner_id=data.owner_id, status="assigned")
        elif action == "start":
            if state != "assigned":
                raise HTTPException(409, "只有待整改漏洞可以开始整改")
            update["status"] = "fixing"
        elif action == "submit":
            if state not in {"assigned", "fixing"}:
                raise HTTPException(409, "当前状态不能提交复测")
            update.update(status="retest", last_submitter=user["id"])
        elif action in {"pass", "reject"}:
            if state != "retest":
                raise HTTPException(409, "只有待复测漏洞可以复测")
            if item["last_submitter"] == user["id"]:
                raise HTTPException(403, "整改提交人与复测人员必须不同")
            update.update(status="closed" if action == "pass" else "fixing", closed_at=now() if action == "pass" else None)
        elif action == "reopen":
            if state != "closed":
                raise HTTPException(409, "只有已关闭漏洞可以重新打开")
            owner = con.execute("SELECT id FROM users WHERE id=? AND active=1", (item["owner_id"],)).fetchone()
            update.update(status="assigned" if owner else "new", owner_id=item["owner_id"] if owner else None, closed_at=None, last_submitter=None)
        con.execute(f"UPDATE vulnerabilities SET {','.join(k+'=?' for k in update)} WHERE id=?", [*update.values(), vid])
        note = data.note or "已开始整改"
        if action == "assign":
            owner = con.execute("SELECT name FROM users WHERE id=?", (data.owner_id,)).fetchone()[0]
            note = f"责任人：{owner}。{note}"
        event(con, user["id"], names[action], note, vid)
    return {"ok": True}


@app.post("/api/vulnerabilities/{vid}/attachments", status_code=201)
def upload(vid: int, file: UploadFile = File(...), user=Depends(current_user)):
    if user["role"] == "viewer":
        raise HTTPException(403, "只读角色不能上传证据")
    with db() as con:
        get_vuln(con, vid, user)
    name = Path((file.filename or "证据").replace("\\", "/")).name[:180]
    if Path(name).suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt", ".log", ".csv", ".docx", ".xlsx", ".zip"}:
        raise HTTPException(422, "支持图片、PDF、文本、Office 文档及 ZIP")
    storage = secrets.token_hex(24)
    target, size = DATA / "attachments" / storage, 0
    try:
        with target.open("xb") as out:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > 10 * 1024 * 1024:
                    raise HTTPException(413, "单个附件不能超过 10 MB")
                out.write(chunk)
        if size == 0:
            raise HTTPException(422, "附件不能为空")
        with db() as con:
            get_vuln(con, vid, user)
            aid = con.execute("INSERT INTO attachments(vuln_id,actor_id,filename,storage_name,size,created_at) VALUES(?,?,?,?,?,?)", (vid, user["id"], name, storage, size, now())).lastrowid
            event(con, user["id"], "上传证据", name, vid)
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return {"id": aid}


@app.get("/api/attachments/{aid}")
def download(aid: int, user=Depends(current_user)):
    with db() as con:
        row = con.execute("SELECT * FROM attachments WHERE id=?", (aid,)).fetchone()
        if not row:
            raise HTTPException(404, "附件不存在")
        get_vuln(con, row["vuln_id"], user)
    target = DATA / "attachments" / row["storage_name"]
    if not target.exists():
        raise HTTPException(404, "附件文件缺失，请联系管理员恢复备份")
    return FileResponse(target, filename=row["filename"], media_type="application/octet-stream")


@app.get("/api/dashboard")
def dashboard(user=Depends(current_user)):
    where, args = selection(user)
    with db() as con:
        rows = [present(r) for r in con.execute(VULN_SELECT + where, args)]
    opened = [r for r in rows if r["status"] != "closed"]
    closed = [r for r in rows if r["status"] == "closed"]
    overdue = [r for r in opened if r["overdue_days"] > 0]
    durations = [(datetime.fromisoformat(r["closed_at"]).astimezone(timezone(timedelta(hours=8))).date() - date.fromisoformat(r["discovered_at"])).days for r in closed]
    trend = []
    for i in range(13, -1, -1):
        day = today() - timedelta(days=i)
        trend.append({"date": day.isoformat(), "new": sum(r["discovered_at"] == day.isoformat() for r in rows), "closed": sum(bool(r["closed_at"]) and datetime.fromisoformat(r["closed_at"]).astimezone(timezone(timedelta(hours=8))).date() == day for r in rows)})
    departments = {}
    for r in rows:
        d = departments.setdefault(r["department"] or "未设置部门", {"name": r["department"] or "未设置部门", "total": 0, "closed": 0, "overdue": 0})
        d["total"] += 1
        d["closed"] += r["status"] == "closed"
        d["overdue"] += r["overdue_days"] > 0
    return {"total": len(rows), "open": len(opened), "critical_high": sum(r["severity"] in {"critical", "high"} for r in opened), "overdue": len(overdue), "retest": sum(r["status"] == "retest" for r in rows), "closed": len(closed), "close_rate": round(len(closed) * 100 / len(rows), 1) if rows else 0, "avg_days": round(sum(durations) / len(durations), 1) if durations else None, "severity": {s: sum(r["severity"] == s for r in opened) for s in SEVERITIES}, "statuses": {s: sum(r["status"] == s for r in rows) for s in STATES}, "trend": trend, "departments": sorted(departments.values(), key=lambda d: (-d["overdue"], -d["total"])), "urgent": sorted(opened, key=lambda r: (r["due_date"], list(SEVERITIES).index(r["severity"])))[:6]}


@app.get("/api/export")
def export(q: str = "", severity: str = "", status: str = "", owner_id: int | None = None, overdue: bool = False, mine: bool = False, asset_id: int | None = None, user=Depends(current_user)):
    where, args = selection(user, q, severity, status, owner_id, overdue, mine, asset_id)
    with db() as con:
        rows = [present(r) for r in con.execute(VULN_SELECT + where + " ORDER BY v.id DESC", args)]
        event(con, user["id"], "导出台账", f"导出 {len(rows)} 条可访问记录")
    buf = io.StringIO(newline="")
    writer = csv.writer(buf)
    writer.writerow(["漏洞编号", "漏洞名称", "风险等级", "漏洞类型", "来源", "资产", "部门", "位置", "CVE", "状态", "责任人", "发现日期", "整改期限", "逾期天数", "关闭时间", "漏洞描述", "修复建议"])
    def safe(value):
        value = str(value or "")
        return "'" + value if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r", "\n")) or value.startswith(("\t", "\r", "\n")) else value
    for r in rows:
        writer.writerow([safe(v) for v in [r["code"], r["title"], SEVERITIES[r["severity"]], r["category"], r["source"], r["asset_name"], r["department"], r["location"], r["cve"], STATES[r["status"]], r["owner_name"], r["discovered_at"], r["due_date"], str(r["overdue_days"]), r["closed_at"], r["description"], r["recommendation"]]])
    return StreamingResponse(iter([("\ufeff" + buf.getvalue()).encode("utf-8")]), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": 'attachment; filename="vulnerabilities.csv"'})


@app.get("/api/audit")
def audit(page: int = 1, user=Depends(current_user)):
    manager(user)
    with db() as con:
        total = con.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        rows = con.execute("SELECT e.*,u.name AS actor,v.title AS vuln_title FROM events e JOIN users u ON u.id=e.actor_id LEFT JOIN vulnerabilities v ON v.id=e.vuln_id ORDER BY e.id DESC LIMIT 30 OFFSET ?", ((max(1, page) - 1) * 30,)).fetchall()
    return {"items": [dict(r) for r in rows], "total": total}


app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE / "static" / "index.html")


if __name__ == "__main__":
    import socket
    import threading
    import time
    import webbrowser
    import uvicorn
    port = int(os.environ.get("VULNOPS_PORT", "8765"))
    if os.environ.get("VULNOPS_OPEN_BROWSER") == "1":
        def open_when_ready():
            for _ in range(100):
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                        webbrowser.open(f"http://127.0.0.1:{port}")
                        return
                except OSError:
                    time.sleep(0.1)
        threading.Thread(target=open_when_ready, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
