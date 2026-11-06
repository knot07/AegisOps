---
name: tdp-external-attack-review
description: 使用 AegisOps 原生 TDP 只读工具对外网攻击源或受害 IP 做告警研判，不依赖 5050、本地配置文件或外部脚本。
---

# TDP 外网攻击原生研判

## 数据入口

- 只调用同一台 TDP 的 `tdp_log_search`、`tdp_threat_monitor_list`、`tdp_threat_intelligent_aggregation`，以及只读 ThreatBook IP 情报工具。
- 以页面给出的告警上下文为调查锚点，首次查询告警时间前后 15 分钟，证据不足时最多扩到前后 60 分钟，不得把窗口外事件冒充本次证据。
- 日志查询的 `net_data_type` 使用 `attack,risk,action`；过滤表达式覆盖 `attacker`、`net.real_src_ip`、`net.src_ip`。
- 使用实时监控列表交叉核对告警详情；使用智能聚合查询同一时间窗口和攻击 IP。找到聚合事件后，携带 `incident_id`、`time_from`、`time_to` 依次查询 `attack_success`、`attack_timeline` 和 `attack_result_distribution`；从时间线提取相关 `alert_id_list` 后调用 `attack_alert_list(include_risk=true, include_action=true, cur_page=1, page_size<=100)`，并按返回分页补齐。调用 `attacker_ip_detail` 必须携带当前调查窗口的 `time_from`、`time_to`、`incident_id` 和 `attacker`。
- 真实公网 IPv4 使用项目自带的 `datang_tdp_ip_reputation` 补充情报；IPv6 跳过该 IPv4 情报工具并记录未查询。情报不能替代 TDP 本地证据。
- 任何情报或 TDP 补查失败都不能省略最终 JSON；应使用已有证据降低置信度并明确未验证项。

## 固定研判流程

1. 核对攻击 IP、告警时间、威胁名称、IOC、严重级别和检出次数，记录缺失字段。
2. 查询前后 15 分钟内该 IP 的 `attack,risk,action` 日志，整理时间线、目标、协议、端口、请求/响应、payload、攻击结果和后续行为。
3. 使用实时监控和智能聚合结果交叉验证；如果聚合事件存在，查询成功攻击名称/主机数、攻击时间线、结果分布和关联告警详情。重点核对 `reqs_line`、`reqs_body`、`resp_line`、`resp_body`、HTTP 状态、flow 字节、`established`、`threat.result`、`threat.confidence`、`threat.is_connected`、phase 与后续 risk/action。只有证据不足时才扩展到前后 60 分钟。
4. 分别列出支持证据、反对证据和缺失信息，再比较“扫描探测、攻击尝试、攻击成立、主机失陷、误报”候选假设。
5. 最后给出结论、风险级别、置信度和仅供人工参考的处置建议。

## 判定约束

- 明确区分已观察事实、分析推断和尚未验证。
- 不复制完整 `raw_data`、Cookie、会话标识或大段 Base64；只摘取与判定有关的请求/响应字段和短片段，注明来源与截断情况。
- 每条证据写明来源和时间；不得把 ThreatBook 标签或模型推测写成 TDP 观察事实。
- 结合 payload、协议、方向、源/目的、攻击结果语义、时间线和后续 `risk/action` 行为。
- 按 TDP 字段语义解释方向：`in` 为外部攻击，`out` 为失陷/外联，`lateral` 为横向渗透；优先使用 `flow_src_ip/flow_dest_ip` 还原真实会话端点。
- 银狐、黑产团伙、C2、木马等 `out` 告警携带恶意域名 IOC 时，应建议在 DNS、安全代理或出口防火墙的出站规则阻断域名并核查内网发起主机，不得因聚合字段顺序误封公网 IP。
- 仅出现目的端口 53 时不得归因为 DNS 隧道；只有 QNAME/载荷特征与稳定周期性流量形成可核验证据时才允许提出该判断。
- 扫描类告警必须区分弱风险标签与强恶意信誉：低于 3 条记录、3 个目标和 10 个目标端口且仅有 spam/scanner/云主机标签时不直接触发封禁；达到 3 条记录、3 个目标、10 个目标端口任一阈值，或命中明确恶意/黑名单/僵尸网络强信誉时，建议临时封禁或限速。
- 不能只看单 IP 频次：同一扫描器或威胁名称在 15 分钟内达到 5 个源 IP，或同一目标达到 3 个源 IP，应按代理池/分布式扫描活动升级，对已观测源 IP 临时封禁或限速，并使用 WAF/IPS 行为规则抑制轮换 IP；不得封禁整个云厂商 ASN/CIDR。
- DNS 返回、CDN、WAF、扫描次数、规则标签、情报恶意标签或单个 `success` 字段不能单独证明攻击成功。
- HTTP 200、TCP established、`threat.is_connected`、聚合 `attack_result=success` 或成功攻击名称/主机数也不是独立定案证据；必须与响应正文、命令回显或后续行为闭环交叉验证。
- 分别判断攻击行为、攻击结果和失陷状态：`attack_outcome` 仅允许成功、失败、尝试/未知、不适用；`compromise_status` 仅允许已失陷、未发现失陷、无法确认。
- 只有扫描/探测且没有利用闭环时优先判为“疑似扫描”。
- 判为“外网攻击”至少需要明确利用行为或多条相互印证的攻击证据；判为“主机失陷”必须存在控制、外联、横向、持久化、命令执行或其他后渗透闭环证据。
- 没有发现成功证据不等于误报；证据冲突、关键查询失败或成功语义无法解释时判为“证据不足”并建议人工复核。
- 仅输出人工参考的封禁建议，不执行任何处置。

## 结构化输出

`verdict` 仅允许：外网攻击、疑似扫描、证据不足、误报可能、主机失陷。

`ban_decision` 仅允许：建议封禁、不建议封禁、人工复核、主机失陷。

`severity` 仅允许：信息、低、中、高、严重、未知。

`supporting_evidence`、`contradicting_evidence`、`missing_information`、`affected_targets`、`key_iocs`、`human_checkpoints` 必须是字符串数组。`evidence` 保留最关键的可复核证据摘要。
