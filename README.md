<div align="center">

<img src="webui/public/favicon.svg" width="76" alt="AegisOps" />

# 御枢 · AegisOps

### 从告警研判，到应急取证，再到漏洞整改。

把模型、智能体、工具和业务场景连接起来的 AI 安全运营工作台。

[![Release](https://img.shields.io/github/v/release/knot07/AegisOps?color=6f984d)](https://github.com/knot07/AegisOps/releases/latest)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](LICENSE.txt)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB)](pyproject.toml)

[下载部署包](https://github.com/knot07/AegisOps/releases/latest) · [部署与操作](DEPLOY.md) · [Windows 指南](WINDOWS.md) · [在线更新](docs/ONLINE-UPDATE.md) · [全部页面预览](#全部页面预览)

</div>

![AegisOps 运营首页](docs/images/pages/home.png)

## 为什么做这个工作台

日常安全运营常常需要在告警设备、日志查询、主机排查、威胁情报和漏洞台账之间切换。AegisOps 将这些入口放入一套统一界面：Atlas 负责对话与能力调度，工作流约束重复步骤，业务场景承接实际处置与记录。

内置三个可切换工作空间：**告警研判、漏洞运营、应急响应**。可从演示平台熟悉界面，再配置自己的模型、设备与主机连接。新部署不携带任何预置账号或业务数据。

```mermaid
flowchart LR
 A[设备接入与日志] --> B[告警研判]
 B --> C[人工确认]
 C --> D[应急响应与证据]
 C --> E[转入漏洞库]
 D --> F[报告与复核]
 E --> G[分派、整改与复测]
 H[Atlas / 模型 / 工具 / 知识 / 工作流] -.-> B
 H -.-> D
 H -.-> E
```

## 下载哪个版本

Release 仅提供三个文件，按部署方式选择：

| 下载 | 适用环境 | 启动方式 |
| --- | --- | --- |
| [Windows x64](https://github.com/knot07/AegisOps/releases/latest/download/AegisOps-2026.11.08-Windows-x64.zip) | Windows 10/11 x64，附 Python、Node、Git 运行环境 | 解压后双击 `start.cmd` |
| [Linux](https://github.com/knot07/AegisOps/releases/latest/download/AegisOps-2026.11.08-Linux.zip) | Linux 原生安装或 Docker Compose | `bash install.sh` 或 `docker compose up -d --build` |
| [Source](https://github.com/knot07/AegisOps/releases/latest/download/AegisOps-2026.11.08-Source.zip) | 二次开发、源码审阅与自定义构建 | 参见部署手册 |

Linux 包和源码包使用同一份完整代码及已构建前端，Linux 包突出部署入口；Windows 包另外附带本机运行环境。首次登录在页面自行设置管理员账号和密码，**没有默认口令**。模型 API Key、设备凭据、业务记录均需自行配置。

## 能力与使用边界

| 能力 | 当前实现 |
| --- | --- |
| AI 对话与调度 | 保留普通调度及实验性 Super-agent；后者采用 Router / Worker 职责，建议以小范围任务评估 |
| 接入设备 | 厂商模板、手动配置、Atlas 辅助梳理；非 TDP 设备需按真实 API、日志样本和字段映射调整流程 |
| 告警闭环 | 正式与演示平台分开；人工确认后触发漏洞入库或应急事件 |
| 漏洞运营 | 台账、整改、资产、审计，统一成员权限 |
| 应急响应 | 受控流程 + AI 分析，SSH / WinRM 只读采集、证据管理、样本摘要、微步沙箱与报告 |
| 在线更新 | 管理员手动检查，SHA256 校验、数据及代码备份、重启检查、失败回滚 |

AI 功能需要可用模型；设备和沙箱功能需要实际接口权限。沙箱报告属于外部分析依据，不能直接等同攻击者身份归因。当前不包含 EDR 远程响应，也不承诺无人工确认的自动处置。远程主机和微步集成需要在自己的授权环境完成连接验证。

## 快速开始

Windows：完整解压后运行 `start.cmd`，访问启动窗口显示的地址（默认 `http://127.0.0.1:5200`）。可先运行 `start.cmd --check` 检查运行环境。

Linux 原生：准备 Python 3.12、Node.js 22+ 与 npm，然后执行：

```bash
bash install.sh
.venv/bin/python run.py --host 127.0.0.1 --port 5200
```

Docker：

```bash
docker compose up -d --build
```

创建管理员 → 配置模型 → 按需接入设备 → 切换业务场景。详细配置、数据路径与升级方式见 [部署与操作手册](DEPLOY.md)。

## 全部页面预览

以下截图来自本次发行版的独立安装环境。域名、IP、资产、漏洞和应急事件均为演示数据；应急截图没有执行真实主机调查。部署包不包含这些演示业务记录。空状态截图展示首次配置时的真实页面。

### 1. 运营首页

查看任务趋势、执行概况与能力资源，通过趋势图掌握工作台的运行情况。

![运营首页](docs/images/pages/home.png)


### 2. Atlas 对话

通过自然语言提出任务，选择模型、智能体、技能和工作流；历史会话集成在同一工作台。普通调度与实验性 Super-agent 调度均保留。

![Atlas 对话](docs/images/pages/chat.png)


### 3. 任务中心

集中查看任务状态和执行记录，定位任务、了解进度并追踪输出。

![任务中心](docs/images/pages/tasks.png)


### 4. 智能体

为不同分析职责维护独立角色、模型、系统提示词及工具权限。Atlas 使用专属品牌图标，其他智能体采用各自的图标和主题色。

![智能体](docs/images/pages/agents.png)


### 5. 技能库

管理可复用的分析方法与操作指导；厂商相关技能展示对应标识，详情和编辑界面采用统一的浅色主题。

![技能库](docs/images/pages/skills.png)


### 6. 工作流

管理、创建和预览可复用流程。内置研判流程需按实际设备接口和字段样本配置，不能直接假定适配所有厂商。

![工作流](docs/images/pages/workflows.png)


### 7. 工作目录

查看任务文件和工作产物，与记忆、知识通过顶部标签切换。

![工作目录](docs/images/pages/workspace.png)


### 8. 知识库

维护知识文件与数据集，为模型提供业务背景、设备手册和分析参考。检索及嵌入能力需要相应模型配置。

![知识库](docs/images/pages/knowledge.png)


### 9. 记忆

查看和维护长期上下文，减少重复说明，支持按实际任务整理有价值的信息。

![记忆](docs/images/pages/memory.png)


### 10. 工具清单

统一浏览工具能力及详情，管理 MCP、API 等连接；知名厂商能力使用对应品牌标识。工具执行仍取决于实际凭据及权限。

![工具清单](docs/images/pages/tools.png)


### 11. 设备接入

按厂商展示接入模板和品牌配色，支持已知参数的手工接入，也可通过 Atlas 根据配置手册辅助梳理接口与字段。

![设备接入](docs/images/pages/devices.png)


### 12. 模型清单

管理模型提供商、接口与模型用量。发行包不预置 API Key，首次部署需自行配置可用模型。

![模型清单](docs/images/pages/models.png)


### 13. 通道配置

维护消息平台等外部通道的配置，配置页跟随各平台的主题配色。

![通道配置](docs/images/pages/channels.png)


### 14. 插件广场

按资源类型、场景和标签筛选插件，统一管理智能体、技能、工具、工作流与场景扩展。

![插件广场](docs/images/pages/hub.png)


### 15. 告警研判：演示平台

固定样例展示告警趋势、攻击分布及研判结果。页面明确标注演示，不连接生产设备。

![告警研判：演示平台](docs/images/pages/review.png)


### 16. 告警研判：正式平台

正式入口与演示入口同时保留。接入设备和模型后开展研判；人工确认后可转入漏洞库，或下发应急响应。截图为未接入真实设备的初始状态。

![告警研判：正式平台](docs/images/pages/review-live.png)


### 17. 漏洞运营：运营总览

集中展示风险分布、整改进度与业务统计；顶部切换台账、整改、资产和审计。以下业务记录均为专门建立的演示数据，不随部署包提供。

![漏洞运营：运营总览](docs/images/pages/vuln-overview.png)


### 18. 漏洞运营：漏洞台账

统一登记风险、严重程度、责任人与关联资产；支持搜索、筛选和查看详情，以颜色区分风险。

![漏洞运营：漏洞台账](docs/images/pages/vuln-ledger.png)


### 19. 漏洞运营：整改工作台

跟踪分派、修复、提交复测和关闭过程，保持漏洞状态与操作记录关联。

![漏洞运营：整改工作台](docs/images/pages/vuln-remediation.png)


### 20. 漏洞运营：资产目录

支持资产新增、搜索、编辑、删除及关联漏洞查看；不同资产类别使用定制图标和多彩渐变卡片。

![漏洞运营：资产目录](docs/images/pages/assets.png)


### 21. 漏洞运营：操作审计

查看业务操作留痕。成员与业务权限在主系统账号管理中统一维护。

![漏洞运营：操作审计](docs/images/pages/vuln-audit.png)


### 22. Atlas 原生 AI 辅助

登记资产、漏洞、主机和事件时可先与 Atlas 对话，也可切换手工填写。问答采用主系统原生会话能力，AI 输出需核实后使用。

![Atlas 原生 AI 辅助](docs/images/pages/atlas-assist.png)


### 23. 应急响应：事件工作台

可从已确认告警下发事件，也可手工或由 AI 辅助登记；支持事件搜索、删除与调查状态跟踪。截图为未执行调查的模拟事件。

![应急响应：事件工作台](docs/images/pages/incident.png)


### 24. 应急响应：调查时间线

以定制图标展示确认、日志关联、主机排查、证据、沙箱和报告阶段。采用固定采集流程约束执行，再由 AI 分析证据。

![应急响应：调查时间线](docs/images/pages/incident-timeline.png)


### 25. 应急响应：远程排查

支持 Linux SSH 与 Windows WinRM 的受控只读采集。主机需先登记，配置连接凭据、可信主机公钥或证书；首版不集成 EDR。

![应急响应：远程排查](docs/images/pages/incident-host.png)


### 26. 应急响应：证据与样本

保留采集结果、文件摘要和证据关联，支持获取授权主机上的指定文件，以及显式确认后提交微步云沙箱。微步需开通对应文件上传与报告 API 权限。

![应急响应：证据与样本](docs/images/pages/incident-evidence.png)


### 27. 应急响应：响应报告

基于现有证据生成和导出 Markdown 报告，区分事实、推断与待验证线索。未采集到的证据不会被视作已确认结果。

![应急响应：响应报告](docs/images/pages/incident-report.png)


### 28. 应急响应：主机与连接

集中登记调查目标和连接信息，明确目标、采集方式与信任校验。未配置连接的事件不会自动登录任意主机。

![应急响应：主机与连接](docs/images/pages/incident-connections.png)


### 29. 偏好设置

统一维护工作台显示与使用偏好。

![偏好设置](docs/images/pages/preferences.png)


### 30. 账号管理

首次部署自行创建管理员；管理员可新增可登录的用户、分配系统角色，并统一维护漏洞运营成员权限。

![账号管理](docs/images/pages/accounts.png)


### 31. 系统日志

查看系统运行记录，用于定位连接、任务执行及服务运行问题。

![系统日志](docs/images/pages/system-logs.png)


### 32. 已归档会话

集中管理归档后的历史会话，保持当前工作列表简洁。

![已归档会话](docs/images/pages/archived.png)


### 33. 在线更新

管理员点击侧栏底部更新图标，手动检查 GitHub 稳定版本。支持校验、备份、安装、重启与启动失败自动回滚；依赖发生变化时提示下载完整包。

![在线更新](docs/images/pages/online-update.png)

## 更新与数据保存

使用本版 `run.py` 或 Windows `start.cmd` 启动后，管理员可在侧栏底部使用在线更新。**2026.11.06 及更早版本需先手工升级一次**；Docker 使用新包重新构建，并复用原数据卷。备份包含敏感业务数据，请保存在受控目录。不要删除 `runtime/` 或原有数据卷。

## 贡献与许可

欢迎通过 Issues 提交问题、设备接入建议和界面反馈，提交日志前请移除凭据及业务数据。代码采用 [Apache-2.0](LICENSE.txt)。第三方依赖、厂商品牌与图标权利归其各自权利人所有；展示标识不代表获得厂商背书。Windows 运行环境说明见 [第三方组件](WINDOWS-THIRD-PARTY.md)。
