---
name: tdp-internal-lateral-review
description: 使用 AegisOps 原生 TDP 只读工具复核已确认外网攻击后的内网横向和失陷行为，不依赖外部脚本。
---

# TDP 内网横向原生复核

仅在外网入口已经有明确利用证据时使用。

- 调用 `tdp_log_search` 查询疑似受害主机在入口告警前 5 分钟到后 30 分钟的 `lateral`、`out` 方向日志。
- 先查 attack；为空时再查 attack、risk、action。
- 只有出现主动横向、命令控制、下载执行、shell、virus、file、C2 或持续外联等完整链路，才能判为主机失陷。
- 单条成功告警、DNS/IOC 命中、外网返回包或规则标签不能单独证明主机失陷。
- 只做只读复核和人工处置建议，不执行封禁、隔离或设备配置修改。
