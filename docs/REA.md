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
