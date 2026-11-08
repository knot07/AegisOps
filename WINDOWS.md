# AegisOps Windows x64 部署

版本 2026.11.08，下载 Releases 中唯一的 `Windows-x64.zip`。支持原生 Windows 10/11 x64；本次在 Windows 本机验证，无需 WSL 或 Docker。

1. 完整解压至可写的较短目录，例如 `D:\Apps\AegisOps`，不要直接在压缩包内启动。
2. 运行 `start.cmd --check`。若提示缺少 VC++ 运行库，运行 `_runtime\vc_redist.x64.exe` 后重试。
3. 双击 `start.cmd`，等待 Service ready，并打开显示的地址。
4. 首次访问自行设置管理员，没有默认账号。配置模型与设备后使用 AI 和真实研判功能。

```bat
start.cmd --check
start.cmd --port 5200
start.cmd --host 0.0.0.0 --port 5201 --data-dir D:\AegisOpsData --no-browser
```

启动窗口需要保持运行，停止前等待任务结束。默认绑定本机地址；远程访问需配置防火墙和 HTTPS。日志位于数据目录 `logs/windows-server.log`。

包内已附 Python 3.12、Node、Git、前端编译器与 Python 依赖，部署不需要全局安装 Python/npm。模型、设备、沙箱等外部服务仍需要网络及有效凭据；部分 AI/文档能力可能按需下载模型文件。本包不包含当前业务数据或任何账号密钥。

管理员可在左侧底部打开在线更新。依赖变化时下载新 Windows 完整包，停止旧服务，备份原数据目录，在新目录解压新包并指定原 `--data-dir`。旧版首次手工迁移后才具备此更新入口。

本次 Windows 验证包括启动依赖检查、首次管理员初始化、普通用户登录、更新权限、资产增改删、应急事件增删，以及六个主要界面加载。未连接真实业务主机或企业沙箱执行远程调查。完整说明见 [部署与操作手册](DEPLOY.md)。
