// ../../../../../../projects/aegisops/aegisops/contracts/webui/shims/react.js
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

// ../../../../../../projects/aegisops/aegisops/contracts/webui/shims/jsx-runtime.js
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
var labels = { new: "\u5F85\u542F\u52A8", queued: "\u5F85\u8C03\u67E5", running: "\u8C03\u67E5\u4E2D", review: "\u5F85\u590D\u6838", failed: "\u6267\u884C\u5931\u8D25", interrupted: "\u5DF2\u4E2D\u65AD", completed: "\u5B8C\u6210", blocked: "\u5F85\u914D\u7F6E", partial: "\u90E8\u5206\u5B8C\u6210", submitted: "\u5DF2\u63D0\u4EA4" };
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
var attackThemes = [
  { id: "ransomware", label: "\u52D2\u7D22\u653B\u51FB", accent: "#ad567d", soft: "#fbeef4", pattern: /勒索|ransomware/i },
  { id: "malware", label: "\u6076\u610F\u7A0B\u5E8F", accent: "#8c68b6", soft: "#f4effb", pattern: /木马|恶意文件|恶意程序|挖矿|webshell|malware|trojan|miner|backdoor|后门/i },
  { id: "exploit", label: "\u6F0F\u6D1E\u5229\u7528", accent: "#b97542", soft: "#fcf3e9", pattern: /漏洞利用|代码执行|命令执行|反序列化|注入|exploit|\brce\b|\bsqli?\b|\bxss\b|cve-/i },
  { id: "credential", label: "\u8EAB\u4EFD\u653B\u51FB", accent: "#a88737", soft: "#fbf6e6", pattern: /爆破|暴力破解|口令|凭据|撞库|brute.?force|credential|password/i },
  { id: "lateral", label: "\u6A2A\u5411\u79FB\u52A8", accent: "#537bbb", soft: "#eef4fd", pattern: /横向|远程执行|lateral|psexec|pass.the.hash/i },
  { id: "exfiltration", label: "\u6570\u636E\u5916\u4F20", accent: "#b56d63", soft: "#fcf0ed", pattern: /外传|数据泄露|窃取|exfiltration|data.?leak/i },
  { id: "phishing", label: "\u9493\u9C7C\u653B\u51FB", accent: "#9c718e", soft: "#f8eff6", pattern: /钓鱼|phishing/i },
  { id: "c2", label: "\u5916\u8054\u901A\u4FE1", accent: "#5b9292", soft: "#edf7f6", pattern: /外联|命令控制|c2|command.and.control|beacon/i },
  { id: "recon", label: "\u626B\u63CF\u63A2\u6D4B", accent: "#558fa9", soft: "#edf6fa", pattern: /探测|探测|扫描|侦察|scan|recon/i },
  { id: "other", label: "\u5176\u4ED6\u4E8B\u4EF6", accent: "#748a63", soft: "#f2f6ec", pattern: /$^/ }
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
var stageColors = [["#16a34a", "#ecfdf1"], ["#089ace", "#ecf9ff"], ["#2563eb", "#eef4ff"], ["#d58a00", "#fffae8"], ["#7c3aed", "#f5efff"], ["#00a18a", "#ebfcf7"]];
function IncidentPage() {
  const [cases, setCases] = useState([]), [selected, setSelected] = useState(new URLSearchParams(location.search).get("case") || ""), [detail, setDetail] = useState(null), [tab, setTab] = useState("overview"), [settings, setSettings] = useState({ hosts: [] }), [error, setError] = useState(""), [busy, setBusy] = useState(""), [query, setQuery] = useState(""), [modal, setModal] = useState(false), [remote, setRemote] = useState(""), [path, setPath] = useState("");
  const [eventModal, setEventModal] = useState(false), [deleteOpen, setDeleteOpen] = useState(false);
  const initialEvent = () => ({ title: "", source: "", target: "", description: "", occurred_at: new Date(Date.now() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 16), start_investigation: true });
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
      if (id) setDetail(await req("/cases/" + id));
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
  function choose(id) {
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
  async function saveEvent() {
    await action("\u521B\u5EFA\u4E8B\u4EF6", async () => {
      const result = await req("/cases", { title: newEvent.title, source: newEvent.source, target: newEvent.target, description: newEvent.description, first_time: Math.floor(new Date(newEvent.occurred_at).getTime() / 1e3), start_investigation: newEvent.start_investigation });
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
  const shown = cases.filter((c) => (c.title + c.target + c.source).toLowerCase().includes(query.toLowerCase()));
  const matching = settings.hosts.filter((h) => h.address === detail?.target);
  const stages = [["intake", "\u4E8B\u4EF6\u786E\u8BA4"], ["logs", "\u8BBE\u5907\u5173\u8054"], ["host", "\u4E3B\u673A\u6392\u67E5"], ["sample", "\u6837\u672C\u53D6\u8BC1"], ["sandbox", "\u6C99\u7BB1\u5206\u6790"], ["report", "\u62A5\u544A\u590D\u6838"]];
  return /* @__PURE__ */ jsxs("div", { className: "ir", children: [
    /* @__PURE__ */ jsx("style", { children: `

 .ir{--green:#a2c67b;--green-hover:#b1d28e;--green-ink:#496b35;--soft:#f0f6e9;--ink:#26382c;--dim:#839080;--line:#e2e8df;color:var(--ink);background:radial-gradient(ellipse at 4% 0,#eaf5df80,transparent 42%),#f6f8f5;min-height:100dvh;padding:32px;font:14px/1.75 system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif}
 .ir *{box-sizing:border-box}.ir button,.ir input,.ir select,.ir textarea{font-family:inherit;font-size:13px;line-height:1.6}.ir button,.ir a{transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}
 .ir button{cursor:pointer;min-height:40px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:9px 16px;color:#586b4f;font-weight:500}.ir button:hover{background:#f2f7ed;border-color:#c8d9b9;transform:translateY(-1px)}.ir button:disabled{opacity:.45;cursor:not-allowed;transform:none}.ir button:focus-visible,.ir a:focus-visible{outline:2px solid #9cba74;outline-offset:3px}
 .ir .danger{color:#b47d6b;background:#fff9f5;border-color:#eedfd5}.ir .danger:hover{background:#fcf0e8;border-color:#dfbfae}.ir .confirm-dialog{width:min(520px,94vw)}.ir .check-line{display:flex;align-items:center;gap:10px;color:#7b8c6c;font-size:12px;margin:20px 0}.ir .check-line input{width:16px;height:16px;min-height:0;accent-color:#a2c67b}.ir .form-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.ir .dialog h2{font-size:20px}
 .ir .primary{background:var(--green);color:#24371d;border-color:transparent;box-shadow:0 3px 10px #536f3310}.ir .primary:hover{background:var(--green-hover);border-color:transparent}
 .ir h1{font-size:28px;letter-spacing:-.6px;font-weight:650;margin:0;line-height:1.45}.ir h2{font-size:20px;font-weight:600;margin:0;line-height:1.55}.ir h3{font-size:17px;font-weight:600;margin:0 0 13px}.ir p{color:var(--dim);margin:8px 0;line-height:1.8}
 .ir .head{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-bottom:28px}.ir .overline{letter-spacing:2.5px;color:#92a282;font-size:10px;margin-bottom:8px}.ir .tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ir .tools button{display:inline-flex;align-items:center;justify-content:center;gap:8px}
 .ir .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-bottom:26px}.ir .stat,.ir .panel{background:#fff;border:1px solid var(--line);border-radius:21px;box-shadow:0 4px 18px #20321a03}.ir .stat{padding:25px 27px;min-height:155px;position:relative;overflow:hidden}.ir .stat:first-child{background:radial-gradient(ellipse at 0 0,#e9f5db,transparent 85%),#fff}.ir .stat b{font-size:39px;font-weight:600;letter-spacing:-1px;display:block;margin-top:13px;line-height:1.2}.ir .stat span{color:#809076;font-size:13px}.ir .stat:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;right:26px;top:30px;background:#c4d7b2}
 .ir .layout{display:grid;grid-template-columns:310px minmax(0,1fr);gap:0;align-items:stretch;height:clamp(590px,calc(100dvh - 345px),1000px);overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 4px 20px #20321a03}.ir .list{padding:20px 18px;border:0;border-right:1px solid #e5ebdf;border-radius:0;background:#fafcf8;box-shadow:none;min-height:0;max-height:none;overflow:hidden;display:flex;flex-direction:column}.ir .list-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px}.ir .list-heading h3{font-size:14px;margin:0;color:#61764f}.ir .list-heading span{font-size:11px;color:#9baa8d}.ir .list-search{padding-bottom:13px}.ir .case-scroll{overflow:auto;min-height:0;flex:1;scrollbar-width:thin;scrollbar-color:#d5dfcb transparent}.ir .case{width:100%;display:block;text-align:left;min-height:108px;padding:16px 14px;margin:0 0 9px;border-radius:12px;background:transparent}.ir .case.active{box-shadow:none}.ir .case small{font-size:10px}.ir .case .addr{font-size:11px}.ir .case strong{font-size:13px}
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
 @media(max-width:850px){.ir .layout{grid-template-columns:1fr;height:auto;max-height:none}.ir .list{max-height:260px;min-height:180px;border-right:0;border-bottom:1px solid #e5ebdf}.ir .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ir .head{flex-wrap:wrap}.ir .detail{min-height:540px;max-height:850px}.ir .case{min-height:100px}.ir .investigation-body{max-height:480px}.ir .tabs{gap:19px}.ir .steps{grid-template-columns:repeat(6,minmax(0,1fr))}}
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
 .ir .export-report:focus-visible{outline:2px solid #92b36e;outline-offset:3px}
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

 ` }),
    /* @__PURE__ */ jsxs("div", { className: "head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "overline", children: "INCIDENT RESPONSE / EVIDENCE INTO ACTION" }),
        /* @__PURE__ */ jsx("h1", { children: "\u5E94\u6025\u54CD\u5E94\u5DE5\u4F5C\u53F0" }),
        /* @__PURE__ */ jsx("p", { children: "\u4ECE\u786E\u8BA4\u544A\u8B66\u5230\u8BC1\u636E\u94FE\uFF0C\u8BA9\u6BCF\u4E00\u6B65\u8C03\u67E5\u90FD\u6709\u4F9D\u636E\u3002" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "tools", children: [
        /* @__PURE__ */ jsx("span", { className: "badge", children: "\u5DE5\u4F5C\u6D41 + AI \u5206\u6790" }),
        /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => {
          setNewEvent(initialEvent());
          setEventModal(true);
        }, children: "\uFF0B \u65B0\u589E\u4E8B\u4EF6" }),
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
    /* @__PURE__ */ jsx("div", { className: "stats", children: [["\u54CD\u5E94\u4E8B\u4EF6", cases.length], ["\u8C03\u67E5\u8FDB\u884C\u4E2D", cases.filter((c) => c.status === "running").length], ["\u7B49\u5F85\u590D\u6838", cases.filter((c) => c.status === "review").length], ["\u767B\u8BB0\u4E3B\u673A", settings.hosts.length]].map(([label, value]) => /* @__PURE__ */ jsxs("div", { className: "stat", children: [
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
        /* @__PURE__ */ jsx("div", { className: "list-search", children: /* @__PURE__ */ jsx("input", { placeholder: "\u641C\u7D22\u4E8B\u4EF6\u3001\u6765\u6E90\u6216\u76EE\u6807 IP", value: query, onChange: (e) => setQuery(e.target.value) }) }),
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
          /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => setModal(true), children: "\uFF0B \u767B\u8BB0\u4E3B\u673A" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "notice", children: "\u5F53\u524D\u7248\u672C\u4EC5\u7CFB\u7EDF\u7BA1\u7406\u5458\u53EF\u8BBF\u95EE\u5E94\u6025\u4E8B\u4EF6\u4E0E\u8BC1\u636E\u3002SSH \u6821\u9A8C\u4E3B\u673A\u516C\u94A5\uFF1BWindows WinRM \u4F7F\u7528 HTTPS \u548C\u53EF\u4FE1\u8BC1\u4E66\u3002\u4E3B\u673A\u5FC5\u987B\u4E0E\u4E8B\u4EF6\u76EE\u6807 IP \u4E00\u81F4\u3002" }),
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
        /* @__PURE__ */ jsx("a", { href: "https://s.threatbook.com/", target: "_blank", rel: "noreferrer", children: "\u6253\u5F00\u5FAE\u6B65\u4E91\u6C99\u7BB1 \u2197" })
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
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "tools", children: [
              /* @__PURE__ */ jsxs("a", { className: "export-report", href: BASE + "/cases/" + detail.id + "/report.md", download: true, children: [
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" }) }),
                "\u5BFC\u51FA\u62A5\u544A"
              ] }),
              /* @__PURE__ */ jsx("button", { className: "danger", disabled: !!busy || detail.status === "running", onClick: () => setDeleteOpen(true), children: "\u5220\u9664\u4E8B\u4EF6" })
            ] })
          ] }),
          JSON.parse(detail.alert || "{}")._demo && /* @__PURE__ */ jsx("div", { className: "notice case-context", children: "\u6F14\u793A\u4E8B\u4EF6 \xB7 \u4EC5\u9884\u89C8\u6D41\u7A0B\uFF0C\u4E0D\u67E5\u8BE2\u771F\u5B9E\u8BBE\u5907\u3001\u4E0D\u4E0A\u673A\u3001\u4E0D\u4E0A\u4F20\u6837\u672C\u3002" }),
          /* @__PURE__ */ jsx("div", { className: "steps", children: stages.map(([key, name], i) => {
            const logs = detail.events.filter((e) => e.stage === key);
            const last = logs[logs.length - 1];
            return /* @__PURE__ */ jsxs("div", { "data-stage": key, style: { "--stage-accent": stageColors[i][0], "--stage-soft": stageColors[i][1] }, title: name + " \xB7 " + (labels[last?.status] || "\u5F85\u6267\u884C"), className: "step " + (last?.status === "completed" ? "done" : last?.status === "blocked" || last?.status === "partial" ? "warn" : ""), children: [
              /* @__PURE__ */ jsxs("i", { children: [
                /* @__PURE__ */ jsx(StageIcon, { stage: key }),
                last?.status === "completed" && /* @__PURE__ */ jsx("span", { className: "stage-completed", role: "img", "aria-label": "\u5DF2\u5B8C\u6210", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m2.5 6 2.3 2.3L9.5 3.5" }) }) })
              ] }),
              name,
              (last?.status === "blocked" || last?.status === "partial") && /* @__PURE__ */ jsx("span", { className: "step-status", children: labels[last.status] })
            ] }, key);
          }) }),
          /* @__PURE__ */ jsx("div", { className: "tabs", children: [["overview", "\u8C03\u67E5\u65F6\u95F4\u7EBF"], ["host", "\u8FDC\u7A0B\u6392\u67E5"], ["evidence", "\u8BC1\u636E\u4E0E\u6837\u672C"], ["report", "\u54CD\u5E94\u62A5\u544A"]].map(([key, label]) => /* @__PURE__ */ jsx("button", { className: tab === key ? "active" : "", onClick: () => setTab(key), children: label }, key)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "investigation-body", children: [
          busy && /* @__PURE__ */ jsxs("p", { className: "busy", role: "status", children: [
            busy,
            "\uFF0C\u8BF7\u7A0D\u5019\u2026"
          ] }),
          tab === "overview" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "timeline-head", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { children: "\u8C03\u67E5\u52A8\u6001" }),
                /* @__PURE__ */ jsxs("p", { children: [
                  detail.events.length,
                  " \u6761\u8BB0\u5F55 \xB7 \u91C7\u96C6\u7ED3\u679C\u4E0E\u64CD\u4F5C\u8FC7\u7A0B"
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { disabled: !!busy || detail.status === "running", onClick: () => action("\u91CD\u65B0\u5173\u8054\u65E5\u5FD7", () => req("/cases/" + detail.id + "/run", {})), children: "\u91CD\u65B0\u5173\u8054\u65E5\u5FD7" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "timeline", children: detail.events.slice().reverse().map((e) => /* @__PURE__ */ jsxs("div", { className: "event", children: [
              /* @__PURE__ */ jsx("time", { children: new Date(e.at).toLocaleString() }),
              /* @__PURE__ */ jsx("b", { children: labels[e.status] || e.status }),
              /* @__PURE__ */ jsx("p", { children: e.message })
            ] }, e.id)) })
          ] }),
          tab === "host" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsx("h3", { children: "\u57FA\u4E8E\u4E8B\u4EF6\u7684\u53EA\u8BFB\u6392\u67E5" }),
            /* @__PURE__ */ jsx("p", { children: "\u56FA\u5B9A\u91C7\u96C6\u8FDB\u7A0B\u3001\u8FDE\u63A5\u3001\u767B\u5F55\u3001\u6301\u4E45\u5316\u4E0E\u8FD1\u671F\u6587\u4EF6\uFF1BWeb \u653B\u51FB\u4E8B\u4EF6\u589E\u52A0 Web \u65E5\u5FD7\u91C7\u96C6\u3002" }),
            /* @__PURE__ */ jsxs("label", { className: "field", children: [
              "\u4E8B\u4EF6\u76EE\u6807\u4E3B\u673A",
              /* @__PURE__ */ jsxs("select", { value: remote, onChange: (e) => setRemote(e.target.value), children: [
                /* @__PURE__ */ jsxs("option", { value: "", children: [
                  "\u9009\u62E9 ",
                  detail.target,
                  " \u7684\u5DF2\u767B\u8BB0\u4E3B\u673A"
                ] }),
                matching.map((h) => /* @__PURE__ */ jsxs("option", { value: h.id, children: [
                  h.name,
                  " \xB7 ",
                  h.protocol
                ] }, h.id))
              ] })
            ] }),
            !matching.length && /* @__PURE__ */ jsx("p", { className: "note", children: "\u5C1A\u672A\u767B\u8BB0\u6B64\u76EE\u6807\uFF0C\u8BF7\u5728\u201C\u4E3B\u673A\u4E0E\u8FDE\u63A5\u201D\u4E2D\u6DFB\u52A0\u3002" }),
            /* @__PURE__ */ jsx("button", { className: "primary", disabled: !remote || !!busy || detail.status === "running", onClick: () => {
              if (confirm("\u786E\u8BA4\u5DF2\u6388\u6743\u5BF9\u6B64\u4E8B\u4EF6\u76EE\u6807\u6267\u884C\u53EA\u8BFB\u6392\u67E5\uFF1F\u91C7\u96C6\u53EF\u80FD\u4EA7\u751F\u767B\u5F55\u548C\u8BBF\u95EE\u8BB0\u5F55\uFF0C\u4E0D\u6267\u884C\u9694\u79BB\u3001\u5220\u9664\u6216\u4FEE\u590D\u3002")) action("\u8FDC\u7A0B\u8C03\u67E5", () => req("/cases/" + detail.id + "/run", { host_id: remote, remote_authorized: true }));
            }, children: "\u6388\u6743\u5E76\u6267\u884C\u6392\u67E5" }),
            /* @__PURE__ */ jsx("div", { className: "notice", children: "\u8FDC\u7A0B\u6392\u67E5\u4E0D\u6267\u884C\u6A21\u578B\u751F\u6210\u7684\u4EFB\u610F\u547D\u4EE4\uFF0C\u4E0D\u8FD0\u884C\u53EF\u7591\u6837\u672C\u3002\u8BC1\u636E\u4FDD\u7559\u547D\u4EE4\u3001\u8FD4\u56DE\u7801\u4E0E\u91C7\u96C6\u65F6\u95F4\u3002\u4ECD\u5E94\u4F7F\u7528\u6700\u5C0F\u6743\u9650\u7684\u4E13\u7528\u8C03\u67E5\u8D26\u53F7\u3002" }),
            /* @__PURE__ */ jsx("h3", { children: "\u6307\u5B9A\u6587\u4EF6\u53D6\u8BC1" }),
            /* @__PURE__ */ jsx("p", { children: "\u6839\u636E\u65E5\u5FD7\u53D1\u73B0\u586B\u5199\u5B9E\u9645\u8DEF\u5F84\u3002\u91C7\u96C6\u524D\u540E\u6838\u5BF9\u8FDC\u7AEF SHA-256\uFF0C\u5E76\u4E0E\u672C\u5730\u6821\u9A8C\u4E00\u81F4\u540E\u5165\u5E93\uFF0C\u6700\u5927 20 MB\u3002" }),
            /* @__PURE__ */ jsxs("label", { className: "field", children: [
              "\u8FDC\u7A0B\u6587\u4EF6\u7EDD\u5BF9\u8DEF\u5F84",
              /* @__PURE__ */ jsx("input", { value: path, onChange: (e) => setPath(e.target.value), placeholder: "/var/www/html/suspicious.php \u6216 C:\\inetpub\\wwwroot\\file.aspx" })
            ] }),
            /* @__PURE__ */ jsx("button", { disabled: !path || !remote || !!busy, onClick: () => {
              if (confirm("\u786E\u8BA4\u4ECE\u4E8B\u4EF6\u76EE\u6807\u91C7\u96C6\u8FD9\u4E2A\u6587\u4EF6\u5230\u5E73\u53F0\u9694\u79BB\u8BC1\u636E\u5E93\uFF1F\u6587\u4EF6\u4E0D\u4F1A\u88AB\u6267\u884C\u3002")) action("\u6587\u4EF6\u53D6\u8BC1", () => req("/cases/" + detail.id + "/files", { host_id: remote, path, confirmed: true }));
            }, children: "\u91C7\u96C6\u6587\u4EF6\u5E76\u505A\u9759\u6001\u521D\u7B5B" })
          ] }),
          tab === "evidence" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsx("div", { className: "notice", children: "\u8BC1\u636E\u4E3A\u539F\u59CB\u54CD\u5E94\u6216\u5B9E\u9645\u91C7\u96C6\u5185\u5BB9\uFF0C\u4E0B\u8F7D\u524D\u6821\u9A8C SHA-256\u3002\u6837\u672C\u4EE5 .bin \u9644\u4EF6\u4E0B\u8F7D\uFF0C\u8BF7\u5728\u9694\u79BB\u73AF\u5883\u4E2D\u5904\u7406\u3002\u4E0A\u4F20\u5916\u90E8\u6C99\u7BB1\u524D\u786E\u8BA4\u6587\u4EF6\u53EF\u5BF9\u5916\u5171\u4EAB\u3002" }),
            detail.evidence.map((e) => /* @__PURE__ */ jsxs("div", { className: "evidence", children: [
              /* @__PURE__ */ jsx(Icon, { type: "file" }),
              /* @__PURE__ */ jsxs("div", { className: "body", children: [
                /* @__PURE__ */ jsx("strong", { children: e.label }),
                /* @__PURE__ */ jsxs("p", { children: [
                  e.kind,
                  " \xB7 ",
                  (e.size / 1024).toFixed(1),
                  " KB \xB7 ",
                  new Date(e.created).toLocaleString()
                ] }),
                /* @__PURE__ */ jsxs("code", { children: [
                  "SHA-256 ",
                  e.sha256
                ] }),
                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/evidence/" + e.id, children: "\u4E0B\u8F7D\u539F\u59CB\u8BC1\u636E" }) }),
                e.kind === "sample" && /* @__PURE__ */ jsxs("div", { className: "sample-actions", children: [
                  /* @__PURE__ */ jsx("button", { disabled: !!busy, onClick: () => action("\u67E5\u8BE2\u6C99\u7BB1\u62A5\u544A", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: false })), children: "\u6309\u54C8\u5E0C\u67E5\u62A5\u544A" }),
                  /* @__PURE__ */ jsx("button", { disabled: !!busy, onClick: () => {
                    if (confirm("\u8FD9\u5C06\u628A\u8BE5\u8BC1\u636E\u6587\u4EF6\u4E0A\u4F20\u5230\u5FAE\u6B65\u4E91\u6C99\u7BB1\uFF08\u5916\u90E8\u670D\u52A1\uFF09\u3002\u786E\u8BA4\u5DF2\u83B7\u6587\u4EF6\u5916\u53D1\u6388\u6743\u5E76\u63A5\u53D7\u5BF9\u5E94\u6C99\u7BB1\u7684\u6570\u636E\u653F\u7B56\uFF1F")) action("\u63D0\u4EA4\u6C99\u7BB1", () => req("/cases/" + detail.id + "/evidence/" + e.id + "/sandbox", { submit: true, external_upload_confirmed: true }));
                  }, children: "\u786E\u8BA4\u5916\u53D1\u5E76\u63D0\u4EA4\u6C99\u7BB1" })
                ] })
              ] })
            ] }, e.id))
          ] }),
          tab === "report" && /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "tools", children: [
              /* @__PURE__ */ jsx("button", { disabled: !!busy || detail.status === "running", className: "primary", onClick: () => action("\u66F4\u65B0\u5173\u8054\u62A5\u544A", () => req("/cases/" + detail.id + "/report", {})), children: "\u6309\u6700\u65B0\u8BC1\u636E\u751F\u6210\u62A5\u544A" }),
              /* @__PURE__ */ jsx("a", { href: BASE + "/cases/" + detail.id + "/report.md", children: "\u4E0B\u8F7D Markdown" })
            ] }),
            /* @__PURE__ */ jsx("p", { children: "\u533A\u5206\u5DF2\u8BC1\u5B9E\u4E8B\u5B9E\u3001\u5F85\u9A8C\u8BC1\u5047\u8BBE\u4E0E\u7F3A\u53E3\uFF0C\u6240\u6709\u7ED3\u8BBA\u5E94\u5173\u8054\u771F\u5B9E\u8BC1\u636E\u7F16\u53F7\u3002" }),
            /* @__PURE__ */ jsx("pre", { children: detail.report || "\u62A5\u544A\u5C1A\u672A\u751F\u6210\u3002\u9996\u6B21\u65E5\u5FD7\u5173\u8054\u7ED3\u675F\u540E\u4F1A\u81EA\u52A8\u6C47\u603B\uFF0C\u4E5F\u53EF\u4EE5\u624B\u52A8\u751F\u6210\u3002" })
          ] })
        ] })
      ] }) })
    ] }),
    deleteOpen && detail && /* @__PURE__ */ jsx("div", { className: "modal", onClick: () => !busy && setDeleteOpen(false), children: /* @__PURE__ */ jsxs("section", { className: "dialog confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u5E94\u6025\u4E8B\u4EF6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("h2", { children: "\u5220\u9664\u5E94\u6025\u4E8B\u4EF6" }),
      /* @__PURE__ */ jsx("p", { children: detail.title }),
      /* @__PURE__ */ jsx("div", { className: "notice", children: "\u5220\u9664\u540E\uFF0C\u4E8B\u4EF6\u5C06\u4ECE\u5DE5\u4F5C\u53F0\u79FB\u9664\u3002\u539F\u59CB\u8BC1\u636E\u548C\u5220\u9664\u8BB0\u5F55\u4FDD\u7559\u5728\u540E\u53F0\u3002\u6B63\u5728\u5904\u7406\u7684\u4E8B\u4EF6\u65E0\u6CD5\u5220\u9664\u3002" }),
      /* @__PURE__ */ jsxs("div", { className: "form-footer", children: [
        /* @__PURE__ */ jsx("button", { disabled: !!busy, onClick: () => setDeleteOpen(false), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ jsx("button", { className: "danger", disabled: !!busy, onClick: () => void removeEvent(), children: busy ? "\u6B63\u5728\u5220\u9664\u2026" : "\u786E\u8BA4\u5220\u9664" })
      ] })
    ] }) }),
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
