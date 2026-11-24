# 官方情报采集协议

实现为 AegisOps 独立代码；协议研究参考 Aabyss-Team/Threat-Broadcast-Plus，研究版本 476fa1609b1817d061ffd262a831e49c37c032bb。运行时不请求 GitHub 数据库。

- 微步漏洞通告：x.threatbook.com/v5/node/vul_module/notice/next，公开分页列表，详情保留官方链接。
- 微步社区文章与周报：管理员或安全运营成员可导入公开的 `x.threatbook.com/v5/article?threatInfoID=…` 原文链接。从公开页面读取标题、摘要、作者和发布时间；查看全文请前往原站。栏目列表需要登录，未纳入自动发现；重复导入同一链接只更新同一条记录。文章不参与自动资产漏洞匹配。
- 阿里云：avd.aliyun.com/high-risk/list，公开页面；高危列表不可用时，从同一官方域名的首页「最新漏洞」表采集，并标记为部分覆盖；该表未评级的条目不会被标为高危。保留已采集分页和历史记录。
- 斗象：vip.tophant.com/api/data/vuln_list，公开 JSON 列表。
- 长亭：stack.chaitin.com/api/v2/vuln/list/，公开分页列表。
- NVD：nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-recent.json.gz，官方近期数据。
- Tenable：www.tenable.com/cve/feeds?sort=newest，官方 RSS。
- CISA：www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json，官方 KEV 目录；不将 KEV 收录自动映射成 CVSS 严重等级。

另有安全报道订阅：Anti-Malware.ru（`/news1/feed`）、TechRadar 安全频道（`/feeds/tag/security`，仅接收 `/pro/security/`）、HookPhish（`/feed/`）、Infostealers（`/feed/`）。这些来源只保留标题、公开摘要、时间和原文链接，不参与漏洞匹配。

采集并发与分页有上限，HTTPS 固定来源、响应尺寸与解压限制；部分分页可保留已采集内容，并明确标记未完成。保存原始语言、链接和发布时间，翻译不参与原始产品匹配。历史数据与整改引用保持，来源失败不清空。同步结果分别记录采集、新增和内容更新数量，重复记录不会计为更新。
