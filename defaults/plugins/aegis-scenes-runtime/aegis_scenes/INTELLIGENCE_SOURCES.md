# 官方情报采集协议

实现为 AegisOps 独立代码；协议研究参考 Aabyss-Team/Threat-Broadcast-Plus，研究版本 476fa1609b1817d061ffd262a831e49c37c032bb。运行时不请求 GitHub 数据库。

- 微步：x.threatbook.com/v5/node/vul_module/notice/next，公开分页列表，详情保留官方链接。
- 阿里云：avd.aliyun.com/high-risk/list，公开页面；无有效列表时报告未更新，不绕过访问限制。
- 斗象：vip.tophant.com/api/data/vuln_list，公开 JSON 列表。
- 长亭：stack.chaitin.com/api/v2/vuln/list/，公开分页列表。
- NVD：nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-recent.json.gz，官方近期数据。
- Tenable：www.tenable.com/cve/feeds?sort=newest，官方 RSS。
- CISA：www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json，官方 KEV 目录；不将 KEV 收录自动映射成 CVSS 严重等级。

采集并发与分页有上限，HTTPS 固定来源、响应尺寸与解压限制；部分分页可保留已采集内容，并明确标记未完成。保存原始语言、链接和发布时间，翻译不参与原始产品匹配。历史数据与整改引用保持，来源失败不清空。
