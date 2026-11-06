"""Consistent backup of SQLite and evidence files. Run locally as an operator."""
import argparse
import os
import sqlite3
import tempfile
import zipfile
from contextlib import closing
from datetime import datetime
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="备份漏洞运营数据库及证据附件")
    parser.add_argument("--output", help="备份 ZIP 的输出路径，默认保存到 backups/")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    data = Path(os.environ.get("VULNOPS_DATA", str(root / "data"))).resolve()
    if not (data / "vulnops.db").exists():
        raise SystemExit("数据库尚未创建，请先启动系统。")
    target = Path(args.output).resolve() if args.output else root / "backups" / f"vulnops-{datetime.now():%Y%m%d-%H%M%S}.zip"
    target.parent.mkdir(parents=True, exist_ok=True)
    # Prevent concurrent writes while snapshotting both the database and its evidence files.
    with closing(sqlite3.connect(data / "vulnops.db", timeout=20)) as guard:
        guard.execute("BEGIN IMMEDIATE")
        try:
            with tempfile.TemporaryDirectory(dir=data.parent) as temp:
                snapshot = Path(temp) / "vulnops.db"
                with closing(sqlite3.connect(data / "vulnops.db")) as source, closing(sqlite3.connect(snapshot)) as dest:
                    source.backup(dest)
                with closing(sqlite3.connect(snapshot)) as dest:
                    rows = dest.execute("SELECT storage_name FROM attachments").fetchall()
                    # A restored backup must require users to authenticate again.
                    dest.execute("DELETE FROM sessions")
                    dest.commit()
                for (name,) in rows:
                    if not (data / "attachments" / name).is_file():
                        raise FileNotFoundError(f"证据文件缺失，备份已中止：{name}")
                with zipfile.ZipFile(target, "x", compression=zipfile.ZIP_DEFLATED) as out:
                    out.write(snapshot, "data/vulnops.db")
                    for (name,) in rows:
                        out.write(data / "attachments" / name, f"data/attachments/{name}")
        finally:
            guard.rollback()
    print(f"Backup saved: {target}")


if __name__ == "__main__":
    main()
