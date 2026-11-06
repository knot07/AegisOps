"""API integration tests with an isolated real SQLite database."""
import importlib
import os
import sys
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
HEADERS = {"X-Requested-With": "VulnOps"}
PASSWORD = "Test-Only-Password-2026!"


@pytest.fixture
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("VULNOPS_DATA", str(tmp_path))
    sys.modules.pop("app", None)
    mod = importlib.import_module("app")
    def client():
        return TestClient(mod.app, headers=HEADERS)
    root = client()
    assert root.post("/api/setup", json={"username": "admin", "password": PASSWORD, "name": "管理员"}).status_code == 201
    assert root.post("/api/login", json={"username": "admin", "password": PASSWORD}).status_code == 200
    members = {}
    for role, username in [("owner", "owner1"), ("owner", "owner2"), ("security", "security"), ("viewer", "viewer")]:
        r = root.post("/api/users", json={"username": username, "password": PASSWORD, "name": username, "role": role, "department": "测试部门"})
        assert r.status_code == 201, r.text
        c = client()
        assert c.post("/api/login", json={"username": username, "password": PASSWORD}).status_code == 200
        members[username] = {"id": r.json()["id"], "client": c}
    aid = root.post("/api/assets", json={"name": "测试资产", "address": "test.internal", "department": "研发部"}).json()["id"]
    def create(owner="owner1", **kw):
        data = {"title": "未授权访问漏洞", "severity": "high", "category": "访问控制", "source": "人工排查", "asset_id": aid, "description": "未授权请求可以读取业务信息", "discovered_at": (mod.today() - timedelta(days=10)).isoformat(), "owner_id": members[owner]["id"] if owner else None}
        data.update(kw)
        r = root.post("/api/vulnerabilities", json=data)
        assert r.status_code == 201, r.text
        return r.json()["id"]
    return mod, root, members, aid, create, client


def action(c, vid, name, **kw):
    v = c.get(f"/api/vulnerabilities/{vid}").json()
    return c.post(f"/api/vulnerabilities/{vid}/actions", json={"action": name, "note": "实际处理说明与验证结果", "version": v["version"], **kw})


def test_auth_csrf_and_setup(env):
    _, root, _, _, _, client = env
    anonymous = client()
    assert anonymous.get("/api/dashboard").status_code == 401
    assert root.post("/api/setup", json={"username": "another", "password": PASSWORD, "name": "管理员"}).status_code == 409
    r = root.post("/api/assets", headers={"Origin": "https://attacker.invalid"}, json={"name": "bad", "address": "bad"})
    assert r.status_code == 403
    assert root.get("/").headers["X-Frame-Options"] == "DENY"
    assert root.get("/").headers["Cache-Control"] == "no-store"
    raw = TestClient(env[0].app)
    assert raw.post("/api/login", json={"username": "admin", "password": PASSWORD}).status_code == 403


def test_real_closed_loop_and_reopen(env):
    _, root, m, _, create, _ = env
    vid = create(owner=None)
    assert action(root, vid, "assign", owner_id=m["owner1"]["id"]).status_code == 200
    owner = m["owner1"]["client"]
    assert action(owner, vid, "start").status_code == 200
    assert action(owner, vid, "submit").status_code == 200
    assert root.get("/api/dashboard").json()["closed"] == 0
    assert action(m["security"]["client"], vid, "reject").status_code == 200
    assert owner.get(f"/api/vulnerabilities/{vid}").json()["status"] == "fixing"
    assert action(owner, vid, "submit").status_code == 200
    assert action(root, vid, "pass").status_code == 200
    d = root.get("/api/dashboard").json()
    assert d["closed"] == 1 and d["overdue"] == 0 and d["close_rate"] == 100
    assert action(root, vid, "reopen").status_code == 200
    v = root.get(f"/api/vulnerabilities/{vid}").json()
    assert v["status"] == "assigned" and v["closed_at"] is None
    assert len(v["events"]) == 8


def test_owner_scope_and_viewer_readonly(env):
    _, root, m, aid, create, _ = env
    vid = create()
    other = create(owner="owner2")
    owner, outsider, viewer = (m[n]["client"] for n in ("owner1", "owner2", "viewer"))
    assert owner.get("/api/vulnerabilities").json()["total"] == 1
    assert outsider.get(f"/api/vulnerabilities/{vid}").status_code == 404
    assert owner.get(f"/api/vulnerabilities/{other}").status_code == 404
    assert owner.get("/api/dashboard").json()["total"] == 1
    assert owner.get("/api/vulnerabilities?owner_id="+str(m["owner2"]["id"])).json()["total"] == 0
    assert viewer.get("/api/vulnerabilities").json()["total"] == 2
    assert action(viewer, vid, "start").status_code == 403
    assert action(owner, vid, "assign", owner_id=m["owner2"]["id"]).status_code == 403
    assert owner.post("/api/assets", json={"name": "no", "address": "x"}).status_code == 403
    assert owner.get("/api/audit").status_code == 403
    assert "password_hash" not in root.get("/api/users").text


def test_no_self_review_and_illegal_transitions(env):
    _, root, m, _, create, _ = env
    vid = create()
    assert action(root, vid, "pass").status_code == 409
    assert action(root, vid, "submit").status_code == 200
    assert action(root, vid, "pass").status_code == 403
    assert action(root, vid, "reject").status_code == 403
    assert action(m["security"]["client"], vid, "pass").status_code == 200
    assert action(root, vid, "start").status_code == 409
    assert action(root, vid, "assign", owner_id=m["owner2"]["id"]).status_code == 409


def test_overdue_sla_and_dashboard_filters(env):
    mod, root, m, _, create, _ = env
    create(severity="critical")
    create(severity="high")
    create(severity="low")
    due_today = create(due_date=mod.today().isoformat())
    d = root.get("/api/dashboard").json()
    assert d["total"] == 4 and d["overdue"] == 2
    assert sum(d["statuses"].values()) == d["total"]
    assert sum(d["severity"].values()) == d["open"]
    assert d["critical_high"] == 3
    assert root.get("/api/vulnerabilities?overdue=true").json()["total"] == 2
    assert root.get("/api/vulnerabilities?severity=critical_high").json()["total"] == 3
    assert root.get(f"/api/vulnerabilities/{due_today}").json()["overdue_days"] == 0
    assert root.get("/api/vulnerabilities?q=VUL-00001").json()["total"] == 1
    assert root.get("/api/vulnerabilities?page=2&page_size=2").json()["items"]


def test_optimistic_lock_and_edit_audit(env):
    _, root, m, _, create, _ = env
    vid = create()
    old = root.get(f"/api/vulnerabilities/{vid}").json()
    assert action(m["owner1"]["client"], vid, "start").status_code == 200
    assert root.post(f"/api/vulnerabilities/{vid}/actions", json={"action": "comment", "note": "过期页面更新", "version": old["version"]}).status_code == 409
    current = root.get(f"/api/vulnerabilities/{vid}").json()
    keys = ["title", "severity", "category", "source", "asset_id", "location", "cve", "description", "recommendation", "owner_id", "discovered_at", "due_date", "version"]
    update = {k: current[k] for k in keys}
    update.update(title="修改后的漏洞标题", reason="核实漏洞影响后修订")
    assert root.put(f"/api/vulnerabilities/{vid}", json=update).status_code == 200
    v = root.get(f"/api/vulnerabilities/{vid}").json()
    assert '修改后的漏洞标题' in v["events"][0]["note"]
    assert '原值' in v["events"][0]["note"]
    update.update(version=v["version"], owner_id=m["owner2"]["id"])
    assert root.put(f"/api/vulnerabilities/{vid}", json=update).status_code == 422


def test_attachment_acl_download_and_file_validation(env):
    _, root, m, _, create, _ = env
    vid = create()
    owner = m["owner1"]["client"]
    r = owner.post(f"/api/vulnerabilities/{vid}/attachments", files={"file": ("evidence.txt", b"verified remediation", "text/plain")})
    assert r.status_code == 201, r.text
    aid = r.json()["id"]
    assert owner.get(f"/api/attachments/{aid}").content == b"verified remediation"
    assert "attachment" in owner.get(f"/api/attachments/{aid}").headers["content-disposition"]
    assert m["owner2"]["client"].get(f"/api/attachments/{aid}").status_code == 404
    assert m["viewer"]["client"].post(f"/api/vulnerabilities/{vid}/attachments", files={"file": ("x.txt", b"x")}).status_code == 403
    for filename, content, status in [("x.exe", b"x", 422), ("x.txt", b"", 422), ("big.txt", b"x" * (10*1024*1024+1), 413)]:
        assert owner.post(f"/api/vulnerabilities/{vid}/attachments", files={"file": (filename, content)}).status_code == status


def test_export_scope_and_formula_escape(env):
    _, root, m, _, create, _ = env
    create(title='=HYPERLINK("example.invalid")')
    create(owner="owner2", title="另一个人的漏洞")
    result = m["owner1"]["client"].get("/api/export")
    assert result.status_code == 200
    assert "'=HYPERLINK" in result.text
    assert "另一个人的漏洞" not in result.text
    assert result.content.startswith(b'\xef\xbb\xbf')


def test_member_disable_and_password_invalidation(env):
    _, root, m, _, create, _ = env
    vid = create()
    owner = m["owner1"]["client"]
    uid = m["owner1"]["id"]
    assert root.patch(f"/api/users/{uid}", json={"active": False}).status_code == 409
    assert action(root, vid, "assign", owner_id=m["owner2"]["id"]).status_code == 200
    assert root.patch(f"/api/users/{uid}", json={"active": False}).status_code == 200
    assert owner.get("/api/me").status_code == 401
    assert root.patch("/api/users/1", json={"active": False}).status_code == 400
    assert root.post("/api/password", json={"old_password": PASSWORD, "new_password": "Changed-Password-2026"}).status_code == 200
    assert root.get("/api/me").status_code == 401


def test_schema_rejects_client_authority_and_invalid_dates(env):
    mod, root, _, aid, _, _ = env
    base = {"title": "测试验证漏洞", "severity": "high", "category": "其他", "source": "人工排查", "asset_id": aid, "description": "详细描述内容", "discovered_at": mod.today().isoformat()}
    assert root.post("/api/vulnerabilities", json={**base, "role": "admin"}).status_code == 422
    assert root.post("/api/vulnerabilities", json={**base, "status": "closed"}).status_code == 422
    assert root.post("/api/vulnerabilities", json={**base, "asset_id": 9999}).status_code == 422
    assert root.post("/api/vulnerabilities", json={**base, "discovered_at": (mod.today()+timedelta(days=1)).isoformat()}).status_code == 422
    assert root.post("/api/vulnerabilities", json={**base, "due_date": (mod.today()-timedelta(days=1)).isoformat()}).status_code == 422


def test_throttle_failed_login_persists(env):
    _, _, _, _, _, client = env
    c = client()
    for _ in range(10):
        assert c.post("/api/login", json={"username": "admin", "password": "incorrect"}).status_code == 401
    assert c.post("/api/login", json={"username": "admin", "password": PASSWORD}).status_code == 429


def test_data_survives_app_reinitialization(env):
    mod, root, _, _, create, client = env
    vid = create()
    mod.init_db()
    fresh = client()
    fresh.post("/api/login", json={"username": "admin", "password": PASSWORD})
    assert fresh.get(f"/api/vulnerabilities/{vid}").json()["title"] == "未授权访问漏洞"
    assert fresh.get("/api/setup").json()["required"] is False


def test_reopen_after_original_owner_disabled(env):
    _, root, m, _, create, _ = env
    vid = create()
    assert action(m['owner1']['client'], vid, 'submit').status_code == 200
    assert action(root, vid, 'pass').status_code == 200
    assert root.patch(f"/api/users/{m['owner1']['id']}", json={'active': False}).status_code == 200
    assert action(root, vid, 'reopen').status_code == 200
    v = root.get(f'/api/vulnerabilities/{vid}').json()
    assert v['status'] == 'new' and v['owner_id'] is None


def test_live_backup_is_complete_and_revokes_restored_sessions(env, tmp_path):
    import sqlite3
    import subprocess
    import zipfile
    mod, root, m, _, create, _ = env
    vid = create()
    payload = b'backup evidence'
    root.post(f'/api/vulnerabilities/{vid}/attachments', files={'file': ('backup.txt', payload)})
    out = tmp_path / 'backup.zip'
    result = subprocess.run([sys.executable, str(Path(mod.__file__).with_name('backup.py')), '--output', str(out)], capture_output=True, text=True, timeout=20)
    assert result.returncode == 0, result.stderr
    with zipfile.ZipFile(out) as z:
        assert 'data/vulnops.db' in z.namelist()
        attachment = next(n for n in z.namelist() if n.startswith('data/attachments/'))
        assert z.read(attachment) == payload
        z.extract('data/vulnops.db', tmp_path / 'restored')
    with sqlite3.connect(tmp_path / 'restored' / 'data' / 'vulnops.db') as con:
        assert con.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert con.execute('SELECT COUNT(*) FROM sessions').fetchone()[0] == 0
        assert con.execute('SELECT COUNT(*) FROM vulnerabilities').fetchone()[0] == 1
    assert root.get('/api/me').status_code == 200
