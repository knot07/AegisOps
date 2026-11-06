#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PYTHON="${AEGISOPS_PYTHON:-python3.12}"
"$PYTHON" -c 'import sys; assert sys.version_info[:2] == (3,12), "Python 3.12 is required"'
command -v node >/dev/null
command -v npm >/dev/null
"$PYTHON" -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.lock
.venv/bin/python -m pip install --no-deps -e .
.venv/bin/python -m pip install --no-deps -e defaults/plugins/aegis-scenes-runtime
(cd webui && npm ci --include=dev)
if [[ ! -f webui/dist/index.html ]]; then (cd webui && npm run build); fi
printf '\nReady: .venv/bin/python run.py --host 0.0.0.0 --port 5200\n'
