"""AegisOps foreground launcher; safe to restart against an existing data directory."""
from pathlib import Path
import argparse
import json
import os
import shutil
import sys

BASE=Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

def initialize(root):
    root.mkdir(parents=True,exist_ok=True)
    for key,value in {
        "AEGISOPS_ROOT":str(root), "AEGISOPS_CONFIG_DIR":str(root/"config"),
        "AEGISOPS_DATA_DIR":str(root/"data"), "AEGISOPS_WORKSPACE_DIR":str(root/"workspace"),
        "AEGISOPS_HUB_ROOT":str(BASE/"defaults/hub"),
        "AEGISOPS_WEBUI_DIST_DIR":str(BASE/"webui/dist"),
    }.items(): os.environ[key]=value
    for folder in ["config","data","workspace","plugins"]:(root/folder).mkdir(exist_ok=True)
    # Seed missing plugin files only. Existing customizations remain intact.
    for source in (BASE/"defaults/plugins").rglob("*"):
        if not source.is_file() or "__pycache__" in source.parts or any(p.endswith(".egg-info") for p in source.parts):continue
        relative=source.relative_to(BASE/"defaults/plugins")
        if relative.parts[0]=="aegis-scenes-runtime":continue
        target=root/"plugins"/relative
        if not target.exists():
            target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
    config=root/"config/aegisops.json"
    if not config.exists():
        config.write_text(json.dumps({"provider":{},"mcp":{},"channels":{},"plugin":[]},ensure_ascii=False,indent=2),encoding="utf-8")

if __name__=="__main__":
    parser=argparse.ArgumentParser(description="御枢 · AegisOps")
    parser.add_argument("--host",default=os.getenv("AEGISOPS_HOST","127.0.0.1"))
    parser.add_argument("--port",type=int,default=int(os.getenv("AEGISOPS_PORT","5200")))
    parser.add_argument("--data-dir",default=os.getenv("AEGISOPS_ROOT",str(BASE/"runtime")))
    args=parser.parse_args()
    initialize(Path(args.data_dir).expanduser().resolve())
    os.chdir(BASE)
    import uvicorn
    uvicorn.run("aegisops.server.app:app",host=args.host,port=args.port,workers=1,access_log=False)
