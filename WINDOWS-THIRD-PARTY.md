# Windows bundled runtimes

The portable distribution includes unmodified third-party runtimes and Python/npm dependencies. Their original license files remain in the runtime and dependency directories. This project does not relicense those components.

| Component | Version | License / upstream source |
| --- | --- | --- |
| CPython | 3.12.14, x86-64 | PSF; `_runtime/python/LICENSE.txt`; https://www.python.org/downloads/source/ |
| Python standalone distribution | uv-managed CPython runtime | https://github.com/astral-sh/python-build-standalone |
| Node.js | 24.18.0, Windows x64 | `_runtime/node/LICENSE`; https://nodejs.org/dist/v24.18.0/ |
| npm | Included with Node runtime | `_runtime/node/node_modules/npm/LICENSE` and bundled dependency licenses |
| Git for Windows | 2.56.0.windows.2 | GPLv2; `_runtime/git/LICENSE.txt`; corresponding upstream source: https://github.com/git-for-windows/git/tree/v2.56.0.windows.2 |
| esbuild | 0.27.2, Windows x64 | MIT; `webui/node_modules/esbuild/LICENSE.md`; https://github.com/evanw/esbuild/tree/v0.27.2 |
| Microsoft Visual C++ x64 Redistributable | Official signed installer | `_runtime/vc_redist.x64.exe`; https://aka.ms/vs/17/release/vc_redist.x64.exe ; Microsoft installer license terms apply |

Pinned Python package versions are listed in `requirements.windows.lock`. The npm dependency tree is specified in `webui/package-lock.json`. Package-level license files and metadata accompany the installed dependencies.

The included runtime copies do not contain the builder's personal accounts or configuration. User data is created separately in `runtime/` or the selected `--data-dir` on first launch.


## 2026.11.18 轻量安装

随包保留 Python 标准运行文件、Git for Windows、uv 安装引擎与 Microsoft VC++ x64 安装器。Node 和主要 Python/npm 运行依赖首次安装时获取，遵循各自许可证。uv 来自 Astral，采用 MIT/Apache-2.0 双许可证；官方仓库 https://github.com/astral-sh/uv 。已安装依赖的源与版本见 requirements.windows.lock（启动安装时排除开发测试依赖）。
