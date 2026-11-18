# Windows 安装与运行


1. 将 Windows ZIP 完整解压到普通用户可写的目录，建议使用短路径。
2. 双击 `start.cmd`。基础 Python 和 Git 随包提供，首次启动会下载 Node、Python 运行依赖和场景编译依赖；请保持网络可用并等待控制台提示。
3. 缺少 Microsoft Visual C++ x64 运行库时，会调用随包的微软安装器，请完成系统安装提示。
4. 安装中断后重新运行同一目录下的 `start.cmd`，已校验的下载可复用。完成后日常启动使用本地依赖。
5. 浏览器打开 `http://127.0.0.1:5200`，设置自己的管理员账号密码，再配置模型和设备。

可在命令行执行：

```bat
start.cmd --check
start.cmd --port 5201
start.cmd --data-dir D:\AegisOpsData
```

默认数据目录为项目内 `runtime`；日志为 `runtime\logs\windows-server.log`。保持启动窗口打开，使用 Ctrl+C 停止。依赖仅安装到项目的 `_runtime` 目录，不覆盖系统 Python。


## 平台范围

完整工作台可在 Windows 本机运行。REA 隔离 worker 使用 Linux/WSL2；Solar Windows 图形工具没有后台接入，Windows 主机调查使用 WinRM HTTPS 固定模板。

[完整部署与操作手册](DEPLOY.md)
