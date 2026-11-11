# 御枢 · AegisOps 部署与操作手册

版本：2026.11.11。三个下载入口见 [Releases](https://github.com/knot07/AegisOps/releases/latest)。

## 选择部署包

Windows x64 包附 Python 3.12、Node、Git、前端编译器及 Python 依赖；Linux 与 Source 包包含完整代码、已构建前端、插件目录、三个场景及安装脚本，需要联网安装依赖。Linux 和 Source 使用同一核心清单，Windows 在此基础上附运行环境。

发行包不含用户、密码、会话、漏洞、资产、业务数据库、API Key、设备凭据、私有 MCP 配置及当前定时任务。README 截图中的演示业务数据不随包提供。

## Windows

将 Windows ZIP 完整解压到普通用户可写目录（建议短路径），运行 `start.cmd --check`，再双击 `start.cmd`。如缺少 Microsoft Visual C++ x64 运行库，按提示运行 `_runtime\vc_redist.x64.exe` 后重试。详见 [Windows 指南](WINDOWS.md)。

```bat
start.cmd --port 5200
start.cmd --port 5201 --no-browser --data-dir D:\AegisOpsData
```

保持启动窗口运行。默认绑定本机地址；需要局域网访问时使用 `--host 0.0.0.0`，并配置防火墙和 HTTPS 反向代理。关闭前等待任务结束。

## Linux 原生

准备 Python 3.12、venv、Node.js 22+、npm 和 Git。Ubuntu 可按需要安装 `libgl1`、`libglib2.0-0` 及中文字体。使用同一个普通用户安装与运行，目录需可写。

```bash
bash install.sh
.venv/bin/python run.py --host 127.0.0.1 --port 5200
# 将业务数据保存在固定目录
.venv/bin/python run.py --host 0.0.0.0 --port 5200 --data-dir /srv/aegisops-data
```

WSL 建议在 Linux 文件系统中解压，避免在 Windows 挂载盘运行大量依赖文件。systemd 可使用项目与 Python 的绝对路径启动 `run.py`，保持固定用户、工作目录与 `--data-dir`。

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f
```

默认仅映射 `127.0.0.1:5200`，数据保存至 `aegisops-data` 命名卷。设置 `AEGISOPS_BIND_ADDRESS` 和 `AEGISOPS_PORT` 可调整映射。更新时使用新发行包重新构建，保持 Compose 项目名和原数据卷不变；不要执行删除数据卷的命令。此版 Docker 配置提供部署入口，本次发布验证了 Linux 原生和 Windows 本机运行，未重新执行 Docker 镜像构建。

## 首次初始化

1. 打开启动地址，按页面提示自行设置管理员账号和密码，没有默认口令。初始化完成前保持仅本机访问。
2. 进入模型清单，配置服务商、接口、API Key 与模型标识，验证连接后再使用 AI。
3. 在账号管理新增用户并设置系统角色。漏洞运营的成员及业务权限也在这里维护。
4. 左侧“场景中心·切换工作空间”可切换告警研判、漏洞运营与应急响应。
5. 正式研判与演示平台分开。演示平台使用固定样例，不能证明正式设备已连接。

## 设备与告警研判

已知接入参数时使用“设备接入”的手动配置；不熟悉接口时点击 Atlas 快速接入，将厂商配置手册和脱敏日志样本交给 Atlas 辅助梳理。对非 TDP 设备，需要按实际接口、认证、告警字段和流量样本调整工作流，不能只修改显示名称后就视为接入完成。

内置研判工作流已提供定义文件，模型参数和真实设备连接需自行设置。告警详情中人工确认后可点击“转入漏洞库”，触发 AI 提取并写入；也可点击应急响应，将事件转入应急工作台。写入后应复核关联资产、风险与证据。

## 应急响应

可从告警转入或新增手工事件，也可先与 Atlas 对话再补充表单。调查使用确定的受控采集步骤，AI 对实际证据进行分析。事件状态和时间线用于区分执行中、失败和待复核结果。

Linux 使用 SSH，需配置授权目标、凭据及可信 OpenSSH 主机公钥；Windows 使用 HTTPS WinRM（通常 5986）、NTLM 与可信证书。首版没有 EDR 远程响应。不要绕过证书或主机信任检查来掩盖连接问题。

文件取证支持指定路径与大小限制（单文件最大 20 MB），采集前后核对 SHA256。微步云沙箱使用 API Key，不依赖保存网页登录密码或 Cookie；需有文件上传及报告查询权限。外发样本需要操作者明确确认。报告基于证据生成，可导出 Markdown；外部沙箱结论不等同攻击者身份归因。

本次发布未连接真实业务 Linux/Windows 主机执行远程排查，也未验证用户企业沙箱权限；在正式环境使用前应以授权测试目标完成端到端验证。

## 调度、技能与工具

普通调度与实验性 Super-agent 均保留，可在对话时切换。Super-agent 使用 Router / Worker 职责；温度仍是调用模型时的采样参数，并非调度强度，具体是否生效取决于所选模型支持。Atlas 系统提示词、技能、工作流和工具应结合实际授权范围维护。

工作·记忆·知识通过同一入口切换。技能、工具与插件详情可查看配置和能力说明，卡片的厂商图标只表示所属平台，不代表连接已成功。

## 在线更新与手工升级

管理员在左侧底部点击更新图标，检查 GitHub 稳定版本、下载校验，再确认备份并安装。使用本版 `run.py` 或 `start.cmd` 托管启动才能自动重启；运行任务结束后再更新。依赖变化时需下载完整部署包。流程详见 [在线更新说明](docs/ONLINE-UPDATE.md)。

旧版 2026.11.06 需先手工升级到这一版。停止旧服务，备份整个数据目录，再将新包解压至新目录，以相同 `--data-dir` 启动。Windows 同时使用新包附带的 `_runtime`。不要将空白新数据目录覆盖旧数据。

默认数据目录为项目内 `runtime/`，自定义时以启动参数为准。`config/`、`data/`、`workspace/`、`plugins/` 均应保留。在线更新备份位于数据目录下 `updates/backups/`，包含敏感配置与业务记录，需限制访问并按保留策略清理。

## 常见问题

- 页面未出现：先检查 `/api/health`、端口占用与日志；场景首次编译需要等待，Windows 确保完整解压了运行环境和编译器。
- AI 不回复：确认可用模型、接口地址、网络与余额；干净包不会携带原环境密钥。
- 正式研判无数据：检查实际设备凭据和日志映射；演示平台数据与生产无关。
- 更新失败：查看更新对话框状态及备份路径；启动检查失败会自动回滚，依赖变化按完整包升级。
- Windows 日志：默认在数据目录的 `logs/windows-server.log`。向 Issues 提交前移除凭据和业务信息。


## 2026.11.11 说明

# REA 深度静态逆向部署

控制接口、报告和原生工具已随主程序提供。Linux 包的 optional/rea 是可选离线运行时；源码包和原生 Windows 包不携带此运行时。不会默认以 root 启动主平台。

Linux x64 / Ubuntu 24.04 / Python 3.12，需 root、iproute2（ip/netns）、runuser 和可用网络命名空间。建议 systemd。

1. 先部署 Linux 主包并完成账号和模型设置。
2. 停止主平台。使用安装主程序的同一个用户所使用的虚拟环境和插件路径运行（替换示例路径）：

```sh
sudo python3 optional/rea/rea_install.py --python /path/to/AegisOps/.venv/bin/python --plugins /path/to/user-data/plugins --no-restart
```

3. 安装器校验离线文件、安装低权限 worker、私有 Node/JDK/Ghidra、Python 依赖和开机服务；不会覆盖场景业务代码。安装器修改前保留备份。
4. 该版本的本机 worker 需要启动它的后端有权限执行 ip netns exec / runuser。默认普通用户运行平台时，REA 显示未就绪，不会回退到无隔离解析。确需使用时，在专用、受控的 Linux/WSL2 主机以 root 启动对应后端；不建议将该后端直接暴露公网。
5. 管理员访问 /api/scenes/incident/rea/status，ready=true 才能执行；在样本与逆向中查看实际反编译报告。

Windows 用户使用 WSL2 中的 Linux 主包，不能在原生 Windows 运行此安装器。Docker 默认镜像是普通用户且不具备命名空间权限，不会自动启用 REA。

只读静态解析不执行样本，不等于绝对安全的恶意软件隔离环境。不支持动态调试或反沙箱规避。5 MB、PE/ELF、600 秒任务上限及 bounded AI 查询；截断、失败和未覆盖函数会明确记录。许可证随 optional/rea/licenses 与各运行时提供。

新版本的手工应急事件必须选择来源设备。支持 TDP 和 360 WAF 自动关联日志，其余设备待适配。微步和 VT 密钥在工具清单配置；上传样本须单独确认。
