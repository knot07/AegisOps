// ../../../../../../../../../aegisops/contracts/webui/shims/react.js
var React = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__?.React;
if (!React) {
  throw new Error("AegisOps WebUI page runtime is not initialized (missing React).");
}
var {
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version
} = React;

// ../../../../../../../../../aegisops/contracts/webui/shims/sdk.js
var sdk = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__;
if (!sdk) {
  throw new Error("AegisOps WebUI page runtime is not initialized (missing SDK).");
}
var api = sdk.api;
var contract = sdk.api.contract;
var Card = sdk.Card;
var Markdown = sdk.Markdown;
var useCurrentUser = sdk.useCurrentUser;
var useLanguage = sdk.useLanguage;
var usePaneActive = sdk.usePaneActive;
var useServerEvents = sdk.useServerEvents;

// ../../../../../../../../../aegisops/contracts/webui/shims/jsx-runtime.js
var runtime = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__;
if (!runtime?.jsx || !runtime?.jsxs) {
  throw new Error("AegisOps WebUI page runtime is not initialized (missing jsx runtime).");
}
var jsx = runtime.jsx;
var jsxs = runtime.jsxs;
var Fragment2 = runtime.React.Fragment;

// src/index.tsx
var BASE = "/api/scenes/incident";
async function req(path, data, method = "POST") {
  const r = await fetch(BASE + path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...data === void 0 ? {} : { method, body: JSON.stringify(data) } });
  const b = await r.json();
  if (!r.ok) throw Error(b.detail || "\u64CD\u4F5C\u672A\u5B8C\u6210");
  return b;
}
var labels = { new: "\u5F85\u542F\u52A8", queued: "\u5F85\u8C03\u67E5", investigating: "\u8C03\u67E5\u4E2D", closed: "\u5DF2\u5F52\u6863", running: "\u6267\u884C\u4E2D", review: "\u5F85\u590D\u6838", failed: "\u6267\u884C\u5931\u8D25", interrupted: "\u5DF2\u4E2D\u65AD", completed: "\u5B8C\u6210", blocked: "\u5F85\u914D\u7F6E", partial: "\u90E8\u5206\u5B8C\u6210", submitted: "\u5DF2\u63D0\u4EA4" };
function Icon({ type = "shield" }) {
  return /* @__PURE__ */ jsx("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: type === "file" ? /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" }),
    /* @__PURE__ */ jsx("path", { d: "M14 2v6h6M8 13h8M8 17h5" })
  ] }) : type === "host" ? /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "18", height: "13", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M8 21h8M12 16v5M7 8l2 2-2 2M12 12h4" })
  ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx("path", { d: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" }),
    /* @__PURE__ */ jsx("path", { d: "m8 12 3 3 5-6" })
  ] }) });
}
function StageIcon({ stage }) {
  const shapes = {
    intake: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { fill: "currentColor", fillOpacity: ".13", stroke: "none", d: "m16 3 10 4v8c0 6-10 13-10 13S6 21 6 15V7Z" }),
      /* @__PURE__ */ jsx("path", { d: "m16 3 10 4v8c0 6-10 13-10 13S6 21 6 15V7Z" }),
      /* @__PURE__ */ jsx("path", { d: "m11 15 3.5 3.5L21 12" })
    ] }),
    logs: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "3", y: "4", width: "11", height: "8", rx: "2", fill: "currentColor", fillOpacity: ".12" }),
      /* @__PURE__ */ jsx("rect", { x: "18", y: "20", width: "11", height: "8", rx: "2", fill: "currentColor", fillOpacity: ".12" }),
      /* @__PURE__ */ jsx("path", { d: "M8.5 12v4h15v4M6 7h5M21 24h5M5 25l4-4m-4 0h4v4M23 6l4 4m0-4v4h-4" })
    ] }),
    host: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "3", y: "5", width: "24", height: "17", rx: "3", fill: "currentColor", fillOpacity: ".12" }),
      /* @__PURE__ */ jsx("path", { d: "M8 27h10M13 22v5M7 10l3 3-3 3M13 16h3" }),
      /* @__PURE__ */ jsx("circle", { cx: "23", cy: "21", r: "5", fill: "var(--stage-soft)" }),
      /* @__PURE__ */ jsx("circle", { cx: "23", cy: "21", r: "5" }),
      /* @__PURE__ */ jsx("path", { d: "m27 25 3 3" })
    ] }),
    sample: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { fill: "currentColor", fillOpacity: ".12", d: "M7 3h11l7 7v17H7Z", stroke: "none" }),
      /* @__PURE__ */ jsx("path", { d: "M18 3H7v24h18V10l-7-7Zm0 0v7h7M11 14h8M11 18h5" }),
      /* @__PURE__ */ jsx("circle", { cx: "22", cy: "24", r: "5", fill: "var(--stage-soft)" }),
      /* @__PURE__ */ jsx("path", { d: "M20 23v3m2-4v4m2-3v3" })
    ] }),
    sandbox: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "m16 3 12 6-12 6L4 9l12-6Z", fill: "currentColor", fillOpacity: ".12" }),
      /* @__PURE__ */ jsx("path", { d: "M4 9v14l12 6 12-6V9M16 15v14" }),
      /* @__PURE__ */ jsx("path", { d: "m10 12-2 6 4 3m10-9 2 6-4 3M16 19v4" })
    ] }),
    report: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "5", y: "4", width: "21", height: "24", rx: "3", fill: "currentColor", fillOpacity: ".12" }),
      /* @__PURE__ */ jsx("path", { d: "M10 10h11M10 15h7M10 22v-3m4 3v-5" }),
      /* @__PURE__ */ jsx("circle", { cx: "24", cy: "23", r: "6", fill: "var(--stage-soft)" }),
      /* @__PURE__ */ jsx("path", { d: "m21 23 2 2 4-4" })
    ] })
  };
  return /* @__PURE__ */ jsx("svg", { "data-stage-icon": stage, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: shapes[stage] });
}
function ActivityTimeline({ events, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const grouped = [];
  for (const e of events.slice().reverse()) {
    const message = eventMessage(e), last = grouped[grouped.length - 1];
    if (last && last.stage === e.stage && last.status === e.status && last.message === message) {
      last.count++;
      continue;
    }
    grouped.push({ ...e, message, count: 1 });
  }
  const shown = expanded ? grouped : grouped.slice(0, compact ? 4 : 8);
  return /* @__PURE__ */ jsxs("div", { className: "activity-digest", children: [
    /* @__PURE__ */ jsxs("div", { className: "activity-summary", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        events.length,
        " \u6761\u8BB0\u5F55"
      ] }),
      /* @__PURE__ */ jsx("small", { children: "\u6309\u65F6\u95F4\u5012\u5E8F \xB7 \u76F8\u90BB\u91CD\u590D\u8BB0\u5F55\u5408\u5E76\u663E\u793A" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "compact-timeline", children: shown.map((e) => /* @__PURE__ */ jsxs("article", { className: "activity-entry", "data-status": e.status, children: [
      /* @__PURE__ */ jsxs("div", { className: "activity-stamp", children: [
        /* @__PURE__ */ jsx("time", { children: new Date(e.at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) }),
        /* @__PURE__ */ jsx("b", { children: labels[e.status] || e.status })
      ] }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          /* @__PURE__ */ jsx("span", { children: e.message }),
          e.count > 1 && /* @__PURE__ */ jsxs("i", { children: [
            "\xD7",
            e.count
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "activity-full", children: [
          e.message,
          /* @__PURE__ */ jsxs("small", { children: [
            "\u64CD\u4F5C\u4EBA\uFF1A",
            e.actor || "\u7CFB\u7EDF",
            " \xB7 ",
            new Date(e.at).toLocaleString()
          ] })
        ] })
      ] })
    ] }, e.id)) }),
    grouped.length > (compact ? 4 : 8) && /* @__PURE__ */ jsx("button", { className: "activity-expand", onClick: () => setExpanded(!expanded), children: expanded ? "\u6536\u8D77\u8BB0\u5F55" : `\u5C55\u5F00\u5168\u90E8 ${grouped.length} \u7EC4\u8BB0\u5F55` })
  ] });
}
var attackThemes = [
  { id: "ransomware", label: "\u52D2\u7D22\u653B\u51FB", accent: "#ad567d", soft: "#fbeef4", pattern: /勒索|ransomware/i },
  { id: "malware", label: "\u6076\u610F\u7A0B\u5E8F", accent: "#8c68b6", soft: "#f4effb", pattern: /木马|恶意文件|恶意程序|挖矿|webshell|malware|trojan|miner|backdoor|后门/i },
  { id: "exploit", label: "\u6F0F\u6D1E\u5229\u7528", accent: "#b97542", soft: "#fcf3e9", pattern: /漏洞利用|代码执行|命令执行|反序列化|注入|exploit|\brce\b|\bsqli?\b|\bxss\b|cve-/i },
  { id: "credential", label: "\u8EAB\u4EFD\u653B\u51FB", accent: "#a88737", soft: "#fbf6e6", pattern: /爆破|暴力破解|口令|凭据|撞库|brute.?force|credential|password/i },
  { id: "lateral", label: "\u6A2A\u5411\u79FB\u52A8", accent: "#537bbb", soft: "#eef4fd", pattern: /横向|远程执行|lateral|psexec|pass.the.hash/i },
  { id: "exfiltration", label: "\u6570\u636E\u5916\u4F20", accent: "#b56d63", soft: "#fcf0ed", pattern: /外传|数据泄露|窃取|exfiltration|data.?leak/i },
  { id: "phishing", label: "\u9493\u9C7C\u653B\u51FB", accent: "#9c718e", soft: "#f8eff6", pattern: /钓鱼|phishing/i },
  { id: "c2", label: "\u5916\u8054\u901A\u4FE1", accent: "#5b9292", soft: "#edf7f6", pattern: /外联|命令控制|c2|command.and.control|beacon/i },
  { id: "recon", label: "\u626B\u63CF\u63A2\u6D4B", accent: "#248fbb", soft: "#eaf7fd", pattern: /探测|探测|扫描|侦察|scan|recon/i },
  { id: "other", label: "\u5176\u4ED6\u4E8B\u4EF6", accent: "#61a237", soft: "#eef8e3", pattern: /$^/ }
];
function attackTheme(c) {
  let alert = {};
  try {
    alert = typeof c.alert === "string" ? JSON.parse(c.alert) : c.alert || {};
  } catch {
  }
  const text = [c.attack_type, c.category, c.title, alert.attack_type, alert.attackType, alert.category, alert.event_type, alert.title, alert.name].filter((v) => typeof v === "string").join(" ");
  return attackThemes.find((t) => t.pattern.test(text)) || attackThemes[attackThemes.length - 1];
}
function IncidentReportDialog({ detail, onClose, heading = "\u5E94\u6025\u54CD\u5E94\u62A5\u544A\u8BE6\u60C5", downloadUrl }) {
  const ref = useRef(null);
  const [source, setSource] = useState(false);
  const chapters = Array.from((detail.report || "").matchAll(/^##\s+(.+)$/gm), (m) => m[1]);
  useEffect(() => {
    const node = ref.current, previous = document.activeElement, overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return /* @__PURE__ */ jsxs("dialog", { ref, className: "report-dialog", "aria-labelledby": "incident-report-title", onCancel: (e) => {
    e.preventDefault();
    onClose();
  }, onClick: (e) => {
    if (e.target === e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
    }
  }, children: [
    /* @__PURE__ */ jsxs("header", { className: "report-dialog-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "report-dialog-heading", children: [
        /* @__PURE__ */ jsx("div", { className: "report-preview-icon", children: /* @__PURE__ */ jsx(StageIcon, { stage: "report" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: heading === "\u6837\u672C\u5206\u6790\u8BE6\u60C5" ? "SAMPLE STATIC ANALYSIS" : "INCIDENT RESPONSE REPORT" }),
          /* @__PURE__ */ jsx("h2", { id: "incident-report-title", children: heading }),
          /* @__PURE__ */ jsx("p", { children: detail.title })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "report-close", autoFocus: true, "aria-label": heading === "\u6837\u672C\u5206\u6790\u8BE6\u60C5" ? "\u5173\u95ED\u6837\u672C\u5206\u6790\u8BE6\u60C5" : "\u5173\u95ED\u62A5\u544A\u8BE6\u60C5", onClick: onClose, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", children: /* @__PURE__ */ jsx("path", { d: "m6 6 12 12M18 6 6 18" }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "report-dialog-toolbar", children: [
      /* @__PURE__ */ jsxs("div", { className: "report-view-toggle", role: "group", "aria-label": "\u62A5\u544A\u663E\u793A\u65B9\u5F0F", children: [
        /* @__PURE__ */ jsx("button", { "aria-pressed": !source, onClick: () => setSource(false), children: "\u9605\u8BFB\u89C6\u56FE" }),
        /* @__PURE__ */ jsx("button", { "aria-pressed": source, onClick: () => setSource(true), children: "Markdown \u6E90\u6587" })
      ] }),
      !source && /* @__PURE__ */ jsxs("select", { "aria-label": "\u8DF3\u8F6C\u62A5\u544A\u7AE0\u8282", defaultValue: "", onChange: (e) => {
        const value = e.target.value;
        if (value !== "") ref.current?.querySelectorAll(".report-document h2")[Number(value)]?.scrollIntoView({ behavior: "smooth", block: "start" });
        e.target.value = "";
      }, children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "\u8DF3\u8F6C\u5230\u7AE0\u8282" }),
        chapters.map((title, i) => /* @__PURE__ */ jsx("option", { value: i, children: title }, i))
      ] }),
      /* @__PURE__ */ jsxs("a", { className: "export-report", href: downloadUrl || BASE + "/cases/" + detail.id + "/report.md", download: true, children: [
        /* @__PURE__ */ jsx(Icon, { type: "file" }),
        "\u4E0B\u8F7D\u62A5\u544A"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "report-dialog-body", children: source ? /* @__PURE__ */ jsx("pre", { className: "report-source", "aria-label": "Markdown \u62A5\u544A\u6E90\u6587", children: detail.report }) : /* @__PURE__ */ jsx("article", { className: "report-document", "aria-label": "\u5E94\u6025\u54CD\u5E94\u62A5\u544A", children: /* @__PURE__ */ jsx(Markdown, { content: detail.report }) }) })
  ] });
}
function SampleReviewSummary({ review, onOpen, onAnalyze, disabled }) {
  const verdicts = { malicious: "\u5B58\u5728\u660E\u786E\u6076\u610F\u529F\u80FD", suspicious: "\u5B58\u5728\u53EF\u7591\u529F\u80FD", no_clear_malice: "\u672A\u89C1\u660E\u786E\u6076\u610F\u529F\u80FD", insufficient: "\u4FE1\u606F\u4E0D\u8DB3\uFF0C\u5F85\u6DF1\u5165\u5206\u6790" };
  return /* @__PURE__ */ jsxs("div", { className: "sample-review-result", "data-verdict": review?.result?.verdict || "pending", children: [
    /* @__PURE__ */ jsxs("div", { className: "sample-review-head", children: [
      /* @__PURE__ */ jsx("strong", { children: "AI \u6837\u672C\u5206\u6790" }),
      review?.status === "completed" && /* @__PURE__ */ jsx("span", { children: verdicts[review.result.verdict] })
    ] }),
    review?.status === "completed" ? /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("p", { children: review.result.summary }),
      /* @__PURE__ */ jsxs("small", { children: [
        review.method === "source_code_review" ? "\u6E90\u7801\u9759\u6001\u5BA1\u9605" : "\u4E8C\u8FDB\u5236\u9759\u6001\u7279\u5F81\u5206\u6790",
        " \xB7 \u7ED3\u679C\u5DF2\u5F52\u6863 \xB7 \u672A\u6267\u884C\u6837\u672C"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
        /* @__PURE__ */ jsx("button", { className: "primary", onClick: onOpen, children: "\u67E5\u770B\u5206\u6790\u7ED3\u679C" }),
        /* @__PURE__ */ jsx("button", { disabled, onClick: () => onAnalyze(true), children: "\u91CD\u65B0\u5206\u6790" })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("p", { children: review?.status === "running" ? "\u6B63\u5728\u8C03\u7528\u6A21\u578B\u5BA1\u9605\u6837\u672C\uFF0C\u7ED3\u679C\u5C06\u81EA\u52A8\u4FDD\u5B58\u3002" : review?.status === "failed" ? review.message || "\u5206\u6790\u672A\u5B8C\u6210\uFF0C\u539F\u59CB\u6837\u672C\u4FDD\u7559\uFF0C\u53EF\u91CD\u8BD5\u3002" : "\u8BE5\u6837\u672C\u5C1A\u672A\u751F\u6210\u72EC\u7ACB\u7684 AI \u5206\u6790\u7ED3\u679C\u3002" }),
      /* @__PURE__ */ jsx("button", { className: "primary", disabled: disabled || review?.status === "running", onClick: () => onAnalyze(false), children: review?.status === "failed" ? "\u91CD\u8BD5 AI \u5206\u6790" : "AI \u5206\u6790\u6837\u672C" })
    ] })
  ] });
}
var evidenceCategories = [["samples", "\u6837\u672C\u6587\u4EF6"], ["host", "\u4E3B\u673A\u65E5\u5FD7"], ["device", "\u8BBE\u5907\u65E5\u5FD7"], ["reports", "\u5206\u6790\u62A5\u544A"], ["context", "\u8C03\u67E5\u8D44\u6599"], ["process", "\u8FC7\u7A0B\u8BB0\u5F55"]];
function evidenceCategory(e) {
  if (e.kind === "sample") return "samples";
  if (["host_logs", "host_followup"].includes(e.kind)) return "host";
  if (e.kind === "device_logs") return "device";
  if (["sample_analysis", "rea_analysis", "sandbox_report", "static_analysis"].includes(e.kind)) return "reports";
  if (["ai_decision", "rea_decision", "rea_tool", "sample_features"].includes(e.kind)) return "process";
  return "context";
}
var evidenceKindNames = { sample: "\u53D6\u8BC1\u6837\u672C", host_logs: "\u4E3B\u673A\u65E5\u5FD7", host_followup: "\u4E3B\u673A\u8FFD\u67E5", device_logs: "\u8BBE\u5907\u65E5\u5FD7", sample_analysis: "AI \u6837\u672C\u5206\u6790", rea_analysis: "REA \u9006\u5411\u62A5\u544A", sandbox_report: "\u6C99\u7BB1\u7ED3\u679C", static_analysis: "\u9759\u6001\u521D\u7B5B", ai_decision: "AI \u8C03\u67E5\u51B3\u7B56", rea_decision: "\u9006\u5411\u51B3\u7B56", rea_tool: "\u9006\u5411\u5DE5\u5177\u8BC1\u636E", sample_features: "\u6837\u672C\u9759\u6001\u7279\u5F81", alert: "\u539F\u59CB\u544A\u8B66", manual_intake: "\u4E8B\u4EF6\u767B\u8BB0\u8D44\u6599" };
var sourceBrands = [
  { key: "qianxin", match: /qianxin|skyeye|secgate|奇安信/i, name: "\u5947\u5B89\u4FE1", asset: "qianxin.png", accent: "#3565ae", soft: "#eef3fb" },
  { key: "threatbook", match: /threatbook|tdp|onesec|onesig|微步/i, name: "\u5FAE\u6B65\u5728\u7EBF", asset: "threatbook-hd.svg", accent: "#d85649", soft: "#fff1ed" },
  { key: "sangfor", match: /sangfor|深信服/i, name: "\u6DF1\u4FE1\u670D", asset: "sangfor-hd.png", accent: "#237eae", soft: "#edf7fd" },
  { key: "chaitin", match: /chaitin|长亭/i, name: "\u957F\u4EAD\u79D1\u6280", asset: "chaitin-hd.png", accent: "#519839", soft: "#f0f9e8" },
  { key: "huorong", match: /huorong|火绒/i, name: "\u706B\u7ED2\u5B89\u5168", asset: "huorong-hd.png", accent: "#e18c27", soft: "#fff7e9" },
  { key: "huawei", match: /huawei|华为/i, name: "\u534E\u4E3A\u4E91", asset: "huaweicloud.png", accent: "#d94c57", soft: "#fff0f2" },
  { key: "360", match: /360|奇虎/i, name: "360 \u5B89\u5168", asset: "360-hd.svg", accent: "#35a04b", soft: "#edf9ee" },
  { key: "qingteng", match: /qingteng|青藤/i, name: "\u9752\u85E4\u4E91\u5B89\u5168", asset: "qingteng.png", accent: "#168b9e", soft: "#edf8f9" }
];
function sourceBrand(d) {
  return sourceBrands.find((b) => b.match.test([d?.storage_key, d?.name].join(" "))) || { key: "custom", name: "\u5B89\u5168\u8BBE\u5907", asset: "", accent: "#659d36", soft: "#f0f8e7" };
}
function sourceDeviceName(d) {
  const aliases = { sangfor_atrust: "\u6DF1\u4FE1\u670D aTrust", chaitin_dongjian: "\u957F\u4EAD\u6D1E\u9274", huorong_edr: "\u706B\u7ED2 EDR", huaweicloud_waf: "\u534E\u4E3A\u4E91 WAF", secgate3600: "\u5947\u5B89\u4FE1 SecGate 3600", "secgate 3600": "\u5947\u5B89\u4FE1 SecGate 3600", "360_waf": "360 WAF", "360_fw": "360 \u9632\u706B\u5899", onesig: "\u5FAE\u6B65 OneSIG" };
  return aliases[String(d?.name || "").toLowerCase()] || d?.name || "\u8BF7\u9009\u62E9\u6765\u6E90\u8BBE\u5907";
}
function SourceDeviceMark({ device }) {
  const b = sourceBrand(device);
  return /* @__PURE__ */ jsx("span", { className: "source-vendor-logo", style: { "--vendor-accent": b.accent, "--vendor-soft": b.soft }, children: b.asset ? /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx("img", { src: "/vendor-logos/" + b.asset, alt: b.name, onError: (e) => {
      e.currentTarget.style.display = "none";
      e.currentTarget.parentElement?.classList.add("image-failed");
    } }),
    /* @__PURE__ */ jsx("b", { "aria-hidden": "true", children: b.name.slice(0, 1) })
  ] }) : /* @__PURE__ */ jsx(StageIcon, { stage: "logs" }) });
}
function DeviceSourcePicker({ devices, value, onChange, label }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(0);
  const root = useRef(null), trigger = useRef(null);
  const selected = devices.find((d) => d.id === value), brand = sourceBrand(selected);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (open) root.current?.querySelectorAll("[role=option]")[active]?.focus();
  }, [open, active]);
  const pick = (id) => {
    onChange(id);
    setOpen(false);
    trigger.current?.focus();
  };
  return /* @__PURE__ */ jsxs("div", { className: "device-source-picker", ref: root, style: { "--vendor-accent": brand.accent, "--vendor-soft": brand.soft }, children: [
    /* @__PURE__ */ jsxs("button", { ref: trigger, type: "button", role: "combobox", "aria-label": label, "aria-expanded": open, "aria-controls": label === "\u65B0\u4E8B\u4EF6\u6765\u6E90\u8BBE\u5907" ? "new-source-options" : "source-options", "aria-haspopup": "listbox", className: "source-picker-trigger " + (selected ? "has-source" : ""), onClick: () => {
      setActive(Math.max(0, devices.findIndex((d) => d.id === value)));
      setOpen(!open);
    }, onKeyDown: (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive(Math.max(0, devices.findIndex((d) => d.id === value)));
        setOpen(true);
      }
    }, children: [
      selected ? /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(SourceDeviceMark, { device: selected }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: sourceDeviceName(selected) }),
          /* @__PURE__ */ jsxs("small", { children: [
            sourceBrand(selected).name,
            " \xB7 ",
            selected.query_supported ? "\u5173\u8054\u65E5\u5FD7\u5DF2\u9002\u914D" : "\u65E5\u5FD7\u9002\u914D\u5F85\u5B8C\u6210"
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(StageIcon, { stage: "logs" }),
        /* @__PURE__ */ jsx("span", { children: "\u9009\u62E9\u5BF9\u5E94\u7684\u6001\u52BF\u611F\u77E5\u6216\u544A\u8B66\u8BBE\u5907" })
      ] }),
      /* @__PURE__ */ jsx("svg", { className: "source-picker-chevron", viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "1.7", children: /* @__PURE__ */ jsx("path", { d: "m5 7 5 5 5-5" }) })
    ] }),
    open && /* @__PURE__ */ jsx("div", { id: label === "\u65B0\u4E8B\u4EF6\u6765\u6E90\u8BBE\u5907" ? "new-source-options" : "source-options", role: "listbox", "aria-label": label + "\u9009\u9879", className: "source-picker-options", onKeyDown: (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }
      if (devices.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + devices.length) % devices.length);
      }
      if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        setActive(devices.length - 1);
      }
    }, children: devices.length ? devices.map((d, i) => {
      const b = sourceBrand(d);
      return /* @__PURE__ */ jsxs("button", { type: "button", role: "option", "aria-selected": value === d.id, tabIndex: active === i ? 0 : -1, style: { "--vendor-accent": b.accent, "--vendor-soft": b.soft }, onClick: () => pick(d.id), onFocus: () => setActive(i), children: [
        /* @__PURE__ */ jsx(SourceDeviceMark, { device: d }),
        /* @__PURE__ */ jsxs("span", { className: "source-option-copy", children: [
          /* @__PURE__ */ jsx("strong", { children: sourceDeviceName(d) }),
          /* @__PURE__ */ jsxs("small", { children: [
            b.name,
            " \xB7 ",
            d.name
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "source-adapter-badge " + (d.query_supported ? "ready" : "pending"), children: d.query_supported ? "\u65E5\u5FD7\u5DF2\u9002\u914D" : "\u5F85\u9002\u914D" }),
        value === d.id && /* @__PURE__ */ jsx("svg", { className: "source-choice-check", viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m4 10 4 4 8-8" }) })
      ] }, d.id);
    }) : /* @__PURE__ */ jsx("p", { className: "note", children: "\u6682\u65E0\u5DF2\u542F\u7528\u8BBE\u5907\uFF0C\u8BF7\u5148\u5728\u8BBE\u5907\u63A5\u5165\u4E2D\u914D\u7F6E\u3002" }) })
  ] });
}
function caseSource(detail) {
  try {
    return JSON.parse(detail?.alert || "{}")._source_device || null;
  } catch {
    return null;
  }
}
function eventMessage(e) {
  return e.message === "\u8BBE\u5907\u65E5\u5FD7\u67E5\u8BE2\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5DF2\u63A5\u5165 TDP \u7684\u8FDE\u63A5\u548C\u6743\u9650\u3002\u539F\u544A\u8B66\u8BC1\u636E\u5DF2\u4FDD\u7559\u3002" ? "\u6765\u6E90\u8BBE\u5907\u65E5\u5FD7\u67E5\u8BE2\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u672C\u4E8B\u4EF6\u7ED1\u5B9A\u8BBE\u5907\u7684\u8FDE\u63A5\u4E0E\u67E5\u8BE2\u6743\u9650\u3002\u539F\u544A\u8B66\u8BC1\u636E\u5DF2\u4FDD\u7559\u3002" : e.message;
}
function logCoverage(value) {
  let meta = {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) meta = parsed;
  } catch {
  }
  const query = meta.query && typeof meta.query === "object" ? meta.query : {};
  const count = (value2) => typeof value2 === "number" && Number.isSafeInteger(value2) && value2 >= 0 ? value2 : null;
  const returned = count(meta.returned), total = count(meta.total), limit = count(meta.page_limit);
  const epoch = (v) => typeof v === "number" && v > 0 && v < 1e11 ? new Date(v * 1e3).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "";
  const local = (v) => typeof v === "string" && /^\d{4}[/\-]\d{2}[/\-]\d{2} \d{2}:\d{2}:\d{2}$/.test(v) ? v : "";
  const from = epoch(query.time_from) || local(query.time_start);
  const to = epoch(query.time_to) || local(query.time_end);
  if (meta.truncated === true || returned !== null && total !== null && total > returned) return { label: "\u7ED3\u679C\u5DF2\u622A\u65AD", from, to, returned, total, limit, note: "\u672A\u8FD4\u56DE\u7684\u65E5\u5FD7\u4E0D\u5728\u672C\u6B21\u8BC1\u636E\u5185\uFF0C\u4E0D\u80FD\u636E\u6B64\u6392\u9664\u5176\u4ED6\u884C\u4E3A\u3002" };
  if (limit !== null) return { label: "\u4EC5\u9996\u6279 \xB7 \u8986\u76D6\u672A\u786E\u8BA4", from, to, returned, total, limit, note: "\u53EF\u80FD\u8FD8\u6709\u540E\u7EED\u5206\u9875\uFF1B\u672C\u6B21\u8BC1\u636E\u4E0D\u80FD\u4EE3\u8868\u5B8C\u6574\u67E5\u8BE2\u7ED3\u679C\u3002" };
  const requested = count(query.size);
  if (requested !== null && requested > 0 && returned !== null && returned >= requested) return { label: "\u8FBE\u5230\u67E5\u8BE2\u4E0A\u9650 \xB7 \u8986\u76D6\u672A\u786E\u8BA4", from, to, returned, total, limit, note: "\u8FD4\u56DE\u6761\u6570\u8FBE\u5230\u8BF7\u6C42\u4E0A\u9650\uFF0C\u65E0\u6CD5\u786E\u8BA4\u662F\u5426\u8FD8\u6709\u66F4\u591A\u5339\u914D\u65E5\u5FD7\u3002" };
  if (meta.truncated === false && returned !== null && total === returned) return { label: returned === 0 ? "\u672C\u6B21\u8FD4\u56DE 0 \u6761" : "\u672A\u8BB0\u5F55\u622A\u65AD", from, to, returned, total, limit, note: "\u4EC5\u4EE3\u8868\u8FD9\u53F0\u8BBE\u5907\u5728\u6307\u5B9A\u65F6\u95F4\u548C\u8FC7\u6EE4\u6761\u4EF6\u4E0B\u7684\u8FD4\u56DE\uFF0C\u4E0D\u4EE3\u8868\u4E8B\u4EF6\u8BC1\u636E\u5B8C\u6574\u3002" };
  return { label: "\u8986\u76D6\u672A\u77E5", from, to, returned, total, limit, note: "\u8FD9\u4EFD\u8BC1\u636E\u6CA1\u6709\u8DB3\u591F\u7684\u8303\u56F4\u6216\u8BA1\u6570\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u662F\u5426\u67E5\u5168\u3002" };
}
function DeviceLogCoverage({ detail }) {
  const records = (detail.evidence || []).filter((e) => e.kind === "device_logs").slice().reverse();
  const latest = (detail.events || []).filter((e) => e.stage === "logs").slice(-1)[0];
  return /* @__PURE__ */ jsxs("section", { "aria-label": "\u65E5\u5FD7\u8BC1\u636E\u8986\u76D6", style: { marginBottom: 16 }, children: [
    /* @__PURE__ */ jsxs("div", { className: "work-section-head", style: { marginBottom: 8 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "\u65E5\u5FD7\u8BC1\u636E\u8986\u76D6" }),
        /* @__PURE__ */ jsx("small", { children: "\u5F52\u6863\u8BC1\u636E\u6309\u65F6\u95F4\u5012\u5E8F\uFF1B\u8986\u76D6\u8303\u56F4\u4E0D\u662F\u4E8B\u4EF6\u5B8C\u6574\u5EA6\u3002" })
      ] }),
      latest && /* @__PURE__ */ jsxs("span", { className: "badge", children: [
        "\u6700\u8FD1\u8BB0\u5F55\uFF1A",
        labels[latest.status] || latest.status
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "device-results", children: [
      records.map((e) => {
        const coverage = logCoverage(e.metadata);
        return /* @__PURE__ */ jsxs("div", { className: "evidence compact-log", style: { flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx(Icon, { type: "file" }),
          /* @__PURE__ */ jsxs("div", { className: "body", style: { minWidth: 0, overflowWrap: "anywhere" }, children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              e.label,
              " \xB7 ",
              coverage.label
            ] }),
            /* @__PURE__ */ jsxs("small", { children: [
              "\u5F52\u6863\uFF1A",
              new Date(e.created).toLocaleString(),
              " \xB7 ",
              (e.size / 1024).toFixed(1),
              " KB"
            ] }),
            /* @__PURE__ */ jsxs("small", { children: [
              "\u67E5\u8BE2\u8303\u56F4\uFF1A",
              coverage.from && coverage.to ? `${coverage.from} \u81F3 ${coverage.to}\uFF08UTC+8\uFF09` : "\u672A\u8BB0\u5F55"
            ] }),
            /* @__PURE__ */ jsxs("small", { children: [
              "\u8FD4\u56DE ",
              coverage.returned ?? "\u672A\u77E5",
              " \u6761 \xB7 \u8BB0\u5F55\u603B\u6570 ",
              coverage.total ?? "\u672A\u77E5",
              coverage.limit !== null ? ` \xB7 \u9996\u6279\u4E0A\u9650 ${coverage.limit} \u6761` : ""
            ] }),
            /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", fontSize: 12 }, children: coverage.note })
          ] }),
          /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/evidence/" + e.id, children: "\u4E0B\u8F7D\u539F\u59CB\u65E5\u5FD7" })
        ] }, e.id);
      }),
      records.length === 0 && /* @__PURE__ */ jsx("div", { className: "compact-empty", children: caseSource(detail) ? "\u6682\u65E0\u5F52\u6863\u65E5\u5FD7\u3002\u672A\u91C7\u96C6\u4E0D\u7B49\u4E8E\u6CA1\u6709\u5F02\u5E38\uFF0C\u8BF7\u5148\u67E5\u8BE2\u5173\u8054\u65E5\u5FD7\u3002" : "\u5C1A\u672A\u7ED1\u5B9A\u544A\u8B66\u6765\u6E90\u8BBE\u5907\uFF0C\u65E0\u6CD5\u5224\u65AD\u65E5\u5FD7\u8986\u76D6\u3002" })
    ] })
  ] });
}
function IncidentPage() {
  const [cases, setCases] = useState([]), [selected, setSelected] = useState(new URLSearchParams(location.search).get("case") || ""), [detail, setDetail] = useState(null), [tab, setTab] = useState("overview"), [settings, setSettings] = useState({ hosts: [] }), [error, setError] = useState(""), [busy, setBusy] = useState(""), [query, setQuery] = useState(""), [modal, setModal] = useState(false), [remote, setRemote] = useState(""), [path, setPath] = useState("");
  const [analysisProvider, setAnalysisProvider] = useState("threatbook"), [externalReport, setExternalReport] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false), [sourceDeviceId, setSourceDeviceId] = useState(""), [sourceNote, setSourceNote] = useState("");
  const [statusOpen, setStatusOpen] = useState(false), [statusAction, setStatusAction] = useState(""), [statusNote, setStatusNote] = useState(""), [caseStatusFilter, setCaseStatusFilter] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState("samples"), [evidenceQuery, setEvidenceQuery] = useState("");
  const [reverseResults, setReverseResults] = useState({}), [reverseReview, setReverseReview] = useState(""), [reaStatus, setReaStatus] = useState(null);
  const [optionalJobs, setOptionalJobs] = useState([]), [optionalLog, setOptionalLog] = useState("");
  const [reportOpen, setReportOpen] = useState(false), [sampleReview, setSampleReview] = useState("");
  const evidenceItems = (detail?.evidence || []).filter((e) => (evidenceFilter === "all" || evidenceCategory(e) === evidenceFilter) && (!evidenceQuery.trim() || [e.label, e.sha256, e.id, evidenceKindNames[e.kind] || e.kind].join(" ").toLowerCase().includes(evidenceQuery.trim().toLowerCase()))).slice().reverse();
  useEffect(() => {
    if (!document.querySelector("script[data-scene-controls]")) {
      const script = document.createElement("script");
      script.src = "/api/scenes/vulnops/static/control-icons.js?v=20261118-1";
      script.dataset.sceneControls = "true";
      document.head.append(script);
    }
  }, []);
  const [eventModal, setEventModal] = useState(false), [deleteOpen, setDeleteOpen] = useState(false);
  const initialEvent = () => ({ title: "", source: "", target: "", source_device_id: "", description: "", occurred_at: new Date(Date.now() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 16), start_investigation: true });
  const [newEvent, setNewEvent] = useState(initialEvent);
  const eventRef = useRef(newEvent);
  eventRef.current = newEvent;
  const [host, setHost] = useState({ name: "", address: "", protocol: "ssh", port: 22, username: "", password: "", host_key: "" });
  const hostRef = useRef(host);
  hostRef.current = host;
  async function refresh(id = selected) {
    try {
      const [c, s] = await Promise.all([req("/cases"), req("/settings")]);
      setCases(c);
      setSettings(s);
      if (id) {
        setDetail(await req("/cases/" + id));
        setReverseResults(await req("/cases/" + id + "/reverse").catch(() => ({})));
      }
      setReaStatus(await req("/rea/status").catch(() => null));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 6e3);
    return () => clearInterval(timer);
  }, [selected]);
  async function action(name, fn) {
    setBusy(name);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  useEffect(() => {
    let gone = false;
    const load = () => req("/optional/jobs").then((j) => {
      if (!gone) setOptionalJobs(j);
    }).catch(() => {
    });
    load();
    const timer = setInterval(load, 5e3);
    return () => {
      gone = true;
      clearInterval(timer);
    };
  }, []);
  async function openOptional(operation) {
    if (!confirm(operation === "rea_install" ? "\u6388\u6743\u4E0B\u8F7D\u5E76\u5B89\u88C5\u53EF\u9009 REA \u9759\u6001\u9006\u5411\u73AF\u5883\uFF1F\u5C06\u6309\u9700\u4E0B\u8F7D\u7EA61GB\u4F9D\u8D56\uFF0C\u4EC5\u652F\u6301\u6B64\u5E73\u53F0\u7684 Linux x64 / WSL2 \u9694\u79BB worker\u3002" : "\u6388\u6743 Solar \u5B98\u65B9\u5DE5\u5177\u5BF9\u672C\u4E8B\u4EF6\u4E3B\u673A\u5F00\u5C55\u5168\u9762\u53EA\u8BFB\u53D6\u8BC1\uFF1F\u4F1A\u521B\u5EFA\u4E34\u65F6\u62A5\u544A\u76EE\u5F55\u5E76\u8BFB\u53D6\u7CFB\u7EDF\u65E5\u5FD7\u3001\u8FDB\u7A0B\u3001\u6587\u4EF6\u4FE1\u606F\uFF1B\u4E0D\u6267\u884C\u6837\u672C\u3001\u4E0D\u5916\u53D1\u8BC1\u636E\u3002")) return;
    await action("\u51C6\u5907 Atlas \u534F\u4F5C", async () => {
      const grant = await req("/optional/authorize", { operation, confirmed: true, case_id: detail?.id || "", host_id: remote });
      if (!window.AegisSceneAI) await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/api/scenes/assistant/widget.js";
        script.onload = () => resolve();
        script.onerror = () => reject(Error("Atlas \u52A0\u8F7D\u5931\u8D25"));
        document.head.append(script);
      });
      window.AegisSceneAI.open({ kind: operation === "rea_install" ? "rea-install" : "forensics", context: { ...grant, target: detail?.target, task_tool: "incident_optional_operations", instructions: "\u4F7F\u7528\u672C\u6B21\u7531\u7BA1\u7406\u5458\u660E\u786E\u786E\u8BA4\u7684\u6388\u6743\u542F\u52A8\u56FA\u5B9A\u5DE5\u5177\u4EFB\u52A1\uFF1B\u968F\u540E\u67E5\u8BE2\u771F\u5B9E\u8FDB\u5EA6\u3002\u4E0D\u53EF\u5728\u672A\u6210\u529F\u81EA\u68C0\u65F6\u58F0\u79F0\u5B8C\u6210\u3002" } });
    });
  }
  function choose(id) {
    setExternalReport(null);
    setSourceOpen(false);
    setStatusOpen(false);
    setStatusNote("");
    setEvidenceFilter("samples");
    setEvidenceQuery("");
    setReverseReview("");
    setReverseResults({});
    setSampleReview("");
    setReportOpen(false);
    setSelected(id);
    setDetail(null);
    setTab("overview");
    const u = new URL(location.href);
    u.searchParams.set("case", id);
    history.replaceState(null, "", u);
  }
  useEffect(() => {
    if (!modal) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled) return;
      const el = document.getElementById("ir-ai-workbench"), manual = document.getElementById("ir-host-fields");
      if (!el || !manual) return;
      window.AegisSceneAI.mount(el, { kind: "host", manual, context: () => ({ form: Object.fromEntries(Object.entries(hostRef.current).filter(([key]) => ["name", "address", "protocol", "port", "username"].includes(key))) }), onApply: (draft) => setHost((current) => ({ ...current, ...Object.fromEntries(Object.entries(draft).filter(([key]) => ["name", "address", "protocol", "port", "username"].includes(key))) })) });
    };
    if (window.AegisSceneAI) mount();
    else {
      const script = document.createElement("script");
      script.src = "/api/scenes/assistant/widget.js";
      script.onload = mount;
      script.onerror = () => {
        if (!cancelled) setError("AI \u52A9\u624B\u52A0\u8F7D\u5931\u8D25\uFF0C\u53EF\u7EE7\u7EED\u624B\u52A8\u586B\u5199\u3002");
      };
      document.head.append(script);
    }
    return () => {
      cancelled = true;
    };
  }, [modal]);
  useEffect(() => {
    if (!eventModal) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled) return;
      const el = document.getElementById("ir-event-ai"), manual = document.getElementById("ir-event-fields");
      if (!el || !manual) return;
      window.AegisSceneAI.mount(el, { kind: "incident", manual, context: () => ({ form: eventRef.current }), onApply: (draft) => setNewEvent((current) => ({ ...current, ...Object.fromEntries(Object.entries(draft).filter(([key, value]) => ["title", "source", "target", "description", "occurred_at"].includes(key) && typeof value === "string")) })) });
    };
    if (window.AegisSceneAI) mount();
    else {
      const script = document.createElement("script");
      script.src = "/api/scenes/assistant/widget.js";
      script.onload = mount;
      script.onerror = () => {
        if (!cancelled) setError("AI \u52A9\u624B\u52A0\u8F7D\u5931\u8D25\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u3002");
      };
      document.head.append(script);
    }
    return () => {
      cancelled = true;
    };
  }, [eventModal]);
  const platform = analysisProvider === "threatbook" ? { name: "\u5FAE\u6B65\u4E91\u6C99\u7BB1", logo: "threatbook-hd.svg", accent: "#b45f55", soft: "#fcf3f0", ready: settings.sandbox_key_configured } : { name: "VirusTotal", logo: "virustotal.svg", accent: "#586e9d", soft: "#f0f3fa", ready: settings.virustotal_key_configured };
  function reportProvider(e) {
    try {
      return JSON.parse(e.metadata || "{}").provider || (e.label.includes("VirusTotal") ? "virustotal" : "threatbook");
    } catch {
      return "threatbook";
    }
  }
  async function showExternalReport(e) {
    await action("\u8BFB\u53D6\u5206\u6790\u62A5\u544A", async () => {
      const r = await fetch(BASE + "/cases/" + detail.id + "/evidence/" + e.id, { credentials: "same-origin" });
      if (!r.ok) throw Error("\u62A5\u544A\u8BFB\u53D6\u5931\u8D25");
      const body = await r.json();
      const stats = body.data?.attributes?.last_analysis_stats;
      const results = body.data?.attributes?.last_analysis_results;
      const clean = (v) => String(v ?? "\u2014").replace(/[|\r\n]/g, " ");
      let md = "# " + e.label + "\n\n\u62A5\u544A\u6765\u81EA\u5916\u90E8\u5E73\u53F0\u3002\u68C0\u51FA\u6570\u91CF\u5C5E\u4E8E\u591A\u5F15\u64CE\u5224\u65AD\uFF0C\u4E0D\u7B49\u540C\u4E8E\u653B\u51FB\u6210\u529F\u6216\u653B\u51FB\u8005\u5F52\u5C5E\u3002\u63D0\u4EA4\u56DE\u6267\u4EC5\u4EE3\u8868\u4EFB\u52A1\u5DF2\u63A5\u6536\uFF0C\u9700\u7A0D\u540E\u67E5\u8BE2\u5206\u6790\u7ED3\u679C\u3002\n\n";
      if (stats) {
        md += "## \u591A\u5F15\u64CE\u7EDF\u8BA1\n\n| \u5224\u5B9A | \u5F15\u64CE\u6570\u91CF |\n| --- | --- |\n" + Object.entries(stats).map(([k, v]) => "| " + clean(k) + " | " + clean(v) + " |").join("\n") + "\n\n";
      }
      if (results) {
        md += "## \u5F15\u64CE\u68C0\u6D4B\u7ED3\u679C\n\n| \u5F15\u64CE | \u5224\u5B9A | \u68C0\u6D4B\u540D\u79F0 |\n| --- | --- | --- |\n" + Object.entries(results).map(([k, v]) => "| " + clean(k) + " | " + clean(v.category) + " | " + clean(v.result) + " |").join("\n") + "\n\n";
      }
      md += "## \u539F\u59CB\u8FD4\u56DE\n\n```json\n" + JSON.stringify(body, null, 2) + "\n```";
      setExternalReport({ title: e.label, report: md, id: e.id });
    });
  }
  function openSource() {
    setSourceDeviceId(caseSource(detail)?.id || "");
    setSourceNote("");
    setSourceOpen(true);
  }
  async function saveEvent() {
    if (!newEvent.source_device_id) {
      setError("\u8BF7\u9009\u62E9\u672C\u4E8B\u4EF6\u5B9E\u9645\u7684\u6765\u6E90\u8BBE\u5907");
      return;
    }
    await action("\u521B\u5EFA\u4E8B\u4EF6", async () => {
      const result = await req("/cases", { title: newEvent.title, source: newEvent.source, target: newEvent.target, description: newEvent.description, source_device_id: newEvent.source_device_id, first_time: Math.floor(new Date(newEvent.occurred_at).getTime() / 1e3), start_investigation: newEvent.start_investigation });
      setEventModal(false);
      choose(result.id);
    });
  }
  async function removeEvent() {
    if (!detail) return;
    setBusy("\u5220\u9664\u4E8B\u4EF6");
    setError("");
    try {
      await req("/cases/" + detail.id, { confirmed: true }, "DELETE");
      setDeleteOpen(false);
      setSelected("");
      setDetail(null);
      setTab("overview");
      const u = new URL(location.href);
      u.searchParams.delete("case");
      history.replaceState(null, "", u);
      await refresh("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const shown = cases.filter((c) => (!caseStatusFilter || c.status === caseStatusFilter) && (c.title + c.target + c.source).toLowerCase().includes(query.toLowerCase()));
  const locked = !!busy || detail?.processing || ["running", "closed"].includes(detail?.status);
  const selectedStatusAction = detail?.status_actions?.find((a) => a.action === statusAction);
  const matching = settings.hosts.filter((h) => h.address === detail?.target);
  const stages = [["intake", "\u4E8B\u4EF6\u786E\u8BA4"], ["logs", "\u8BBE\u5907\u5173\u8054"], ["host", "\u4E3B\u673A\u6392\u67E5"], ["sample", "\u6837\u672C\u53D6\u8BC1"], ["sandbox", "\u6C99\u7BB1\u5206\u6790"], ["report", "\u62A5\u544A\u590D\u6838"]];
  return /* @__PURE__ */ jsxs("div", { className: "ir", "data-aegis-scene": "incident", children: [
    /* @__PURE__ */ jsx("link", { rel: "stylesheet", href: "/api/scenes/vulnops/static/workspace-controls.css?v=20261118-1" }),
    /* @__PURE__ */ jsx("style", { children: `

 .ir{--green:#a2c67b;--green-hover:#b1d28e;--green-ink:#496b35;--soft:#f0f6e9;--ink:#26382c;--dim:#839080;--line:#e2e8df;color:var(--ink);background:radial-gradient(ellipse at 4% 0,#eaf5df80,transparent 42%),#f6f8f5;min-height:100dvh;padding:32px;font:14px/1.75 system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif}
 .ir *{box-sizing:border-box}.ir button,.ir input,.ir select,.ir textarea{font-family:inherit;font-size:13px;line-height:1.6}.ir button,.ir a{transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}
 .ir button{cursor:pointer;min-height:40px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:9px 16px;color:#586b4f;font-weight:500}.ir button:hover{background:#f2f7ed;border-color:#c8d9b9;transform:translateY(-1px)}.ir button:disabled{opacity:.45;cursor:not-allowed;transform:none}.ir button:focus-visible,.ir a:focus-visible{outline:2px solid #9cba74;outline-offset:3px}
 .ir .danger{color:#b47d6b;background:#fff9f5;border-color:#eedfd5}.ir .danger:hover{background:#fcf0e8;border-color:#dfbfae}.ir .confirm-dialog{width:min(520px,94vw)}.ir .check-line{display:flex;align-items:center;gap:10px;color:#7b8c6c;font-size:12px;margin:20px 0}.ir .check-line input{width:16px;height:16px;min-height:0;accent-color:#a2c67b}.ir .form-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.ir .dialog h2{font-size:20px}
 .ir .primary{background:var(--green);color:#24371d;border-color:transparent;box-shadow:0 3px 10px #536f3310}.ir .primary:hover{background:var(--green-hover);border-color:transparent}

 .ir .work-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.ir .work-section-head h3{margin:0 0 4px}.ir .work-section-head small{font-size:12px;color:#819075}.ir .activity-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;color:#75816e;margin:0 0 12px}.ir .activity-summary small{font-size:11px;color:#94a08a}.ir .compact-timeline{border:1px solid #e3eadc;border-radius:12px;overflow:hidden}.ir .activity-entry{display:grid;grid-template-columns:130px minmax(0,1fr);gap:14px;padding:13px 15px;background:#fff;border-bottom:1px solid #edf1e8;align-items:start}.ir .activity-entry:last-child{border-bottom:0}.ir .activity-stamp time{display:block;font-size:11px;color:#839079;line-height:1.6;font-variant-numeric:tabular-nums}.ir .activity-stamp b{display:inline-block;margin-top:4px;padding:2px 7px;border-radius:5px;background:#eef5e5;color:#6d8a4d;font-size:10px;font-weight:550}.ir .activity-entry[data-status=blocked] b,.ir .activity-entry[data-status=partial] b{background:#fff6df;color:#a78837}.ir .activity-entry[data-status=failed] b{background:#fbedeb;color:#b26455}.ir .activity-entry summary{display:flex;gap:8px;align-items:start;cursor:pointer;list-style:none;font-size:13px;line-height:1.8;color:#566353;min-height:40px}.ir .activity-entry summary::-webkit-details-marker{display:none}.ir .activity-entry summary>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ir .activity-entry summary:after{content:'\u2304';color:#9caa92;margin-left:auto;flex:none}.ir .activity-entry summary i{font-size:10px;background:#f1f6ea;padding:0 5px;border-radius:4px;font-style:normal;flex:none}.ir .activity-full{font-size:12px;line-height:1.85;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:#f7faf3;border-radius:9px;margin-top:8px}.ir .activity-full small{display:block;color:#94a087;margin-top:8px}.ir .activity-expand{display:block;margin:14px auto 0;padding:7px 16px;font-size:12px;color:#6f8e4e}.ir .compact-log{display:flex;align-items:center;margin:10px 0;padding:14px}.ir .compact-log small{display:block;margin-top:5px;font-size:11px;color:#87937e}.ir .compact-log a{margin-left:auto;font-size:12px;white-space:nowrap}.ir .compact-empty{padding:32px 16px;border:1px dashed #dce7d2;border-radius:12px;color:#8b997f;text-align:center;font-size:13px}.ir .work-help{margin-top:14px;border:1px solid #e4ebdc;border-radius:10px;background:#fafcf7;padding:12px 14px}.ir .work-help>summary{font-size:12px;color:#788d61;cursor:pointer;font-weight:550}.ir .work-help p{font-size:12px;line-height:1.9;margin:12px 0 0}.ir .work-help .activity-digest{margin-top:16px}.ir .host-operation{display:flex;gap:16px;padding:20px 0;border-top:1px solid #e7eddf}.ir .host-operation:first-of-type{border-top:0;padding-top:5px}.ir .operation-number{flex:none;width:31px;height:31px;display:grid;place-items:center;background:#e8f2d8;color:#6d9349;border-radius:9px;font-size:12px;font-weight:650}.ir .operation-body{flex:1;min-width:0}.ir .operation-body h4{font-size:14px;font-weight:650;color:#3c5134;margin:4px 0 12px}.ir .operation-body>p{font-size:12px;margin:0 0 15px}.ir .operation-body .field{margin:0;max-width:600px}.ir .operation-body .field>span{font-size:12px;color:#89997c;font-weight:400}.ir .operation-body>small{display:block;color:#a18b53;margin-top:9px;font-size:12px}.ir .file-collect-line{display:flex;gap:10px}.ir .file-collect-line input{min-width:0;flex:1}.ir .file-collect-line button{flex:none}@media(max-width:700px){.ir .activity-entry{grid-template-columns:105px minmax(0,1fr);gap:8px;padding:12px 10px}.ir .activity-summary small{display:none}.ir .file-collect-line{flex-wrap:wrap}.ir .host-operation{gap:11px}}
 .ir .scene-page-brand{display:flex;align-items:center;gap:16px}.ir .scene-page-logo{width:54px;height:54px;flex:none;object-fit:contain;filter:drop-shadow(0 3px 4px #cd536320)}.ir h1{font-size:28px;letter-spacing:-.6px;font-weight:650;margin:0;line-height:1.45}.ir h2{font-size:20px;font-weight:600;margin:0;line-height:1.55}.ir h3{font-size:17px;font-weight:600;margin:0 0 13px}.ir p{color:var(--dim);margin:8px 0;line-height:1.8}
 .ir .head{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-bottom:28px}.ir .overline{letter-spacing:2.5px;color:#92a282;font-size:10px;margin-bottom:8px}.ir .tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ir .tools button{display:inline-flex;align-items:center;justify-content:center;gap:8px}
 .ir .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-bottom:26px}.ir .stat,.ir .panel{background:#fff;border:1px solid var(--line);border-radius:21px;box-shadow:0 4px 18px #20321a03}.ir .stat{padding:25px 27px;min-height:155px;position:relative;overflow:hidden}.ir .stat:first-child{background:radial-gradient(ellipse at 0 0,#e9f5db,transparent 85%),#fff}.ir .stat b{font-size:39px;font-weight:600;letter-spacing:-1px;display:block;margin-top:13px;line-height:1.2}.ir .stat span{color:#809076;font-size:13px}.ir .stat:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;right:26px;top:30px;background:#c4d7b2}
 .ir .layout{display:grid;grid-template-columns:310px minmax(0,1fr);gap:0;align-items:stretch;height:clamp(920px,calc(100dvh - 60px),1600px);overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 4px 20px #20321a03}.ir .list{padding:20px 18px;border:0;border-right:1px solid #e5ebdf;border-radius:0;background:#fafcf8;box-shadow:none;min-height:0;max-height:none;overflow:hidden;display:flex;flex-direction:column}.ir .list-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px}.ir .list-heading h3{font-size:14px;margin:0;color:#61764f}.ir .list-heading span{font-size:11px;color:#9baa8d}.ir .list-search{padding-bottom:13px}.ir .case-scroll{overflow:auto;min-height:0;flex:1;scrollbar-width:thin;scrollbar-color:#d5dfcb transparent}.ir .case{width:100%;display:block;text-align:left;min-height:108px;padding:16px 14px;margin:0 0 9px;border-radius:12px;background:transparent}.ir .case.active{box-shadow:none}.ir .case small{font-size:10px}.ir .case .addr{font-size:11px}.ir .case strong{font-size:13px}
.ir input,.ir select,.ir textarea{width:100%;border:1px solid #dfe6da;background:#fcfdfb;color:#32472b;padding:11px 13px;border-radius:10px;outline:none}.ir input:focus,.ir select:focus,.ir textarea:focus{border-color:#a2bd84;box-shadow:0 0 0 3px #a2c67b18}
 .ir .empty{text-align:center;padding:88px 30px;color:#8b9982}.ir .empty>svg{display:inline-block;width:58px;height:58px;color:#aac095}.ir .empty h2{color:#586f49;margin:20px 0 12px}.ir .detail{padding:0;min-width:0;min-height:0;border:0;border-radius:0;box-shadow:none;display:flex;flex-direction:column;overflow:hidden;animation:ir-enter .3s ease}.ir .detail.settings-view{display:block;padding:26px;overflow:auto}.ir .case-summary{padding:24px 26px 0;flex-shrink:0}.ir .case-summary>.head{margin-bottom:14px}.ir .case-summary h2{font-size:19px}.ir .case-summary .head p{font-size:12px;margin:6px 0}.ir .case-context{padding:7px 0!important;margin:10px 0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#94a284!important;font-size:11px!important}.ir .investigation-body{overflow:auto;flex:1;min-height:0;padding:22px 26px 26px;scrollbar-width:thin;scrollbar-color:#d5dfcb transparent;overscroll-behavior:contain}.ir .timeline-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}.ir .timeline-head h3{font-size:14px;margin:0}.ir .timeline-head p{font-size:11px;margin:4px 0 0}.ir .timeline-head button{min-height:33px;font-size:11px;padding:6px 12px}.ir .detail>.empty{padding:100px 24px}.ir .badge{display:inline-flex;align-items:center;min-height:26px;border:1px solid #e0ead5;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:500;background:#f1f6e9;color:#6d8754}
 .ir .steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;margin:14px 0 18px;padding:4px 0}.ir .step{position:relative;background:transparent;border:0;text-align:center;min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px 3px;font-size:11px;color:#8c9984}.ir .step:not(:last-child):after{content:'';position:absolute;top:20px;left:calc(50% + 20px);width:calc(100% - 40px);border-top:1px solid #e1e8d8}.ir .step.done{background:transparent;color:#6e8b51}.ir .step.warn{background:transparent;color:#9e957b}.ir .step i{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;border:1px solid #e4eadd;background:#fafcf7;font-style:normal;font-size:12px;font-weight:500;margin-bottom:8px}.ir .step.done i{background:#edf5e4;border-color:#d5e5bf;color:#73964c}.ir .step.warn i{background:#faf7f0;border-color:#ece5d7;color:#aa9872}
 .ir .tabs{display:flex;gap:24px;padding:0;background:transparent;border:0;border-bottom:1px solid #e7ecdf;border-radius:0;margin:0;overflow:auto}.ir .tabs button{border:0;border-bottom:2px solid transparent;background:transparent;border-radius:0;padding:11px 2px;min-height:40px;white-space:nowrap;color:#8e9b85;font-size:12px}.ir .tabs .active{color:#60843e;background:transparent;border-bottom-color:#a2c67b;box-shadow:none}
 .ir .event{position:relative;border:0;border-left:1px solid #e1e9d7;background:transparent;border-radius:0;padding:0 0 23px 22px;margin:0 0 0 5px}.ir .event:before{content:'';position:absolute;left:-4px;top:6px;width:7px;height:7px;border-radius:50%;background:#bed3a6;box-shadow:0 0 0 4px #fff}.ir .event:last-child{border-left-color:transparent;padding-bottom:0}.ir .event time{color:#a0ab96;font-size:11px}.ir .event b{font-size:10px;font-weight:500;color:#82976b;margin-left:12px;background:#f2f6ec;border-radius:5px;padding:2px 6px}.ir .event p{color:#7c8f6d;font-size:12px;margin:7px 0 0;line-height:1.8}.ir .timeline{padding:0 3px}
 .ir .notice{background:#f5f8ef;border:1px solid #e2ead6;border-radius:12px;padding:16px 19px;color:#859571;font-size:12px;line-height:1.9;margin:18px 0}.ir .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.ir .field{display:block;margin:18px 0;color:#7a8b6e;font-size:13px}.ir .field input,.ir .field select,.ir .field textarea{margin-top:8px}
 .ir .evidence{padding:22px;border:1px solid #e3eadd;background:#fcfdfb;border-radius:15px;margin:15px 0;display:flex;gap:16px;align-items:flex-start}.ir .evidence>svg{color:#8aa46e;flex-shrink:0;margin-top:3px}.ir .evidence .body{flex:1;min-width:0}.ir .evidence strong{font-size:14px;font-weight:600}.ir code{font:11px/1.8 Consolas,monospace;overflow-wrap:anywhere;color:#8b9980}.ir .evidence a{font-size:12px;color:#668746;text-decoration:none}.ir .error{padding:15px 19px;background:#fff3ee;border:1px solid #f0ddcf;color:#aa7054;border-radius:13px;margin-bottom:24px}.ir pre{white-space:pre-wrap;word-break:break-word;background:#f8faf5;border:1px solid #e5ebdf;padding:25px;border-radius:15px;font:13px/1.95 system-ui,'Microsoft YaHei',sans-serif;max-height:none;overflow:visible;margin:18px 0 0}
 .ir .modal{position:fixed;inset:0;background:#152c2055;backdrop-filter:blur(5px);z-index:1000;display:grid;place-items:center;padding:25px}.ir .dialog{width:min(720px,94vw);background:#fff;border:1px solid #e5ebdf;border-radius:23px;padding:30px;max-height:92dvh;overflow:auto;animation:ir-enter .25s ease}.ir .note{font-size:12px;color:#8a9980}.ir .hostitem{border:1px solid #e2eadd;background:#fbfdf8;padding:22px;border-radius:15px;margin:14px 0;display:flex;gap:18px;align-items:center}.ir .hostitem>svg{width:27px;height:27px;color:#8eaa72}.ir .hostitem .badge{margin-left:auto}.ir a{color:#668249;text-decoration:none}.ir a:hover{color:#496a32}.ir .sample-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}.ir .sample-actions button{font-size:12px;padding:8px 13px;min-height:36px}.ir .busy{font-size:13px;color:#7c965d;margin-left:10px}
 .ir .asai h3{font-size:23px;font-weight:600;margin-bottom:10px}.ir .asai p{font-size:13px;color:#87918b}.ir .asai textarea{border:0;background:transparent;border-radius:0;padding:0;box-shadow:none}.ir .asai .assend{background:#a2c67b;color:#24371d;border-color:transparent}.ir .asai .asguide{min-height:100px;padding:20px;font-size:14px}.ir .asai .ascontent{padding:32px}.ir .asai .asmsg{font-size:14px}.ir .asai .asdraft pre{padding:10px;background:transparent;border:0}.ir .asai .ascomposer{padding:18px}
 @keyframes ir-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
 @media(min-width:1700px){.ir{padding:36px 40px}.ir .stat{min-height:170px}.ir .layout{grid-template-columns:330px minmax(0,1fr)}}
 @media(max-width:1200px){.ir{padding:24px}.ir .stats{gap:14px}.ir .layout{grid-template-columns:260px minmax(0,1fr)}.ir .case-summary{padding:20px 21px 0}.ir .investigation-body{padding:21px}.ir .stat{padding:22px;min-height:145px}.ir .stat b{font-size:35px}.ir .grid{grid-template-columns:1fr}}
 @media(max-width:850px){.ir .layout{grid-template-columns:1fr;height:auto;max-height:none}.ir .list{max-height:260px;min-height:180px;border-right:0;border-bottom:1px solid #e5ebdf}.ir .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ir .head{flex-wrap:wrap}.ir .detail{min-height:680px;max-height:1050px}.ir .case{min-height:100px}.ir .investigation-body{max-height:680px}.ir .tabs{gap:19px}.ir .steps{grid-template-columns:repeat(6,minmax(0,1fr))}}
 @media(max-width:550px){.ir{padding:16px}.ir h1{font-size:24px}.ir .stats{gap:10px}.ir .stat{padding:18px;min-height:130px}.ir .stat b{font-size:32px}.ir .tabs button{padding:8px 10px;font-size:12px}.ir .case-summary{padding:18px 16px 0}.ir .investigation-body{padding:19px 16px}.ir .tabs{gap:15px}.ir .step{font-size:10px}.ir .step:not(:last-child):after{left:calc(50% + 17px);width:calc(100% - 34px)}.ir .tools{gap:8px}.ir .modal{padding:12px}.ir .dialog{padding:20px}.ir .asai .ascontent{padding:16px}.ir .evidence{padding:16px}}


 /* Shared typography for investigation, evidence and report content. */
 .ir .investigation-body,.ir .tabs{font-family:'Microsoft YaHei','PingFang SC','Segoe UI',sans-serif;font-size:13px;font-weight:400;line-height:1.8;letter-spacing:0;-webkit-font-smoothing:antialiased}
 .ir .investigation-body :is(p,div,span,label,button,input,select,textarea,a,strong,b,small,time,pre),.ir .tabs button{font-family:inherit;letter-spacing:0}
 .ir .investigation-body{color:#607155}
 .ir .investigation-body h3{font-family:inherit;font-size:15px;font-weight:600;line-height:1.6;color:#435b35;margin-bottom:12px}
 .ir .investigation-body p,.ir .investigation-body .field,.ir .investigation-body pre{font-size:13px;font-weight:400;line-height:1.85}
 .ir .investigation-body p{color:#85917b}
 .ir .investigation-body :is(button,input,select,textarea,a){font-size:13px;font-weight:400;line-height:1.65}
 .ir .investigation-body :is(.notice,.note,.evidence p){font-size:12px;font-weight:400;line-height:1.8;color:#8a977f}
 .ir .investigation-body .evidence strong{font-size:14px;font-weight:600;line-height:1.6;color:#526b42}
 .ir .investigation-body code{font-family:'Cascadia Mono',Consolas,monospace;font-size:11px;font-weight:400;line-height:1.8;color:#939f89}
 .ir .investigation-body pre{font-family:inherit;color:#607155;tab-size:2}
 .ir .investigation-body .sample-actions button{font-size:12px;font-weight:400}
 .ir .tabs button{font-size:13px;font-weight:400;line-height:1.6}.ir .tabs button.active{font-weight:500}
 @media(prefers-reduced-motion:reduce){.ir *{animation:none!important;transition:none!important}}

 .ir .step{color:var(--stage-accent)}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,#fff,var(--stage-soft));border-color:color-mix(in srgb,var(--stage-accent) 30%,white);color:var(--stage-accent);box-shadow:0 2px 6px color-mix(in srgb,var(--stage-accent) 7%,transparent)}
 .ir .step.done{color:var(--stage-accent)}.ir .step.done i{color:var(--stage-accent);background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 18%,white));border-color:color-mix(in srgb,var(--stage-accent) 42%,white);font-weight:650}
 .ir .step:not(:last-child):after{border:0;height:1px;background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 32%,white),#e5eae6)}
 .ir .step.warn i{border-style:dashed}.ir .step-status{font-size:9px;margin-top:3px;line-height:1.3;color:#9a8055}
 .ir .case{position:relative;background:radial-gradient(ellipse at 0% 0%,var(--case-soft),transparent 90%),linear-gradient(125deg,#fff,var(--case-soft));border-color:color-mix(in srgb,var(--case-accent) 18%,#e8ece8);transition:border-color .18s,box-shadow .18s,background .18s}
 .ir .case strong{color:var(--case-accent)}.ir .case .addr{color:#64746b}.ir .case small{color:#819087;font-size:11px}
 .ir .case:hover{border-color:color-mix(in srgb,var(--case-accent) 55%,white);box-shadow:0 3px 10px color-mix(in srgb,var(--case-accent) 9%,transparent)}
 .ir .case.active{background:linear-gradient(125deg,var(--case-soft),color-mix(in srgb,var(--case-accent) 14%,white));border-color:color-mix(in srgb,var(--case-accent) 55%,white);box-shadow:inset 3px 0 var(--case-accent)}
 .ir .case-type{display:inline-block;color:var(--case-accent);background:color-mix(in srgb,var(--case-soft) 80%,white);border:1px solid color-mix(in srgb,var(--case-accent) 18%,white);border-radius:6px;font-size:10px;line-height:1.5;padding:2px 7px;margin-bottom:8px}
 .ir .case-status{display:inline-block;margin-left:5px;color:#6f7f73}.ir .case-status[data-status=running]{color:#4979aa}.ir .case-status[data-status=failed]{color:#b56262}.ir .case-status[data-status=review]{color:#a18445}


 /* Slightly stronger color depth and readable secondary text. */
 .ir .stat:nth-child(1){--stat-accent:#72964e}.ir .stat:nth-child(2){--stat-accent:#568cad}.ir .stat:nth-child(3){--stat-accent:#aa8a52}.ir .stat:nth-child(4){--stat-accent:#8d74ac}
 .ir .stat{background:radial-gradient(ellipse at 0% 0%,color-mix(in srgb,var(--stat-accent) 19%,white),transparent 95%),linear-gradient(135deg,#fff,color-mix(in srgb,var(--stat-accent) 7%,white));border-color:color-mix(in srgb,var(--stat-accent) 25%,white)}
 .ir .stat:after{background:var(--stat-accent);opacity:.65}.ir .stat span{color:#657b61}.ir .stat b{color:#30452f}
 .ir .case{background:linear-gradient(130deg,color-mix(in srgb,var(--case-accent) 12%,white),color-mix(in srgb,var(--case-accent) 5%,white));border-color:color-mix(in srgb,var(--case-accent) 31%,white)}
 .ir .case.active{background:linear-gradient(125deg,color-mix(in srgb,var(--case-accent) 23%,white),color-mix(in srgb,var(--case-accent) 12%,white));border-color:color-mix(in srgb,var(--case-accent) 65%,white)}
 .ir .case strong{display:block;font-size:13px;line-height:1.6;margin-bottom:4px}.ir .case-type{background:color-mix(in srgb,var(--case-accent) 15%,white);border-color:color-mix(in srgb,var(--case-accent) 28%,white)}
 .ir .case .addr,.ir .case small{color:#61766e}.ir .case small{display:block;margin-top:6px}
 .ir .step,.ir .step.warn{color:var(--stage-accent);font-weight:500}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 11%,white),color-mix(in srgb,var(--stage-accent) 20%,white));border-color:color-mix(in srgb,var(--stage-accent) 48%,white);font-weight:600}
 .ir .step.done i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 20%,white),color-mix(in srgb,var(--stage-accent) 32%,white));border-color:color-mix(in srgb,var(--stage-accent) 60%,white)}
 .ir .step:not(:last-child):after{background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 52%,white),#dce5dd)}
 .ir .tabs button{color:#72816a}.ir .tabs .active{color:#4d7439;border-bottom-color:#86aa60}
 .ir .head p,.ir .investigation-body p{color:#6e8066}.ir .event time{color:#819078}.ir .event b{background:#e5eedb;color:#67844e}.ir .event:before{background:#9bb97b}
 .ir .case-context{color:#7c8e6b!important}.ir .badge{background:#e8f0dd;border-color:#d5e2c5;color:#64814b}


 /* Match the analysis workspace: charcoal typography, one green headline metric. */
 .ir{color:#273239}.ir h1,.ir h2,.ir .investigation-body h3,.ir .list-heading h3{color:#263339}
 .ir .stat{background:#fff;border-color:#e5e9e6;box-shadow:0 3px 10px #21332b04}
 .ir .stat:first-child{background:#edf6df;border-color:#deebce}
 .ir .stat b{color:#202a2e}.ir .stat span{color:#66757b}.ir .stat:after{background:#b5c4ba;opacity:.65}.ir .stat:first-child:after{background:#7da94e}
 .ir .head p,.ir .investigation-body,.ir .investigation-body p{color:#59696d}
 .ir .event time,.ir .case-context{color:#75847d!important}.ir .event p{color:#53666a}.ir .event b{background:#e5efd8;color:#5e7d3e}.ir .event:before{background:#96b46a}
 .ir .case{background:linear-gradient(130deg,color-mix(in srgb,var(--case-accent) 19%,white),color-mix(in srgb,var(--case-accent) 9%,white));border-color:color-mix(in srgb,var(--case-accent) 40%,white)}
 .ir .case.active{background:linear-gradient(125deg,color-mix(in srgb,var(--case-accent) 30%,white),color-mix(in srgb,var(--case-accent) 17%,white));border-color:color-mix(in srgb,var(--case-accent) 75%,white)}
 .ir .case strong,.ir .case-type{color:color-mix(in srgb,var(--case-accent) 78%,#182a33)}
 .ir .case .addr,.ir .case small{color:#566c70}
 .ir .step,.ir .step.warn,.ir .step.done{color:color-mix(in srgb,var(--stage-accent) 80%,#1d3038)}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 18%,white),color-mix(in srgb,var(--stage-accent) 29%,white));border-color:color-mix(in srgb,var(--stage-accent) 60%,white);color:color-mix(in srgb,var(--stage-accent) 80%,#1d3038)}
 .ir .step.done i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 28%,white),color-mix(in srgb,var(--stage-accent) 42%,white));border-color:var(--stage-accent);color:color-mix(in srgb,var(--stage-accent) 76%,#1d3038)}
 .ir .tabs button{color:#68767a}.ir .tabs .active{color:#517831;border-bottom-color:#91ba55;font-weight:500}
 .ir button,.ir a{color:#52665a}.ir button.primary{background:#a8cd77;color:#2e4323}.ir button.danger{color:#ac6d5a}


 /* Fixed top alignment keeps every circle centered on the connector, regardless of status text. */
 .ir .step{justify-content:flex-start;min-height:86px;padding:5px 3px;color:var(--stage-accent);line-height:1.6}
 .ir .step.warn,.ir .step.done{color:var(--stage-accent)}
 .ir .step i,.ir .step.warn i{box-sizing:border-box;flex:none;width:32px;height:32px;margin:0 0 8px;background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 20%,white));border-color:var(--stage-accent);color:var(--stage-accent);font-size:13px;font-weight:650;line-height:1;box-shadow:0 2px 7px color-mix(in srgb,var(--stage-accent) 13%,transparent)}
 .ir .step.done i{background:var(--stage-accent);border-color:var(--stage-accent);color:#fff;box-shadow:0 3px 9px color-mix(in srgb,var(--stage-accent) 23%,transparent)}
 .ir .step:not(:last-child):after{top:21px;left:calc(50% + 23px);width:calc(100% - 46px);height:2px;transform:translateY(-50%);border:0;background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 50%,white),color-mix(in srgb,var(--stage-accent) 20%,white))}
 .ir .step-status{color:#a27118;font-weight:400}
 .ir button.danger{background:#ef4444;border-color:#ef4444;color:#fff;box-shadow:0 3px 9px #ef444420}
 .ir button.danger:hover:not(:disabled){background:#dc2626;border-color:#dc2626;color:#fff}
 .ir button.danger:focus-visible{outline:2px solid #f87171;outline-offset:3px}
 .ir button.danger:disabled{opacity:.45;box-shadow:none}


 .ir .export-report{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 15px;border:1px solid #d5dfcc;border-radius:11px;background:linear-gradient(135deg,#fff,#f0f6e8);color:#52723a;font-size:13px;font-weight:500;text-decoration:none;line-height:1.5;transition:background .18s,border-color .18s}
 .ir .export-report svg{width:16px;height:16px;flex:none}
 .ir .export-report:hover{background:#eaf2e0;border-color:#b3c69d;color:#46662f}
 .ir a.export-report:focus-visible{outline:2px solid #92b36e;outline-offset:3px}
 .ir button.danger{background:#d65a55;border-color:#d65a55;color:#fff;box-shadow:none}
 .ir button.danger:hover:not(:disabled){background:#c64c48;border-color:#c64c48;color:#fff}
 .ir button.danger:focus-visible{outline-color:#e39b97}


 /* Model-list inspired event surfaces: colored start, clean white finish. */
 .ir .case{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 10%,white) 0%,color-mix(in srgb,var(--case-accent) 4%,white) 48%,#fff 90%);border-color:color-mix(in srgb,var(--case-accent) 23%,#edf0ed);border-radius:13px;box-shadow:none}
 .ir .case:hover{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 14%,white),#fff 92%);border-color:color-mix(in srgb,var(--case-accent) 43%,white);box-shadow:0 3px 10px color-mix(in srgb,var(--case-accent) 6%,transparent)}
 .ir .case.active{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 16%,white) 0%,color-mix(in srgb,var(--case-accent) 6%,white) 48%,#fff 94%);border-color:color-mix(in srgb,var(--case-accent) 60%,white);box-shadow:inset 2px 0 var(--case-accent),0 2px 8px color-mix(in srgb,var(--case-accent) 5%,transparent)}
 .ir .case-type{background:color-mix(in srgb,var(--case-accent) 9%,white);border-color:color-mix(in srgb,var(--case-accent) 18%,white)}


 /* Dedicated stage emblems retain their identity after completion. */
 .ir .steps{--step-node-size:40px}
 .ir .step{min-height:96px}
 .ir .step i,.ir .step.warn i,.ir .step.done i{position:relative;width:var(--step-node-size);height:var(--step-node-size);border-style:solid;background:linear-gradient(140deg,#fff,color-mix(in srgb,var(--stage-accent) 20%,white));color:var(--stage-accent);border-color:color-mix(in srgb,var(--stage-accent) 56%,white)}
 .ir .step i>[data-stage-icon]{width:26px;height:26px;display:block}
 .ir .step.done i{background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 27%,white));border-color:var(--stage-accent)}
 .ir .step:not(:last-child):after{top:calc(5px + var(--step-node-size) * .5);left:calc(50% + var(--step-node-size) * .5 + 7px);width:calc(100% - var(--step-node-size) - 14px)}
 .ir .stage-completed{position:absolute;right:-4px;bottom:-3px;display:grid;place-items:center;width:15px;height:15px;border:2px solid #fff;border-radius:50%;background:var(--stage-accent);color:#fff;box-sizing:content-box}
 .ir .stage-completed svg{display:block;width:11px;height:11px}
 @media(max-width:550px){.ir .steps{--step-node-size:34px}.ir .step i>[data-stage-icon]{width:23px;height:23px}}


 /* Shared typography hierarchy across investigation tabs and dialogs. */
 .ir{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;color:#35434b;font-size:13px;line-height:1.7}
 .ir h1{font-size:26px;font-weight:650;letter-spacing:-.4px;color:#263238}
 .ir h2,.ir .case-summary h2,.ir .dialog h2{font-size:19px;font-weight:650;line-height:1.5;letter-spacing:-.15px;color:#2d3940}
 .ir h3,.ir .timeline-head h3{font-size:15px;line-height:1.6;font-weight:650;color:#34434a;margin-bottom:8px}
 .ir p,.ir .investigation-body>p,.ir .settings-view p{font-size:13px;line-height:1.8;color:#75828a}
 .ir .head p,.ir .timeline-head p{font-size:12px;line-height:1.7;font-weight:400;color:#859097;margin:5px 0 0}
 .ir .tabs{gap:25px}
 .ir .tabs button{font-size:13px;font-weight:500;line-height:1.6;color:#7e8a91;padding:12px 2px}
 .ir .tabs button.active{font-weight:650;color:#63883e}
 .ir .step{font-size:12px;font-weight:500;line-height:1.6}
 .ir .case strong{font-size:13px;line-height:1.6;font-weight:600;letter-spacing:0}
 .ir .case .addr{font-size:12px;line-height:1.7;font-variant-numeric:tabular-nums}
 .ir .case small{font-size:11px;line-height:1.6}
 .ir .event{padding-left:24px;padding-bottom:25px}
 .ir .event time{display:inline-block;font-family:Inter,'Segoe UI',sans-serif;font-size:12px;line-height:20px;font-weight:500;letter-spacing:.1px;font-variant-numeric:tabular-nums;color:#849198}
 .ir .event b{display:inline-flex;align-items:center;vertical-align:middle;font-size:11px;line-height:18px;font-weight:600;letter-spacing:0;margin-left:10px;padding:1px 7px;border-radius:5px;background:#edf4e5;color:#6a884b}
 .ir .event p{font-size:13px;line-height:1.85;font-weight:400;color:#52636c;margin:8px 0 0;overflow-wrap:anywhere}
 .ir .notice,.ir .note,.ir .check-line{font-size:12px;line-height:1.85;font-weight:400}
 .ir .field{font-size:13px;font-weight:500;color:#5d6d76;line-height:1.6}
 .ir input,.ir select,.ir textarea{font-size:13px;font-weight:400;color:#41525c}
 .ir .evidence strong,.ir .hostitem strong{font-size:13px;font-weight:600;line-height:1.7;color:#41525b}
 .ir .evidence p,.ir .hostitem p{font-size:12px;color:#829097;line-height:1.7}
 .ir code{font-family:Consolas,'SFMono-Regular',monospace;font-size:11px;line-height:1.8;color:#7d8b93;font-variant-numeric:tabular-nums}
 .ir pre{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;font-size:13px;line-height:1.95;color:#52616a}
 .ir .badge{font-size:11px;font-weight:600;line-height:1.6}
 .ir .tools button,.ir .tools a,.ir .timeline-head button,.ir .sample-actions button{font-size:12px;font-weight:500;line-height:1.6}


 .ir button.primary,.ir a.export-report,.ir .native-scene-launch .atlas-workbench-entry{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:9px 16px;border:1px solid #9bc967;border-radius:10px;background:linear-gradient(120deg,#b6e583,#9dd464);color:#314e20;font-family:inherit;font-size:13px;font-weight:600;line-height:1.4;text-decoration:none;box-shadow:0 3px 9px #648c351a;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}
 .ir button.primary:hover:not(:disabled),.ir a.export-report:hover:not(:disabled),.ir .native-scene-launch .atlas-workbench-entry:hover:not(:disabled){background:linear-gradient(120deg,#a8dc71,#90c956);border-color:#8fbe5b;color:#314e20;box-shadow:0 4px 12px #648c3529;transform:translateY(-1px)}
 .ir button.primary:active:not(:disabled),.ir a.export-report:active:not(:disabled),.ir .native-scene-launch .atlas-workbench-entry:active:not(:disabled){background:linear-gradient(120deg,#9fd267,#88bf51);box-shadow:0 1px 3px #648c3520;transform:translateY(0)}
 .ir button.primary:focus-visible,.ir a.export-report:focus-visible,.ir .native-scene-launch .atlas-workbench-entry:focus-visible{outline:3px solid #99c96766;outline-offset:3px}
 .ir button.primary:disabled,.ir a.export-report:disabled,.ir .native-scene-launch .atlas-workbench-entry:disabled{opacity:.45;box-shadow:none;transform:none;cursor:not-allowed}


 /* Secondary controls and destructive actions use the shared type scale. */
 .ir button,.ir .tools button,.ir .tools a,.ir .timeline-head button,.ir .sample-actions button{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;font-size:13px;font-weight:600;line-height:1.5;letter-spacing:.1px}
 .ir button:not(.primary):not(.danger):not(.case){color:#52656a}
 .ir .tabs button{font-size:13px;font-weight:500;letter-spacing:0}
 .ir .tabs button.active{font-weight:650;color:#63883e}
 .ir button.danger{background:#faeaea;border:1px solid #faeaea;color:#d54e43;font-size:13px;font-weight:600;box-shadow:none}
 .ir button.danger:hover:not(:disabled){background:#f6dedd;border-color:#f1cecb;color:#c64036;box-shadow:none}
 .ir button.danger:active:not(:disabled){background:#f1d1cf;color:#ba392f;transform:translateY(0)}
 .ir button.danger:focus-visible{outline:3px solid #edb5b066;outline-offset:3px}

  /* Evidence report reading surface. */
 .ir .report-document{margin-top:22px;padding:28px 30px;border:1px solid #dfe7d8;border-radius:16px;background:linear-gradient(145deg,#fcfef9,#fff 45%);color:#374b3c;min-width:0;font-size:14px;line-height:1.95;overflow-wrap:anywhere}
 .ir .report-document :is(p,li,td,th,blockquote){font-size:14px;line-height:1.95;color:#526354;font-weight:400}
 .ir .report-document p{margin:12px 0}.ir .report-document :is(h1,h2,h3,h4){color:#2e4531;font-weight:650;line-height:1.55;letter-spacing:0;scroll-margin-top:20px}
 .ir .report-document h1{font-size:23px;margin:0 0 24px}.ir .report-document h2{font-size:18px;margin:30px 0 14px;padding-bottom:10px;border-bottom:1px solid #e2eadc}.ir .report-document h3{font-size:16px;margin:23px 0 10px}.ir .report-document h4{font-size:14px;margin:20px 0 8px}
 .ir .report-document :is(strong,b){font-weight:650;color:#304c36}.ir .report-document :is(ul,ol){padding-left:25px;margin:14px 0;list-style-position:outside}.ir .report-document ul{list-style-type:disc}.ir .report-document ol{list-style-type:decimal}.ir .report-document li{padding-left:3px;margin:7px 0}.ir .report-document li::marker{color:#6e9652;font-weight:600}
 .ir .report-document blockquote{border-left:3px solid #9dc575;background:#f0f6e9;padding:10px 17px;margin:18px 0;border-radius:0 9px 9px 0}.ir .report-document blockquote p{margin:3px 0}
 .ir .report-document code{font-family:'Cascadia Mono',Consolas,monospace;font-size:12px;line-height:1.8;background:#edf3e7;color:#426039;padding:2px 5px;border-radius:5px;white-space:break-spaces;overflow-wrap:anywhere}
 .ir .report-document pre{font-family:'Cascadia Mono',Consolas,monospace;background:#f2f5ef;border:1px solid #dfe6d9;padding:16px 18px;margin:18px 0;overflow:auto;white-space:pre;word-break:normal;max-width:100%;border-radius:10px}.ir .report-document pre code{font-size:12px;background:none;padding:0;white-space:pre;overflow-wrap:normal;color:#3b5140}
 .ir .report-document table{display:block;width:100%;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:18px 0;border:1px solid #e0e7db;border-radius:9px}.ir .report-document :is(th,td){padding:10px 13px;text-align:left;vertical-align:top;border:1px solid #e0e7db;min-width:100px;font-size:13px}.ir .report-document th{background:#edf4e5;color:#385333;font-weight:600}.ir .report-document tr:nth-child(even) td{background:#f8faf5}
 .ir .report-document hr{height:1px;border:0;background:#e1e8dc;margin:26px 0}.ir .report-document a{color:#527f35;text-decoration:underline;text-decoration-color:#a9c58d;text-underline-offset:3px}.ir .report-document a:hover{color:#315d1f}.ir .report-document .report-evidence-link{font-size:12px;font-family:Consolas,monospace}
 .ir .report-view-toggle{display:flex;gap:4px;padding:3px;background:#f0f4ec;border:1px solid #e0e7db;border-radius:10px;margin-left:auto}.ir .report-view-toggle button{min-height:30px;padding:4px 12px;background:transparent;border:0;border-radius:7px}.ir .report-view-toggle button[aria-pressed=true]{background:#fff;color:#456d30;box-shadow:0 1px 4px #263d1910;font-weight:600}
 .ir .report-empty{padding:35px;text-align:center;border:1px dashed #dbe5d2;border-radius:14px;background:#fafcf7;margin-top:20px;color:#819276}
 @media(max-width:850px){.ir .report-document{padding:20px 17px}.ir .report-document h1{font-size:20px}.ir .report-view-toggle{margin-left:0}}


 .ir .report-preview{display:flex;align-items:center;gap:20px;padding:26px;border:1px solid #dce7d2;border-radius:17px;background:radial-gradient(ellipse at 0 0,#e9f3dc88,transparent 65%),#fcfef9;margin:4px 0 18px}
 .ir .report-preview-icon{--stage-soft:#edf7e7;display:grid;place-items:center;flex:none;width:52px;height:56px;background:linear-gradient(145deg,#e7f4d7,#f6faef);border:1px solid #d4e7bf;border-radius:14px;color:#669d3c}.ir .report-preview-icon svg{width:33px;height:33px}
 .ir .report-preview-copy{flex:1;min-width:0}.ir .report-preview-copy h3{font-size:17px;color:#344c2d;margin:0 0 6px}.ir .report-preview-copy p{margin:0 0 8px;font-size:13px;color:#7a8e6a}.ir .report-preview-copy small{font-size:12px;color:#8b9a7e}
 .ir .report-dialog{position:fixed;inset:0;margin:auto;width:min(1180px,calc(100vw - 48px));height:min(90dvh,1050px);max-width:none;max-height:calc(100dvh - 32px);border:1px solid #dce6d4;border-radius:22px;padding:0;background:#f7faf4;color:#344733;box-shadow:0 24px 90px #13230f38;overflow:hidden;animation:ir-report-enter .22s ease}
 .ir .report-dialog[open]{display:flex;flex-direction:column}.ir .report-dialog::backdrop{background:#14251c66;backdrop-filter:blur(5px)}
 .ir .report-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:23px 28px;background:linear-gradient(120deg,#edf5e4,#fff 80%);border-bottom:1px solid #e0e8d9;flex:none}.ir .report-dialog-heading{display:flex;align-items:center;gap:16px;min-width:0}.ir .report-dialog-heading>div:last-child{min-width:0}.ir .report-dialog-heading span{font-size:9px;letter-spacing:1.8px;color:#8aa374}.ir .report-dialog-heading h2{font-size:21px;font-weight:650;line-height:1.5;margin:3px 0;color:#304a2b}.ir .report-dialog-heading p{font-size:12px;margin:2px 0 0;line-height:1.6;color:#819174;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:760px}.ir .report-close{width:36px;height:36px;min-height:36px;display:grid;place-items:center;padding:0;border-color:#dfe7d8;background:#ffffffaa;border-radius:10px;flex:none}
 .ir .report-dialog-toolbar{display:flex;align-items:center;gap:12px;padding:12px 28px;border-bottom:1px solid #e1e8dc;background:#fff;flex:none}.ir .report-dialog-toolbar .report-view-toggle{margin:0}.ir .report-dialog-toolbar select{width:auto;max-width:300px;padding:6px 30px 6px 12px;min-height:34px;font-size:12px;background-color:#f8faf5}.ir .report-dialog-toolbar .export-report{margin-left:auto;min-height:34px;padding:6px 12px;font-size:12px}
 .ir .report-dialog-body{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;padding:24px 28px 32px;scrollbar-width:thin;scrollbar-color:#cbd9bf transparent}.ir .report-dialog-body .report-document{margin:0;padding:28px 34px;background:#fff}.ir .report-dialog-body .report-source{margin:0;font:13px/1.9 'Cascadia Mono',Consolas,monospace;color:#43553b;background:#fff;padding:24px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
 @keyframes ir-report-enter{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
 @media(prefers-reduced-motion:reduce){.ir .report-dialog{animation:none}}
 @media(max-width:700px){.ir .report-preview{flex-wrap:wrap;padding:20px;gap:14px}.ir .report-preview>.primary{width:100%}.ir .report-dialog{width:calc(100vw - 20px);height:94dvh;border-radius:16px}.ir .report-dialog-header{padding:16px}.ir .report-dialog-heading h2{font-size:18px}.ir .report-dialog-heading .report-preview-icon{width:40px;height:44px}.ir .report-dialog-toolbar{padding:10px 14px;flex-wrap:wrap;gap:8px}.ir .report-dialog-toolbar select{max-width:170px;flex:1}.ir .report-dialog-body{padding:14px}.ir .report-dialog-body .report-document{padding:20px 17px}}

 .ir .sample-review-result{margin-top:17px;padding:16px 18px;border:1px solid #dce6d3;border-radius:12px;background:linear-gradient(125deg,#edf5e5aa,#fff)}.ir .sample-review-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ir .sample-review-head strong{font-size:13px;color:#425d35}.ir .sample-review-head span{font-size:11px;font-weight:600;border-radius:6px;padding:2px 8px;background:#e8f3df;color:#52773a}.ir .sample-review-result[data-verdict=malicious] .sample-review-head span{background:#fbe9e7;color:#b14e47}.ir .sample-review-result[data-verdict=suspicious] .sample-review-head span{background:#fbf1db;color:#9c741e}.ir .sample-review-result[data-verdict=insufficient] .sample-review-head span{background:#edf0ec;color:#71806b}.ir .sample-review-result p{font-size:13px;color:#576b4e;line-height:1.85;margin:9px 0}.ir .sample-review-result small{font-size:11px;color:#8b987f}.ir .sample-review-result .sample-actions{margin-top:12px}.ir .sample-review-result>button{margin-top:5px}

 .ir .investigation-nav{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding-top:22px;margin-top:20px;border-top:1px solid #e0e8d8}.ir .investigation-nav button{display:flex;align-items:center;justify-content:center;gap:9px;padding:12px 7px;text-align:left;background:transparent;border:1px solid transparent;border-radius:12px;transition:background .18s,border-color .18s,transform .18s}.ir .investigation-nav button:hover{background:#f1f6e9;transform:translateY(-1px)}.ir .investigation-nav button.active{background:linear-gradient(130deg,#dceebf,#eff6e3);border-color:#bbd79a;color:#476b2c;box-shadow:0 3px 8px #42632208}.ir .investigation-nav i{--stage-soft:#eff6e3;display:grid;place-items:center;width:29px;flex:none;color:#6c8654}.ir .investigation-nav svg{width:29px;height:29px}.ir .investigation-nav span{min-width:0}.ir .investigation-nav strong{display:block;font-size:13px;font-weight:500;white-space:nowrap}.ir .investigation-nav .active strong{font-weight:700}.ir .investigation-nav small{display:block;font-size:10px;margin-top:4px;color:#869379}.ir .investigation-nav small[data-status=running]{color:#649434}.ir .investigation-nav small[data-status=partial],.ir .investigation-nav small[data-status=blocked]{color:#a27d35}.ir .rea-environment{display:flex;align-items:center;gap:16px;background:linear-gradient(120deg,#e9f0fc,#f5f8fd);padding:19px;border:1px solid #d5e1f1;border-radius:14px;margin-bottom:18px}.ir .rea-environment>svg{width:38px;height:38px;color:#4d76a6}.ir .rea-environment p{margin:5px 0;font-size:12px;line-height:1.7}.ir .rea-environment strong{font-size:14px}@media(max-width:1100px){.ir .investigation-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.ir .investigation-nav button{transition:none}}

 .ir .evidence-browser{margin:20px 0 16px;padding:15px 17px;border:1px solid #dfe7d7;border-radius:14px;background:linear-gradient(130deg,#f4f8ee,#fff)}.ir .evidence-category-tabs{display:flex;gap:7px;flex-wrap:wrap;padding-bottom:13px;border-bottom:1px solid #e4eadf}.ir .evidence-category-tabs button{display:inline-flex;align-items:center;gap:8px;min-height:34px;padding:6px 11px;background:transparent;border:1px solid transparent;font-size:12px;color:#78866d;border-radius:9px}.ir .evidence-category-tabs button span{font-size:10px;padding:0 5px;border-radius:5px;background:#eaf0e4;color:#7b8c6b;min-width:19px;text-align:center}.ir .evidence-category-tabs button[aria-pressed=true]{background:#e5f0d7;border-color:#c8dcaf;color:#4f7134;font-weight:650}.ir .evidence-category-tabs button[aria-pressed=true] span{background:#cfe2b5;color:#45672d}.ir .evidence-category-tabs button:hover{border-color:#d7e3ca;background:#f1f6e9}.ir .evidence-search{display:flex;align-items:center;gap:12px;padding-top:13px}.ir .evidence-search label{display:flex;align-items:center;gap:9px;flex:1;min-width:0;background:#fff;border:1px solid #dee7d6;border-radius:9px;padding:0 11px}.ir .evidence-search label:focus-within{border-color:#95b972;box-shadow:0 0 0 2px #a7ca7d22}.ir .evidence-search label svg{width:17px;height:17px;color:#8b9f7b;flex:none}.ir .evidence-search input{border:0;background:none;min-width:0;width:100%;box-shadow:none;outline:none;padding:9px 0;font-size:12px}.ir .evidence-search small{font-size:11px;white-space:nowrap;color:#91a082}.ir .evidence-kind{font-size:11px;font-weight:500;color:#799163}.ir .evidence .body{min-width:0}.ir .evidence code{overflow-wrap:anywhere}@media(max-width:700px){.ir .evidence-search{flex-wrap:wrap}.ir .evidence-search label{min-width:200px}}

 /* Fresh foliage accents: clearer chroma without darkening the workspace. */
 .ir{--green:#a9d96d;--green-hover:#9dd05f;--green-ink:#427c23;--soft:#eef8df;--line:#dfebd6;background:radial-gradient(ellipse at 4% 0,#e9f8d988,transparent 45%),#f7faf4}
 .ir .stat:first-child{background:linear-gradient(125deg,#e8f7ce,#f3fae8);border-color:#d5eabb}.ir .stat:first-child:after{background:#7abc42;opacity:1}
 .ir .list{background:linear-gradient(170deg,#f7fbf1,#fcfdf9)}.ir .case{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 13%,white),color-mix(in srgb,var(--case-accent) 4%,white) 65%,#fff);border-color:color-mix(in srgb,var(--case-accent) 28%,white)}
 .ir .case.active{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 22%,white),color-mix(in srgb,var(--case-accent) 7%,white) 78%,#fff);border-color:color-mix(in srgb,var(--case-accent) 65%,white);box-shadow:inset 3px 0 var(--case-accent),0 3px 9px color-mix(in srgb,var(--case-accent) 7%,transparent)}
 .ir .case-type{background:color-mix(in srgb,var(--case-accent) 12%,white);border-color:color-mix(in srgb,var(--case-accent) 23%,white)}.ir .case strong{color:color-mix(in srgb,var(--case-accent) 70%,#17352b)}
 .ir .investigation-nav button i{color:#6ba83e}.ir .investigation-nav button.active{background:linear-gradient(125deg,#d9f1b3,#edf9df);border-color:#b5dc87;color:#397820;box-shadow:0 3px 8px #68a1370a}.ir .investigation-nav button.active i{--stage-soft:#e8f7d4;color:#4a972b}.ir .investigation-nav button.active small{color:#65854a}.ir .investigation-nav small[data-status=completed]{color:#5b9732}
 .ir .investigation-body .notice{background:linear-gradient(115deg,#eef8e0,#f7fbef);border-color:#d8e9c3;color:#607c48}.ir .evidence{background:linear-gradient(125deg,#f0f8e9,#fcfef9 70%);border-color:#dcebcf}.ir .evidence>svg{color:#6bb239}.ir .investigation-body .evidence strong{color:#416c2d}.ir .investigation-body .evidence p{color:#6b8059}.ir .investigation-body .evidence code{color:#728765}
 .ir .sample-review-result{background:linear-gradient(120deg,#eaf6dc,#fcfef8);border-color:#d4e7bc}.ir .sample-review-head strong{color:#48752d}.ir .sample-review-head span{background:#ddefc9;color:#48782b}
 .ir button.primary,.ir a.export-report{background:linear-gradient(125deg,#b2df77,#a0d264);border-color:#9dce61;color:#2e4f1c;box-shadow:0 3px 8px #6f9b3320}.ir button.primary:hover:not(:disabled),.ir a.export-report:hover{background:linear-gradient(125deg,#a7d96a,#95ca56);border-color:#8bbf4a;color:#294a17}
 .ir .investigation-body .sample-actions button:not(.primary){background:linear-gradient(125deg,#f0f8e6,#fcfef8);border-color:#cfe3b6;color:#528332}.ir .investigation-body .sample-actions button:not(.primary):hover:not(:disabled){background:#e8f5d7;border-color:#b5d28f;color:#3e7122}
 .ir .evidence-category-tabs button[aria-pressed=true]{background:linear-gradient(120deg,#e1f3c5,#eef9e1);border-color:#bddc96;color:#48752a}.ir .evidence-category-tabs button[aria-pressed=true] span{background:#cce7a8;color:#3f6c21}

 .ir .status-update{background:linear-gradient(125deg,#eff9e3,#fff);border-color:#c5e29f;color:#497c28;font-weight:600}.ir .status-dialog{width:min(620px,94vw)}.ir .status-current{display:flex;align-items:center;gap:14px;padding:15px 18px;background:linear-gradient(120deg,#e8f6d6,#f7fcef);border:1px solid #d4e9ba;border-radius:12px;margin-bottom:20px;font-size:12px;color:#7d9369}.ir .status-current strong{color:#4f7b31;font-size:13px;font-weight:600}.ir .status-current>span{color:#8eb768;font-size:17px}.ir .status-report-needed{color:#a6782e;font-size:12px}.ir .case-status[data-status=closed]{color:#398568}.ir .case-status[data-status=investigating]{color:#57942d}.ir .list-search select{width:100%;margin-top:8px;min-height:32px;padding:6px 30px 6px 10px;font-size:11px;border-color:#dbe8cf;background-color:#f5faed;color:#688050}.ir .case-summary .archive-fact{font-size:11px;color:#548064}

 .ir .source-device-line{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:9px;font-size:11px;color:#839673}.ir .source-device-line strong{font-size:11px;font-weight:600;color:#4d7d31}.ir .source-device-line button{min-height:23px;padding:1px 8px;font-size:10px;border-radius:6px;background:#f1f8e8;border-color:#d4e7bd;color:#5f8c3c}.ir .source-query-notice{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}.ir .source-query-notice button{margin-left:auto;min-height:30px;padding:4px 10px;font-size:11px}

 .ir .device-source-picker{position:relative;margin-top:5px}.ir button.source-picker-trigger{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;text-align:left;padding:11px 14px;background:linear-gradient(120deg,var(--vendor-soft),#fff 85%);border:1px solid color-mix(in srgb,var(--vendor-accent) 25%,white);border-radius:12px;color:var(--vendor-accent);transform:none}.ir .source-picker-trigger[aria-expanded=true]{border-color:var(--vendor-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--vendor-accent) 10%,transparent)}.ir .source-picker-trigger>svg:not(.source-picker-chevron){width:26px;height:26px;flex:none}.ir .source-picker-trigger>span:not(.source-vendor-logo){flex:1;min-width:0;font-size:13px}.ir .source-picker-trigger strong{display:block;font-size:14px;font-weight:600;color:var(--vendor-accent)}.ir .source-picker-trigger small{display:block;font-size:11px;margin-top:3px;color:#7c8b7b}.ir .source-picker-chevron{width:18px;height:18px;margin-left:auto;flex:none;transition:transform .18s}.ir [aria-expanded=true] .source-picker-chevron{transform:rotate(180deg)}
 .ir .source-vendor-logo{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:#fff;border:1px solid color-mix(in srgb,var(--vendor-accent) 15%,white);padding:6px;flex:none;box-sizing:border-box}.ir .source-vendor-logo img{display:block;width:100%;height:100%;object-fit:contain}.ir .source-vendor-logo b{display:none;color:var(--vendor-accent)}.ir .source-vendor-logo.image-failed b{display:block}.ir .source-vendor-logo>svg{width:23px;height:23px}
 .ir .source-picker-options{margin-top:9px;max-height:320px;overflow:auto;overscroll-behavior:contain;padding:7px;background:#fff;border:1px solid #e0e9d9;border-radius:14px;box-shadow:0 7px 22px #263c1910;scrollbar-width:thin;scrollbar-color:#c7d9b8 transparent;animation:ir-enter .16s ease}.ir .source-picker-options button{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:6px;padding:11px 12px;min-height:64px;border-radius:10px;text-align:left;background:linear-gradient(110deg,var(--vendor-soft),#fff 90%);border:1px solid color-mix(in srgb,var(--vendor-accent) 18%,white);transform:none;box-shadow:none}.ir .source-picker-options button:last-child{margin-bottom:0}.ir .source-picker-options button:hover,.ir .source-picker-options button:focus-visible{border-color:color-mix(in srgb,var(--vendor-accent) 65%,white);outline:0;background:linear-gradient(110deg,color-mix(in srgb,var(--vendor-accent) 14%,white),#fff)}.ir .source-picker-options button[aria-selected=true]{border-color:var(--vendor-accent);box-shadow:inset 3px 0 var(--vendor-accent)}.ir .source-option-copy{flex:1;min-width:0}.ir .source-option-copy strong{display:block;font-size:13px;font-weight:600;color:var(--vendor-accent)}.ir .source-option-copy small{display:block;font-size:10px;line-height:1.6;color:#869187;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.ir .source-adapter-badge{font-size:10px;border-radius:6px;padding:3px 6px;white-space:nowrap;font-weight:500;background:#f4f5f1;color:#8a9383}.ir .source-adapter-badge.ready{background:#e6f5d8;color:#5c8d35}.ir .source-choice-check{width:18px;height:18px;color:var(--vendor-accent);flex:none}
 @media(max-width:550px){.ir .source-picker-options button{gap:8px;padding:10px 8px}.ir .source-picker-options{max-height:260px}.ir .source-adapter-badge{font-size:9px}}

 .ir .analysis-platform-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:25px}.ir .analysis-platform-tabs button{display:flex;align-items:center;gap:13px;text-align:left;padding:17px 18px;min-height:88px;background:linear-gradient(115deg,var(--analysis-soft),#fff);border:1px solid color-mix(in srgb,var(--analysis-accent) 20%,white);color:var(--analysis-accent);border-radius:15px}.ir .analysis-platform-tabs button[aria-selected=true]{border-color:var(--analysis-accent);box-shadow:inset 0 -3px var(--analysis-accent),0 4px 14px color-mix(in srgb,var(--analysis-accent) 10%,transparent)}.ir .analysis-platform-tabs img{width:38px;height:38px;object-fit:contain}.ir .analysis-platform-tabs span{flex:1}.ir .analysis-platform-tabs strong{display:block;font-size:15px;font-weight:650}.ir .analysis-platform-tabs small{display:block;font-size:11px;color:#7b8490;margin-top:3px}.ir .analysis-platform-tabs i{font-style:normal;font-size:11px;white-space:nowrap}
 .ir .analysis-brand-head{display:flex;align-items:center;gap:12px;margin-bottom:17px}.ir .analysis-brand-head>img{width:32px;height:32px;object-fit:contain}.ir .analysis-brand-head h3{margin:0;color:var(--analysis-accent);font-size:17px;font-weight:650}.ir .analysis-brand-head p{margin:3px 0 0;font-size:12px;color:#7b8490}.ir .analysis-notice{padding:15px 18px;border-radius:12px;margin-bottom:18px;background:linear-gradient(110deg,var(--analysis-soft),#fff);border:1px solid color-mix(in srgb,var(--analysis-accent) 17%,white);color:color-mix(in srgb,var(--analysis-accent) 75%,#48505b);font-size:13px;line-height:1.85}
 .ir .external-analysis .evidence.analysis-sample{background:linear-gradient(115deg,var(--analysis-soft),#fff 95%);border:1px solid color-mix(in srgb,var(--analysis-accent) 20%,white);padding:20px;border-radius:14px;box-shadow:none}.ir .analysis-sample>svg{color:var(--analysis-accent)}.ir .analysis-sample strong{color:color-mix(in srgb,var(--analysis-accent) 70%,#26333d);font-size:14px;font-weight:650}.ir .analysis-sample code{display:block;margin-top:8px;overflow-wrap:anywhere;font-size:12px;color:#7d8690;background:transparent}.ir .external-analysis .analysis-sample button,.ir .external-analysis .analysis-sample a{color:var(--analysis-accent);border-color:color-mix(in srgb,var(--analysis-accent) 26%,white);background:#ffffffb8}.ir .external-analysis .analysis-sample button:hover{background:var(--analysis-soft);border-color:var(--analysis-accent)}.ir .external-analysis .analysis-sample button.analysis-submit{background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 17%,white),var(--analysis-soft));font-weight:600}.ir .external-analysis .analysis-results-title{font-size:14px;margin:26px 0 12px;color:#4e5860}
 @media(max-width:650px){.ir .analysis-platform-tabs{grid-template-columns:1fr}.ir .analysis-platform-tabs button{min-height:74px;padding:13px}.ir .analysis-platform-tabs strong{font-size:14px}}

 .ir .investigation-body .external-analysis .analysis-sample strong{color:#343f4b;font-weight:650}.ir .investigation-body .external-analysis .analysis-sample code{color:#77808e;font-weight:400}.ir .investigation-body .external-analysis .analysis-sample p{color:#77808e}.ir .investigation-body .external-analysis .sample-actions button:not(.primary),.ir .investigation-body .external-analysis .sample-actions a{color:var(--analysis-accent);border-color:color-mix(in srgb,var(--analysis-accent) 28%,white);background:linear-gradient(120deg,#fff,var(--analysis-soft))}.ir .investigation-body .external-analysis .sample-actions button:not(.primary):hover:not(:disabled){color:var(--analysis-accent);border-color:var(--analysis-accent);background:var(--analysis-soft)}.ir .investigation-body .external-analysis .sample-actions .analysis-submit:not(.primary){background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 17%,white),var(--analysis-soft));font-weight:600}
 .ir .analysis-brand-head>div{flex:1}.ir .external-analysis .analysis-official-link{display:inline-flex;align-items:center;gap:8px;flex:none;padding:9px 14px;border:1px solid color-mix(in srgb,var(--analysis-accent) 25%,white);border-radius:10px;color:var(--analysis-accent);font-size:12px;font-weight:600;background:linear-gradient(120deg,#fff,var(--analysis-soft))}.ir .external-analysis .analysis-official-link:hover{border-color:var(--analysis-accent);box-shadow:0 3px 12px color-mix(in srgb,var(--analysis-accent) 12%,transparent)}
 @media(max-width:650px){.ir .analysis-brand-head{flex-wrap:wrap}.ir .analysis-official-link{margin-left:44px}}


 .ir .external-analysis[data-provider=threatbook]{--analysis-border:#ead9d3;--analysis-fill:#efd8d0;--analysis-ink:#88483f}.ir .external-analysis[data-provider=virustotal]{--analysis-border:#dbe1ee;--analysis-fill:#dce4f4;--analysis-ink:#405782}
 .ir .external-analysis .analysis-platform-tabs button{background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-soft) 65%,white),#fff);border-color:color-mix(in srgb,var(--analysis-accent) 18%,white);color:#43505c;box-shadow:none}.ir .external-analysis .analysis-platform-tabs button[aria-selected=true]{background:linear-gradient(115deg,color-mix(in srgb,var(--analysis-accent) 11%,white),var(--analysis-soft) 65%,#fff);border-color:color-mix(in srgb,var(--analysis-accent) 48%,white);box-shadow:0 3px 12px color-mix(in srgb,var(--analysis-accent) 7%,transparent)}.ir .external-analysis .analysis-platform-tabs button:hover{border-color:color-mix(in srgb,var(--analysis-accent) 42%,white);background:var(--analysis-soft)}.ir .external-analysis .analysis-platform-tabs strong{color:color-mix(in srgb,var(--analysis-accent) 76%,#303c48)}.ir .external-analysis .analysis-platform-tabs small{color:#828792}.ir .external-analysis .analysis-platform-tabs i{color:#828792}
 .ir .external-analysis .analysis-brand-head h3{color:var(--analysis-ink)}.ir .external-analysis .analysis-notice{background:linear-gradient(115deg,var(--analysis-soft),#fdfdfc);border-color:var(--analysis-border);color:#747c85}.ir .investigation-body .external-analysis .evidence.analysis-sample{background:linear-gradient(115deg,var(--analysis-soft),#fff 90%);border-color:var(--analysis-border)}.ir .investigation-body .external-analysis .analysis-sample>svg{color:var(--analysis-accent)}.ir .investigation-body .external-analysis .analysis-sample strong{color:#343f4b}.ir .investigation-body .external-analysis .analysis-sample code{color:#7b818b}
 .ir .investigation-body .external-analysis .sample-actions button:not(.primary),.ir .investigation-body .external-analysis .sample-actions a{color:var(--analysis-ink);border-color:var(--analysis-border);background:#ffffffd9}.ir .investigation-body .external-analysis .sample-actions button:not(.primary):hover:not(:disabled){color:var(--analysis-ink);border-color:color-mix(in srgb,var(--analysis-accent) 48%,white);background:var(--analysis-soft)}.ir .investigation-body .external-analysis .sample-actions button.analysis-submit:not(.primary){background:linear-gradient(120deg,var(--analysis-fill),var(--analysis-soft));border-color:color-mix(in srgb,var(--analysis-accent) 25%,white);color:var(--analysis-ink);box-shadow:none}.ir .investigation-body .external-analysis .sample-actions button.analysis-submit:not(.primary):hover:not(:disabled){background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 24%,white),var(--analysis-fill));color:var(--analysis-ink)}.ir .external-analysis .analysis-official-link{background:#fff;border-color:var(--analysis-border);color:var(--analysis-ink);box-shadow:none}
` }),
    /* @__PURE__ */ jsxs("div", { className: "head", children: [
      /* @__PURE__ */ jsxs("div", { className: "scene-page-brand", children: [
        /* @__PURE__ */ jsx("img", { "data-scene-logo": "incident", className: "scene-page-logo", src: "/api/scenes/assistant/logos/incident.svg", alt: "\u5E94\u6025\u54CD\u5E94 Logo" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "overline", children: "INCIDENT RESPONSE / EVIDENCE INTO ACTION" }),
          /* @__PURE__ */ jsx("h1", { children: "\u5E94\u6025\u54CD\u5E94\u5DE5\u4F5C\u53F0" }),
          /* @__PURE__ */ jsx("p", { children: "\u4ECE\u786E\u8BA4\u544A\u8B66\u5230\u8BC1\u636E\u94FE\uFF0C\u8BA9\u6BCF\u4E00\u6B65\u8C03\u67E5\u90FD\u6709\u4F9D\u636E\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "tools", children: [
        /* @__PURE__ */ jsx("span", { className: "badge", children: "\u5DE5\u4F5C\u6D41 + AI \u5206\u6790" }),
        /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => {
          setNewEvent(initialEvent());
          setEventModal(true);
        }, children: "\u65B0\u589E\u4E8B\u4EF6" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          setTab("settings");
          setSelected("");
        }, children: [
          /* @__PURE__ */ jsx(Icon, { type: "host" }),
          " \u4E3B\u673A\u4E0E\u8FDE\u63A5"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => void refresh(), children: "\u5237\u65B0" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("div", { role: "alert", className: "error", children: error }),
    /* @__PURE__ */ jsx("div", { className: "stats", children: [["\u54CD\u5E94\u4E8B\u4EF6", cases.length], ["\u8C03\u67E5\u8FDB\u884C\u4E2D", cases.filter((c) => ["queued", "running", "investigating"].includes(c.status)).length], ["\u7B49\u5F85\u590D\u6838", cases.filter((c) => c.status === "review").length], ["\u767B\u8BB0\u4E3B\u673A", settings.hosts.length]].map(([label, value]) => /* @__PURE__ */ jsxs("div", { className: "stat", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      /* @__PURE__ */ jsx("b", { children: value })
    ] }, String(label))) }),
    /* @__PURE__ */ jsxs("div", { className: "layout", children: [
      /* @__PURE__ */ jsxs("aside", { className: "panel list", children: [
        /* @__PURE__ */ jsxs("div", { className: "list-heading", children: [
          /* @__PURE__ */ jsx("h3", { children: "\u54CD\u5E94\u4E8B\u4EF6" }),
          /* @__PURE__ */ jsxs("span", { children: [
            shown.length,
            " \u9879"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "list-search", children: [
          /* @__PURE__ */ jsx("input", { placeholder: "\u641C\u7D22\u4E8B\u4EF6\u3001\u6765\u6E90\u6216\u76EE\u6807 IP", value: query, onChange: (e) => setQuery(e.target.value) }),
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u7B5B\u9009\u4E8B\u4EF6\u72B6\u6001", value: caseStatusFilter, onChange: (e) => setCaseStatusFilter(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "\u5168\u90E8\u4E8B\u4EF6\u72B6\u6001" }),
            ["new", "queued", "investigating", "running", "review", "closed", "failed", "interrupted"].map((key) => /* @__PURE__ */ jsxs("option", { value: key, children: [
              labels[key],
              " \xB7 ",
              cases.filter((c) => c.status === key).length
            ] }, key))
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "case-scroll", children: shown.length ? shown.map((c) => /* @__PURE__ */ jsxs("button", { "data-attack-type": attackTheme(c).id, style: { "--case-accent": attackTheme(c).accent, "--case-soft": attackTheme(c).soft }, className: "case " + (selected === c.id ? "active" : ""), onClick: () => choose(c.id), children: [
          /* @__PURE__ */ jsx("span", { className: "case-type", children: attackTheme(c).label }),
          /* @__PURE__ */ jsx("strong", { children: c.title }),
          /* @__PURE__ */ jsxs("div", { className: "addr", children: [
            c.source || "\u6765\u6E90\u5F85\u6838\u5B9E",
            " \u2192 ",
            c.target
          ] }),
          /* @__PURE__ */ jsxs("small", { children: [
            new Date(c.created).toLocaleString(),
            " \xB7 ",
            /* @__PURE__ */ jsx("span", { className: "case-status", "data-status": c.status, children: labels[c.status] || c.status })
          ] })
        ] }, c.id)) : /* @__PURE__ */ jsxs("div", { className: "empty", children: [
          "\u6682\u65E0\u4E8B\u4EF6\u3002",
          /* @__PURE__ */ jsx("br", {}),
          "\u53EF\u65B0\u589E\u4E8B\u4EF6\uFF0C\u6216\u4ECE\u6B63\u5F0F\u544A\u8B66\u4E0B\u53D1\u8C03\u67E5\u3002"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "panel detail " + (tab === "settings" ? "settings-view" : ""), children: tab === "settings" ? /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsxs("div", { className: "head", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { children: "\u4E3B\u673A\u4E0E\u8C03\u67E5\u8FDE\u63A5" }),
            /* @__PURE__ */ jsx("p", { children: "\u4EC5\u767B\u8BB0\u53D7\u7BA1\u4E3B\u673A\uFF0C\u51ED\u636E\u4F7F\u7528\u5E73\u53F0 Secret Manager \u4FDD\u5B58\u3002" })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => setModal(true), children: "\u767B\u8BB0\u4E3B\u673A" })
        ] }),
        /* @__PURE__ */ jsxs("details", { className: "work-help", children: [
          /* @__PURE__ */ jsx("summary", { children: "\u4E3B\u673A\u63A5\u5165\u4E0E\u6743\u9650\u8BF4\u660E" }),
          /* @__PURE__ */ jsx("p", { children: "\u4EC5\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE\u4E8B\u4EF6\u8BC1\u636E\u3002SSH \u6821\u9A8C\u4E3B\u673A\u516C\u94A5\uFF1BWinRM \u4F7F\u7528 HTTPS \u548C\u53EF\u4FE1\u8BC1\u4E66\uFF1B\u4E3B\u673A\u987B\u4E0E\u4E8B\u4EF6\u76EE\u6807\u4E00\u81F4\u3002" })
        ] }),
        settings.hosts.map((h) => /* @__PURE__ */ jsxs("div", { className: "hostitem", children: [
          /* @__PURE__ */ jsx(Icon, { type: "host" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: h.name }),
            /* @__PURE__ */ jsxs("p", { children: [
              h.address,
              ":",
              h.port,
              " \xB7 ",
              h.protocol === "ssh" ? "Linux SSH" : "Windows WinRM",
              " \xB7 ",
              h.username
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "badge", children: "\u5DF2\u767B\u8BB0" })
        ] }, h.id)),
        /* @__PURE__ */ jsx("h3", { style: { marginTop: 25 }, children: "\u5FAE\u6B65\u4E91\u6C99\u7BB1" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u590D\u7528 threatbook-cn \u6587\u4EF6\u5206\u6790\u51ED\u636E\uFF1A",
          /* @__PURE__ */ jsx("span", { className: "badge", children: settings.sandbox_key_configured ? "\u5DF2\u914D\u7F6E\u5BC6\u94A5" : "\u5C1A\u672A\u914D\u7F6E" })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "\u53D6\u8BC1\u5B8C\u6210\u540E\u53EF\u6309\u54C8\u5E0C\u67E5\u62A5\u544A\uFF0C\u6216\u660E\u786E\u786E\u8BA4\u540E\u4E0A\u4F20\u6837\u672C\u3002\u63D0\u4EA4\u548C\u62A5\u544A\u5747\u5F52\u6863\u5230\u4E8B\u4EF6\u8BC1\u636E\u5E93\u3002" }),
        /* @__PURE__ */ jsx("a", { href: "https://s.threatbook.com/", target: "_blank", rel: "noreferrer", children: "\u6253\u5F00\u5FAE\u6B65\u4E91\u6C99\u7BB1 \u2197" }),
        /* @__PURE__ */ jsx("h3", { style: { marginTop: 25 }, children: "VirusTotal" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u590D\u7528 VirusTotal API \u51ED\u636E\uFF1A",
          /* @__PURE__ */ jsx("span", { className: "badge", children: settings.virustotal_key_configured ? "\u5DF2\u914D\u7F6E\u5BC6\u94A5" : "\u5C1A\u672A\u914D\u7F6E" })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "\u652F\u6301\u6587\u4EF6\u54C8\u5E0C\u67E5\u8BE2\u4E0E\u786E\u8BA4\u540E\u7684\u6837\u672C\u63D0\u4EA4\uFF0C\u591A\u5F15\u64CE\u7ED3\u679C\u5F52\u6863\u5230\u4E8B\u4EF6\u8BC1\u636E\u5E93\u3002" }),
        /* @__PURE__ */ jsx("a", { href: "https://www.virustotal.com/", target: "_blank", rel: "noreferrer", children: "\u6253\u5F00 VirusTotal \u2197" })
      ] }) : !detail ? /* @__PURE__ */ jsxs("div", { className: "empty", children: [
        /* @__PURE__ */ jsx(Icon, {}),
        /* @__PURE__ */ jsx("h2", { children: "\u8BA9\u7EBF\u7D22\u6210\u4E3A\u5B8C\u6574\u8C03\u67E5" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u65B0\u589E\u5E94\u6025\u4E8B\u4EF6\uFF0C\u6216\u5728\u544A\u8B66\u8BE6\u60C5\u70B9\u51FB",
          /* @__PURE__ */ jsx("br", {}),
          "\u201C\u5E94\u6025\u54CD\u5E94\u201D\u5F00\u59CB\u8C03\u67E5\u3002"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "notice", children: "\u8BBE\u5907\u65E5\u5FD7\u5173\u8054 \u2192 \u4E3B\u673A\u53EA\u8BFB\u6392\u67E5 \u2192 \u6837\u672C\u53D6\u8BC1 \u2192 \u6C99\u7BB1\u5206\u6790 \u2192 \u8BC1\u636E\u62A5\u544A" })
      ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsxs("div", { className: "case-summary", children: [
          /* @__PURE__ */ jsxs("div", { className: "head", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "badge", children: labels[detail.status] || detail.status }),
              /* @__PURE__ */ jsx("h2", { style: { marginTop: 10 }, children: detail.title }),
              /* @__PURE__ */ jsxs("p", { children: [
                detail.source || "\u6765\u6E90\u5F85\u6838\u5B9E",
                " \u2192 ",
                detail.target,
                " \xB7 ",
                detail.actor
              ] }),
              /* @__PURE__ */ jsxs("code", { children: [
                "IR-",
                detail.id.slice(0, 10)
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "source-device-line", children: [
                /* @__PURE__ */ jsx("span", { children: "\u6765\u6E90\u8BBE\u5907" }),
                /* @__PURE__ */ jsx("strong", { children: caseSource(detail)?.name || "\u5C1A\u672A\u660E\u786E\u6765\u6E90\u8BBE\u5907" }),
                /* @__PURE__ */ jsx("button", { disabled: locked, onClick: openSource, children: caseSource(detail) ? "\u53D8\u66F4\u6765\u6E90" : "\u660E\u786E\u6765\u6E90\u8BBE\u5907" })
              ] }),
              detail.status === "closed" && /* @__PURE__ */ jsxs("p", { className: "archive-fact", children: [
                "\u5DF2\u5F52\u6863 \xB7 ",
                new Date(detail.closed_at).toLocaleString(),
                " \xB7 ",
                detail.closed_by
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "tools", children: [
              /* @__PURE__ */ jsx("button", { className: "status-update", disabled: !!busy || detail.processing || !detail.status_actions?.length, onClick: () => {
                setStatusAction(detail.status_actions?.[0]?.action || "");
                setStatusNote("");
                setStatusOpen(true);
              }, children: "\u66F4\u65B0\u72B6\u6001" }),
              /* @__PURE__ */ jsxs("a", { className: "export-report", href: BASE + "/cases/" + detail.id + "/report.md", download: true, children: [
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" }) }),
                "\u5BFC\u51FA\u62A5\u544A"
              ] }),
              /* @__PURE__ */ jsx("button", { className: "danger", disabled: !!busy || locked, onClick: () => setDeleteOpen(true), children: "\u5220\u9664\u4E8B\u4EF6" })
            ] })
          ] }),
          JSON.parse(detail.alert || "{}")._demo && /* @__PURE__ */ jsx("div", { className: "notice case-context", children: "\u6F14\u793A\u4E8B\u4EF6 \xB7 \u4EC5\u9884\u89C8\u6D41\u7A0B\uFF0C\u4E0D\u67E5\u8BE2\u771F\u5B9E\u8BBE\u5907\u3001\u4E0D\u4E0A\u673A\u3001\u4E0D\u4E0A\u4F20\u6837\u672C\u3002" }),
          /* @__PURE__ */ jsx("div", { className: "investigation-nav", role: "tablist", "aria-label": "\u8C03\u67E5\u529F\u80FD", children: [["overview", "\u8C03\u67E5\u52A8\u6001", "intake"], ["logs", "\u8BBE\u5907\u5173\u8054", "logs"], ["host", "\u4E3B\u673A\u6392\u67E5", "host"], ["evidence", "\u6837\u672C\u4E0E\u9006\u5411", "sample"], ["sandbox", "\u6C99\u7BB1\u5206\u6790", "sandbox"], ["report", "\u54CD\u5E94\u62A5\u544A", "report"]].map(([key, name, stage]) => {
            const events = detail.events.filter((e) => e.stage === stage);
            const last = events[events.length - 1];
            return /* @__PURE__ */ jsxs("button", { type: "button", role: "tab", "aria-selected": tab === key, className: tab === key ? "active" : "", onClick: () => setTab(key), children: [
              /* @__PURE__ */ jsx("i", { children: /* @__PURE__ */ jsx(StageIcon, { stage }) }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: name }),
                /* @__PURE__ */ jsx("small", { "data-status": last?.status || "pending", children: labels[last?.status] || "\u5F85\u6267\u884C" })
              ] })
            ] }, key);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "investigation-body", children: [
          optionalJobs.length > 0 && ["host", "evidence"].includes(tab) && /* @__PURE__ */ jsxs("details", { className: "work-help", children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "\u53D6\u8BC1\u4E0E\u73AF\u5883\u4EFB\u52A1 \xB7 ",
              optionalJobs.filter((j) => ["running", "queued"].includes(j.status)).length,
              " \u9879\u6267\u884C\u4E2D"
            ] }),
            optionalJobs.slice(0, 5).map((j) => /* @__PURE__ */ jsxs("div", { className: "optional-job", children: [
              /* @__PURE__ */ jsxs("strong", { children: [
                j.kind === "rea_install" ? "REA \u5B89\u88C5" : "Solar \u53D6\u8BC1",
                " \xB7 ",
                labels[j.status] || j.status
              ] }),
              /* @__PURE__ */ jsx("p", { children: j.result?.message }),
              j.kind === "rea_install" && /* @__PURE__ */ jsx("button", { onClick: () => req("/optional/jobs/" + j.id + "/log").then((r) => setOptionalLog(r.text)), children: "\u67E5\u770B\u65E5\u5FD7" })
            ] }, j.id))
          ] }),
          optionalLog && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => setOptionalLog(""), children: /* @__PURE__ */ jsxs("div", { className: "dialog", onClick: (e) => e.stopPropagation(), children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setOptionalLog(""), children: "\u5173\u95ED" }),
            /* @__PURE__ */ jsx("h3", { children: "\u5B89\u88C5\u65E5\u5FD7" }),
            /* @__PURE__ */ jsx("pre", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }, children: optionalLog })
          ] }) }),
          busy && /* @__PURE__ */ jsxs("p", { className: "busy", role: "status", children: [
            busy,
            "\uFF0C\u8BF7\u7A0D\u5019\u2026"
          ] }),
          tab === "overview" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "work-section-head", children: [
              /* @__PURE__ */ jsx("h3", { children: "\u8C03\u67E5\u52A8\u6001" }),
              /* @__PURE__ */ jsx("button", { disabled: !!busy || locked, onClick: () => action("\u91CD\u65B0\u5173\u8054\u65E5\u5FD7", () => req("/cases/" + detail.id + "/run", {})), children: "\u5237\u65B0\u5173\u8054\u65E5\u5FD7" })
            ] }),
            /* @__PURE__ */ jsx(ActivityTimeline, { events: detail.events })
          ] }),
          tab === "logs" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "work-section-head", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { children: "\u8BBE\u5907\u5173\u8054" }),
                /* @__PURE__ */ jsx("small", { children: caseSource(detail)?.name || "\u5C1A\u672A\u7ED1\u5B9A\u6765\u6E90\u8BBE\u5907" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tools", children: [
                /* @__PURE__ */ jsx("button", { disabled: locked, onClick: openSource, children: caseSource(detail) ? "\u66F4\u6362\u8BBE\u5907" : "\u9009\u62E9\u8BBE\u5907" }),
                /* @__PURE__ */ jsx("button", { className: "primary", disabled: !!busy || locked || !caseSource(detail), onClick: () => action("\u5173\u8054\u8BBE\u5907\u65E5\u5FD7", () => req("/cases/" + detail.id + "/run", {})), children: "\u67E5\u8BE2\u5173\u8054\u65E5\u5FD7" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(DeviceLogCoverage, { detail }),
            detail.events.some((e) => e.stage === "logs") && /* @__PURE__ */ jsxs("details", { className: "work-help", open: detail.events.filter((e) => e.stage === "logs").slice(-1)[0]?.status === "blocked" || detail.events.filter((e) => e.stage === "logs").slice(-1)[0]?.status === "failed", children: [
              /* @__PURE__ */ jsx("summary", { children: "\u67E5\u8BE2\u8BB0\u5F55\u4E0E\u5F02\u5E38" }),
              /* @__PURE__ */ jsx(ActivityTimeline, { compact: true, events: detail.events.filter((e) => e.stage === "logs") })
            ] }),
            /* @__PURE__ */ jsxs("details", { className: "work-help", children: [
              /* @__PURE__ */ jsx("summary", { children: "\u67E5\u8BE2\u8303\u56F4\u8BF4\u660E" }),
              /* @__PURE__ */ jsx("p", { children: "\u4EC5\u67E5\u8BE2\u5F53\u524D\u4E8B\u4EF6\u7ED1\u5B9A\u7684\u8BBE\u5907\u3001\u544A\u8B66\u65F6\u95F4\u7A97\u53E3\u53CA\u5173\u8054 IP\u3002\u539F\u59CB\u54CD\u5E94\u4FDD\u7559\u5728\u8BC1\u636E\u5E93\uFF0C\u5B8C\u6574\u6027\u4EE5\u8BC1\u636E SHA-256 \u6821\u9A8C\u3002" })
            ] })
          ] }),
          tab === "sandbox" && /* @__PURE__ */ jsxs("section", { className: "external-analysis", "data-provider": analysisProvider, style: { "--analysis-accent": platform.accent, "--analysis-soft": platform.soft }, children: [
            /* @__PURE__ */ jsx("div", { className: "analysis-platform-tabs", role: "tablist", "aria-label": "\u6837\u672C\u5206\u6790\u5E73\u53F0", children: [["threatbook", "\u5FAE\u6B65\u4E91\u6C99\u7BB1", "threatbook-hd.svg", "\u52A8\u6001\u884C\u4E3A \xB7 \u4E91\u6C99\u7BB1"], ["virustotal", "VirusTotal", "virustotal.svg", "\u591A\u5F15\u64CE\u68C0\u6D4B \xB7 \u6587\u4EF6\u60C5\u62A5"]].map(([id, name, logo, desc]) => /* @__PURE__ */ jsxs("button", { role: "tab", "aria-selected": analysisProvider === id, onClick: () => setAnalysisProvider(id), style: { "--analysis-accent": id === "threatbook" ? "#b45f55" : "#586e9d", "--analysis-soft": id === "threatbook" ? "#fcf3f0" : "#f0f3fa" }, children: [
              /* @__PURE__ */ jsx("img", { src: "/vendor-logos/" + logo, alt: name }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: name }),
                /* @__PURE__ */ jsx("small", { children: desc })
              ] }),
              /* @__PURE__ */ jsx("i", { children: (id === "threatbook" ? settings.sandbox_key_configured : settings.virustotal_key_configured) ? "\u5DF2\u914D\u7F6E" : "\u5F85\u914D\u7F6E" })
            ] }, id)) }),
            /* @__PURE__ */ jsxs("div", { className: "analysis-brand-head", children: [
              /* @__PURE__ */ jsx("img", { src: "/vendor-logos/" + platform.logo, alt: "" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { children: [
                  platform.name,
                  "\u6837\u672C\u5206\u6790"
                ] }),
                /* @__PURE__ */ jsx("p", { children: analysisProvider === "threatbook" ? "\u4EE5\u4E91\u6C99\u7BB1\u884C\u4E3A\u62A5\u544A\u8F85\u52A9\u9A8C\u8BC1\u53EF\u7591\u6587\u4EF6\u3002" : "\u805A\u5408\u591A\u5F15\u64CE\u68C0\u51FA\u4E0E\u6587\u4EF6\u60C5\u62A5\uFF0C\u8F85\u52A9\u4EA4\u53C9\u9A8C\u8BC1\u6837\u672C\u98CE\u9669\u3002" })
              ] }),
              /* @__PURE__ */ jsxs("a", { className: "analysis-official-link", href: analysisProvider === "threatbook" ? "https://s.threatbook.com/" : "https://www.virustotal.com/gui/home/upload", target: "_blank", rel: "noopener noreferrer", children: [
                "\u524D\u5F80",
                analysisProvider === "threatbook" ? "\u5FAE\u6B65" : " VT",
                "\u5B98\u7F51\u4E0A\u4F20 ",
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "analysis-notice", children: [
              platform.ready ? "\u5DF2\u914D\u7F6E API\u3002" : "\u5C1A\u672A\u914D\u7F6E API Key\uFF0C\u8BF7\u5728\u5DE5\u5177\u6E05\u5355\u4E2D\u914D\u7F6E\u5BF9\u5E94\u5E73\u53F0\u3002",
              "\u5148\u6309\u54C8\u5E0C\u67E5\u8BE2\uFF0C\u6587\u4EF6\u4E0D\u4F1A\u4E0A\u4F20\uFF1B\u63D0\u4EA4\u6587\u4EF6\u9700\u5355\u72EC\u786E\u8BA4\u5916\u53D1\u6388\u6743\u3002",
              analysisProvider === "virustotal" && "\u6807\u51C6 VT \u4E0A\u4F20\u53EF\u80FD\u5411\u5B89\u5168\u793E\u533A\u53CA\u5408\u4F5C\u65B9\u5171\u4EAB\u6837\u672C\uFF0C\u654F\u611F\u6587\u4EF6\u8BF7\u52FF\u63D0\u4EA4\u3002"
            ] }),
            detail.evidence.filter((e) => e.kind === "sample").map((e) => /* @__PURE__ */ jsxs("div", { className: "evidence analysis-sample", children: [
              /* @__PURE__ */ jsx(Icon, { type: "file" }),
              /* @__PURE__ */ jsxs("div", { className: "body", children: [
                /* @__PURE__ */ jsx("strong", { children: e.label }),
                /* @__PURE__ */ jsxs("code", { children: [
                  "SHA-256 ",
                  e.sha256
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
                  /* @__PURE__ */ jsx("button", { disabled: !!busy || locked || !platform.ready, onClick: () => action("\u67E5\u8BE2" + platform.name + "\u62A5\u544A", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: false, provider: analysisProvider })), children: "\u6309\u54C8\u5E0C\u67E5\u62A5\u544A" }),
                  /* @__PURE__ */ jsxs("button", { className: "analysis-submit", disabled: !!busy || locked || !platform.ready, onClick: () => {
                    if (confirm(analysisProvider === "virustotal" ? "\u786E\u8BA4\u5DF2\u83B7\u6587\u4EF6\u5916\u53D1\u6388\u6743\uFF0C\u5C06\u6837\u672C\u4E0A\u4F20\u81F3 VirusTotal\uFF1F\u6807\u51C6\u4E0A\u4F20\u53EF\u80FD\u5411\u5B89\u5168\u793E\u533A\u53CA\u5408\u4F5C\u65B9\u5171\u4EAB\u6587\u4EF6\uFF0C\u654F\u611F\u6587\u4EF6\u8BF7\u52FF\u63D0\u4EA4\u3002" : "\u786E\u8BA4\u5DF2\u83B7\u6587\u4EF6\u5916\u53D1\u6388\u6743\uFF0C\u5C06\u6B64\u6837\u672C\u4E0A\u4F20\u5230\u5FAE\u6B65\u4E91\u6C99\u7BB1\uFF1F")) action("\u63D0\u4EA4" + platform.name, () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: true, provider: analysisProvider, external_upload_confirmed: true }));
                  }, children: [
                    "\u786E\u8BA4\u5916\u53D1\u5E76\u63D0\u4EA4",
                    analysisProvider === "threatbook" ? "\u6C99\u7BB1" : " VT"
                  ] })
                ] })
              ] })
            ] }, e.id)),
            !detail.evidence.some((e) => e.kind === "sample") && /* @__PURE__ */ jsx("div", { className: "empty", children: "\u5C1A\u65E0\u53D6\u8BC1\u6837\u672C\uFF0C\u8BF7\u5148\u5B8C\u6210\u6587\u4EF6\u53D6\u8BC1\u3002" }),
            /* @__PURE__ */ jsx("h3", { className: "analysis-results-title", children: "\u5206\u6790\u56DE\u6267\u4E0E\u62A5\u544A" }),
            detail.evidence.filter((e) => e.kind === "sandbox_report" && reportProvider(e) === analysisProvider).slice().reverse().map((e) => /* @__PURE__ */ jsxs("div", { className: "evidence analysis-sample", children: [
              /* @__PURE__ */ jsx(Icon, { type: "file" }),
              /* @__PURE__ */ jsxs("div", { className: "body", children: [
                /* @__PURE__ */ jsx("strong", { children: e.label }),
                /* @__PURE__ */ jsx("p", { children: new Date(e.created).toLocaleString() }),
                /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => showExternalReport(e), children: "\u67E5\u770B\u8BE6\u60C5" }),
                  /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/evidence/" + e.id, children: "\u4E0B\u8F7D\u539F\u59CB\u62A5\u544A" })
                ] })
              ] })
            ] }, e.id)),
            !detail.evidence.some((e) => e.kind === "sandbox_report" && reportProvider(e) === analysisProvider) && /* @__PURE__ */ jsx("p", { className: "note", children: "\u5F53\u524D\u5E73\u53F0\u5C1A\u65E0\u5206\u6790\u7ED3\u679C\u3002\u67E5\u8BE2\u6216\u63D0\u4EA4\u6210\u529F\u540E\uFF0C\u539F\u59CB\u8FD4\u56DE\u4F1A\u4FDD\u5B58\u5728\u672C\u4E8B\u4EF6\u8BC1\u636E\u5E93\u3002" })
          ] }),
          tab === "host" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "work-section-head", children: [
              /* @__PURE__ */ jsx("h3", { children: "\u4E3B\u673A\u6392\u67E5" }),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setTab("settings");
                setSelected("");
              }, children: "\u7BA1\u7406\u4E3B\u673A" })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "host-operation", children: [
              /* @__PURE__ */ jsx("div", { className: "operation-number", children: "01" }),
              /* @__PURE__ */ jsxs("div", { className: "operation-body", children: [
                /* @__PURE__ */ jsx("h4", { children: "\u9009\u62E9\u76EE\u6807\u4E3B\u673A" }),
                /* @__PURE__ */ jsxs("label", { className: "field", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "\u4E8B\u4EF6\u76EE\u6807\uFF1A",
                    detail.target
                  ] }),
                  /* @__PURE__ */ jsxs("select", { "aria-label": "\u8C03\u67E5\u76EE\u6807\u4E3B\u673A", value: remote, onChange: (e) => setRemote(e.target.value), children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u767B\u8BB0\u4E3B\u673A" }),
                    matching.map((h) => /* @__PURE__ */ jsxs("option", { value: h.id, children: [
                      h.name,
                      " \xB7 ",
                      h.protocol
                    ] }, h.id))
                  ] })
                ] }),
                !matching.length && /* @__PURE__ */ jsx("small", { children: "\u8BF7\u5148\u767B\u8BB0\u76EE\u6807\u4E3B\u673A\u7684 SSH \u6216 WinRM \u8FDE\u63A5\u3002" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "host-operation", children: [
              /* @__PURE__ */ jsx("div", { className: "operation-number", children: "02" }),
              /* @__PURE__ */ jsxs("div", { className: "operation-body", children: [
                /* @__PURE__ */ jsx("h4", { children: "\u542F\u52A8 AI \u8C03\u67E5" }),
                /* @__PURE__ */ jsx("p", { children: "\u91C7\u96C6\u4E3B\u673A\u7EBF\u7D22\uFF0C\u5173\u8054\u8BC1\u636E\u5E76\u751F\u6210\u62A5\u544A\u3002" }),
                /* @__PURE__ */ jsx("button", { className: "primary", disabled: !remote || !!busy || locked, onClick: () => {
                  if (confirm("\u786E\u8BA4\u6388\u6743 Atlas \u5BF9\u5F53\u524D\u4E8B\u4EF6\u76EE\u6807\u6267\u884C\u53EA\u8BFB\u8C03\u67E5\u53CA\u5DF2\u53D1\u73B0\u53EF\u7591\u6587\u4EF6\u7684\u81EA\u52A8\u53D6\u8BC1\uFF1F\u6700\u591A3\u8F6E\u8FFD\u67E5\uFF0C\u4E0D\u6267\u884C\u6837\u672C\uFF0C\u4E0D\u505A\u5220\u9664\u3001\u4FEE\u590D\u6216\u5916\u90E8\u4E0A\u4F20\u3002")) action("\u8FDC\u7A0B\u8C03\u67E5", () => req("/cases/" + detail.id + "/run", { host_id: remote, remote_authorized: true, ai_autonomous: true }));
                }, children: "\u6388\u6743\u5E76\u542F\u52A8 AI \u8C03\u67E5" }),
                /* @__PURE__ */ jsxs("details", { className: "work-help", children: [
                  /* @__PURE__ */ jsx("summary", { children: "\u8C03\u67E5\u8303\u56F4\u4E0E\u6388\u6743\u8BF4\u660E" }),
                  /* @__PURE__ */ jsx("p", { children: "\u4ECE\u8FDB\u7A0B\u3001\u8FDE\u63A5\u3001\u767B\u5F55\u548C\u6301\u4E45\u5316\u7EBF\u7D22\u51FA\u53D1\uFF0C\u6700\u591A3\u8F6E\u6309\u8BC1\u636E\u8FFD\u67E5\u53CA\u53D6\u8BC1\uFF1B\u6240\u6709\u52A8\u4F5C\u4E0E\u6A21\u578B\u51B3\u7B56\u5F52\u6863\u3002\u4E0D\u6267\u884C\u6837\u672C\u3001\u4E0D\u5220\u9664\u6216\u4FEE\u590D\u6587\u4EF6\uFF0C\u4E0D\u81EA\u52A8\u5916\u53D1\u3002" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "host-operation", children: [
              /* @__PURE__ */ jsx("div", { className: "operation-number", children: "03" }),
              /* @__PURE__ */ jsxs("div", { className: "operation-body", children: [
                /* @__PURE__ */ jsx("h4", { children: "\u8865\u5145\u6587\u4EF6\u53D6\u8BC1" }),
                /* @__PURE__ */ jsxs("div", { className: "file-collect-line", children: [
                  /* @__PURE__ */ jsx("input", { "aria-label": "\u53D6\u8BC1\u6587\u4EF6\u8DEF\u5F84", value: path, onChange: (e) => setPath(e.target.value), placeholder: "\u8F93\u5165\u8FDC\u7A0B\u6587\u4EF6\u7684\u7EDD\u5BF9\u8DEF\u5F84" }),
                  /* @__PURE__ */ jsx("button", { disabled: !path || !remote || !!busy || locked, onClick: () => {
                    if (confirm("\u786E\u8BA4\u4ECE\u4E8B\u4EF6\u76EE\u6807\u91C7\u96C6\u8FD9\u4E2A\u6587\u4EF6\u5230\u5E73\u53F0\u9694\u79BB\u8BC1\u636E\u5E93\uFF1F\u6587\u4EF6\u4E0D\u4F1A\u88AB\u6267\u884C\u3002")) action("\u6587\u4EF6\u53D6\u8BC1", () => req("/cases/" + detail.id + "/files", { host_id: remote, path, confirmed: true }));
                  }, children: "\u91C7\u96C6\u5E76\u5206\u6790" })
                ] }),
                /* @__PURE__ */ jsxs("details", { className: "work-help", children: [
                  /* @__PURE__ */ jsx("summary", { children: "\u6587\u4EF6\u91C7\u96C6\u8BF4\u660E" }),
                  /* @__PURE__ */ jsx("p", { children: "\u6309\u5B9E\u9645\u7EBF\u7D22\u586B\u5199\u5B8C\u6574\u8DEF\u5F84\u3002\u5355\u6587\u4EF6\u6700\u592720MB\uFF0C\u8FDC\u7AEF\u4E0E\u672C\u5730 SHA-256 \u4E00\u81F4\u540E\u5165\u5E93\uFF0C\u968F\u540E\u6267\u884C\u9759\u6001\u521D\u7B5B\u3002" })
                ] })
              ] })
            ] })
          ] }),
          tab === "evidence" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "rea-environment", children: [
              /* @__PURE__ */ jsx(StageIcon, { stage: "sample" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("strong", { children: "REA \xB7 Ghidra \u6DF1\u5EA6\u9759\u6001\u9006\u5411" }),
                /* @__PURE__ */ jsxs("p", { children: [
                  reaStatus?.ready ? "\u5F15\u64CE\u5DF2\u5C31\u7EEA \xB7 Linux / WSL2 \xB7 AI \u6309\u8BC1\u636E\u9009\u62E9\u51FD\u6570\u4E0E\u8C03\u7528\u5173\u7CFB" : "\u5C1A\u672A\u5B89\u88C5\u6216\u73AF\u5883\u672A\u5C31\u7EEA",
                  "\u3002PE / ELF \u4F7F\u7528\u9759\u6001\u53CD\u7F16\u8BD1\u3002"
                ] })
              ] }),
              !reaStatus?.ready && /* @__PURE__ */ jsx("button", { className: "primary", disabled: !!busy, onClick: () => void openOptional("rea_install"), children: "\u5B89\u88C5 REA" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "notice", children: "\u8BC1\u636E\u4E3A\u539F\u59CB\u54CD\u5E94\u6216\u5B9E\u9645\u91C7\u96C6\u5185\u5BB9\uFF0C\u4E0B\u8F7D\u524D\u6821\u9A8C SHA-256\u3002\u6837\u672C\u4EE5 .bin \u9644\u4EF6\u4E0B\u8F7D\uFF0C\u8BF7\u5728\u9694\u79BB\u73AF\u5883\u4E2D\u5904\u7406\u3002\u4E0A\u4F20\u5916\u90E8\u6C99\u7BB1\u524D\u786E\u8BA4\u6587\u4EF6\u53EF\u5BF9\u5916\u5171\u4EAB\u3002" }),
            /* @__PURE__ */ jsxs("div", { className: "evidence-browser", children: [
              /* @__PURE__ */ jsx("div", { className: "evidence-category-tabs", role: "group", "aria-label": "\u8BC1\u636E\u5206\u7C7B", children: [["all", "\u5168\u90E8\u8BC1\u636E"], ...evidenceCategories].map(([key, name]) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": evidenceFilter === key, onClick: () => setEvidenceFilter(key), children: [
                name,
                /* @__PURE__ */ jsx("span", { children: (detail.evidence || []).filter((e) => key === "all" || evidenceCategory(e) === key).length })
              ] }, key)) }),
              /* @__PURE__ */ jsxs("div", { className: "evidence-search", children: [
                /* @__PURE__ */ jsxs("label", { children: [
                  /* @__PURE__ */ jsx(Icon, { type: "file" }),
                  /* @__PURE__ */ jsx("input", { "aria-label": "\u641C\u7D22\u8BC1\u636E", value: evidenceQuery, onChange: (e) => setEvidenceQuery(e.target.value), placeholder: "\u641C\u7D22\u6587\u4EF6\u540D\u79F0\u3001\u8BC1\u636E\u7F16\u53F7\u6216 SHA-256" })
                ] }),
                evidenceQuery && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEvidenceQuery(""), children: "\u6E05\u7A7A" }),
                /* @__PURE__ */ jsxs("small", { children: [
                  "\u663E\u793A ",
                  evidenceItems.length,
                  " \u9879 / \u5171 ",
                  detail.evidence.length,
                  " \u9879"
                ] })
              ] })
            ] }),
            !evidenceItems.length && /* @__PURE__ */ jsxs("div", { className: "empty", children: [
              /* @__PURE__ */ jsx(Icon, { type: "file" }),
              /* @__PURE__ */ jsx("h3", { children: evidenceQuery ? "\u6CA1\u6709\u5339\u914D\u7684\u8BC1\u636E" : "\u6B64\u5206\u7C7B\u6682\u65E0\u8BC1\u636E" }),
              /* @__PURE__ */ jsx("p", { children: evidenceFilter === "samples" ? "\u5B8C\u6210\u6587\u4EF6\u53D6\u8BC1\u540E\uFF0C\u6837\u672C\u4F1A\u81EA\u52A8\u5F52\u5165\u8FD9\u91CC\u3002" : "\u8C03\u67E5\u8FC7\u7A0B\u4E2D\u4EA7\u751F\u7684\u8BC1\u636E\u4F1A\u6309\u7528\u9014\u81EA\u52A8\u5F52\u7C7B\u3002" }),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setEvidenceFilter("all");
                setEvidenceQuery("");
              }, children: "\u67E5\u770B\u5168\u90E8\u8BC1\u636E" })
            ] }),
            evidenceItems.map((e) => /* @__PURE__ */ jsxs("div", { className: "evidence", children: [
              /* @__PURE__ */ jsx(Icon, { type: "file" }),
              /* @__PURE__ */ jsxs("div", { className: "body", children: [
                /* @__PURE__ */ jsx("strong", { children: e.label }),
                /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "evidence-kind", children: evidenceKindNames[e.kind] || "\u8C03\u67E5\u8D44\u6599" }),
                  " \xB7 ",
                  (e.size / 1024).toFixed(1),
                  " KB \xB7 ",
                  new Date(e.created).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("code", { children: [
                  "SHA-256 ",
                  e.sha256
                ] }),
                e.kind === "sample" && /* @__PURE__ */ jsx(SampleReviewSummary, { review: detail.sample_analyses?.[e.id], disabled: !!busy || locked, onOpen: () => setSampleReview(e.id), onAnalyze: (force) => action("AI \u6837\u672C\u5206\u6790", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/analysis", { force })) }),
                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/evidence/" + e.id, children: "\u4E0B\u8F7D\u539F\u59CB\u8BC1\u636E" }) }),
                e.kind === "sample" && /* @__PURE__ */ jsxs("div", { className: "sample-review-result", children: [
                  /* @__PURE__ */ jsxs("div", { className: "sample-review-head", children: [
                    /* @__PURE__ */ jsx("strong", { children: "REA \u6DF1\u5EA6\u9006\u5411" }),
                    /* @__PURE__ */ jsx("span", { children: labels[reverseResults[e.id]?.status] || "\u5C1A\u672A\u5206\u6790" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { children: reverseResults[e.id]?.pseudocode_count ? `\u5B9E\u9645\u53D6\u5F97 ${reverseResults[e.id].pseudocode_count} \u4E2A\u51FD\u6570\u4F2A\u4EE3\u7801\uFF0C\u539F\u59CB\u5DE5\u5177\u7ED3\u679C\u5DF2\u5F52\u6863\u3002` : reverseResults[e.id]?.message || "\u652F\u6301 5 MB \u4EE5\u5185 PE / ELF\u3002\u53EA\u505A\u9759\u6001\u53CD\u7F16\u8BD1\uFF0C\u4E0D\u6267\u884C\u6837\u672C\u3002" }),
                  /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
                    /* @__PURE__ */ jsx("button", { disabled: !reaStatus?.ready || !!busy || locked || ["queued", "running"].includes(reverseResults[e.id]?.status), onClick: () => action("\u63D0\u4EA4 REA \u9006\u5411", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/reverse", {})), children: "REA \u6DF1\u5EA6\u9006\u5411" }),
                    reverseResults[e.id]?.markdown && /* @__PURE__ */ jsx("button", { onClick: () => setReverseReview(e.id), children: "\u67E5\u770B\u9006\u5411\u62A5\u544A" })
                  ] })
                ] }),
                e.kind === "sample" && /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
                  /* @__PURE__ */ jsx("button", { disabled: locked, onClick: () => action("\u67E5\u8BE2\u6C99\u7BB1\u62A5\u544A", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: false })), children: "\u5FAE\u6B65\u54C8\u5E0C\u67E5\u62A5\u544A" }),
                  /* @__PURE__ */ jsx("button", { disabled: locked, onClick: () => {
                    if (confirm("\u8FD9\u5C06\u628A\u8BE5\u8BC1\u636E\u6587\u4EF6\u4E0A\u4F20\u5230\u5FAE\u6B65\u4E91\u6C99\u7BB1\uFF08\u5916\u90E8\u670D\u52A1\uFF09\u3002\u786E\u8BA4\u5DF2\u83B7\u6587\u4EF6\u5916\u53D1\u6388\u6743\u5E76\u63A5\u53D7\u5BF9\u5E94\u6C99\u7BB1\u7684\u6570\u636E\u653F\u7B56\uFF1F")) action("\u63D0\u4EA4\u6C99\u7BB1", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: true, external_upload_confirmed: true }));
                  }, children: "\u63D0\u4EA4\u5FAE\u6B65\u6C99\u7BB1" }),
                  /* @__PURE__ */ jsx("button", { disabled: !!busy, onClick: () => {
                    setAnalysisProvider("virustotal");
                    setTab("sandbox");
                  }, children: "VirusTotal \u5206\u6790" })
                ] })
              ] })
            ] }, e.id))
          ] }),
          tab === "report" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            detail.report ? /* @__PURE__ */ jsxs("div", { className: "report-preview", children: [
              /* @__PURE__ */ jsx("div", { className: "report-preview-icon", children: /* @__PURE__ */ jsx(StageIcon, { stage: "report" }) }),
              /* @__PURE__ */ jsxs("div", { className: "report-preview-copy", children: [
                /* @__PURE__ */ jsx("h3", { children: "\u5E94\u6025\u54CD\u5E94\u8C03\u67E5\u62A5\u544A" }),
                /* @__PURE__ */ jsx("p", { children: "\u67E5\u770B\u4E8B\u4EF6\u5224\u5B9A\u3001\u5173\u8054\u7EBF\u7D22\u4E0E\u5904\u7F6E\u5EFA\u8BAE" }),
                /* @__PURE__ */ jsxs("small", { children: [
                  detail.evidence.length,
                  " \u9879\u8BC1\u636E \xB7 ",
                  detail.events.length,
                  " \u6761\u8C03\u67E5\u8BB0\u5F55"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "primary", onClick: () => setReportOpen(true), children: [
                "\u67E5\u770B\u62A5\u544A\u8BE6\u60C5 ",
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" })
              ] })
            ] }) : /* @__PURE__ */ jsx("div", { className: "report-empty", children: "\u62A5\u544A\u5C1A\u672A\u751F\u6210\uFF0C\u5B8C\u6210\u8C03\u67E5\u540E\u4F1A\u81EA\u52A8\u6C47\u603B\u3002" }),
            /* @__PURE__ */ jsxs("div", { className: "tools", children: [
              /* @__PURE__ */ jsx("button", { disabled: !!busy || locked, onClick: () => action("\u66F4\u65B0\u5173\u8054\u62A5\u544A", () => req("/cases/" + detail.id + "/report", {})), children: "\u6309\u6700\u65B0\u8BC1\u636E\u751F\u6210\u62A5\u544A" }),
              detail.report && /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/report.md", download: true, children: "\u4E0B\u8F7D Markdown" })
            ] })
          ] })
        ] })
      ] }) })
    ] }),
    sourceOpen && detail && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => !busy && setSourceOpen(false), children: /* @__PURE__ */ jsxs("form", { className: "dialog status-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u660E\u786E\u4E8B\u4EF6\u6765\u6E90\u8BBE\u5907", onClick: (e) => e.stopPropagation(), onSubmit: (e) => {
      e.preventDefault();
      action("\u7ED1\u5B9A\u6765\u6E90\u8BBE\u5907", async () => {
        await req("/cases/" + detail.id + "/source", { device_id: sourceDeviceId, expected_device_id: caseSource(detail)?.id || "", note: sourceNote });
        setSourceOpen(false);
      });
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "\u660E\u786E\u6765\u6E90\u8BBE\u5907" }),
          /* @__PURE__ */ jsx("p", { children: "\u7ED1\u5B9A\u5B9E\u9645\u4EA7\u751F\u672C\u4E8B\u4EF6\u544A\u8B66\u6216\u65E5\u5FD7\u7684\u8BBE\u5907" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6765\u6E90\u7A97\u53E3", onClick: () => setSourceOpen(false), children: "\xD7" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        "\u6765\u6E90\u8BBE\u5907",
        /* @__PURE__ */ jsx(DeviceSourcePicker, { devices: settings.devices || [], value: sourceDeviceId, onChange: setSourceDeviceId, label: "\u4E8B\u4EF6\u6765\u6E90\u8BBE\u5907" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "notice", children: "\u6765\u6E90\u4E0E\u67E5\u8BE2\u76EE\u6807\u4F1A\u4FDD\u5B58\u5728\u4E8B\u4EF6\u4E2D\u3002\u672A\u9002\u914D\u7684\u8BBE\u5907\u4F1A\u660E\u786E\u63D0\u793A\uFF0C\u4E0D\u4F1A\u56DE\u9000\u67E5\u8BE2 TDP \u6216\u5176\u4ED6\u8BBE\u5907\u3002\u5386\u53F2\u67E5\u8BE2\u8BC1\u636E\u4FDD\u7559\u539F\u8BBE\u5907\u6807\u8BC6\u3002" }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        "\u6765\u6E90\u786E\u8BA4\u4F9D\u636E",
        /* @__PURE__ */ jsx("textarea", { required: true, minLength: 3, maxLength: 2e3, rows: 4, "aria-label": "\u6765\u6E90\u786E\u8BA4\u4F9D\u636E", value: sourceNote, onChange: (e) => setSourceNote(e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u4ECE\u8BE5\u8BBE\u5907\u7684\u544A\u8B66\u8BE6\u60C5\u521B\u5EFA\uFF0C\u6838\u5BF9\u4E86\u4E8B\u4EF6\u65F6\u95F4\u4E0E\u76EE\u6807IP" })
      ] }),
      error && /* @__PURE__ */ jsx("div", { role: "alert", className: "error", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "form-footer", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSourceOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: locked || !sourceDeviceId || sourceNote.trim().length < 3, children: "\u4FDD\u5B58\u6765\u6E90\u8BBE\u5907" })
      ] })
    ] }) }),
    statusOpen && detail && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => !busy && setStatusOpen(false), children: /* @__PURE__ */ jsxs("form", { className: "dialog status-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u66F4\u65B0\u4E8B\u4EF6\u72B6\u6001", onClick: (e) => e.stopPropagation(), onSubmit: (e) => {
      e.preventDefault();
      action("\u66F4\u65B0\u4E8B\u4EF6\u72B6\u6001", async () => {
        await req("/cases/" + detail.id + "/status", { action: statusAction, expected_status: detail.status, note: statusNote });
        setStatusOpen(false);
      });
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "\u66F4\u65B0\u4E8B\u4EF6\u72B6\u6001" }),
          /* @__PURE__ */ jsx("p", { children: detail.title })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u72B6\u6001\u7A97\u53E3", onClick: () => setStatusOpen(false), children: "\xD7" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "status-current", children: [
        "\u5F53\u524D\u72B6\u6001 ",
        /* @__PURE__ */ jsx("strong", { children: labels[detail.status] || detail.status }),
        /* @__PURE__ */ jsx("span", { children: "\u2192" }),
        /* @__PURE__ */ jsx("strong", { children: labels[selectedStatusAction?.target] || "\u8BF7\u9009\u62E9\u64CD\u4F5C" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        "\u64CD\u4F5C",
        /* @__PURE__ */ jsx("select", { value: statusAction, onChange: (e) => setStatusAction(e.target.value), children: (detail.status_actions || []).map((a) => /* @__PURE__ */ jsx("option", { value: a.action, children: a.label }, a.action)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "notice", children: [
        selectedStatusAction?.description,
        selectedStatusAction?.needs_report && !detail.report && /* @__PURE__ */ jsx("p", { className: "status-report-needed", children: "\u5C1A\u672A\u751F\u6210\u54CD\u5E94\u62A5\u544A\uFF0C\u8BF7\u5148\u5230\u201C\u54CD\u5E94\u62A5\u544A\u201D\u6309\u6700\u65B0\u8BC1\u636E\u751F\u6210\u3002" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        "\u5904\u7406\u8BF4\u660E",
        /* @__PURE__ */ jsx("textarea", { "aria-label": "\u72B6\u6001\u5904\u7406\u8BF4\u660E", required: true, minLength: 3, maxLength: 2e3, rows: 4, value: statusNote, onChange: (e) => setStatusNote(e.target.value), placeholder: "\u8BB0\u5F55\u8C03\u67E5\u5B89\u6392\u3001\u590D\u6838\u7ED3\u8BBA\u3001\u9000\u56DE\u539F\u56E0\u6216\u91CD\u65B0\u6253\u5F00\u7684\u4F9D\u636E" })
      ] }),
      error && /* @__PURE__ */ jsx("div", { role: "alert", className: "error", children: error }),
      /* @__PURE__ */ jsx("p", { className: "note", children: "\u72B6\u6001\u53D8\u66F4\u5C06\u8BB0\u5F55\u64CD\u4F5C\u4EBA\u3001\u65F6\u95F4\u548C\u5904\u7406\u8BF4\u660E\u3002\u5F00\u59CB\u8C03\u67E5\u4E0D\u4F1A\u81EA\u52A8\u6267\u884C\u8FDC\u7A0B\u547D\u4EE4\u3002" }),
      /* @__PURE__ */ jsxs("div", { className: "form-footer", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setStatusOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: !!busy || detail.processing || !selectedStatusAction?.enabled || statusNote.trim().length < 3, children: selectedStatusAction?.label || "\u786E\u8BA4\u66F4\u65B0" })
      ] })
    ] }) }),
    deleteOpen && detail && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => !busy && setDeleteOpen(false), children: /* @__PURE__ */ jsxs("section", { className: "dialog confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u5E94\u6025\u4E8B\u4EF6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("h2", { children: "\u5220\u9664\u5E94\u6025\u4E8B\u4EF6" }),
      /* @__PURE__ */ jsx("p", { children: detail.title }),
      /* @__PURE__ */ jsx("div", { className: "notice", children: "\u5220\u9664\u540E\uFF0C\u4E8B\u4EF6\u5C06\u4ECE\u5DE5\u4F5C\u53F0\u79FB\u9664\u3002\u539F\u59CB\u8BC1\u636E\u548C\u5220\u9664\u8BB0\u5F55\u4FDD\u7559\u5728\u540E\u53F0\u3002\u6B63\u5728\u5904\u7406\u7684\u4E8B\u4EF6\u65E0\u6CD5\u5220\u9664\u3002" }),
      /* @__PURE__ */ jsxs("div", { className: "form-footer", children: [
        /* @__PURE__ */ jsx("button", { disabled: !!busy, onClick: () => setDeleteOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ jsx("button", { className: "danger", disabled: !!busy, onClick: () => void removeEvent(), children: busy ? "\u6B63\u5728\u5220\u9664\u2026" : "\u786E\u8BA4\u5220\u9664" })
      ] })
    ] }) }),
    reverseReview && reverseResults[reverseReview]?.markdown && detail && /* @__PURE__ */ jsx(IncidentReportDialog, { detail: { ...detail, title: detail.evidence.find((e) => e.id === reverseReview)?.label || "\u6837\u672C\u9006\u5411", report: reverseResults[reverseReview].markdown }, heading: "REA \u9006\u5411\u5206\u6790\u8BE6\u60C5", downloadUrl: BASE + "/cases/" + detail.id + "/evidence/" + reverseReview + "/reverse.md", onClose: () => setReverseReview("") }),
    externalReport && detail && /* @__PURE__ */ jsx(IncidentReportDialog, { detail: externalReport, heading: "\u5916\u90E8\u6837\u672C\u5206\u6790\u8BE6\u60C5", downloadUrl: BASE + "/cases/" + detail.id + "/evidence/" + externalReport.id, onClose: () => setExternalReport(null) }),
    reportOpen && detail && /* @__PURE__ */ jsx(IncidentReportDialog, { detail, onClose: () => setReportOpen(false) }),
    sampleReview && detail?.sample_analyses?.[sampleReview]?.status === "completed" && /* @__PURE__ */ jsx(IncidentReportDialog, { detail: { ...detail, title: detail.evidence.find((e) => e.id === sampleReview)?.label || "\u6837\u672C\u5206\u6790", report: detail.sample_analyses[sampleReview].markdown }, heading: "\u6837\u672C\u5206\u6790\u8BE6\u60C5", downloadUrl: BASE + "/cases/" + detail.id + "/evidence/" + sampleReview + "/analysis.md", onClose: () => setSampleReview("") }),
    eventModal && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => !busy && setEventModal(false), children: /* @__PURE__ */ jsxs("form", { className: "dialog scene-ai-modal", onClick: (e) => e.stopPropagation(), onSubmit: (e) => {
      e.preventDefault();
      void saveEvent();
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "\u65B0\u589E\u5E94\u6025\u54CD\u5E94\u4E8B\u4EF6" }),
          /* @__PURE__ */ jsx("p", { children: "\u4E0E Atlas \u6574\u7406\u7EBF\u7D22\uFF0C\u6216\u624B\u5DE5\u767B\u8BB0\u4E8B\u4EF6" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589E\u4E8B\u4EF6", onClick: () => setEventModal(false), children: "\xD7" })
      ] }),
      /* @__PURE__ */ jsx("div", { id: "ir-event-ai" }),
      /* @__PURE__ */ jsxs("div", { id: "ir-event-fields", children: [
        error && /* @__PURE__ */ jsx("div", { className: "error", role: "alert", children: error }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u4E8B\u4EF6\u540D\u79F0",
          /* @__PURE__ */ jsx("input", { required: true, minLength: 3, maxLength: 160, value: newEvent.title, onChange: (e) => setNewEvent({ ...newEvent, title: e.target.value }), placeholder: "\u4F8B\u5982\uFF1A\u4E1A\u52A1\u670D\u52A1\u5668\u7591\u4F3C\u5F02\u5E38\u767B\u5F55" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid", children: [
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u76EE\u6807 IP",
            /* @__PURE__ */ jsx("input", { required: true, value: newEvent.target, onChange: (e) => setNewEvent({ ...newEvent, target: e.target.value }), placeholder: "\u53D7\u5F71\u54CD\u4E3B\u673A\u7684 IP" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u6765\u6E90 IP\uFF08\u9009\u586B\uFF09",
            /* @__PURE__ */ jsx("input", { value: newEvent.source, onChange: (e) => setNewEvent({ ...newEvent, source: e.target.value }), placeholder: "\u672A\u77E5\u65F6\u53EF\u7559\u7A7A" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u6765\u6E90\u8BBE\u5907 / \u6001\u52BF\u611F\u77E5\u5E73\u53F0 *",
          /* @__PURE__ */ jsx(DeviceSourcePicker, { devices: settings.devices || [], value: newEvent.source_device_id, onChange: (value) => setNewEvent({ ...newEvent, source_device_id: value }), label: "\u65B0\u4E8B\u4EF6\u6765\u6E90\u8BBE\u5907" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "note", children: "\u624B\u5DE5\u4E8B\u4EF6\u9700\u8981\u660E\u786E\u6765\u6E90\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u9009\u7528\u9ED8\u8BA4\u8BBE\u5907\u3002\u6807\u6CE8\u201C\u65E5\u5FD7\u9002\u914D\u5F85\u5B8C\u6210\u201D\u7684\u8BBE\u5907\u53EF\u767B\u8BB0\u6765\u6E90\uFF0C\u5F53\u524D\u4E0D\u80FD\u81EA\u52A8\u5173\u8054\u5176\u65E5\u5FD7\u3002" }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u4E8B\u4EF6\u53D1\u751F\u65F6\u95F4",
          /* @__PURE__ */ jsx("input", { type: "datetime-local", required: true, value: newEvent.occurred_at, onChange: (e) => setNewEvent({ ...newEvent, occurred_at: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u4E8B\u4EF6\u63CF\u8FF0\u4E0E\u5DF2\u77E5\u7EBF\u7D22",
          /* @__PURE__ */ jsx("textarea", { required: true, minLength: 3, maxLength: 12e3, rows: 5, value: newEvent.description, onChange: (e) => setNewEvent({ ...newEvent, description: e.target.value }), placeholder: "\u8BB0\u5F55\u53D1\u73B0\u65B9\u5F0F\u3001\u5F02\u5E38\u73B0\u8C61\u3001\u53D7\u5F71\u54CD\u8303\u56F4\u53CA\u5DF2\u6709\u8BC1\u636E" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "check-line", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: newEvent.start_investigation, onChange: (e) => setNewEvent({ ...newEvent, start_investigation: e.target.checked }) }),
          "\u521B\u5EFA\u540E\u81EA\u52A8\u67E5\u8BE2\u5173\u8054\u8BBE\u5907\u65E5\u5FD7\u5E76\u751F\u6210\u62A5\u544A"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "notice", children: "\u6309\u4E8B\u4EF6\u65F6\u95F4\u548C\u5DF2\u77E5 IP \u67E5\u8BE2\u8BBE\u5907\u65E5\u5FD7\uFF1B\u8FDC\u7A0B\u4E0A\u673A\u3001\u6587\u4EF6\u53D6\u8BC1\u548C\u5916\u90E8\u6C99\u7BB1\u4E0A\u4F20\u6309\u4E8B\u4EF6\u53E6\u884C\u64CD\u4F5C\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "form-footer", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEventModal(false), children: "\u53D6\u6D88" }),
          /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: !!busy, children: busy ? "\u6B63\u5728\u521B\u5EFA\u2026" : "\u521B\u5EFA\u4E8B\u4EF6" })
        ] })
      ] })
    ] }) }),
    modal && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => setModal(false), children: /* @__PURE__ */ jsxs("form", { className: "dialog scene-ai-modal", onClick: (e) => e.stopPropagation(), onSubmit: (e) => {
      e.preventDefault();
      action("\u767B\u8BB0\u4E3B\u673A", async () => {
        await req("/hosts", host);
        setHost({ ...host, password: "" });
        setModal(false);
      });
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "\u767B\u8BB0\u8C03\u67E5\u4E3B\u673A" }),
          /* @__PURE__ */ jsx("p", { children: "\u586B\u5199\u8BE6\u60C5\uFF0C\u6216\u4E0E Atlas \u534F\u4F5C\u5B8C\u6210\u914D\u7F6E" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModal(false), children: "\xD7" })
      ] }),
      /* @__PURE__ */ jsx("div", { id: "ir-ai-workbench" }),
      /* @__PURE__ */ jsxs("div", { id: "ir-host-fields", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid", children: [
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u4E3B\u673A\u540D\u79F0",
            /* @__PURE__ */ jsx("input", { required: true, value: host.name, onChange: (e) => setHost({ ...host, name: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u76EE\u6807 IP",
            /* @__PURE__ */ jsx("input", { required: true, value: host.address, onChange: (e) => setHost({ ...host, address: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid", children: [
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u8FDE\u63A5\u65B9\u5F0F",
            /* @__PURE__ */ jsxs("select", { value: host.protocol, onChange: (e) => setHost({ ...host, protocol: e.target.value, port: e.target.value === "ssh" ? 22 : 5986 }), children: [
              /* @__PURE__ */ jsx("option", { value: "ssh", children: "Linux SSH" }),
              /* @__PURE__ */ jsx("option", { value: "winrm", children: "Windows WinRM HTTPS" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "field", children: [
            "\u7AEF\u53E3",
            /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "65535", required: true, value: host.port, onChange: (e) => setHost({ ...host, port: Number(e.target.value) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u8C03\u67E5\u8D26\u53F7",
          /* @__PURE__ */ jsx("input", { required: true, value: host.username, onChange: (e) => setHost({ ...host, username: e.target.value }), autoComplete: "off" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u767B\u5F55\u5BC6\u7801",
          /* @__PURE__ */ jsx("input", { type: "password", required: true, value: host.password, onChange: (e) => setHost({ ...host, password: e.target.value }), autoComplete: "new-password" })
        ] }),
        host.protocol === "ssh" ? /* @__PURE__ */ jsxs("label", { className: "field", children: [
          "\u53EF\u4FE1 OpenSSH \u4E3B\u673A\u516C\u94A5",
          /* @__PURE__ */ jsx("textarea", { required: true, rows: 3, value: host.host_key, onChange: (e) => setHost({ ...host, host_key: e.target.value }), placeholder: "ssh-ed25519 AAAA\u2026\uFF08\u4ECE\u670D\u52A1\u5668\u7BA1\u7406\u5458\u53D6\u5F97\uFF0C\u4E0D\u662F\u767B\u5F55\u79C1\u94A5\uFF09" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "notice", children: "WinRM \u4F7F\u7528 5986 / HTTPS\u3001NTLM \u8BA4\u8BC1\uFF0C\u670D\u52A1\u5668\u8BC1\u4E66\u9700\u8981\u6709\u6548\u5E76\u88AB\u5E73\u53F0\u4FE1\u4EFB\uFF1B\u8BC1\u4E66\u5FC5\u987B\u8986\u76D6\u76EE\u6807 IP\u3002" }),
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: !!busy, children: "\u4FDD\u5B58\u4E3B\u673A" }),
        /* @__PURE__ */ jsx("p", { className: "note", children: "\u51ED\u636E\u7531\u5E73\u53F0 Secret Manager \u7BA1\u7406\uFF1B\u4E0D\u4F1A\u8FD4\u56DE\u5230\u9875\u9762\u3002" })
      ] })
    ] }) })
  ] });
}
export {
  IncidentPage as default
};
