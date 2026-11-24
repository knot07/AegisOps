// ../../../../../../aegisops/contracts/webui/shims/react.js
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

// ../../../../../../aegisops/contracts/webui/shims/sdk.js
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

// src/model-brands.ts
var brands = { "deepseek": { "id": "deepseek", "name": "DeepSeek", "accent": "#4267c7", "soft": "#edf2ff", "asset": "deepseek-color" }, "qwen": { "id": "qwen", "name": "\u901A\u4E49\u5343\u95EE", "accent": "#7754c6", "soft": "#f3effc", "asset": "qwen-color" }, "zhipu": { "id": "zhipu", "name": "\u667A\u8C31 GLM", "accent": "#496ec2", "soft": "#eff3fe", "asset": "zhipu-color" }, "minimax": { "id": "minimax", "name": "MiniMax", "accent": "#c16780", "soft": "#fcf0f3", "asset": "minimax-color" }, "stepfun": { "id": "stepfun", "name": "\u9636\u8DC3\u661F\u8FB0", "accent": "#497bd0", "soft": "#eff5ff", "asset": "stepfun-color" }, "doubao": { "id": "doubao", "name": "\u5B57\u8282\u8C46\u5305", "accent": "#4b82ce", "soft": "#edf4ff", "asset": "doubao-color" }, "wenxin": { "id": "wenxin", "name": "\u767E\u5EA6\u6587\u5FC3", "accent": "#426adb", "soft": "#edf1ff", "asset": "wenxin-color" }, "hunyuan": { "id": "hunyuan", "name": "\u817E\u8BAF\u6DF7\u5143", "accent": "#428bd4", "soft": "#edf6ff", "asset": "hunyuan-color" }, "spark": { "id": "spark", "name": "\u8BAF\u98DE\u661F\u706B", "accent": "#3989c4", "soft": "#eef7fc", "asset": "spark-color" }, "yi": { "id": "yi", "name": "\u96F6\u4E00\u4E07\u7269", "accent": "#548ac5", "soft": "#eef5fd", "asset": "yi-color" }, "baichuan": { "id": "baichuan", "name": "\u767E\u5DDD", "accent": "#c77d3b", "soft": "#fff4e8", "asset": "baichuan-color" }, "internlm": { "id": "internlm", "name": "\u4E66\u751F\u6D66\u8BED", "accent": "#5782cc", "soft": "#eef4ff", "asset": "internlm-color" }, "mistral": { "id": "mistral", "name": "Mistral", "accent": "#d17d31", "soft": "#fff2df", "asset": "mistral-color" }, "meta": { "id": "meta", "name": "Meta Llama", "accent": "#327ad3", "soft": "#edf4ff", "asset": "meta-color" }, "nvidia": { "id": "nvidia", "name": "NVIDIA", "accent": "#71a42e", "soft": "#f1f7e7", "asset": "nvidia-color" }, "perplexity": { "id": "perplexity", "name": "Perplexity", "accent": "#328a91", "soft": "#eaf7f7", "asset": "perplexity-color" }, "ai21": { "id": "ai21", "name": "AI21 Labs", "accent": "#91575d", "soft": "#faedef", "asset": "ai21-brand-color" }, "stability": { "id": "stability", "name": "Stability AI", "accent": "#7e55bf", "soft": "#f4effb", "asset": "stability-color" }, "xiaomi": { "id": "xiaomi", "name": "\u5C0F\u7C73 MiMo", "accent": "#d17b32", "soft": "#fff3e8", "asset": "xiaomimimo" }, "longcat": { "id": "longcat", "name": "\u7F8E\u56E2 LongCat", "accent": "#c29725", "soft": "#fff8df", "asset": "longcat-color" }, "huawei": { "id": "huawei", "name": "\u534E\u4E3A\u76D8\u53E4", "accent": "#be5c5a", "soft": "#fcf0ef", "asset": "huawei-color" }, "anthropic": { "id": "anthropic", "name": "Anthropic Claude", "accent": "#ad7354", "soft": "#fcf2e9", "asset": "anthropic" }, "google": { "id": "google", "name": "Google Gemini", "accent": "#4478c8", "soft": "#eff4fe", "asset": "google-color" }, "moonshot": { "id": "moonshot", "name": "\u6708\u4E4B\u6697\u9762 Kimi", "accent": "#546bb3", "soft": "#f0f3fd", "asset": "moonshot" }, "cohere": { "id": "cohere", "name": "Cohere", "accent": "#51876e", "soft": "#eff7ef", "asset": "cohere-color" }, "grok": { "id": "grok", "name": "xAI Grok", "accent": "#526075", "soft": "#f0f3f8", "asset": "grok" }, "openai": { "id": "openai", "name": "OpenAI", "accent": "#25846e", "soft": "#edf7f3", "asset": "openai" }, "azure": { "id": "azure", "name": "Microsoft Azure", "accent": "#258ec0", "soft": "#ebf7fd", "asset": "azure-color" }, "threatbook": { "id": "threatbook", "name": "\u5FAE\u6B65 ThreatBook", "accent": "#c86353", "soft": "#fcf0ec", "asset": "threatbook" }, "ollama": { "id": "ollama", "name": "Ollama", "accent": "#62726e", "soft": "#f1f6f3", "asset": "ollama" }, "openrouter": { "id": "openrouter", "name": "OpenRouter", "accent": "#67658d", "soft": "#f2f1fa", "asset": "openrouter-color" }, "siliconcloud": { "id": "siliconcloud", "name": "\u7845\u57FA\u6D41\u52A8", "accent": "#745fc0", "soft": "#f3effb", "asset": "siliconcloud-color" }, "volcengine": { "id": "volcengine", "name": "\u706B\u5C71\u5F15\u64CE", "accent": "#4186c4", "soft": "#edf5fd", "asset": "volcengine-color" }, "gitee": { "id": "gitee", "name": "Gitee AI", "accent": "#bb575d", "soft": "#fbf0ef", "asset": "giteeai" }, "compatible": { "id": "compatible", "name": "\u517C\u5BB9\u6A21\u578B\u670D\u52A1", "accent": "#8462bf", "soft": "#f4f0fc" }, "cherry": { "id": "cherry", "name": "Cherry", "accent": "#bf5772", "soft": "#fbf0f3" }, "custom": { "id": "custom", "name": "\u81EA\u5B9A\u4E49\u6A21\u578B\u670D\u52A1", "accent": "#738b53", "soft": "#f3f7ed" } };
function modelBrand(value) {
  const s = value.toLowerCase();
  if (/deepseek/i.test(s)) return brands.deepseek;
  if (/qwen|qwq|qvq|通义|百炼|dashscope/i.test(s)) return brands.qwen;
  if (/glm|zhipu|智谱/i.test(s)) return brands.zhipu;
  if (/minimax|abab|海螺/i.test(s)) return brands.minimax;
  if (/stepfun|step[-_ ]|阶跃/i.test(s)) return brands.stepfun;
  if (/doubao|豆包|seed[-_ ]/i.test(s)) return brands.doubao;
  if (/ernie|wenxin|文心|千帆|qianfan/i.test(s)) return brands.wenxin;
  if (/hunyuan|混元/i.test(s)) return brands.hunyuan;
  if (/spark|星火|讯飞|iflytek/i.test(s)) return brands.spark;
  if (/(^|[/ :])yi[-_ ]|零一万物|01ai/i.test(s)) return brands.yi;
  if (/baichuan|百川/i.test(s)) return brands.baichuan;
  if (/internlm|书生|浦语/i.test(s)) return brands.internlm;
  if (/mistral|mixtral|codestral|ministral|devstral/i.test(s)) return brands.mistral;
  if (/llama|meta[-_ ]/i.test(s)) return brands.meta;
  if (/nemotron|nvidia/i.test(s)) return brands.nvidia;
  if (/perplexity|sonar[-_ ]/i.test(s)) return brands.perplexity;
  if (/ai21|jamba/i.test(s)) return brands.ai21;
  if (/stability|stable[-_ ]/i.test(s)) return brands.stability;
  if (/mimo|xiaomi|小米/i.test(s)) return brands.xiaomi;
  if (/longcat|美团/i.test(s)) return brands.longcat;
  if (/pangu|盘古|huawei/i.test(s)) return brands.huawei;
  if (/anthropic|claude/i.test(s)) return brands.anthropic;
  if (/google|gemini|gemma/i.test(s)) return brands.google;
  if (/moonshot|kimi|月之暗面/i.test(s)) return brands.moonshot;
  if (/cohere|command[-_ ]/i.test(s)) return brands.cohere;
  if (/grok|xai/i.test(s)) return brands.grok;
  if (/openai|gpt[-_ ]|(^|[/ :])o[1-9]([-_ :]|$)|chatgpt/i.test(s)) return brands.openai;
  if (/azure/i.test(s)) return brands.azure;
  if (/threatbook|微步/i.test(s)) return brands.threatbook;
  if (/ollama/i.test(s)) return brands.ollama;
  if (/openrouter/i.test(s)) return brands.openrouter;
  if (/siliconflow|siliconcloud|硅基/i.test(s)) return brands.siliconcloud;
  if (/volcengine|火山/i.test(s)) return brands.volcengine;
  if (/gitee/i.test(s)) return brands.gitee;
  if (/compatible/i.test(s)) return brands.compatible;
  if (/cherry/i.test(s)) return brands.cherry;
  return brands.custom;
}

// ../../../../../../aegisops/contracts/webui/shims/jsx-runtime.js
var runtime = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__;
if (!runtime?.jsx || !runtime?.jsxs) {
  throw new Error("AegisOps WebUI page runtime is not initialized (missing jsx runtime).");
}
var jsx = runtime.jsx;
var jsxs = runtime.jsxs;
var Fragment2 = runtime.React.Fragment;

// src/Page.tsx
var C = {
  bg: "var(--dt-bg)",
  pageBg: "var(--dt-page-bg)",
  panel: "var(--dt-panel)",
  panelSoft: "var(--dt-panel-soft)",
  panelHead: "var(--dt-panel-head)",
  border: "var(--dt-border)",
  borderLight: "var(--dt-border-strong)",
  text: "var(--dt-text)",
  textMid: "var(--dt-text-mid)",
  textDim: "var(--dt-text-dim)",
  textMuted: "var(--dt-text-muted)",
  blue: "var(--dt-blue)",
  blueDark: "var(--dt-blue-bg)",
  blueLight: "var(--dt-blue-text)",
  green: "var(--dt-green)",
  greenDark: "var(--dt-green-bg)",
  greenLight: "var(--dt-green-text)",
  red: "var(--dt-red)",
  redDark: "var(--dt-red-bg)",
  redLight: "var(--dt-red-text)",
  orange: "var(--dt-orange)",
  orangeDark: "var(--dt-orange-bg)",
  orangeLight: "var(--dt-orange-text)",
  cyan: "var(--dt-cyan)",
  cyanDark: "var(--dt-cyan-bg)",
  cyanLight: "var(--dt-cyan-text)",
  line: "var(--dt-line)",
  rowAlt: "var(--dt-row-alt)",
  overlay: "var(--dt-overlay)",
  shadow: "var(--dt-shadow)"
};
var LIGHT_THEME_VARS = {
  "--dt-bg": "#f6f8f7",
  "--dt-page-bg": "#f6f8f7",
  "--dt-panel": "#ffffff",
  "--dt-panel-soft": "#f5f7f6",
  "--dt-panel-head": "#f2f5f3",
  "--dt-border": "rgba(46,58,62,.085)",
  "--dt-border-strong": "rgba(46,58,62,.16)",
  "--dt-text": "#101418",
  "--dt-text-mid": "#445157",
  "--dt-text-dim": "#69757a",
  "--dt-text-muted": "#78848a",
  "--dt-blue": "#236de9",
  "--dt-blue-bg": "rgba(35,109,233,.08)",
  "--dt-blue-text": "#2364cf",
  "--dt-green": "#82dd2d",
  "--dt-green-bg": "#edf8e3",
  "--dt-green-text": "#427d1e",
  "--dt-red": "#e96c62",
  "--dt-red-bg": "#fff0ee",
  "--dt-red-text": "#bf443c",
  "--dt-orange": "#d5a455",
  "--dt-orange-bg": "#fcf4e6",
  "--dt-orange-text": "#91611d",
  "--dt-cyan": "#6d919d",
  "--dt-cyan-bg": "#eef3f5",
  "--dt-cyan-text": "#486a77",
  "--dt-line": "#273439",
  "--dt-row-alt": "rgba(46,58,62,.018)",
  "--dt-overlay": "rgba(16,20,24,.32)",
  "--dt-shadow": "0 1px 2px rgba(46,58,62,.035), 0 5px 16px rgba(46,58,62,.035)",
  "--dt-accent": "#82dd2d",
  "--dt-accent-soft": "#edf8e3",
  "--dt-control": "#131619",
  "--dt-control-text": "#ffffff"
};
var DARK_THEME_VARS = {
  "--dt-bg": "#121517",
  "--dt-page-bg": "#121517",
  "--dt-panel": "#1b1f21",
  "--dt-panel-soft": "#222729",
  "--dt-panel-head": "#252b2d",
  "--dt-border": "rgba(255,255,255,.08)",
  "--dt-border-strong": "rgba(255,255,255,.17)",
  "--dt-text": "#eef2f1",
  "--dt-text-mid": "#bdc7c9",
  "--dt-text-dim": "#a0abad",
  "--dt-text-muted": "#909c9f",
  "--dt-blue": "#4c8dff",
  "--dt-blue-bg": "rgba(76,141,255,.14)",
  "--dt-blue-text": "#9abfff",
  "--dt-green": "#82dd2d",
  "--dt-green-bg": "rgba(130,221,45,.12)",
  "--dt-green-text": "#a6df75",
  "--dt-red": "#ff7a71",
  "--dt-red-bg": "rgba(255,90,80,.12)",
  "--dt-red-text": "#ffaaa3",
  "--dt-orange": "#e0b46c",
  "--dt-orange-bg": "rgba(224,180,108,.12)",
  "--dt-orange-text": "#eac68d",
  "--dt-cyan": "#8eacb8",
  "--dt-cyan-bg": "rgba(142,172,184,.12)",
  "--dt-cyan-text": "#adc7d1",
  "--dt-line": "#ced9d5",
  "--dt-row-alt": "rgba(255,255,255,.018)",
  "--dt-overlay": "rgba(0,0,0,.55)",
  "--dt-shadow": "0 1px 2px rgba(0,0,0,.2), 0 5px 16px rgba(0,0,0,.12)",
  "--dt-accent": "#82dd2d",
  "--dt-accent-soft": "rgba(130,221,45,.10)",
  "--dt-control": "#82dd2d",
  "--dt-control-text": "#17200f"
};
var FONT = '"Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
var PAGE_SIZE = 10;
var MAX_AI_CONCURRENCY = 3;
var VALID_DECISIONS = /* @__PURE__ */ new Set(["\u5EFA\u8BAE\u5C01\u7981", "\u4E0D\u5EFA\u8BAE\u5C01\u7981", "\u4EBA\u5DE5\u590D\u6838", "\u4E3B\u673A\u5931\u9677"]);
var TIME_PRESETS = [
  { minutes: 5, label: "\u6700\u8FD15\u5206\u949F" },
  { minutes: 15, label: "\u6700\u8FD115\u5206\u949F" },
  { minutes: 30, label: "\u6700\u8FD130\u5206\u949F" },
  { minutes: 60, label: "\u6700\u8FD11\u5C0F\u65F6" },
  { minutes: 120, label: "\u6700\u8FD12\u5C0F\u65F6" },
  { minutes: 360, label: "\u6700\u8FD16\u5C0F\u65F6" },
  { minutes: 720, label: "\u6700\u8FD112\u5C0F\u65F6" },
  { minutes: 1440, label: "\u6700\u8FD11\u5929" }
];
function useAegisOpsHostState() {
  const readDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const readWidth = () => typeof window !== "undefined" ? window.innerWidth : 1440;
  const [isDark, setIsDark] = useState(readDark);
  const [viewportWidth, setViewportWidth] = useState(readWidth);
  useEffect(() => {
    const updateTheme = () => setIsDark(readDark());
    const updateWidth = () => setViewportWidth(readWidth());
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", updateWidth);
    updateTheme();
    updateWidth();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);
  return { isDark, viewportWidth };
}
function useBrandLogo(storageKey) {
  const [logo, setLogo] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || null;
    } catch {
      return null;
    }
  });
  const inputRef = useRef(null);
  const chooseLogo = () => inputRef.current?.click();
  const onLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (!value) return;
      try {
        localStorage.setItem(storageKey, value);
      } catch {
      }
      setLogo(value);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };
  const resetLogo = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
    }
    setLogo(null);
  };
  return { logo, inputRef, chooseLogo, onLogoChange, resetLogo };
}
function loadSceneAssistant() {
  const win = window;
  if (win.AegisSceneAI) return Promise.resolve(win.AegisSceneAI);
  if (win.aegisSceneAILoad) return win.aegisSceneAILoad;
  win.aegisSceneAILoad = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/api/scenes/assistant/widget.js";
    script.onload = () => resolve(win.AegisSceneAI);
    script.onerror = () => {
      win.aegisSceneAILoad = null;
      reject(Error("AI \u52A9\u624B\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5"));
    };
    document.head.append(script);
  });
  return win.aegisSceneAILoad;
}
function rowKey(row) {
  return row.row_key || row.aggregation_key || [row.ip, row.ioc || row.ip, row.threat_type || "", row.threat_name || ""].join("|");
}
function fmtTime(ts) {
  if (!ts) return "--";
  return new Date(ts * 1e3).toLocaleString("zh-CN", { hour12: false });
}
function toDatetimeLocal(value) {
  const pad = (part) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
function readTimeSetting(now) {
  const fallback = { mode: "preset", minutes: 120, customStart: toDatetimeLocal(new Date(now - 2 * 60 * 60 * 1e3)), customEnd: toDatetimeLocal(new Date(now)) };
  try {
    const parsed = JSON.parse(localStorage.getItem("datang-ai-v2-time-filter") || "{}");
    const presetValid = TIME_PRESETS.some((item) => item.minutes === Number(parsed.minutes));
    const customValid = parsed.mode === "custom" && parsed.customStart && parsed.customEnd && new Date(parsed.customEnd).getTime() > new Date(parsed.customStart).getTime();
    if (customValid) return { mode: "custom", minutes: presetValid ? Number(parsed.minutes) : 120, customStart: String(parsed.customStart), customEnd: String(parsed.customEnd) };
    if (presetValid) return { ...fallback, minutes: Number(parsed.minutes) };
  } catch {
  }
  return fallback;
}
function saveTimeSetting(mode, minutes, customStart, customEnd) {
  localStorage.setItem("datang-ai-v2-time-filter", JSON.stringify({ mode, minutes, customStart, customEnd }));
}
function threatTypeLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "--";
  if (normalized === "attack" || normalized.includes("\u653B\u51FB")) return "\u653B\u51FB";
  if (normalized.includes("scan") || normalized.includes("\u626B\u63CF")) return "\u626B\u63CF";
  return value || "--";
}
function severityLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "--";
  if (["critical", "\u4E25\u91CD", "\u6781\u9AD8", "4", "5"].includes(normalized)) return "\u4E25\u91CD";
  if (["high", "\u9AD8", "\u9AD8\u5371", "3"].includes(normalized)) return "\u9AD8\u5371";
  if (["medium", "middle", "\u4E2D", "\u4E2D\u5371", "2"].includes(normalized)) return "\u4E2D\u5371";
  if (["low", "\u4F4E", "\u4F4E\u5371", "1"].includes(normalized)) return "\u4F4E\u5371";
  return value || "--";
}
function safeDecision(value) {
  return value && VALID_DECISIONS.has(value) ? value : value ? "\u7ED3\u679C\u5F02\u5E38" : "-";
}
function decisionLabel(row) {
  if (row.ai_status !== "done") return "-";
  if (row.ai_action_scope === "\u51FA\u7AD9\u57DF\u540DIOC" || isOutboundDomainRow(row)) return "\u51FA\u7AD9\u963B\u65AD\u57DF\u540D";
  if (row.ai_action_scope === "IOC\u57DF\u540D" || row.ai_summary?.includes("\u4E0D\u8981\u5C01\u7981\u53EF\u4FE1\u57FA\u7840\u8BBE\u65BD IP")) return "\u4EC5\u963B\u65AD\u57DF\u540D";
  if (row.ai_action_scope === "\u76EE\u6807\u4E3B\u673A\u548C\u6E90IP") return "\u9694\u79BB\u5E76\u5C01\u7981";
  return safeDecision(row.ai_ban_decision);
}
function isOutboundDomainRow(row) {
  const domain = String(row.ioc || "").trim();
  const threat = String(row.threat_name || "");
  return /^(?=.{4,253}$)(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}$/.test(domain) && /银狐|黑产|C2|木马|病毒|远控|后门|恶意域名|僵尸网络/i.test(threat) && trafficPathsFor(row).some((path) => path.direction === "\u5185\u5230\u5916");
}
function actionScopeLabel(row) {
  if (row.ai_status !== "done") return "--";
  return isOutboundDomainRow(row) ? "\u51FA\u7AD9\u57DF\u540DIOC" : row.ai_action_scope || "--";
}
function evidenceText(value) {
  if (value === null || value === void 0) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function extractIp(value) {
  const text = evidenceText(value).trim();
  const ipv4 = text.match(/(?:^|[^\d])((?:\d{1,3}\.){3}\d{1,3})(?:$|[^\d])/);
  if (ipv4) {
    const candidate = ipv4[1];
    if (candidate.split(".").every((part) => Number(part) <= 255)) return candidate;
  }
  const direct = text.replace(/^\[|\]$/g, "");
  return direct.includes(":") && /^[0-9a-f:]+$/i.test(direct) ? direct : "";
}
function networkZone(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127 || parts[0] === 169 && parts[1] === 254 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || parts[0] === 192 && parts[1] === 168) return "internal";
    return "external";
  }
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)) return "internal";
  return normalized.includes(":") ? "external" : "unknown";
}
function inferTrafficDirection(sourceIp, destinationIp) {
  const source = networkZone(sourceIp);
  const destination = networkZone(destinationIp);
  if (source === "external" && destination === "internal") return "\u5916\u5230\u5185";
  if (source === "internal" && destination === "internal") return "\u5185\u5230\u5185";
  if (source === "internal" && destination === "external") return "\u5185\u5230\u5916";
  return "\u5F85\u786E\u8BA4";
}
function trafficPathsFor(row) {
  const validDirections = /* @__PURE__ */ new Set(["\u5916\u5230\u5185", "\u5185\u5230\u5185", "\u5185\u5230\u5916", "\u5F85\u786E\u8BA4"]);
  const saved = Array.isArray(row.ai_traffic_paths) ? row.ai_traffic_paths.filter(
    (item) => item && item.source_ip && item.destination_ip && validDirections.has(item.direction)
  ).map((item) => {
    if (String(item.sensor_direction).toLowerCase() === "out" && item.direction === "\u5916\u5230\u5185") {
      return { ...item, source_ip: item.destination_ip, destination_ip: item.source_ip, destination_port: "", direction: "\u5185\u5230\u5916" };
    }
    return item;
  }) : [];
  if (saved.length) return saved.slice(0, 20);
  const sourceIp = extractIp(row.ip) || row.ip || "\u5F85\u786E\u8BA4";
  const targetIps = [...new Set((row.ai_affected_targets || []).map(extractIp).filter(Boolean))];
  if (!targetIps.length) return [{ source_ip: sourceIp, destination_ip: "\u5F85\u786E\u8BA4", direction: "\u5F85\u786E\u8BA4" }];
  return targetIps.slice(0, 20).map((destinationIp) => ({
    source_ip: sourceIp,
    destination_ip: destinationIp,
    direction: inferTrafficDirection(sourceIp, destinationIp)
  }));
}
function mergeAi(row, ai) {
  if (!ai) return row;
  return {
    ...row,
    ai_status: ai.status || row.ai_status,
    ai_phase: ai.phase || row.ai_phase,
    ai_label: ai.label || row.ai_label,
    ai_verdict: ai.verdict ?? row.ai_verdict,
    ai_ban_decision: ai.ban_decision ?? row.ai_ban_decision,
    ai_confidence: ai.confidence ?? row.ai_confidence,
    ai_severity: ai.severity ?? row.ai_severity,
    ai_attack_outcome: ai.attack_outcome ?? row.ai_attack_outcome,
    ai_compromise_status: ai.compromise_status ?? row.ai_compromise_status,
    ai_action_scope: ai.action_scope ?? row.ai_action_scope,
    ai_recommended_action: ai.recommended_action ?? row.ai_recommended_action,
    ai_summary: ai.summary ?? row.ai_summary,
    ai_evidence: ai.evidence ?? row.ai_evidence,
    ai_supporting_evidence: ai.supporting_evidence ?? row.ai_supporting_evidence,
    ai_contradicting_evidence: ai.contradicting_evidence ?? row.ai_contradicting_evidence,
    ai_missing_information: ai.missing_information ?? row.ai_missing_information,
    ai_affected_targets: ai.affected_targets ?? row.ai_affected_targets,
    ai_traffic_paths: ai.traffic_paths ?? row.ai_traffic_paths,
    ai_http_evidence: ai.http_evidence ?? row.ai_http_evidence,
    ai_source_location: ai.source_location ?? row.ai_source_location,
    ai_key_iocs: ai.key_iocs ?? row.ai_key_iocs,
    ai_human_checkpoints: ai.human_checkpoints ?? row.ai_human_checkpoints,
    ai_progress: ai.progress ?? row.ai_progress,
    ai_raw_output: ai.raw_output ?? row.ai_raw_output,
    ai_error: ai.error ?? row.ai_error,
    ai_task_key: ai.task_key || row.ai_task_key,
    ai_session_id: ai.session_id || row.ai_session_id,
    ai_workflow_id: ai.workflow_id || row.ai_workflow_id,
    ai_execution_id: ai.execution_id || row.ai_execution_id
  };
}
function mergeDashboardRow(latest, previous) {
  if (!previous) return latest;
  return {
    ...previous,
    ...latest,
    ai_evidence: latest.ai_evidence ?? previous.ai_evidence,
    ai_supporting_evidence: latest.ai_supporting_evidence ?? previous.ai_supporting_evidence,
    ai_contradicting_evidence: latest.ai_contradicting_evidence ?? previous.ai_contradicting_evidence,
    ai_missing_information: latest.ai_missing_information ?? previous.ai_missing_information,
    ai_affected_targets: latest.ai_affected_targets ?? previous.ai_affected_targets,
    ai_traffic_paths: latest.ai_traffic_paths ?? previous.ai_traffic_paths,
    ai_http_evidence: latest.ai_http_evidence ?? previous.ai_http_evidence,
    ai_source_location: latest.ai_source_location ?? previous.ai_source_location,
    ai_key_iocs: latest.ai_key_iocs ?? previous.ai_key_iocs,
    ai_human_checkpoints: latest.ai_human_checkpoints ?? previous.ai_human_checkpoints,
    ai_raw_output: latest.ai_raw_output ?? previous.ai_raw_output
  };
}
function aiLabel(row) {
  if (row.ai_status === "done") return "\u5DF2\u5B8C\u6210";
  if (row.ai_status === "failed") return "\u7814\u5224\u5F02\u5E38";
  if (row.ai_phase === "queued") return "\u961F\u5217\u4E2D";
  if (row.ai_phase === "parsing") return "\u89E3\u6790\u4E2D";
  if (row.ai_phase === "collecting") return "\u56FA\u5B9A\u53D6\u8BC1\u4E2D";
  if (row.ai_phase === "rule_engine") return "\u89C4\u5219\u5206\u6790\u4E2D";
  if (row.ai_phase === "model_analysis") return "\u6A21\u578B\u5206\u6790\u4E2D";
  if (row.ai_phase === "finalizing") return "\u7ED3\u679C\u6821\u9A8C\u4E2D";
  if (row.ai_status === "pending") return "\u7814\u5224\u4E2D";
  return "AI\u7814\u5224";
}
function AIResultBadge({ row, onStart }) {
  const status = row.ai_status || "none";
  const palette = status === "done" ? { background: C.greenDark, color: C.greenLight } : status === "failed" ? { background: C.redDark, color: C.redLight } : status === "pending" ? { background: C.orangeDark, color: C.orangeLight } : { background: C.blueDark, color: C.blueLight };
  if (status === "none" || status === "failed") {
    return /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `\u5F00\u59CB\u7814\u5224 ${row.ip}`, title: "\u70B9\u51FB\u5F00\u59CBAI\u7814\u5224", onClick: () => onStart(row), style: { ...aiResultBadgeStyle, ...palette, cursor: "pointer" }, children: status === "failed" ? "\u91CD\u65B0\u7814\u5224" : aiLabel(row) });
  }
  return /* @__PURE__ */ jsx("span", { style: { ...aiResultBadgeStyle, ...palette }, children: aiLabel(row) });
}
function Icon({ name, size = 18 }) {
  const paths = {
    activity: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "4", fill: "currentColor", fillOpacity: ".15" }),
      /* @__PURE__ */ jsx("path", { d: "M6 12h3l2-4 2.5 7 1.5-3H18" })
    ] }),
    bot: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "4", y: "7", width: "16", height: "13", rx: "5", fill: "currentColor", fillOpacity: ".15" }),
      /* @__PURE__ */ jsx("path", { d: "M12 4v3m-3 6h.1m5.8 0h.1m-5 3q2 1.5 4 0" }),
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "3.5", r: "1", fill: "currentColor" })
    ] }),
    chart: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "4", fill: "currentColor", fillOpacity: ".13" }),
      /* @__PURE__ */ jsx("path", { d: "M7 16v-4m5 4V8m5 8v-6" })
    ] }),
    clock: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "M12 3a9 9 0 1 0 9 9h-9Z", fill: "currentColor", fillOpacity: ".14" }),
      /* @__PURE__ */ jsx("path", { d: "M15 3v6h6a8 8 0 0 0-6-6Z" })
    ] }),
    download: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "M4 14h4l2 2h4l2-2h4v5H4Z", fill: "currentColor", fillOpacity: ".14" }),
      /* @__PURE__ */ jsx("path", { d: "M12 4v9m-3-3 3 3 3-3" })
    ] }),
    calendar: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }),
      /* @__PURE__ */ jsx("path", { d: "M8 3v4M16 3v4M3 10h18" })
    ] }),
    check: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5 12l4 4L19 6" }) }),
    "chevron-down": /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6 9l6 6 6-6" }) }),
    "chevron-left": /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M15 18l-6-6 6-6" }) }),
    "chevron-right": /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9 18l6-6-6-6" }) }),
    refresh: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5" }),
      /* @__PURE__ */ jsx("path", { d: "M18 3v4h-4M6 21v-4h4" })
    ] }),
    shield: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6Z", fill: "currentColor", fillOpacity: ".15" }),
      /* @__PURE__ */ jsx("path", { d: "m8.5 12 2.5 2.5 4.5-5" })
    ] }),
    spark: /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx("path", { d: "M11 3c.5 4 3 6.5 7 7-4 .5-6.5 3-7 7-.5-4-3-6.5-7-7 4-.5 6.5-3 7-7Z", fill: "currentColor", fillOpacity: ".25" }),
      /* @__PURE__ */ jsx("path", { d: "M18 15v6m-3-3h6" })
    ] }),
    play: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "m8 5 11 7-11 7Z", fill: "currentColor", fillOpacity: ".2" }) }),
    pause: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M8 6v12m8-12v12" }) }),
    x: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6 6l12 12M18 6L6 18" }) })
  };
  return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", style: { display: "block" }, children: /* @__PURE__ */ jsx("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: paths[name] || paths.activity }) });
}
function TrendChart({ trend }) {
  const [hovered, setHovered] = useState(null);
  const labels = trend.labels || [];
  const values = (trend.tdp || []).map((value) => Math.max(0, Number(value) || 0));
  const sum = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(0, ...values);
  const W = 720, H = 250, L = 32, R = 24, T = 28, B = 34;
  const chartH = H - T - B;
  const limit = Math.max(4, Math.ceil(peak / 4) * 4);
  const step = (W - L - R) / Math.max(1, labels.length);
  const x = (index) => L + step * (index + 0.5);
  const y = (value) => T + chartH * (1 - value / limit);
  const active = hovered !== null && hovered < values.length ? hovered : null;
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const smoothPath = points.map((point, index) => {
    if (!index) return "M " + point.x + " " + point.y;
    const previous = points[index - 1];
    const before = points[Math.max(0, index - 2)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const clampY = (value) => Math.max(T, Math.min(T + chartH, value));
    return "C " + (previous.x + (point.x - before.x) / 6) + " " + clampY(previous.y + (point.y - before.y) / 6) + " " + (point.x - (after.x - previous.x) / 6) + " " + clampY(point.y - (after.y - previous.y) / 6) + " " + point.x + " " + point.y;
  }).join(" ");
  return /* @__PURE__ */ jsxs("div", { className: "dt-trend-body", children: [
    /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { color: C.textDim, fontSize: 12 }, children: "\u544A\u8B66\u603B\u91CF" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 5, alignItems: "baseline", marginTop: 8 }, children: [
          /* @__PURE__ */ jsx("strong", { style: { color: C.text, fontSize: 42, lineHeight: 1, fontWeight: 720 }, children: sum.toLocaleString() }),
          /* @__PURE__ */ jsx("span", { style: { color: C.textMuted, fontSize: 14 }, children: "\u6B21" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 18, paddingTop: 14, borderTop: "1px solid " + C.border }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { color: C.textMuted, fontSize: 11 }, children: "\u5CF0\u503C" }),
          /* @__PURE__ */ jsx("strong", { style: { display: "block", marginTop: 5, fontSize: 16 }, children: peak })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { color: C.textMuted, fontSize: 11 }, children: "\u5747\u503C" }),
          /* @__PURE__ */ jsx("strong", { style: { display: "block", marginTop: 5, fontSize: 16 }, children: values.length ? (sum / values.length).toFixed(1) : "0" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("span", { style: { alignSelf: "start", display: "inline-flex", gap: 6, alignItems: "center", padding: "5px 8px", borderRadius: 4, fontSize: 11, color: C.textMid, background: C.panel }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 5, height: 5, background: C.green, borderRadius: "50%" } }),
        "\u5F53\u524D\u65F6\u95F4\u8303\u56F4"
      ] })
    ] }),
    labels.length && values.length ? /* @__PURE__ */ jsxs("svg", { role: "img", "aria-label": "\u544A\u8B66\u8D8B\u52BF\u67F1\u72B6\u56FE", viewBox: "0 0 " + W + " " + H, width: "100%", height: "250", onPointerLeave: () => setHovered(null), style: { display: "block", minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("pattern", { id: "tdpHatch", width: "7", height: "7", patternUnits: "userSpaceOnUse", patternTransform: "rotate(40)", children: [
        /* @__PURE__ */ jsx("rect", { width: "7", height: "7", fill: C.green, opacity: ".68" }),
        /* @__PURE__ */ jsx("line", { x1: "0", y1: "0", x2: "0", y2: "7", stroke: C.greenLight, strokeWidth: "1.4", opacity: ".38" })
      ] }) }),
      [0, 0.5, 1].map((ratio) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: L, x2: W - R, y1: y(limit * ratio), y2: y(limit * ratio), stroke: C.borderLight, strokeDasharray: "2 5" }),
        /* @__PURE__ */ jsx("text", { x: L - 8, y: y(limit * ratio) + 4, textAnchor: "end", fill: C.textMuted, fontSize: "10", children: limit * ratio })
      ] }, ratio)),
      values.map((value, index) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("rect", { className: "dt-trend-bar", style: { animationDelay: Math.min(index * 18, 220) + "ms" }, x: x(index) - Math.min(14, step * 0.27), y: y(value), width: Math.min(28, step * 0.54), height: Math.max(2, y(0) - y(value)), rx: "4", fill: value ? "url(#tdpHatch)" : C.borderLight }),
        value === peak && value > 0 && /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx("line", { x1: x(index), x2: x(index), y1: y(0), y2: y(value), stroke: C.line, strokeWidth: "1.5" }),
          /* @__PURE__ */ jsx("circle", { cx: x(index), cy: y(value), r: "4", stroke: C.line, strokeWidth: "2", fill: C.panel })
        ] }),
        (index % Math.max(1, Math.ceil(labels.length / 6)) === 0 || index === labels.length - 1) && /* @__PURE__ */ jsx("text", { x: x(index), y: H - 9, textAnchor: "middle", fontSize: "10", fill: C.textMuted, children: labels[index] }),
        /* @__PURE__ */ jsx("rect", { x: L + step * index, y: T, width: step, height: chartH, fill: "transparent", onPointerEnter: () => setHovered(index), onPointerMove: () => setHovered(index) })
      ] }, index)),
      /* @__PURE__ */ jsx("path", { className: "dt-trend-curve", pathLength: "1", "data-trend-curve": true, d: smoothPath, fill: "none", stroke: C.line, strokeWidth: "1.6", strokeLinejoin: "round", strokeLinecap: "round", pointerEvents: "none" }),
      points.map((point, index) => /* @__PURE__ */ jsx("circle", { cx: point.x, cy: point.y, r: "2.8", fill: C.panel, stroke: C.line, strokeWidth: "1.5", pointerEvents: "none" }, "curve-point-" + index)),
      active !== null && /* @__PURE__ */ jsxs("g", { pointerEvents: "none", children: [
        /* @__PURE__ */ jsx("line", { x1: x(active), x2: x(active), y1: T, y2: y(0), stroke: C.textMuted, strokeDasharray: "3 4" }),
        /* @__PURE__ */ jsx("circle", { cx: x(active), cy: y(values[active]), r: "5", fill: C.panel, stroke: C.line, strokeWidth: "2" }),
        /* @__PURE__ */ jsx("rect", { x: Math.max(L, Math.min(W - 154, x(active) - 70)), y: Math.max(5, y(values[active]) - 62), width: "138", height: "49", rx: "6", fill: C.panel, stroke: C.borderLight }),
        /* @__PURE__ */ jsx("text", { x: Math.max(L, Math.min(W - 154, x(active) - 70)) + 12, y: Math.max(5, y(values[active]) - 62) + 18, fill: C.textDim, fontSize: "11", children: labels[active] }),
        /* @__PURE__ */ jsxs("text", { x: Math.max(L, Math.min(W - 154, x(active) - 70)) + 12, y: Math.max(5, y(values[active]) - 62) + 36, fill: C.text, fontSize: "12", fontWeight: "650", children: [
          "\u544A\u8B66\u3000",
          values[active],
          " \u6B21"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { style: { minHeight: 250, display: "grid", placeItems: "center", color: C.textMuted }, children: "\u6682\u65E0\u8D8B\u52BF\u6570\u636E" })
  ] });
}
function AttackTypePie({ rows }) {
  const [active, setActive] = useState(null);
  const counts = rows.reduce((result, row) => {
    const label = threatTypeLabel(row.threat_type) || "\u5176\u4ED6";
    result[label] = (result[label] || 0) + Math.max(0, Number(row.count) || 0);
    return result;
  }, {});
  const entries = Object.entries(counts).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((total, [, value]) => total + value, 0);
  const palette = [C.green, C.blue, C.orange, C.cyan, C.red, C.line];
  const selected = entries.find(([label]) => label === active);
  const ticks = Array.from({ length: 72 }, (_, index) => {
    const position = (index + 0.5) / 72 * sum;
    let accumulated = 0;
    const category = entries.findIndex(([, value]) => {
      accumulated += value;
      return position < accumulated;
    });
    const angle = index * Math.PI * 2 / 72 - Math.PI / 2;
    return { index, category, angle };
  });
  const [ringOverride, setRingOverride] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media?.matches ?? false);
    media?.addEventListener?.("change", update);
    return () => media?.removeEventListener?.("change", update);
  }, []);
  const breathe = ringOverride ?? !reducedMotion;
  return /* @__PURE__ */ jsxs("div", { className: "dt-ring-body", children: [
    /* @__PURE__ */ jsxs("div", { className: "dt-ring-visual", children: [
      sum > 0 && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "dt-ring-motion",
          "aria-label": "\u544A\u8B66\u523B\u5EA6\u73AF\u547C\u5438\u52A8\u6548",
          "aria-pressed": breathe,
          title: breathe ? "\u6682\u505C\u547C\u5438\u52A8\u6548" : "\u64AD\u653E\u547C\u5438\u52A8\u6548",
          onClick: () => setRingOverride(!breathe),
          children: /* @__PURE__ */ jsx(Icon, { name: breathe ? "pause" : "play", size: 13 })
        }
      ),
      /* @__PURE__ */ jsxs("svg", { role: "img", "aria-label": "\u653B\u51FB\u7C7B\u578B\u5360\u6BD4\u523B\u5EA6\u73AF", viewBox: "0 0 240 240", width: "100%", height: "156", onPointerLeave: () => setActive(null), style: { minWidth: 0, display: "block" }, children: [
        /* @__PURE__ */ jsx("g", { className: "dt-ring-ticks", "data-breathing": sum > 0 && breathe && !active ? "on" : "off", children: ticks.map(({ index, category, angle }) => /* @__PURE__ */ jsx(
          "line",
          {
            x1: 120 + Math.cos(angle) * 87,
            y1: 120 + Math.sin(angle) * 87,
            x2: 120 + Math.cos(angle) * (index % 6 === 0 ? 105 : 101),
            y2: 120 + Math.sin(angle) * (index % 6 === 0 ? 105 : 101),
            stroke: category < 0 ? C.borderLight : palette[category % palette.length],
            strokeWidth: "2.5",
            strokeLinecap: "round",
            opacity: active && entries[category]?.[0] !== active ? 0.22 : 1,
            onPointerEnter: () => setActive(entries[category]?.[0] || null)
          },
          index
        )) }),
        /* @__PURE__ */ jsx("text", { x: "120", y: "118", textAnchor: "middle", fill: C.text, fontSize: "29", fontWeight: "720", children: (selected ? selected[1] : sum).toLocaleString() }),
        /* @__PURE__ */ jsx("text", { x: "120", y: "141", textAnchor: "middle", fill: C.textMuted, fontSize: "11", children: selected ? selected[0] : "\u544A\u8B66\u603B\u91CF" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: 9, minWidth: 0, padding: "0 3px" }, children: entries.length ? entries.map(([label, value], index) => /* @__PURE__ */ jsxs("div", { onPointerEnter: () => setActive(label), onPointerLeave: () => setActive(null), style: { display: "grid", gridTemplateColumns: "48px minmax(40px,1fr) 83px", gap: 9, alignItems: "center", fontSize: 12, minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: C.textDim, overflowWrap: "anywhere" }, children: label }),
      /* @__PURE__ */ jsx("div", { role: "progressbar", "aria-label": label + "\u544A\u8B66\u5360\u6BD4", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Number((value / sum * 100).toFixed(1)), style: { height: 7, borderRadius: 4, background: C.panelSoft, overflow: "hidden" }, children: /* @__PURE__ */ jsx("span", { style: { display: "block", height: "100%", width: value / sum * 100 + "%", borderRadius: 4, background: palette[index % palette.length], opacity: active && active !== label ? 0.4 : 0.78, transition: "width .2s ease, opacity .15s ease" } }) }),
      /* @__PURE__ */ jsxs("span", { style: { textAlign: "right", whiteSpace: "nowrap" }, children: [
        /* @__PURE__ */ jsx("strong", { style: { color: C.text, fontWeight: 650 }, children: value }),
        /* @__PURE__ */ jsxs("small", { style: { color: C.textMuted, fontSize: 10 }, children: [
          " \xB7 ",
          (value / sum * 100).toFixed(1),
          "%"
        ] })
      ] })
    ] }, label)) : /* @__PURE__ */ jsx("span", { style: { color: C.textMuted, fontSize: 12 }, children: "\u6682\u65E0\u7C7B\u578B\u6570\u636E" }) })
  ] });
}
function downloadCsv(rows) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const columns = [
    ["#", (_r, i) => i + 1],
    ["\u6700\u8FD1\u53D1\u73B0\u65F6\u95F4", (r) => fmtTime(r.last_time || r.first_time)],
    ["\u7C7B\u578B", (r) => threatTypeLabel(r.threat_type)],
    ["\u653B\u51FB\u8005IP/IOC", (r) => r.ioc || r.ip],
    ["\u5A01\u80C1\u540D\u79F0", (r) => r.threat_name || ""],
    ["AI\u7814\u5224\u5EFA\u8BAE", (r) => decisionLabel(r)],
    ["AI\u7814\u5224\u7ED3\u679C", (r) => aiLabel(r)],
    ["\u4E25\u91CD\u7EA7\u522B", (r) => severityLabel(r.severity)],
    ["\u68C0\u51FA\u6B21\u6570", (r) => r.count],
    ["AI\u7ED3\u8BBA", (r) => r.ai_verdict || ""]
  ];
  const csv = "\uFEFF" + [columns.map(([h]) => quote(h)).join(","), ...rows.map((r, i) => columns.map(([, g]) => quote(g(r, i))).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `AegisOps_AI_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
function pageTokens(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  let start = Math.max(2, current - 2);
  let end = Math.min(total - 1, current + 2);
  if (current <= 4) end = 5;
  if (current >= total - 3) start = total - 4;
  const result = [1];
  if (start > 2) result.push("left-ellipsis");
  for (let value = start; value <= end; value += 1) result.push(value);
  if (end < total - 1) result.push("right-ellipsis");
  result.push(total);
  return result;
}
function StyledSelect({ value, options, onChange, ariaLabel, placement = "bottom", buttonStyle }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, style: { position: "relative", minWidth: 0 }, children: [
    /* @__PURE__ */ jsxs("button", { type: "button", "aria-label": ariaLabel, "aria-haspopup": "listbox", "aria-expanded": open, onClick: () => setOpen((value2) => !value2), style: { width: "100%", minHeight: 34, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 11px", color: C.text, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, ...buttonStyle }, children: [
      /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: selected?.label || "--" }),
      /* @__PURE__ */ jsx("span", { style: { color: C.textDim, transform: open ? "rotate(180deg)" : "none", transition: "transform .16s ease" }, children: /* @__PURE__ */ jsx(Icon, { name: "chevron-down", size: 15 }) })
    ] }),
    open && /* @__PURE__ */ jsx("div", { role: "listbox", "aria-label": ariaLabel, style: { position: "absolute", left: 0, right: 0, ...placement === "top" ? { bottom: "calc(100% + 7px)" } : { top: "calc(100% + 7px)" }, zIndex: 160, minWidth: 132, maxHeight: 224, overflowY: "auto", padding: 5, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 6, boxShadow: C.shadow, scrollbarGutter: "stable" }, children: options.map((option) => /* @__PURE__ */ jsxs("button", { type: "button", role: "option", "aria-selected": option.value === value, onClick: () => {
      onChange(option.value);
      setOpen(false);
    }, style: { width: "100%", minHeight: 36, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 10px", border: "none", borderRadius: 4, background: option.value === value ? C.blueDark : "transparent", color: option.value === value ? C.blueLight : C.textMid, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: option.value === value ? 750 : 550, textAlign: "left" }, children: [
      /* @__PURE__ */ jsx("span", { children: option.label }),
      option.value === value && /* @__PURE__ */ jsx(Icon, { name: "check", size: 14 })
    ] }, option.value)) })
  ] });
}
var HOUR_OPTIONS = Array.from({ length: 24 }, (_, value) => ({ value, label: String(value).padStart(2, "0") }));
var MINUTE_OPTIONS = Array.from({ length: 60 }, (_, value) => ({ value, label: String(value).padStart(2, "0") }));
function DateTimeField({ label, value, onChange }) {
  const parsed = new Date(value);
  const selected = Number.isNaN(parsed.getTime()) ? /* @__PURE__ */ new Date() : parsed;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  const updateDate = (day) => {
    const next = new Date(selected);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(toDatetimeLocal(next));
  };
  const updateTime = (hour, minute) => {
    const next = new Date(selected);
    next.setHours(hour, minute, 0, 0);
    onChange(toDatetimeLocal(next));
  };
  const sameDay = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsx("span", { style: { display: "block", marginBottom: 6, color: C.textDim, fontSize: 11, fontWeight: 650 }, children: label }),
    /* @__PURE__ */ jsxs("button", { type: "button", "aria-label": label, "aria-haspopup": "dialog", "aria-expanded": open, onClick: () => {
      setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
      setOpen((value2) => !value2);
    }, style: { width: "100%", minHeight: 38, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 10px", color: C.text, background: C.panelSoft, border: `1px solid ${open ? C.blue : C.border}`, borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 650 }, children: [
      /* @__PURE__ */ jsx("span", { children: value ? value.replace("T", " ") : "--" }),
      /* @__PURE__ */ jsx("span", { style: { color: C.blueLight }, children: /* @__PURE__ */ jsx(Icon, { name: "calendar", size: 16 }) })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { role: "dialog", "aria-label": `${label}\u65E5\u671F\u65F6\u95F4\u9009\u62E9`, style: { position: "absolute", right: 0, top: "calc(100% + 7px)", zIndex: 150, width: "min(318px, calc(100vw - 64px))", boxSizing: "border-box", padding: 12, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 7, boxShadow: C.shadow }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)), style: calendarNavButtonStyle, children: /* @__PURE__ */ jsx(Icon, { name: "chevron-left", size: 17 }) }),
        /* @__PURE__ */ jsxs("strong", { style: { color: C.text, fontSize: 14 }, children: [
          viewMonth.getFullYear(),
          "\u5E74",
          viewMonth.getMonth() + 1,
          "\u6708"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)), style: calendarNavButtonStyle, children: /* @__PURE__ */ jsx(Icon, { name: "chevron-right", size: 17 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }, children: [
        ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].map((day) => /* @__PURE__ */ jsx("div", { style: { height: 26, display: "grid", placeItems: "center", color: C.textMuted, fontSize: 11, fontWeight: 700 }, children: day }, day)),
        days.map((day) => {
          const currentMonth = day.getMonth() === viewMonth.getMonth();
          const active = sameDay(day, selected);
          const today = sameDay(day, /* @__PURE__ */ new Date());
          return /* @__PURE__ */ jsx("button", { type: "button", onClick: () => updateDate(day), style: { height: 32, display: "grid", placeItems: "center", padding: 0, border: `1px solid ${active ? C.blue : today ? C.borderLight : "transparent"}`, borderRadius: 4, background: active ? C.blue : "transparent", color: active ? "#fff" : currentMonth ? C.textMid : C.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: active || today ? 750 : 500 }, children: day.getDate() }, toDatetimeLocal(day).slice(0, 10));
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 14px 1fr", alignItems: "center", gap: 7, marginTop: 11, paddingTop: 11, borderTop: `1px solid ${C.border}` }, children: [
        /* @__PURE__ */ jsx(StyledSelect, { ariaLabel: `${label}\u5C0F\u65F6`, value: selected.getHours(), options: HOUR_OPTIONS, onChange: (hour) => updateTime(hour, selected.getMinutes()), placement: "top" }),
        /* @__PURE__ */ jsx("span", { style: { color: C.textDim, textAlign: "center", fontWeight: 800 }, children: ":" }),
        /* @__PURE__ */ jsx(StyledSelect, { ariaLabel: `${label}\u5206\u949F`, value: selected.getMinutes(), options: MINUTE_OPTIONS, onChange: (minute) => updateTime(selected.getHours(), minute), placement: "top" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, marginTop: 11 }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          const now = /* @__PURE__ */ new Date();
          onChange(toDatetimeLocal(now));
          setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        }, style: { ...secondaryButton, minHeight: 32 }, children: "\u4ECA\u5929" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setOpen(false), style: { ...primaryButton, minHeight: 32 }, children: "\u786E\u5B9A" })
      ] })
    ] })
  ] });
}
function Pager({ current, total, totalItems, pageSize, onChange, onPageSizeChange }) {
  const [jumpPage, setJumpPage] = useState("");
  const applyJump = () => {
    const target = Math.max(1, Math.min(total, Number.parseInt(jumpPage, 10) || current));
    onChange(target);
    setJumpPage("");
  };
  return /* @__PURE__ */ jsxs("div", { style: paginationStyle, children: [
    /* @__PURE__ */ jsxs("span", { style: { color: C.textMid, whiteSpace: "nowrap" }, children: [
      "\u5171\u6709 ",
      totalItems,
      " \u6761\u4FE1\u606F"
    ] }),
    /* @__PURE__ */ jsx("button", { "aria-label": "\u4E0A\u4E00\u9875", disabled: current <= 1, onClick: () => onChange(current - 1), style: { ...pagerStyle, opacity: current <= 1 ? 0.45 : 1 }, children: "\u2039" }),
    pageTokens(current, total).map((token) => typeof token === "number" ? /* @__PURE__ */ jsx("button", { "aria-label": `\u7B2C${token}\u9875`, onClick: () => onChange(token), style: { ...pagerStyle, background: token === current ? "var(--dt-control)" : C.panel, color: token === current ? "var(--dt-control-text)" : C.textDim }, children: token }, `page-${token}`) : /* @__PURE__ */ jsx("span", { style: { minWidth: 30, textAlign: "center", color: C.textMuted }, children: "\u2026" }, token)),
    /* @__PURE__ */ jsx("button", { "aria-label": "\u4E0B\u4E00\u9875", disabled: current >= total, onClick: () => onChange(current + 1), style: { ...pagerStyle, opacity: current >= total ? 0.45 : 1 }, children: "\u203A" }),
    /* @__PURE__ */ jsx(StyledSelect, { ariaLabel: "\u6BCF\u9875\u6761\u6570", value: pageSize, options: [{ value: 10, label: "\u6BCF\u9875/10\u6761" }, { value: 20, label: "\u6BCF\u9875/20\u6761" }, { value: 50, label: "\u6BCF\u9875/50\u6761" }], onChange: onPageSizeChange, placement: "top", buttonStyle: { width: 132, height: 40, background: C.panel } }),
    /* @__PURE__ */ jsxs("label", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: C.textMid, whiteSpace: "nowrap" }, children: [
      "\u8DF3\u81F3",
      /* @__PURE__ */ jsx("input", { "aria-label": "\u8DF3\u8F6C\u9875\u7801", inputMode: "numeric", value: jumpPage, onChange: (event) => setJumpPage(event.target.value.replace(/\D/g, "")), onKeyDown: (event) => {
        if (event.key === "Enter") applyJump();
      }, onBlur: applyJump, style: jumpInputStyle }),
      "\u9875"
    ] })
  ] });
}
function Page() {
  const { isDark, viewportWidth } = useAegisOpsHostState();
  const brandLogo = useBrandLogo("datang-ai-v2-custom-brand-logo-v1");
  const brandNameKey = "tdp-custom-platform-name";
  const [brandName, setBrandName] = useState(() => {
    try {
      return localStorage.getItem(brandNameKey) || "AI \u7814\u5224\u5E73\u53F0";
    } catch {
      return "AI \u7814\u5224\u5E73\u53F0";
    }
  });
  const renamePlatform = () => {
    const value = window.prompt("\u8BBE\u7F6E\u5E73\u53F0\u540D\u79F0\uFF08\u7559\u7A7A\u6062\u590D\u9ED8\u8BA4\uFF09", brandName);
    if (value === null) return;
    const name = value.trim().slice(0, 60) || "AI \u7814\u5224\u5E73\u53F0";
    try {
      localStorage.setItem(brandNameKey, name);
    } catch {
    }
    setBrandName(name);
  };
  const isMobile = viewportWidth < 760;
  const isCompact = viewportWidth < 1080;
  const themeVars = isDark ? DARK_THEME_VARS : LIGHT_THEME_VARS;
  const initialNow = useRef(Date.now()).current;
  const initialTimeSetting = useRef(readTimeSetting(initialNow)).current;
  const [minutes, setMinutes] = useState(initialTimeSetting.minutes);
  const [timeMode, setTimeMode] = useState(initialTimeSetting.mode);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(initialTimeSetting.customStart);
  const [customEnd, setCustomEnd] = useState(initialTimeSetting.customEnd);
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);
  const [refreshMs, setRefreshMs] = useState(6e4);
  const [autoJudge, setAutoJudge] = useState(() => localStorage.getItem("datang-ai-v2-auto") === "1");
  const [tdp, setTdp] = useState({ rows: [], start_time: 0, end_time: 0 });
  const [trend, setTrend] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [detailIp, setDetailIp] = useState(null);
  const [outputOpen, setOutputOpen] = useState(false);
  const [vulnImports, setVulnImports] = useState({});
  const importLocks = useRef(/* @__PURE__ */ new Set());
  const importAlive = useRef(true);
  useEffect(() => {
    importAlive.current = true;
    return () => {
      importAlive.current = false;
    };
  }, []);
  const askAlertAI = async () => {
    try {
      const host = window.parent !== window ? window.parent : window;
      const ready = await new Promise((resolve) => {
        const id = crypto.randomUUID();
        const done2 = (ok) => {
          clearTimeout(timer);
          window.removeEventListener("message", receive);
          resolve(ok);
        };
        const receive = (event) => {
          if (event.origin === location.origin && event.source === host && event.data?.type === "aegis:scene-assistant-ready" && event.data.id === id) done2(true);
        };
        const timer = setTimeout(() => done2(false), 1800);
        window.addEventListener("message", receive);
        host.postMessage({ type: "aegis:scene-assistant-ping", id }, location.origin);
      });
      if (!ready) {
        const last = Number(host.sessionStorage.getItem("aegis-onboarding-reload") || 0);
        if (Date.now() - last < 6e4) throw Error("Atlas \u63A5\u5165\u9762\u677F\u672A\u80FD\u52A0\u8F7D\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002");
        host.sessionStorage.setItem("aegis-onboarding-reload", String(Date.now()));
        host.sessionStorage.setItem("aegis-onboarding-pending", String(Date.now()));
        host.location.reload();
        return;
      }
      const assistant = await loadSceneAssistant();
      assistant.open({ kind: "onboarding", title: "Atlas\u5FEB\u901F\u63A5\u5165\u4F7F\u7528", context: { environment: "production", visible_rows: rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({ ip: row.ip, ioc: row.ioc, threat_name: row.threat_name, threat_type: row.threat_type, severity: row.severity, count: row.count, first_time: row.first_time, last_time: row.last_time, dst_ip: row.dst_ip, ai_status: row.ai_status })), scope: "\u4EC5\u5F53\u524D\u5206\u9875\u53EF\u89C1\u6570\u636E", time_range: { start: tdp.start_time, end: tdp.end_time } } });
    } catch (e) {
      alert(e.message || "AI \u52A9\u624B\u6682\u4E0D\u53EF\u7528");
    }
  };
  const [irBusy, setIrBusy] = useState(false);
  const [irMessage, setIrMessage] = useState("");
  const [irUrl, setIrUrl] = useState("");
  const transferIncident = async (row) => {
    if (irBusy || !confirm("\u786E\u8BA4\u6B64\u544A\u8B66\u653B\u51FB\u6210\u529F\u5E76\u4E0B\u53D1\u5E94\u6025\u54CD\u5E94\uFF1F\u5E73\u53F0\u5C06\u81EA\u52A8\u67E5\u8BE2\u5173\u8054 IP \u7684\u8BBE\u5907\u65E5\u5FD7\u3002\u8FDC\u7A0B\u4E0A\u673A\u4E0E\u6837\u672C\u5916\u53D1\u9700\u8981\u53E6\u884C\u786E\u8BA4\u3002")) return;
    setIrBusy(true);
    setIrMessage("");
    setIrUrl("");
    try {
      const response = await fetch("/api/scenes/incident/from-alert", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row_key: rowKey(row), first_time: row.first_time, confirmed: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "\u4E0B\u53D1\u5931\u8D25");
      setIrUrl(result.url);
      window.location.assign(result.url);
    } catch (e) {
      setIrMessage(e.message || "\u5E94\u6025\u4E0B\u53D1\u5931\u8D25");
    } finally {
      setIrBusy(false);
    }
  };
  const transferVulnerability = async (row) => {
    const key = rowKey(row);
    if (importLocks.current.has(key)) return;
    importLocks.current.add(key);
    const update = (state) => {
      if (importAlive.current) setVulnImports((prev) => ({ ...prev, [key]: state }));
    };
    update({ status: "pending" });
    try {
      const response = await fetch("/api/scenes/tdp/vulnerability-imports", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "ai", row_key: key, first_time: row.first_time, confirmed: true }) });
      let result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.message || "\u8F6C\u5165\u5931\u8D25");
      for (let attempt = 0; result.status === "pending" && attempt < 100; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!importAlive.current) return;
        const poll = await fetch("/api/scenes/tdp/vulnerability-imports/" + result.id, { credentials: "same-origin" });
        const next = await poll.json();
        if (!poll.ok) throw new Error(next.detail || next.message || "\u65E0\u6CD5\u83B7\u53D6\u5199\u5165\u8FDB\u5EA6");
        result = next;
      }
      if (result.status === "pending") throw new Error("AI \u4ECD\u5728\u540E\u53F0\u5904\u7406\uFF0C\u53EF\u518D\u6B21\u70B9\u51FB\u67E5\u770B\u7ED3\u679C\uFF0C\u4E0D\u4F1A\u91CD\u590D\u5EFA\u6863\u3002");
      if (result.status === "failed") throw new Error(result.error || "AI \u5EFA\u6863\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
      update({ status: "completed", url: result.url });
    } catch (error2) {
      update({ status: "failed", error: error2 instanceof Error ? error2.message : "\u8F6C\u5165\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" });
    } finally {
      importLocks.current.delete(key);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [currentModel, setCurrentModel] = useState({ providerId: "", modelId: "", error: "" });
  const requestSeq = useRef(0);
  const lastTrendRangeRef = useRef("");
  const launchingRef = useRef(/* @__PURE__ */ new Set());
  const loadDashboard = useCallback(async (quiet = false) => {
    const seq = ++requestSeq.current;
    if (!quiet) setLoading(true);
    try {
      const params = { auto: autoJudge ? 1 : 0, _: Date.now() };
      if (timeMode === "custom") {
        params.start_time = Math.floor(new Date(customStart).getTime() / 1e3);
        params.end_time = Math.floor(new Date(customEnd).getTime() / 1e3);
      } else {
        params.minutes = minutes;
      }
      const trendRangeKey = timeMode === "custom" ? `custom:${customStart}:${customEnd}` : `preset:${minutes}`;
      params.trend_refresh = lastTrendRangeRef.current === trendRangeKey ? timeMode === "preset" ? "current" : "none" : "range";
      const response = await api.page.get("/dashboard", { params });
      const payload = response.data;
      if (!payload?.ok) throw new Error(payload?.error || "\u770B\u677F\u6570\u636E\u83B7\u53D6\u5931\u8D25");
      if (seq !== requestSeq.current) return;
      const latest = payload.data.tdp || { rows: [], start_time: 0, end_time: 0 };
      setTdp((current) => ({
        ...latest,
        rows: (latest.rows || []).map((row) => mergeDashboardRow(
          row,
          current.rows.find((item) => rowKey(item) === rowKey(row))
        ))
      }));
      setTrend(payload.trend || {});
      setUpdatedAt(payload.fetched_at || Math.floor(Date.now() / 1e3));
      lastTrendRangeRef.current = trendRangeKey;
      setError("");
    } catch (e) {
      if (seq === requestSeq.current) setError(e instanceof Error ? e.message : "\u770B\u677F\u6570\u636E\u83B7\u53D6\u5931\u8D25");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [minutes, timeMode, customStart, customEnd, autoJudge]);
  useEffect(() => {
    setPage(1);
    void loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    if (!refreshMs) return;
    const timer = window.setInterval(() => void loadDashboard(true), refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs, loadDashboard]);
  useEffect(() => {
    const loadModel = async () => {
      try {
        const response = await api.get("/api/default-model/resolved");
        setCurrentModel({
          providerId: String(response.data?.provider_id || ""),
          modelId: String(response.data?.model_id || ""),
          error: ""
        });
      } catch {
        setCurrentModel({ providerId: "", modelId: "", error: "\u672A\u914D\u7F6E" });
      }
    };
    void loadModel();
    const timer = window.setInterval(() => void loadModel(), 6e4);
    return () => window.clearInterval(timer);
  }, []);
  const launchJudgement = useCallback(async (row, secondRound = false) => {
    const launchKey = `${rowKey(row)}:${secondRound ? 2 : 1}`;
    if (launchingRef.current.has(launchKey)) return;
    launchingRef.current.add(launchKey);
    try {
      const prepared = await api.page.post("/judgement/prepare", {
        ip: row.ip,
        start_time: tdp.start_time,
        end_time: tdp.end_time,
        alert_time: row.last_time || tdp.end_time,
        alert_context: {
          threat_name: row.threat_name || "",
          ioc: row.ioc || row.ip,
          severity: row.severity || "",
          count: row.count,
          threat_type: row.threat_type || "",
          is_cdn: Boolean(row.is_cdn),
          is_exit: Boolean(row.is_exit),
          geo_data: row.geo_data || {},
          src_ip_geo_data: row.src_ip_geo_data || {},
          distributed_scan_campaign: Boolean(row.distributed_scan_campaign),
          scan_campaign_family: row.scan_campaign_family || "",
          scan_campaign_source_count: row.scan_campaign_source_count || 0,
          scan_campaign_event_count: row.scan_campaign_event_count || 0,
          scan_campaign_target_count: row.scan_campaign_target_count || 0,
          scan_campaign_same_target_source_count: row.scan_campaign_same_target_source_count || 0,
          scan_campaign_window_seconds: row.scan_campaign_window_seconds || 0,
          scan_campaign_start_time: row.scan_campaign_start_time || 0,
          scan_campaign_end_time: row.scan_campaign_end_time || 0,
          scan_campaign_source_ips: row.scan_campaign_source_ips || [],
          aggregation_type: row.aggregation_type || "",
          aggregation_key: row.aggregation_key || "",
          grouped_row_count: row.grouped_row_count || 0,
          grouped_ips: row.grouped_ips || [],
          grouped_targets: row.grouped_targets || [],
          grouped_ports: row.grouped_ports || []
        },
        second_round: secondRound,
        first_judgement: secondRound ? {
          verdict: row.ai_verdict,
          ban_decision: row.ai_ban_decision,
          confidence: row.ai_confidence,
          summary: row.ai_summary,
          evidence: row.ai_evidence || [],
          severity: row.ai_severity || "\u672A\u77E5",
          attack_outcome: row.ai_attack_outcome || "\u5C1D\u8BD5/\u672A\u77E5",
          compromise_status: row.ai_compromise_status || "\u65E0\u6CD5\u786E\u8BA4",
          supporting_evidence: row.ai_supporting_evidence || [],
          contradicting_evidence: row.ai_contradicting_evidence || [],
          missing_information: row.ai_missing_information || [],
          affected_targets: row.ai_affected_targets || [],
          key_iocs: row.ai_key_iocs || [],
          human_checkpoints: row.ai_human_checkpoints || []
        } : void 0
      });
      if (!prepared.data?.ok) throw new Error(prepared.data?.error || "\u7814\u5224\u51C6\u5907\u5931\u8D25");
      const workflowId = String(prepared.data.workflow_id || "");
      if (!workflowId || !prepared.data.inputs) throw new Error("\u56FA\u5B9A\u7814\u5224\u5DE5\u4F5C\u6D41\u914D\u7F6E\u7F3A\u5931");
      const execution = await api.post(`/api/workflow/${encodeURIComponent(workflowId)}/run`, {
        inputs: prepared.data.inputs,
        timeoutS: 900,
        trace: false,
        agent: prepared.data.agent
      });
      const executionId = execution.data?.id;
      if (!executionId) throw new Error("AegisOps \u5DE5\u4F5C\u6D41\u542F\u52A8\u5931\u8D25");
      await api.page.post("/judgement/register", {
        task_key: prepared.data.task_key,
        workflow_id: workflowId,
        execution_id: executionId
      });
      setTdp((current) => ({ ...current, rows: current.rows.map((item) => rowKey(item) === rowKey(row) ? mergeAi(item, {
        status: "pending",
        phase: "queued",
        label: "\u961F\u5217\u4E2D",
        progress: "\u7B49\u5F85\u56FA\u5B9A\u5DE5\u4F5C\u6D41\u6267\u884C",
        task_key: prepared.data.task_key,
        workflow_id: workflowId,
        execution_id: executionId
      }) : item) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "\u7814\u5224\u63D0\u4EA4\u5931\u8D25");
    } finally {
      launchingRef.current.delete(launchKey);
    }
  }, [tdp.start_time, tdp.end_time]);
  const pendingRows = useMemo(() => tdp.rows.filter((row) => row.ai_status === "pending" && row.ai_task_key), [tdp.rows]);
  useEffect(() => {
    if (!pendingRows.length) return;
    const poll = async () => {
      const updates = await Promise.all(pendingRows.slice(0, MAX_AI_CONCURRENCY).map(async (row) => {
        try {
          const status = await api.page.get("/judgement/status", { params: { task_key: row.ai_task_key, _: Date.now() } });
          if (status.data?.ai?.status !== "pending") {
            return status.data?.ok ? { key: rowKey(row), ai: status.data.ai } : null;
          }
          const workflowId = String(status.data?.ai?.workflow_id || row.ai_workflow_id || "");
          const executionId = String(status.data?.ai?.execution_id || row.ai_execution_id || "");
          if (workflowId && executionId) {
            const run = await api.get(`/api/workflow/${encodeURIComponent(workflowId)}/history/${encodeURIComponent(executionId)}`);
            const runStatus = String(run.data?.status || "running");
            if (runStatus === "success" && run.data?.outputResults?.judgement) {
              const completed = await api.page.post("/judgement/complete", {
                task_key: row.ai_task_key,
                result: run.data.outputResults.judgement,
                raw_output: run.data.outputResults.judgement.raw_output || ""
              });
              return completed.data?.ok ? { key: rowKey(row), ai: {
                status: "done",
                phase: "done",
                label: "\u5DF2\u5B8C\u6210",
                ...completed.data.result,
                task_key: row.ai_task_key,
                workflow_id: workflowId,
                execution_id: executionId
              } } : null;
            }
            if (["error", "timeout", "cancelled"].includes(runStatus)) {
              const failed = await api.page.post("/judgement/fail", {
                task_key: row.ai_task_key,
                error: run.data?.errorMessage || `\u56FA\u5B9A\u5DE5\u4F5C\u6D41\u6267\u884C${runStatus}`
              });
              return failed.data?.ok ? { key: rowKey(row), ai: failed.data.ai } : null;
            }
          }
          return status.data?.ok ? { key: rowKey(row), ai: status.data.ai } : null;
        } catch {
          return null;
        }
      }));
      setTdp((current) => ({ ...current, rows: current.rows.map((row) => {
        const update = updates.find((item) => item?.key === rowKey(row));
        return update ? mergeAi(row, update.ai) : row;
      }) }));
    };
    const timer = window.setInterval(() => void poll(), 3e3);
    return () => window.clearInterval(timer);
  }, [pendingRows.map((row) => `${rowKey(row)}:${row.ai_task_key}:${row.ai_execution_id}`).join("|")]);
  useEffect(() => {
    if (!autoJudge || !tdp.start_time || !tdp.end_time) return;
    const active = tdp.rows.filter((row) => row.ai_status === "pending").length + launchingRef.current.size;
    const available = Math.max(0, MAX_AI_CONCURRENCY - active);
    if (!available) return;
    const candidates = tdp.rows.filter((row) => (!row.ai_status || row.ai_status === "none") && row.count >= 1).filter((row) => !launchingRef.current.has(`${rowKey(row)}:1`)).slice(0, available);
    candidates.forEach((row) => {
      void launchJudgement(row, false);
    });
  }, [autoJudge, tdp.start_time, tdp.end_time, tdp.rows, launchJudgement]);
  const startJudge = async (row) => {
    await launchJudgement(row, false);
  };
  const openDetail = async (row) => {
    setDetailIp(rowKey(row));
    if (row.ai_status !== "done" && row.ai_status !== "pending") return;
    try {
      const response = await api.page.get("/judgement/status", { params: { task_key: row.ai_task_key || "", ip: row.ip, _: Date.now() } });
      if (!response.data?.ok || !response.data?.ai) return;
      setTdp((current) => ({ ...current, rows: current.rows.map((item) => rowKey(item) === rowKey(row) ? mergeAi(item, response.data.ai) : item) }));
    } catch {
    }
  };
  const openWorkbench = async (row) => {
    try {
      if (row.ai_workflow_id) {
        window.location.assign(`/workflows/${encodeURIComponent(row.ai_workflow_id)}`);
        return;
      }
      if (row.ai_session_id) {
        window.location.assign(`/sessions?session=${encodeURIComponent(row.ai_session_id)}`);
        return;
      }
      const prefix = `TDP-judgement-${row.ip}-`;
      const response = await api.get("/api/session", {
        params: { view: "list", status: "all", search: prefix, limit: 100 }
      });
      const sessions = Array.isArray(response.data) ? response.data : [];
      const matches = sessions.filter((item) => String(item?.title || "").startsWith(prefix)).sort((a, b) => Number(b?.time?.updated || b?.time?.created || 0) - Number(a?.time?.updated || a?.time?.created || 0));
      if (!matches.length || !matches[0]?.id) throw new Error("\u672A\u627E\u5230\u8BE5 IP \u7684 AegisOps \u7814\u5224\u4F1A\u8BDD");
      window.location.assign(`/sessions?session=${encodeURIComponent(matches[0].id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "\u7814\u5224\u5DE5\u4F5C\u53F0\u6253\u5F00\u5931\u8D25");
    }
  };
  const rows = useMemo(() => [...tdp.rows || []].sort((left, right) => {
    const rightTime = Number(right.last_time || right.first_time || 0);
    const leftTime = Number(left.last_time || left.first_time || 0);
    if (rightTime !== leftTime) return rightTime - leftTime;
    return String(left.ip).localeCompare(String(right.ip));
  }), [tdp.rows]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const done = rows.filter((r) => r.ai_status === "done").length;
  const pending = rows.filter((r) => r.ai_status === "pending").length;
  const detail = detailIp ? rows.find((r) => rowKey(r) === detailIp) : void 0;
  const cards = [
    ["\u6C47\u603B\u653B\u51FB", tdp.event_total ?? rows.reduce((s, r) => s + Number(r.count || 0), 0)],
    ["\u8BBE\u5907\u544A\u8B66", tdp.event_total ?? 0],
    ["\u653B\u51FB IP \u6570", rows.length],
    ["AI \u5DF2\u7814\u5224", done],
    ["AI \u7814\u5224\u4E2D", pending],
    ["AI \u7814\u5224\u7387", rows.length ? `${(done / rows.length * 100).toFixed(1)}%` : "0.0%"]
  ];
  const metricCards = [
    { label: "\u6C47\u603B\u653B\u51FB", value: cards[0][1], hint: "\u5F53\u524D\u65F6\u95F4\u8303\u56F4\u4E8B\u4EF6\u603B\u91CF", icon: "activity", accent: C.blue, soft: C.blueDark },
    { label: "\u8BBE\u5907\u544A\u8B66", value: cards[1][1], hint: "\u5DF2\u63A5\u5165\u8BBE\u5907\u544A\u8B66\u6C47\u603B", icon: "shield", accent: C.cyan, soft: C.cyanDark },
    { label: "\u653B\u51FB IP \u6570", value: cards[2][1], hint: "\u6309\u653B\u51FB\u6E90\u53BB\u91CD\u7EDF\u8BA1", icon: "chart", accent: C.red, soft: C.redDark },
    { label: "AI \u5DF2\u7814\u5224", value: cards[3][1], hint: "\u5DF2\u5F62\u6210\u5904\u7F6E\u5EFA\u8BAE", icon: "bot", accent: C.green, soft: C.greenDark },
    { label: "AI \u7814\u5224\u4E2D", value: cards[4][1], hint: "\u6B63\u5728\u6392\u961F\u6216\u8FD0\u884C", icon: "spark", accent: C.orange, soft: C.orangeDark },
    { label: "AI \u7814\u5224\u7387", value: cards[5][1], hint: "\u5B8C\u6210\u6570 / \u653B\u51FB IP \u6570", icon: "clock", accent: C.blue, soft: C.blueDark }
  ];
  const timeControlValue = timeMode === "custom" ? "\u81EA\u5B9A\u4E49\u65F6\u95F4" : TIME_PRESETS.find((item) => item.minutes === minutes)?.label || "\u6700\u8FD12\u5C0F\u65F6";
  const syncText = error ? "\u8FDE\u63A5\u5F02\u5E38" : loading ? "\u540C\u6B65\u4E2D" : refreshMs ? "\u5DF2\u540C\u6B65" : "\u624B\u52A8\u5237\u65B0";
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  return /* @__PURE__ */ jsxs("div", { "data-aegisops-theme": isDark ? "dark" : "light", "data-layout": isMobile ? "mobile" : isCompact ? "compact" : "desktop", style: { ...themeVars, background: C.pageBg, width: "100%", height: "100vh", minHeight: 0, color: C.text, fontFamily: FONT, margin: isCompact ? -12 : -16, transition: "background-color .18s ease, color .18s ease", overflowX: "hidden", overflowY: "auto", scrollbarGutter: "stable" }, children: [
    /* @__PURE__ */ jsx("style", { children: `[data-aegisops-theme] { -webkit-font-smoothing: antialiased; letter-spacing: 0; scrollbar-width: thin; scrollbar-color: var(--dt-border-strong) transparent; }
      [data-aegisops-theme] button { font-family: inherit; transition: background .16s ease, box-shadow .16s ease; }
      [data-aegisops-theme] button:enabled:hover { filter: brightness(.97); }
      [data-aegisops-theme] .dt-detail-button:hover { background: var(--dt-blue-bg) !important; }
      [data-aegisops-theme] button:disabled { cursor: not-allowed; }
      [data-aegisops-theme] button:focus-visible { outline: 2px solid var(--dt-blue); outline-offset: 3px; }
      [data-aegisops-theme] tbody tr:hover { background: var(--dt-blue-bg) !important; }
      [data-aegisops-theme] svg { flex-shrink: 0; }
      [data-aegisops-theme] { --dt-ease: cubic-bezier(.16,1,.3,1); }
      [data-aegisops-theme] .dt-metric { animation: dt-enter .55s var(--dt-ease) backwards; transition: box-shadow .22s ease, border-color .22s ease; }
      [data-aegisops-theme] .dt-metric:hover { border-color: var(--dt-border-strong); box-shadow: 0 4px 16px rgba(46,58,62,.07); }
      [data-aegisops-theme] button { transition: background .18s ease, color .18s ease, box-shadow .22s ease, transform .22s var(--dt-ease) !important; }
      [data-aegisops-theme] button:enabled:active { transform: translateY(1px); }
      [data-aegisops-theme] button:disabled { transform: none; }
      .dt-trend-bar { transform-box: fill-box; transform-origin: center bottom; animation: dt-bar-grow .7s var(--dt-ease) backwards; }
      .dt-trend-curve { animation: dt-curve-draw .9s var(--dt-ease) .12s backwards; }
      .dt-report-dialog { animation: dt-dialog-open .3s var(--dt-ease) both; }
      .dt-report-content { animation: dt-panel-enter .23s var(--dt-ease); }
      .dt-report-tabs button { transition: color .16s ease, border-color .2s ease !important; }
      [data-aegisops-theme] [role=progressbar] > span { animation: dt-progress-grow .65s var(--dt-ease) backwards; transform-origin: left center; }
      @keyframes dt-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes dt-bar-grow { from { opacity: .15; transform: scaleY(.08); } to { opacity: 1; transform: none; } }
      @keyframes dt-progress-grow { from { opacity: .2; transform: scaleX(.06); } to { opacity: 1; transform: none; } }
      @keyframes dt-curve-draw { from { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; } to { stroke-dasharray: 1; stroke-dashoffset: 0; opacity: 1; } }
      @keyframes dt-dialog-open { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
      @keyframes dt-panel-enter { from { opacity: .3; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { [data-aegisops-theme] *, [data-aegisops-theme] *::before, [data-aegisops-theme] *::after { animation: none !important; transition: none !important; transform: none !important; scroll-behavior: auto !important; } }
      @media (hover:hover) { [data-aegisops-theme] button:enabled:hover { box-shadow: 0 3px 10px rgba(46,58,62,.08); } }
      .dt-report-dialog, .dt-report-dialog * { font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif !important; letter-spacing: 0 !important; font-synthesis: none; }
      .dt-report-dialog { font-size: 13px; line-height: 1.7; font-weight: 400; font-variant-numeric: tabular-nums; }
      .dt-report-dialog button { font-size: 13px; font-weight: 600; }
      .dt-report-dialog .dt-report-content { font-size: 13px; font-weight: 400; }
      .dt-report-dialog .dt-report-heading { font-size: 15px; font-weight: 650; }
      .dt-report-dialog code { font-size: 12px !important; font-weight: 500 !important; }
      .dt-report-dialog pre { font-size: 12px !important; font-weight: 400 !important; line-height: 1.7 !important; }
      .dt-report-dialog strong { font-weight: 650; }
      .dt-report-summary { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(0, 1.7fr); gap: 24px; padding: 22px 28px; border-bottom: 1px solid var(--dt-border); background: var(--dt-panel); }
      .dt-report-metrics { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
      .dt-report-tabs { flex: 0 0 auto; display: flex; padding: 0 28px; background: var(--dt-panel-soft); border-bottom: 1px solid var(--dt-border); }
      .dt-report-content { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 24px 28px; scrollbar-gutter: stable; }
      .dt-report-columns { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 24px; }
      .dt-report-heading { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 700; color: var(--dt-text); }
      .dt-report-section { padding-top: 22px; margin-top: 22px; border-top: 1px solid var(--dt-border); }
      .dt-overview-fields { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 28px; margin: 12px 0 0; }
      @media (max-width:1080px) { .dt-report-summary { grid-template-columns: minmax(0,1fr); gap: 18px; } .dt-report-columns { grid-template-columns: minmax(0,1fr); } }
      @media (max-width:760px) { .dt-report-summary { padding: 16px; } .dt-report-metrics { grid-template-columns: repeat(2,minmax(0,1fr)); } .dt-report-content { padding: 18px 16px; } .dt-report-tabs { padding: 0 16px; } .dt-overview-fields { grid-template-columns: minmax(0,1fr); } }
      .dt-trend-body { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 18px; align-items: center; padding: 12px; min-width: 0; }
      .dt-ring-visual { position: relative; min-width: 0; }
      .dt-ring-motion { position:absolute; z-index:1; top:0; right:0; display:grid; place-items:center; width:26px; height:26px;
        color:var(--dt-text-dim); background:var(--dt-panel-soft); border:1px solid var(--dt-border); border-radius:8px; cursor:pointer; }
      .dt-ring-motion:focus-visible { outline:2px solid var(--dt-blue); outline-offset:2px; }
      .dt-ring-ticks { transform-origin:120px 120px; }
      .dt-ring-ticks[data-breathing="on"] { animation:dt-alert-ring-breathe 3.2s ease-in-out infinite; }
      @keyframes dt-alert-ring-breathe { 0%,100% { opacity:.34; transform:scale(.98); } 50% { opacity:1; transform:scale(1.045); } }
      .dt-ring-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; align-items: center; min-width: 0; }
      [data-aegisops-theme] * { font-family: inherit; }
      [data-aegisops-theme] code, [data-aegisops-theme] pre { font-family: Consolas, monospace; }
      @media (max-width: 760px) { .dt-trend-body { grid-template-columns: minmax(0, 1fr); } .dt-trend-body > div:first-child { flex-direction: row !important; flex-wrap: wrap; align-items: center; justify-content: space-between !important; } }
      [data-layout="mobile"] [data-tdp-controls] { gap: 8px !important; }
      [data-layout="mobile"] header { padding: 16px 12px !important; }
      [data-layout="mobile"] h1 { font-size: 18px !important; }
      @media (prefers-reduced-motion: reduce) { [data-aegisops-theme] * { transition: none !important; } }

 .review-atlas-entry,.review-refresh{background:linear-gradient(120deg,#b6e583,#9dd464)!important;color:#314e20!important;border:1px solid #9bc967!important;border-radius:10px!important;min-height:38px!important;font-size:13px!important;font-weight:600!important;box-shadow:0 3px 9px #648c351a!important;transition:background .18s,box-shadow .18s,transform .18s}
 .review-atlas-entry:hover,.review-refresh:hover{background:linear-gradient(120deg,#a8dc71,#90c956)!important;box-shadow:0 4px 12px #648c3529!important;transform:translateY(-1px)}
 .review-atlas-entry:active,.review-refresh:active{transform:translateY(0)}
 .review-atlas-entry:focus-visible,.review-refresh:focus-visible{outline:3px solid #99c96766;outline-offset:3px}
 .review-sync-chip{background:#f0f6e9!important;border-color:#dfe9d3!important;color:#6a844b!important;font-size:12px!important;font-weight:600;min-height:34px!important;border-radius:8px!important}
 .review-time-chip{background:#f5f7f7!important;border-color:#e4e9e9!important;color:#7c898f!important;font-size:12px!important;font-weight:500;font-variant-numeric:tabular-nums;min-height:34px!important;border-radius:8px!important}
 [data-tdp-stat]{min-height:48px!important;background:linear-gradient(115deg,#f2f7ec,#fff)!important;border-color:#e1ead9!important;border-radius:10px!important;box-shadow:none!important;padding:9px 13px!important}
 [data-tdp-stat]>span:first-child{background:#e8f2dc!important;color:#6a9142!important;border-radius:9px!important;width:30px!important;height:30px!important}
 [data-tdp-stat]>span:last-child>span{color:#4f5e57!important;font-size:13px!important;font-weight:600!important;line-height:1.4!important}
 [data-tdp-stat] small{color:#839087!important;font-size:12px!important;font-weight:400!important;line-height:1.5!important}

    ` }),
    /* @__PURE__ */ jsxs("nav", { "aria-label": "\u7814\u5224\u73AF\u5883\u5207\u6362", style: { display: "flex", gap: 8, padding: "12px 24px", borderBottom: `1px solid ${C.border}`, background: C.panel }, children: [
      /* @__PURE__ */ jsx("a", { href: "/contracts/webui/workspaces/tdp_ai/ai", "aria-current": "page", style: { padding: "7px 18px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600, background: "#edf4e5", color: "#526e3d" }, children: "\u6B63\u5F0F\u7814\u5224" }),
      /* @__PURE__ */ jsx("a", { href: "/contracts/webui/workspaces/tdp_ai/ai-demo", "aria-current": void 0, style: { padding: "7px 18px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600, background: "transparent", color: C.textMuted }, children: "\u6F14\u793A\u5E73\u53F0" })
    ] }),
    /* @__PURE__ */ jsxs("header", { style: topbarStyle, children: [
      /* @__PURE__ */ jsxs("div", { style: brandStyle, children: [
        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u66F4\u6362 Logo", title: "\u70B9\u51FB\u66F4\u6362 Logo", onClick: brandLogo.chooseLogo, style: brandLogoStyle, children: brandLogo.logo ? /* @__PURE__ */ jsx("img", { src: brandLogo.logo, alt: "\u5DE5\u4F5C\u53F0 Logo", style: { maxWidth: isMobile ? 160 : 220, height: isMobile ? 24 : 28, objectFit: "contain" } }) : /* @__PURE__ */ jsx("img", { "data-scene-logo": "review", src: "/api/scenes/assistant/logos/review.svg", alt: "\u6001\u52BF\u611F\u77E5 AI \u7814\u5224 Logo", style: { width: 48, height: 48, objectFit: "contain" } }) }),
          /* @__PURE__ */ jsx("input", { ref: brandLogo.inputRef, type: "file", accept: "image/png,image/jpeg,image/webp,image/svg+xml", onChange: brandLogo.onLogoChange, style: { display: "none" } }),
          brandLogo.logo && /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u6062\u590D\u9ED8\u8BA4 Logo", title: "\u6062\u590D\u9ED8\u8BA4 Logo", onClick: brandLogo.resetLogo, style: resetLogoButtonStyle, children: "\xD7" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("h1", { style: brandTitleStyle, children: /* @__PURE__ */ jsx("button", { type: "button", onClick: renamePlatform, title: "\u70B9\u51FB\u81EA\u5B9A\u4E49\u5E73\u53F0\u540D\u79F0", "aria-label": "\u4FEE\u6539\u5E73\u53F0\u540D\u79F0", style: { font: "inherit", color: "inherit", background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }, children: brandName }) }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 4, color: C.textDim, fontSize: 12, fontWeight: 600 }, children: "\u8BBE\u5907\u544A\u8B66\u6C47\u603B\u3001AI \u7814\u5224\u4E0E\u54CD\u5E94\u8054\u52A8" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }, children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: "review-atlas-entry", onClick: () => void askAlertAI(), style: { ...secondaryButton, color: "#526d42", borderColor: "#d8e4cc", background: "#f3f7ee" }, children: [
          /* @__PURE__ */ jsx(Icon, { name: "spark", size: 15 }),
          "Atlas\u5FEB\u901F\u63A5\u5165\u4F7F\u7528"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "review-sync-chip", style: chipStyle, children: [
          /* @__PURE__ */ jsx("span", { style: { ...statusDotStyle, background: error ? C.red : loading ? C.orange : C.green } }),
          syncText
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "review-time-chip", style: chipStyle, children: [
          /* @__PURE__ */ jsx(Icon, { name: "clock", size: 16 }),
          error || fmtTime(updatedAt)
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "review-refresh", title: "\u7ACB\u5373\u5237\u65B0", onClick: () => void loadDashboard(), style: primaryButton, children: [
          /* @__PURE__ */ jsx(Icon, { name: "refresh", size: 16 }),
          loading ? "\u5237\u65B0\u4E2D" : "\u5237\u65B0"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, padding: isMobile ? 12 : "20px 28px 32px", alignItems: "start", minHeight: "calc(100vh - 68px)" }, children: /* @__PURE__ */ jsxs("main", { className: "dt-dashboard-main", style: { display: "grid", gap: 14, minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("section", { style: { padding: 0 }, children: /* @__PURE__ */ jsxs("div", { "data-tdp-controls": true, style: { display: "grid", gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : isCompact ? "repeat(2, minmax(0, 1fr))" : "1.05fr .8fr .95fr 1fr 1.15fr", gap: 12, alignItems: "stretch" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { ...syncFieldStyle, position: "relative", padding: 0 }, children: [
          /* @__PURE__ */ jsxs("button", { type: "button", "aria-label": "\u65F6\u95F4\u8303\u56F4", "aria-expanded": timePickerOpen, onClick: () => {
            setDraftStart(customStart);
            setDraftEnd(customEnd);
            setTimePickerOpen((open) => !open);
          }, style: { width: "100%", height: "100%", minHeight: 58, border: "none", background: "transparent", color: C.text, textAlign: "left", cursor: "pointer", padding: "10px 12px" }, children: [
            /* @__PURE__ */ jsx("span", { style: syncLabelStyle, children: "\u65F6\u95F4\u8303\u56F4" }),
            /* @__PURE__ */ jsxs("span", { style: syncValueStyle, children: [
              /* @__PURE__ */ jsx("span", { children: timeControlValue }),
              /* @__PURE__ */ jsx("small", { children: "\u25BE" })
            ] })
          ] }),
          timePickerOpen && /* @__PURE__ */ jsxs("div", { style: { position: "absolute", right: isMobile ? "auto" : 0, left: isMobile ? 0 : "auto", top: "calc(100% + 8px)", zIndex: 80, width: isMobile ? "min(340px, calc(100vw - 42px))" : 360, boxSizing: "border-box", padding: 14, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 8, boxShadow: C.shadow }, children: [
            /* @__PURE__ */ jsx("div", { style: { color: C.textMid, fontSize: 12, fontWeight: 650, marginBottom: 8 }, children: "\u5FEB\u6377\u65F6\u95F4" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 13 }, children: TIME_PRESETS.map((item) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
              setMinutes(item.minutes);
              setTimeMode("preset");
              saveTimeSetting("preset", item.minutes, customStart, customEnd);
              setTimePickerOpen(false);
            }, style: { padding: "7px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: timeMode === "preset" && minutes === item.minutes ? C.blueDark : C.panelSoft, color: timeMode === "preset" && minutes === item.minutes ? C.blueLight : C.textMid, border: `1px solid ${timeMode === "preset" && minutes === item.minutes ? C.blue : C.border}` }, children: item.label }, item.minutes)) }),
            /* @__PURE__ */ jsx("div", { style: { color: C.textMid, fontSize: 12, fontWeight: 650, marginBottom: 8 }, children: "\u81EA\u5B9A\u4E49\u65F6\u95F4" }),
            /* @__PURE__ */ jsx(DateTimeField, { label: "\u5F00\u59CB\u65F6\u95F4", value: draftStart, onChange: setDraftStart }),
            /* @__PURE__ */ jsx("div", { style: { marginTop: 9 }, children: /* @__PURE__ */ jsx(DateTimeField, { label: "\u7ED3\u675F\u65F6\u95F4", value: draftEnd, onChange: setDraftEnd }) }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 13 }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setTimePickerOpen(false), style: secondaryButton, children: "\u53D6\u6D88" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
                const nextStart = draftStart;
                const nextEnd = draftEnd;
                const start = new Date(nextStart).getTime();
                const end = new Date(nextEnd).getTime();
                if (!nextStart || !nextEnd || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
                  setError("\u81EA\u5B9A\u4E49\u7ED3\u675F\u65F6\u95F4\u5FC5\u987B\u665A\u4E8E\u5F00\u59CB\u65F6\u95F4");
                  return;
                }
                setCustomStart(nextStart);
                setCustomEnd(nextEnd);
                setTimeMode("custom");
                saveTimeSetting("custom", minutes, nextStart, nextEnd);
                setTimePickerOpen(false);
              }, style: primaryButton, children: "\u5E94\u7528" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: syncFieldStyle, children: [
          /* @__PURE__ */ jsx("span", { style: syncLabelStyle, children: "\u5237\u65B0\u9891\u7387" }),
          /* @__PURE__ */ jsx(StyledSelect, { ariaLabel: "\u5237\u65B0\u9891\u7387", value: refreshMs, options: [{ value: 5e3, label: "5\u79D2" }, { value: 3e4, label: "30\u79D2" }, { value: 6e4, label: "1\u5206\u949F" }, { value: 0, label: "\u5DF2\u5173\u95ED" }], onChange: setRefreshMs, buttonStyle: { minHeight: 24, padding: 0, background: "transparent", border: "none", color: C.text, fontSize: 15, justifyContent: "space-between" } })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", role: "switch", "aria-label": "AI\u81EA\u52A8\u7814\u5224", "aria-checked": autoJudge, onClick: () => {
          const next = !autoJudge;
          setAutoJudge(next);
          localStorage.setItem("datang-ai-v2-auto", next ? "1" : "0");
        }, style: { ...syncFieldStyle, fontFamily: "inherit", flexDirection: "row", alignItems: "center", justifyContent: "space-between", color: C.text, cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("span", { style: syncLabelStyle, children: "AI\u81EA\u52A8\u7814\u5224" }),
            /* @__PURE__ */ jsx("span", { style: { color: autoJudge ? C.blueLight : C.textDim, fontSize: 15, fontWeight: 700 }, children: autoJudge ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED" })
          ] }),
          /* @__PURE__ */ jsx("span", { style: { width: 48, height: 26, padding: 3, borderRadius: 999, background: autoJudge ? C.blue : C.borderLight, flex: "0 0 auto", display: "flex", justifyContent: autoJudge ? "flex-end" : "flex-start", transition: ".2s" }, children: /* @__PURE__ */ jsx("span", { style: { display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 3px 8px rgba(28,44,66,.18)" } }) })
        ] }),
        /* @__PURE__ */ jsx(CurrentModelCard, { model: currentModel }),
        /* @__PURE__ */ jsxs("div", { style: { ...syncFieldStyle, borderColor: error ? C.red : C.border }, children: [
          /* @__PURE__ */ jsx("span", { style: syncLabelStyle, children: error ? "\u8FDE\u63A5\u5F02\u5E38" : "\u6700\u8FD1\u66F4\u65B0" }),
          /* @__PURE__ */ jsx("span", { style: { color: error ? C.redLight : C.textMid, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: error || fmtTime(updatedAt) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { style: { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : isCompact ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))", gap: 14 }, children: metricCards.map((card, index) => /* @__PURE__ */ jsxs("div", { className: "dt-metric", style: { ...metricStyle, animationDelay: index * 45 + "ms", background: index === 0 ? "var(--dt-accent-soft)" : C.panel }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }, children: [
          /* @__PURE__ */ jsx("div", { style: { ...labelStyle, color: C.textDim, fontWeight: 600 }, children: card.label }),
          /* @__PURE__ */ jsx("div", { style: { ...metricIconStyle, background: "transparent", color: index === 0 ? C.greenLight : C.textMuted }, children: /* @__PURE__ */ jsx(Icon, { name: card.icon, size: 17 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: metricValueStyle, children: String(card.value) }),
          /* @__PURE__ */ jsx("div", { style: { ...hintStyle, marginTop: 7 }, children: card.hint })
        ] })
      ] }, card.label)) }),
      /* @__PURE__ */ jsxs("section", { style: { padding: 0 }, children: [
        /* @__PURE__ */ jsxs("div", { style: sectionHeadStyle, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { style: sectionTitleStyle, children: "\u5916\u7F51\u653B\u51FB\u8D8B\u52BF" }),
            /* @__PURE__ */ jsxs("p", { style: sectionDescStyle, children: [
              fmtTime(tdp.start_time),
              " ~ ",
              fmtTime(tdp.end_time)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: legendStyle, children: [
            /* @__PURE__ */ jsx("span", { style: { ...legendDotStyle, background: C.green } }),
            "\u544A\u8B66\u6B21\u6570"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1.8fr) minmax(330px, .82fr)", gap: 14, alignItems: "stretch" }, children: [
          /* @__PURE__ */ jsx("div", { style: { ...panelStyle, background: "linear-gradient(120deg, var(--dt-accent-soft), var(--dt-panel) 68%)", minWidth: 0, minHeight: 290, display: "grid", alignItems: "center", padding: "14px 10px", overflow: "hidden" }, children: /* @__PURE__ */ jsx(TrendChart, { trend }) }),
          /* @__PURE__ */ jsxs("div", { style: { ...panelStyle, minWidth: 0, padding: "18px 20px", boxSizing: "border-box" }, children: [
            /* @__PURE__ */ jsx("div", { style: { marginBottom: 4, color: C.text, fontSize: 14, fontWeight: 800 }, children: "\u653B\u51FB\u7C7B\u578B\u5206\u5E03" }),
            /* @__PURE__ */ jsx("div", { style: { marginBottom: 8, color: C.textMuted, fontSize: 11 }, children: "\u5F53\u524D\u65F6\u95F4\u8303\u56F4\u5185\u7684\u544A\u8B66\u5360\u6BD4" }),
            /* @__PURE__ */ jsx(AttackTypePie, { rows: tdp.rows })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { style: { ...panelStyle, height: 782, minHeight: 782, maxHeight: 782, boxSizing: "border-box", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { ...sectionHeadStyle, marginBottom: 0, padding: "20px 20px 14px", borderBottom: `1px solid ${C.border}`, flex: "0 0 auto" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("h2", { style: sectionTitleStyle, children: "\u544A\u8B66\u4E8B\u4EF6\u5217\u8868" }),
            /* @__PURE__ */ jsxs("p", { style: sectionDescStyle, children: [
              "\u5171 ",
              rows.length,
              " \u6761 \xB7 \u6BCF\u9875 ",
              pageSize,
              " \u6761 \xB7 \u7B2C ",
              page,
              "/",
              pages,
              " \u9875"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ jsx(MiniStat, { icon: "shield", label: "\u544A\u8B66\u5217\u8868", value: `${rows.length} \u4E2A\u7814\u5224\u4E8B\u4EF6` }),
            /* @__PURE__ */ jsx(MiniStat, { icon: "bot", label: "AI\u7814\u5224", value: `${done} \u5DF2\u5B8C\u6210 / ${pending} \u8FDB\u884C\u4E2D` }),
            /* @__PURE__ */ jsxs("button", { onClick: () => downloadCsv(rows), style: secondaryButton, children: [
              /* @__PURE__ */ jsx(Icon, { name: "download", size: 15 }),
              "\u4E0B\u8F7D"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { "data-tdp-table-scroll": true, style: { overflow: "auto", flex: "1 1 auto", minHeight: 0, WebkitOverflowScrolling: "touch", scrollbarGutter: "stable" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 1320 }, children: [
          /* @__PURE__ */ jsx("colgroup", { children: ["12%", "7%", "14%", "17%", "11%", "11%", "8%", "8%", "12%"].map((width, index) => /* @__PURE__ */ jsx("col", { style: { width } }, index)) }),
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: ["\u6700\u8FD1\u53D1\u73B0\u65F6\u95F4", "\u7C7B\u578B", "\u653B\u51FB\u8005IP/IOC", "\u5A01\u80C1\u540D\u79F0", "AI\u7814\u5224\u5EFA\u8BAE", "AI\u7814\u5224\u7ED3\u679C", "\u4E25\u91CD\u7EA7\u522B", "\u68C0\u51FA\u6B21\u6570", "\u64CD\u4F5C"].map((h) => /* @__PURE__ */ jsx("th", { style: { ...thStyle, textAlign: h === "\u68C0\u51FA\u6B21\u6570" ? "right" : "left" }, children: h }, h)) }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            pageRows.map((row, i) => {
              const severity = severityLabel(row.severity);
              const severityColor = severity === "\u4E25\u91CD" || severity === "\u9AD8\u5371" ? C.redLight : severity === "\u4E2D\u5371" ? C.orangeLight : C.textDim;
              return /* @__PURE__ */ jsxs("tr", { style: { height: 58, background: i % 2 ? C.rowAlt : "transparent" }, children: [
                /* @__PURE__ */ jsx("td", { title: fmtTime(row.last_time || row.first_time), style: { ...tdStyle, color: C.textMid, fontVariantNumeric: "tabular-nums" }, children: fmtTime(row.last_time || row.first_time) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle, children: /* @__PURE__ */ jsx("span", { style: typeBadgeStyle, children: threatTypeLabel(row.threat_type) }) }),
                /* @__PURE__ */ jsxs("td", { title: row.ioc || row.ip, style: { ...tdStyle, padding: "6px 14px", color: C.cyanLight, fontFamily: "Consolas, monospace", fontWeight: 700 }, children: [
                  /* @__PURE__ */ jsx("div", { style: { lineHeight: "14px" }, children: row.ioc || row.ip }),
                  Boolean(row.grouped_row_count && row.grouped_row_count > 1) && /* @__PURE__ */ jsxs("div", { style: { marginTop: 2, color: C.textMuted, fontFamily: FONT, fontSize: 11, lineHeight: "14px", fontWeight: 650 }, children: [
                    "\u5DF2\u805A\u5408 ",
                    row.grouped_row_count,
                    " \u4E2A\u6765\u6E90"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("td", { title: row.threat_name || "--", style: { ...tdStyle, color: C.text, fontWeight: 700 }, children: row.threat_name || "--" }),
                /* @__PURE__ */ jsx("td", { title: row.ai_recommended_action || decisionLabel(row), style: { ...tdStyle, color: ["\u5EFA\u8BAE\u5C01\u7981", "\u4EC5\u963B\u65AD\u57DF\u540D", "\u51FA\u7AD9\u963B\u65AD\u57DF\u540D", "\u9694\u79BB\u5E76\u5C01\u7981"].includes(decisionLabel(row)) ? C.redLight : decisionLabel(row) === "\u4E0D\u5EFA\u8BAE\u5C01\u7981" ? C.greenLight : C.textMid, fontWeight: decisionLabel(row) === "-" ? 500 : 700, whiteSpace: "nowrap" }, children: decisionLabel(row) === "-" ? "--" : decisionLabel(row) }),
                /* @__PURE__ */ jsx("td", { style: tdStyle, children: /* @__PURE__ */ jsx(AIResultBadge, { row, onStart: (item) => void startJudge(item) }) }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle, color: severityColor, fontWeight: 700, whiteSpace: "nowrap" }, children: severity === "--" ? "--" : /* @__PURE__ */ jsxs(Fragment2, { children: [
                  /* @__PURE__ */ jsx("span", { style: { color: severityColor }, children: "\u25CF" }),
                  " ",
                  severity
                ] }) }),
                /* @__PURE__ */ jsx("td", { style: { ...tdStyle, textAlign: "right", fontWeight: 750, color: row.count >= 50 ? C.redLight : C.text }, children: row.count }),
                /* @__PURE__ */ jsx("td", { style: tdStyle, children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => void openDetail(row), className: "dt-detail-button", style: detailLinkStyle, children: "\u67E5\u770B\u8BE6\u60C5" }) })
              ] }, rowKey(row));
            }),
            rows.length > 0 && Array.from({ length: Math.max(0, 10 - pageRows.length) }, (_, index) => /* @__PURE__ */ jsx("tr", { "aria-hidden": "true", style: { height: 58, background: (pageRows.length + index) % 2 ? C.rowAlt : "transparent" }, children: /* @__PURE__ */ jsx("td", { colSpan: 9, style: { ...tdStyle, color: "transparent" }, children: "\xA0" }) }, `empty-row-${index}`))
          ] })
        ] }) }),
        !rows.length && /* @__PURE__ */ jsx("div", { style: { padding: 38, textAlign: "center", color: C.textMuted }, children: loading ? "\u6B63\u5728\u83B7\u53D6\u8BBE\u5907\u544A\u8B66..." : error || "\u5F53\u524D\u65F6\u95F4\u8303\u56F4\u6682\u65E0\u6570\u636E" }),
        /* @__PURE__ */ jsx("div", { style: { position: "relative", zIndex: 10, display: "flex", justifyContent: "flex-end", alignItems: "center", height: 64, minHeight: 64, maxHeight: 64, boxSizing: "border-box", padding: "10px 18px", borderTop: `1px solid ${C.border}`, background: C.panel, flex: "0 0 auto", overflow: "visible" }, children: /* @__PURE__ */ jsx(Pager, { current: page, total: pages, totalItems: rows.length, pageSize, onChange: setPage, onPageSizeChange: (nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        } }) })
      ] })
    ] }) }),
    detail && /* @__PURE__ */ jsx("div", { onClick: () => {
      setDetailIp(null);
      setOutputOpen(false);
    }, style: modalMask, children: /* @__PURE__ */ jsxs("div", { className: "dt-report-dialog", onClick: (e) => e.stopPropagation(), style: { ...modalCard, width: "min(1440px, calc(100vw - 32px))", height: "min(920px, calc(100dvh - 32px))", maxHeight: "calc(100dvh - 32px)", overflow: "hidden", display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { ...modalHead, flex: "0 0 auto", background: C.panel, zIndex: 2 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("strong", { style: { color: C.text, fontSize: 20, lineHeight: 1.25 }, children: "\u544A\u8B66\u7814\u5224\u8BE6\u60C5" }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 9, marginTop: 5, color: C.textDim, fontSize: 12, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsx("code", { style: inlineCodeStyle, children: detail.ip }),
            /* @__PURE__ */ jsx("span", { children: detail.threat_name || "\u544A\u8B66\u7814\u5224" }),
            /* @__PURE__ */ jsx("span", { children: "\xB7" }),
            /* @__PURE__ */ jsx("span", { children: fmtTime(detail.last_time || detail.first_time) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { "aria-label": "\u5173\u95ED\u7814\u5224\u8BE6\u60C5", title: "\u5173\u95ED", onClick: () => {
          setDetailIp(null);
          setOutputOpen(false);
        }, style: closeStyle, children: /* @__PURE__ */ jsx(Icon, { name: "x", size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx(ReviewReport, { row: detail, compact: isCompact }, rowKey(detail)),
      /* @__PURE__ */ jsx("div", { style: { padding: "10px 20px", borderTop: `1px solid ${C.border}`, background: C.panel, color: C.textDim, fontSize: 12 }, "aria-live": "polite", children: vulnImports[rowKey(detail)]?.status === "completed" ? "\u5DF2\u6839\u636E\u4EBA\u5DE5\u786E\u8BA4\uFF0C\u7531 AI \u81EA\u52A8\u5199\u5165\u6F0F\u6D1E\u8FD0\u8425\u53F0\u8D26\u3002" : vulnImports[rowKey(detail)]?.error || (vulnImports[rowKey(detail)]?.status === "pending" ? "AI \u6B63\u5728\u6574\u7406\u6F0F\u6D1E\u4FE1\u606F\u3001\u5339\u914D\u53D7\u5F71\u54CD\u8D44\u4EA7\u5E76\u5199\u5165\u53F0\u8D26\uFF0C\u8BF7\u7A0D\u5019\u2026" : "\u4EBA\u5DE5\u786E\u8BA4\u653B\u51FB\u6210\u529F\u540E\uFF0C\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\uFF0CAI \u5C06\u81EA\u52A8\u6574\u7406\u5E76\u5199\u5165\u6F0F\u6D1E\u8FD0\u8425\u3002") }),
      /* @__PURE__ */ jsxs("div", { style: { padding: "8px 20px", color: C.textDim, fontSize: 12 }, "aria-live": "polite", children: [
        irMessage,
        irUrl && /* @__PURE__ */ jsx("a", { href: irUrl, style: { color: C.greenLight, marginLeft: 12 }, children: "\u6253\u5F00\u5E94\u6025\u4E8B\u4EF6 \u2192" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: reportActionsStyle, children: [
        /* @__PURE__ */ jsx("button", { type: "button", disabled: irBusy, onClick: () => void transferIncident(detail), style: { ...primaryButton, background: "#3f6749", color: "#fff" }, children: irBusy ? "\u6B63\u5728\u4E0B\u53D1\u2026" : "\u5E94\u6025\u54CD\u5E94" }),
        vulnImports[rowKey(detail)]?.status === "completed" ? /* @__PURE__ */ jsx("a", { href: vulnImports[rowKey(detail)]?.url, style: { ...primaryButton, textDecoration: "none" }, children: "\u67E5\u770B\u6F0F\u6D1E\u8BB0\u5F55 \u2192" }) : /* @__PURE__ */ jsx("button", { type: "button", disabled: vulnImports[rowKey(detail)]?.status === "pending", onClick: () => void transferVulnerability(detail), style: { ...primaryButton, background: "#43583a", color: "#fff", opacity: vulnImports[rowKey(detail)]?.status === "pending" ? 0.6 : 1 }, children: vulnImports[rowKey(detail)]?.status === "pending" ? "AI \u6B63\u5728\u5199\u5165\u2026" : "\u8F6C\u5165\u6F0F\u6D1E\u5E93" }),
        /* @__PURE__ */ jsxs("button", { disabled: detail.ai_status === "pending", title: detail.ai_status === "done" ? "\u91CD\u65B0\u6267\u884C\u56FA\u5B9A\u5DE5\u4F5C\u6D41\u5E76\u7528\u6700\u65B0\u7ED3\u679C\u66F4\u65B0\u5F53\u524D\u8BE6\u60C5" : detail.ai_status === "pending" ? "\u7814\u5224\u6B63\u5728\u6267\u884C" : "\u5F00\u59CBAI\u7814\u5224", onClick: () => detail.ai_status === "done" ? void launchJudgement(detail, true) : detail.ai_status !== "pending" ? void startJudge(detail) : void 0, style: { ...primaryButton, opacity: detail.ai_status === "pending" ? 0.58 : 1, cursor: detail.ai_status === "pending" ? "not-allowed" : "pointer" }, children: [
          /* @__PURE__ */ jsx(Icon, { name: detail.ai_status === "done" ? "spark" : "bot", size: 15 }),
          detail.ai_status === "done" ? "\u4E8C\u6B21\u7814\u5224" : detail.ai_status === "pending" ? "\u7814\u5224\u4E2D" : "AI\u7814\u5224"
        ] })
      ] })
    ] }) }),
    detail && outputOpen && /* @__PURE__ */ jsx("div", { onClick: () => setOutputOpen(false), style: { ...modalMask, zIndex: 1100 }, children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), style: { ...modalCard, width: "min(920px, 96vw)" }, children: [
      /* @__PURE__ */ jsxs("div", { style: modalHead, children: [
        /* @__PURE__ */ jsx("strong", { children: "AI\u8F93\u51FA\u5168\u6587" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOutputOpen(false), style: closeStyle, children: "\xD7" })
      ] }),
      /* @__PURE__ */ jsx("pre", { style: { margin: 0, padding: 18, background: C.bg, color: C.textMid, whiteSpace: "pre-wrap", maxHeight: "68vh", overflow: "auto", fontSize: 12 }, children: detail.ai_raw_output || detail.ai_progress || "\u6682\u65E0AI\u8F93\u51FA" })
    ] }) })
  ] });
}
var topbarStyle = { minHeight: 80, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "18px 28px", background: C.panel, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" };
var brandStyle = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, minWidth: 0 };
var brandTitleStyle = { margin: 0, color: C.text, fontSize: 22, lineHeight: 1.3, fontWeight: 720, letterSpacing: 0 };
var brandLogoStyle = { minWidth: 44, height: 52, display: "grid", placeItems: "center", borderRadius: 0, padding: 0, background: "transparent", border: 0, boxShadow: "none" };
var resetLogoButtonStyle = { position: "absolute", top: -7, right: -7, width: 18, height: 18, display: "grid", placeItems: "center", padding: 0, border: `1px solid ${C.border}`, borderRadius: "50%", background: C.panel, color: C.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1 };
var chipStyle = { minHeight: 32, maxWidth: "100%", boxSizing: "border-box", padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.panelSoft, display: "inline-flex", alignItems: "center", gap: 8, overflowWrap: "anywhere", color: C.textDim, fontSize: 12 };
var statusDotStyle = { width: 7, height: 7, borderRadius: "50%", flex: "0 0 auto" };
var panelStyle = { border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, boxShadow: C.shadow };
var syncFieldStyle = { minHeight: 58, border: `1px solid ${C.border}`, borderRadius: 5, background: C.panel, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, textAlign: "left" };
var syncLabelStyle = { display: "block", color: C.textDim, fontSize: 12, marginBottom: 4 };
var syncValueStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, color: C.text, fontSize: 15, fontWeight: 750, lineHeight: 1.1 };
var metricStyle = { minHeight: 126, padding: "18px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "space-between", gap: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel, boxShadow: C.shadow, minWidth: 0 };
var metricIconStyle = { width: 28, height: 28, borderRadius: 6, display: "grid", placeItems: "center", flex: "0 0 auto" };
var labelStyle = { color: C.textDim, fontSize: 12 };
var hintStyle = { marginTop: 8, color: C.textMuted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
var metricValueStyle = { fontSize: 30, lineHeight: 1.15, fontWeight: 720, fontVariantNumeric: "tabular-nums", color: C.text, marginTop: 10, overflow: "hidden", textOverflow: "ellipsis" };
var sectionHeadStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" };
var sectionTitleStyle = { margin: 0, color: C.text, fontSize: 16, lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 };
var sectionDescStyle = { margin: "5px 0 0", color: C.textDim, fontSize: 12 };
var legendStyle = { display: "flex", alignItems: "center", gap: 8, color: C.textDim, fontSize: 12, flexWrap: "wrap" };
var legendDotStyle = { width: 10, height: 10, borderRadius: 999, flex: "0 0 auto" };
var thStyle = { height: 52, boxSizing: "border-box", padding: "12px 14px", background: C.panelHead, color: C.textMid, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 750, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "sticky", top: 0, zIndex: 1 };
var tdStyle = { height: 58, boxSizing: "border-box", padding: "13px 14px", borderBottom: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
var typeBadgeStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 48, height: 24, padding: "0 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, color: C.textMid, background: C.panelSoft };
var aiResultBadgeStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 62, height: 28, padding: "0 12px", boxSizing: "border-box", border: "none", borderRadius: 6, fontFamily: "inherit", fontSize: 12, fontWeight: 750, whiteSpace: "nowrap" };
var detailLinkStyle = { minHeight: 30, padding: "4px 8px", border: "none", borderRadius: 5, background: "transparent", color: C.blueLight, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
var detailBlockStyle = { minWidth: 0, lineHeight: 1.65 };
var detailLabelStyle = { color: C.textDim, fontSize: 13, fontWeight: 800 };
var reportBodyStyle = { flex: "1 1 auto", overflow: "auto", padding: "0 30px 30px", background: C.panel, fontSize: 13, scrollbarGutter: "stable" };
var reportVerdictBarStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, margin: "0 -30px", padding: "20px 30px", background: C.panelSoft, borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" };
var reportSectionStyle = { padding: "22px 0", borderBottom: `1px solid ${C.border}` };
var reportNumberStyle = { width: 26, height: 26, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 4, color: C.blueLight, background: C.blueDark, fontSize: 12, fontWeight: 800 };
var reportSectionTitleStyle = { margin: 0, color: C.text, fontSize: 16, lineHeight: 1.4, fontWeight: 700 };
var conclusionStyle = { padding: "14px 16px", color: C.textMid, background: C.panelSoft, borderLeft: `3px solid ${C.blue}`, fontSize: 13, lineHeight: 1.75, fontWeight: 560, whiteSpace: "pre-wrap", overflowWrap: "anywhere" };
var overviewTableStyle = { display: "grid", gridTemplateColumns: "minmax(120px, .22fr) minmax(0, 1fr)", borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` };
var overviewLabelStyle = { padding: "11px 13px", color: C.textDim, background: C.panelSoft, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 750 };
var overviewValueStyle = { minWidth: 0, padding: "11px 14px", color: C.textMid, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, fontSize: 13, lineHeight: 1.55, fontWeight: 600, overflowWrap: "anywhere" };
var inlineCodeStyle = { padding: "2px 6px", borderRadius: 3, color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: "1em", fontWeight: 750, overflowWrap: "anywhere" };
var outcomeTableStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, marginBottom: 18 };
var recommendationStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", alignItems: "start", gap: 12, padding: "16px 18px", color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.textDim}`, fontSize: 13, lineHeight: 1.8, overflowWrap: "anywhere" };
var reportActionsStyle = { flex: "0 0 auto", display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: C.panel };
var trafficFieldLabelStyle = { display: "block", marginBottom: 3, color: C.textMuted, fontSize: 11, fontWeight: 700 };
var trafficIpStyle = { display: "block", fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 13, lineHeight: 1.35, fontWeight: 750, overflowWrap: "anywhere" };
var packetColumnStyle = { minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 5, background: C.panelSoft, overflow: "hidden" };
var packetHeadStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9, fontSize: 13 };
var packetStatusStyle = { padding: "3px 7px", borderRadius: 4, fontSize: 11, fontWeight: 750, whiteSpace: "nowrap" };
var packetLineStyle = { display: "block", padding: "8px 10px", color: C.textMid, background: C.bg, borderRadius: 3, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 12, fontWeight: 650, whiteSpace: "pre-wrap", overflowWrap: "anywhere" };
var packetBodyStyle = { margin: 0, padding: 12, color: C.textMid, background: C.bg, borderTop: `1px solid ${C.border}`, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" };
var packetEmptyStyle = { minHeight: 52, padding: 10, color: C.orangeLight, background: C.orangeDark, borderRadius: 4, fontSize: 12, lineHeight: 1.55 };
var packetByteStyle = { marginTop: 8, color: C.textMuted, fontSize: 11 };
var evidenceListStyle = { display: "grid", gap: 9, marginTop: 11 };
var stepStyle = { display: "flex", gap: 10, alignItems: "flex-start", color: C.textMid, fontSize: 13, lineHeight: 1.65, fontWeight: 540, overflowWrap: "anywhere", wordBreak: "break-word" };
var checkStyle = { width: 20, height: 20, flex: "0 0 auto", borderRadius: 3, background: C.panelSoft, border: `1px solid ${C.border}`, color: C.textDim, display: "grid", placeItems: "center", marginTop: 1, fontSize: 11, fontWeight: 800 };
var paginationStyle = { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "nowrap", minWidth: "max-content", fontSize: 13 };
var pagerStyle = { width: 40, height: 40, display: "grid", placeItems: "center", background: C.panel, color: C.text, border: `1px solid ${C.borderLight}`, borderRadius: 5, padding: 0, cursor: "pointer", fontSize: 14 };
var jumpInputStyle = { width: 58, height: 40, boxSizing: "border-box", border: `1px solid ${C.borderLight}`, borderRadius: 5, background: C.panel, color: C.text, outline: "none", textAlign: "center", fontSize: 13 };
var calendarNavButtonStyle = { width: 32, height: 32, display: "grid", placeItems: "center", padding: 0, color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer" };
var modalMask = { position: "fixed", inset: 0, background: C.overlay, display: "grid", placeItems: "center", zIndex: 1e3, padding: 18 };
var modalCard = { width: "min(760px, 96vw)", maxHeight: "86vh", overflow: "auto", background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 8, boxShadow: C.shadow };
var modalHead = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: `1px solid ${C.border}` };
var closeStyle = { width: 32, height: 32, display: "grid", placeItems: "center", flex: "0 0 auto", border: "none", borderRadius: 6, background: "transparent", color: C.textDim, cursor: "pointer", padding: 0 };
var primaryButton = { minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: "var(--dt-control)", color: "var(--dt-control-text)", border: "1px solid transparent", borderRadius: 8, padding: "0 14px", cursor: "pointer", fontSize: 13, fontWeight: 650, boxShadow: "0 3px 10px rgba(16,20,24,.16), inset 0 1px 0 rgba(255,255,255,.12)" };
var secondaryButton = { minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.panel, color: C.textMid, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "0 13px", cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 1px 2px rgba(46,58,62,.04), inset 0 1px 0 rgba(255,255,255,.12)" };
function MiniStat({ icon, label, value }) {
  return /* @__PURE__ */ jsxs("div", { "data-tdp-stat": true, style: { minHeight: 44, display: "inline-flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, color: C.textMid }, children: [
    /* @__PURE__ */ jsx("span", { style: { width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 9, background: C.greenDark, color: C.greenLight }, children: /* @__PURE__ */ jsx(Icon, { name: icon, size: 15 }) }),
    /* @__PURE__ */ jsxs("span", { style: { display: "grid", gap: 3, lineHeight: 1.25 }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: C.textMid, fontSize: 12, fontWeight: 500 }, children: label }),
      /* @__PURE__ */ jsx("small", { style: { color: C.textDim, fontSize: 11, whiteSpace: "nowrap" }, children: value })
    ] })
  ] });
}
function DetailMetric({ label, value, danger = false }) {
  return /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
    /* @__PURE__ */ jsx("div", { style: { color: C.textMuted, fontSize: 12 }, children: label }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: 6, color: danger ? C.redLight : C.text, fontSize: 16, lineHeight: 1.3, fontWeight: 800, overflowWrap: "anywhere" }, children: value })
  ] });
}
function ReviewReport({ row, compact }) {
  const [tab, setTab] = useState("overview");
  const scrollRef = useRef(null);
  const paths = trafficPathsFor(row);
  const decision = decisionLabel(row);
  const dangerous = ["\u5EFA\u8BAE\u5C01\u7981", "\u9694\u79BB\u5E76\u5C01\u7981", "\u51FA\u7AD9\u963B\u65AD\u57DF\u540D", "\u4EC5\u963B\u65AD\u57DF\u540D"].includes(decision);
  const isDone = row.ai_status === "done";
  return /* @__PURE__ */ jsxs("div", { style: { flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", background: C.panel }, children: [
    /* @__PURE__ */ jsxs("div", { className: "dt-report-summary", children: [
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { color: C.textDim, fontSize: 11, marginBottom: 7 }, children: "\u7814\u5224\u7ED3\u8BBA" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }, children: [
          /* @__PURE__ */ jsx("strong", { style: { fontSize: 24, fontWeight: 720, lineHeight: 1.3 }, children: isDone ? row.ai_verdict || "\u5DF2\u5B8C\u6210" : row.ai_status === "pending" ? "\u6B63\u5728\u7814\u5224" : "\u7B49\u5F85\u7814\u5224" }),
          /* @__PURE__ */ jsx("span", { style: { padding: "4px 9px", borderRadius: 4, background: dangerous ? C.redDark : C.panelSoft, color: dangerous ? C.redLight : C.textMid, fontSize: 12, fontWeight: 600 }, children: decision === "-" ? "\u5C1A\u672A\u5F62\u6210\u5EFA\u8BAE" : decision })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dt-report-metrics", children: [
        /* @__PURE__ */ jsx(DetailMetric, { label: "\u653B\u51FB\u7ED3\u679C", value: isDone ? row.ai_attack_outcome || "\u5C1D\u8BD5/\u672A\u77E5" : "--", danger: row.ai_attack_outcome === "\u6210\u529F" }),
        /* @__PURE__ */ jsx(DetailMetric, { label: "\u4E3B\u673A\u72B6\u6001", value: isDone ? row.ai_compromise_status || "\u65E0\u6CD5\u786E\u8BA4" : "--", danger: row.ai_compromise_status === "\u5DF2\u5931\u9677" }),
        /* @__PURE__ */ jsx(DetailMetric, { label: "\u98CE\u9669\u7B49\u7EA7", value: row.ai_severity || severityLabel(row.severity), danger: ["\u4E25\u91CD", "\u9AD8\u5371", "\u9AD8"].includes(row.ai_severity || row.severity || "") }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(DetailMetric, { label: "\u7F6E\u4FE1\u5EA6", value: isDone && row.ai_confidence !== void 0 ? row.ai_confidence + "%" : "--" }),
          /* @__PURE__ */ jsx("div", { style: { height: 3, marginTop: 8, maxWidth: 90, background: C.border, borderRadius: 2 }, children: /* @__PURE__ */ jsx("span", { style: { display: "block", width: (isDone ? Math.max(0, Math.min(100, row.ai_confidence || 0)) : 0) + "%", height: "100%", background: C.green, borderRadius: 2 } }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { role: "tablist", "aria-label": "\u7814\u5224\u8BE6\u60C5\u5206\u7C7B", className: "dt-report-tabs", children: [["overview", "\u7814\u5224\u6982\u89C8"], ["evidence", "\u6D41\u91CF\u8BC1\u636E"], ["additional", "\u8865\u5145\u4FE1\u606F"]].map(([id, label]) => /* @__PURE__ */ jsx("button", { id: "review-tab-" + id, type: "button", role: "tab", "aria-selected": tab === id, "aria-controls": "review-panel-" + id, onClick: () => {
      setTab(id);
      scrollRef.current?.scrollTo(0, 0);
    }, style: { minHeight: 44, padding: "0 3px", marginRight: 24, background: "transparent", border: "none", borderBottom: "2px solid " + (tab === id ? C.text : "transparent"), color: tab === id ? C.text : C.textDim, cursor: "pointer", fontSize: 13, fontWeight: tab === id ? 700 : 500 }, children: label }, id)) }),
    /* @__PURE__ */ jsxs("div", { ref: scrollRef, role: "tabpanel", id: "review-panel-" + tab, "aria-labelledby": "review-tab-" + tab, tabIndex: 0, className: "dt-report-content", children: [
      tab === "overview" && /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsxs("div", { className: "dt-report-columns", children: [
          /* @__PURE__ */ jsxs("section", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("h2", { className: "dt-report-heading", children: "\u5206\u6790\u6458\u8981" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "12px 0 0", fontSize: 14, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }, children: row.ai_summary || row.ai_progress || row.ai_error || "\u5F53\u524D\u6682\u65E0\u7814\u5224\u7ED3\u8BBA\u3002" }),
            /* @__PURE__ */ jsx(EvidenceSection, { title: "\u6838\u5FC3\u7814\u5224\u4F9D\u636E", items: row.ai_evidence, tone: "support" })
          ] }),
          /* @__PURE__ */ jsxs("section", { style: { minWidth: 0, paddingLeft: compact ? 0 : 24, borderLeft: compact ? "none" : "1px solid " + C.border }, children: [
            /* @__PURE__ */ jsx("h2", { className: "dt-report-heading", children: "\u5904\u7F6E\u5EFA\u8BAE" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "12px 0 0", fontSize: 14, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }, children: row.ai_recommended_action || "\u8BF7\u6839\u636E\u7814\u5224\u8BC1\u636E\u8FDB\u884C\u4EBA\u5DE5\u590D\u6838\u540E\u5904\u7F6E\u3002" }),
            /* @__PURE__ */ jsx(EvidenceSection, { title: "\u6838\u67E5\u4E0E\u5904\u7F6E\u6E05\u5355", items: row.ai_human_checkpoints, tone: "check" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "dt-report-section", children: [
          /* @__PURE__ */ jsx("h2", { className: "dt-report-heading", children: "\u544A\u8B66\u4FE1\u606F" }),
          /* @__PURE__ */ jsx(OverviewTable, { row, paths })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "dt-report-section", children: [
          /* @__PURE__ */ jsx("h2", { className: "dt-report-heading", children: "\u8BC1\u636E\u8BC4\u4F30" }),
          /* @__PURE__ */ jsxs("div", { className: "dt-report-columns", children: [
            /* @__PURE__ */ jsx(EvidenceSection, { title: "\u652F\u6301\u8BC1\u636E", items: row.ai_supporting_evidence, tone: "support" }),
            /* @__PURE__ */ jsx(EvidenceSection, { title: "\u53CD\u8BC1\u4E0E\u7591\u70B9", items: row.ai_contradicting_evidence, tone: "oppose" })
          ] })
        ] })
      ] }),
      tab === "evidence" && /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 20 }, children: [["\u8BF7\u6C42\u62A5\u6587", (row.ai_http_evidence || []).some((item) => Boolean(item.request_line || item.request_body))], ["\u54CD\u5E94\u62A5\u6587", (row.ai_http_evidence || []).some((item) => Boolean(item.response_line || item.response_body))]].map(([label, available]) => /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", gap: 7, alignItems: "center", border: "1px solid " + C.border, borderRadius: 5, padding: "7px 10px", color: C.textMid, fontSize: 12 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 5, height: 5, borderRadius: "50%", background: available ? C.green : C.orange } }),
          label,
          " \xB7 ",
          available ? "\u5DF2\u83B7\u53D6" : "\u672A\u83B7\u53D6"
        ] }, String(label))) }),
        /* @__PURE__ */ jsx(TrafficPaths, { paths, compact }),
        /* @__PURE__ */ jsx(HttpEvidencePanel, { items: row.ai_http_evidence })
      ] }),
      tab === "additional" && /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { className: "dt-report-heading", children: "\u6838\u9A8C\u8303\u56F4" }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: "\u7F3A\u5931\u4FE1\u606F\u4E0E\u53D6\u8BC1\u9650\u5236", items: row.ai_missing_information, tone: "missing" })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "dt-report-section", children: /* @__PURE__ */ jsxs("div", { className: "dt-report-columns", children: [
          /* @__PURE__ */ jsx(EvidenceSection, { title: "\u53D7\u5F71\u54CD\u76EE\u6807", items: row.ai_affected_targets, tone: "target" }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: "\u5173\u952E IOC", items: row.ai_key_iocs, tone: "ioc" })
        ] }) })
      ] })
    ] }, tab)
  ] });
}
function OverviewTable({ row, paths }) {
  const request = (row.ai_http_evidence || []).find((item) => item.request_line)?.request_line || "--";
  const targets = [...new Set(paths.map((path) => [path.destination_ip, path.destination_port].filter(Boolean).join(":")).filter(Boolean))];
  const groupedIps = row.grouped_ips || [];
  const groupedSourceText = groupedIps.length ? `${groupedIps.slice(0, 8).join("\u3001")}${groupedIps.length > 8 ? ` \u7B49 ${groupedIps.length} \u4E2A` : ""}` : row.ip || "--";
  const entries = [
    ["\u8BF7\u6C42", request],
    ["\u5A01\u80C1\u540D\u79F0", row.threat_name || "--"],
    ["\u653B\u51FB\u8005 IP / IOC", row.ioc || row.ip || "--"],
    ["\u5173\u8054\u6765\u6E90 IP", groupedSourceText],
    ["IP \u5F52\u5C5E\u5730", row.ai_source_location?.known ? `${row.ai_source_location.display || row.ai_source_location.country || "--"}\uFF08${row.ai_source_location.is_foreign ? "\u5883\u5916" : "\u5883\u5185"}${row.ai_source_location.source ? `\uFF0C${row.ai_source_location.source}` : ""}\uFF09` : "\u672A\u77E5"],
    ["\u76EE\u6807", targets.join("\u3001") || (row.grouped_targets || []).join("\u3001") || "--"],
    ["\u544A\u8B66\u7C7B\u578B", threatTypeLabel(row.threat_type)],
    ["\u6700\u8FD1\u53D1\u73B0\u65F6\u95F4", fmtTime(row.last_time || row.first_time)],
    ["\u68C0\u51FA\u6B21\u6570", `${row.count || 0} \u6B21`],
    ["\u5904\u7F6E\u5BF9\u8C61", actionScopeLabel(row)]
  ];
  return /* @__PURE__ */ jsx("dl", { className: "dt-overview-fields", children: entries.map(([label, value]) => /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, display: "grid", gridTemplateColumns: "98px minmax(0,1fr)", gap: 10, padding: "11px 0", borderBottom: "1px solid " + C.border }, children: [
    /* @__PURE__ */ jsx("dt", { style: { margin: 0, color: C.textDim, fontSize: 12 }, children: label }),
    /* @__PURE__ */ jsx("dd", { style: { margin: 0, color: C.textMid, fontSize: 13, lineHeight: 1.6, overflowWrap: "anywhere" }, children: label.includes("IP") || label === "\u8BF7\u6C42" || label === "\u76EE\u6807" ? /* @__PURE__ */ jsx("code", { style: { fontFamily: "Consolas, monospace", fontSize: 12 }, children: value }) : value })
  ] }, label)) });
}
function TrafficPaths({ paths, compact }) {
  const directionPalette = {
    "\u5916\u5230\u5185": { color: C.redLight, background: C.redDark },
    "\u5185\u5230\u5185": { color: C.textMid, background: C.panelSoft },
    "\u5185\u5230\u5916": { color: C.blueLight, background: C.blueDark },
    "\u5F85\u786E\u8BA4": { color: C.textDim, background: C.panelSoft }
  };
  return /* @__PURE__ */ jsxs("div", { style: detailBlockStyle, children: [
    /* @__PURE__ */ jsx("div", { style: { ...detailLabelStyle, color: C.textMid }, children: "\u5173\u952E\u6D41\u91CF\u8DEF\u5F84" }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: 9 }, children: paths.map((path, index) => {
      const palette = directionPalette[path.direction] || directionPalette["\u5F85\u786E\u8BA4"];
      const transport = [path.protocol, path.destination_port ? `\u76EE\u7684\u7AEF\u53E3 ${path.destination_port}` : ""].filter(Boolean).join(" / ");
      return /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: compact ? "minmax(0, 1fr) auto minmax(0, 1fr)" : "minmax(180px, 1fr) auto minmax(180px, 1fr) minmax(0, .8fr)", alignItems: "center", gap: compact ? 8 : 14, minHeight: 54, padding: "7px 2px", borderTop: index ? `1px solid ${C.border}` : "none" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("span", { style: trafficFieldLabelStyle, children: "\u6E90 IP" }),
          /* @__PURE__ */ jsx("strong", { style: { ...trafficIpStyle, color: C.textMid }, children: path.source_ip })
        ] }),
        /* @__PURE__ */ jsx("span", { style: { minWidth: 64, padding: "5px 10px", borderRadius: 5, textAlign: "center", color: palette.color, background: palette.background, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }, children: path.direction }),
        /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("span", { style: trafficFieldLabelStyle, children: "\u76EE\u7684 IP" }),
          /* @__PURE__ */ jsx("strong", { style: { ...trafficIpStyle, color: path.destination_ip === "\u5F85\u786E\u8BA4" ? C.textDim : C.textMid }, children: path.destination_ip })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { minWidth: 0, gridColumn: compact ? "1 / -1" : "auto", color: C.textDim, fontSize: 12, fontWeight: transport ? 650 : 500, overflowWrap: "anywhere" }, children: transport || "\u534F\u8BAE / \u7AEF\u53E3\u5F85\u786E\u8BA4" })
      ] }, `${path.source_ip}-${path.destination_ip}-${path.destination_port || ""}-${index}`);
    }) })
  ] });
}
function HttpEvidencePanel({ items }) {
  const values = Array.isArray(items) ? items : [];
  return /* @__PURE__ */ jsxs("div", { style: { ...detailBlockStyle, marginTop: 20 }, children: [
    /* @__PURE__ */ jsx("div", { style: { ...detailLabelStyle, color: C.textMid }, children: "HTTP \u8BF7\u6C42 / \u54CD\u5E94\u8BC1\u636E" }),
    values.length ? /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: 14, marginTop: 10 }, children: values.map((item, index) => {
      const requestAvailable = Boolean(item.request_line || item.request_body);
      const responseAvailable = Boolean(item.response_line || item.response_body);
      const endpoint = [item.source_ip, item.destination_ip ? `-> ${item.destination_ip}${item.destination_port ? `:${item.destination_port}` : ""}` : ""].filter(Boolean).join(" ");
      return /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, paddingTop: index ? 14 : 0, borderTop: index ? `1px solid ${C.border}` : "none" }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: C.textDim, fontSize: 12 }, children: [
          /* @__PURE__ */ jsxs("span", { children: [
            endpoint || "\u6D41\u91CF\u7AEF\u70B9\u5F85\u786E\u8BA4",
            item.flow_id ? ` \xB7 Flow ${item.flow_id}` : ""
          ] }),
          /* @__PURE__ */ jsx("span", { children: item.occurrences && item.occurrences > 1 ? `\u540C\u62A5\u6587\u547D\u4E2D ${item.occurrences} \u6761\u544A\u8B66` : "\u5355\u6761\u544A\u8B66" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 12, marginTop: 9 }, children: [
          /* @__PURE__ */ jsxs("div", { style: packetColumnStyle, children: [
            /* @__PURE__ */ jsxs("div", { style: { padding: 12 }, children: [
              /* @__PURE__ */ jsxs("div", { style: packetHeadStyle, children: [
                /* @__PURE__ */ jsx("strong", { style: { color: C.text }, children: "\u8BF7\u6C42\u5305" }),
                /* @__PURE__ */ jsx("span", { style: { ...packetStatusStyle, color: requestAvailable ? C.greenLight : C.orangeLight, background: requestAvailable ? C.greenDark : C.orangeDark }, children: item.request_status || "\u539F\u59CB\u544A\u8B66\u672A\u91C7\u96C6" })
              ] }),
              requestAvailable ? /* @__PURE__ */ jsx("code", { style: packetLineStyle, children: item.request_line || "\u8BF7\u6C42\u884C\u672A\u91C7\u96C6" }) : /* @__PURE__ */ jsx("div", { style: packetEmptyStyle, children: "\u8BBE\u5907\u539F\u59CB\u544A\u8B66\u4E2D\u6CA1\u6709\u8BF7\u6C42\u884C\u548C\u8BF7\u6C42\u4F53\u3002" }),
              /* @__PURE__ */ jsxs("div", { style: packetByteStyle, children: [
                "\u5BA2\u6237\u7AEF\u5230\u670D\u52A1\u7AEF ",
                item.bytes_to_server || 0,
                " bytes"
              ] })
            ] }),
            requestAvailable && /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { style: { padding: "10px 12px", color: C.blueLight, borderTop: `1px solid ${C.border}`, cursor: "pointer", fontSize: 12, fontWeight: 750 }, children: "\u5B8C\u6574\u8BF7\u6C42\u4F53" }),
              /* @__PURE__ */ jsx("pre", { style: packetBodyStyle, children: item.request_body || "\u8BF7\u6C42\u4F53\u4E3A\u7A7A" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { style: packetColumnStyle, children: /* @__PURE__ */ jsxs("div", { style: { padding: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { style: packetHeadStyle, children: [
              /* @__PURE__ */ jsx("strong", { style: { color: C.text }, children: "\u54CD\u5E94\u5305" }),
              /* @__PURE__ */ jsx("span", { style: { ...packetStatusStyle, color: responseAvailable ? C.greenLight : C.orangeLight, background: responseAvailable ? C.greenDark : C.orangeDark }, children: item.response_status || "\u539F\u59CB\u544A\u8B66\u672A\u91C7\u96C6" })
            ] }),
            responseAvailable ? /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsx("code", { style: packetLineStyle, children: item.response_line || "\u54CD\u5E94\u884C\u672A\u91C7\u96C6" }),
              /* @__PURE__ */ jsx("pre", { style: { ...packetBodyStyle, marginTop: 8, border: "none", borderRadius: 4 }, children: item.response_body || "\u54CD\u5E94\u4F53\u4E3A\u7A7A" })
            ] }) : /* @__PURE__ */ jsx("div", { style: packetEmptyStyle, children: "\u8BBE\u5907\u539F\u59CB\u544A\u8B66\u7684\u54CD\u5E94\u884C\u548C\u54CD\u5E94\u4F53\u4E3A\u7A7A\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u653B\u51FB\u662F\u5426\u6210\u529F\u3002" }),
            /* @__PURE__ */ jsxs("div", { style: packetByteStyle, children: [
              "\u670D\u52A1\u7AEF\u5230\u5BA2\u6237\u7AEF ",
              item.bytes_to_client || 0,
              " bytes",
              !responseAvailable && item.bytes_to_client ? "\uFF0C\u4EC5\u6709\u6D41\u91CF\u8BA1\u6570\uFF0C\u65E0\u53EF\u89E3\u6790\u54CD\u5E94\u5185\u5BB9" : ""
            ] })
          ] }) })
        ] })
      ] }, `${item.flow_id || index}-${index}`);
    }) }) : /* @__PURE__ */ jsx("div", { style: { marginTop: 10, color: C.textMuted, fontSize: 13 }, children: "\u5F53\u524D\u7814\u5224\u7ED3\u679C\u6CA1\u6709\u53EF\u5C55\u793A\u7684 HTTP \u62A5\u6587\u8BC1\u636E\u3002" })
  ] });
}
function EvidenceSection({ title, items, tone }) {
  const palette = {
    support: { color: C.greenLight, background: C.greenDark },
    oppose: { color: C.redLight, background: C.redDark },
    missing: { color: C.orangeLight, background: C.orangeDark },
    check: { color: C.blueLight, background: C.blueDark },
    target: { color: C.cyanLight, background: C.cyanDark },
    ioc: { color: C.textMid, background: C.panelSoft }
  }[tone];
  const values = Array.isArray(items) ? items : [];
  return /* @__PURE__ */ jsxs("div", { style: { ...detailBlockStyle, minWidth: 0, marginTop: 16 }, children: [
    /* @__PURE__ */ jsx("div", { style: { ...detailLabelStyle, color: C.textMid, fontWeight: 650 }, children: title }),
    /* @__PURE__ */ jsx("div", { style: evidenceListStyle, children: values.length ? values.map((item, index) => /* @__PURE__ */ jsxs("div", { style: stepStyle, children: [
      /* @__PURE__ */ jsx("span", { style: { ...checkStyle, color: C.textMuted, background: C.panelSoft }, children: index + 1 }),
      /* @__PURE__ */ jsx("span", { style: { minWidth: 0 }, children: evidenceText(item) })
    ] }, index)) : /* @__PURE__ */ jsx("div", { style: { color: C.textMuted, fontSize: 13 }, children: "\u65E0" }) })
  ] });
}
function CurrentModelCard({ model }) {
  const initial = modelBrand(model.modelId || ""), b = initial.id !== "custom" ? initial : modelBrand(model.providerId || "");
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [b.asset]);
  return /* @__PURE__ */ jsxs("div", { "aria-label": "\u5F53\u524DAI\u6A21\u578B", "data-current-model-brand": b.id, title: model.modelId ? `${model.providerId}/${model.modelId}` : model.error, style: { ...syncFieldStyle, display: "flex", alignItems: "center", gap: 13, background: `linear-gradient(120deg,${b.soft},#fff)`, borderColor: `color-mix(in srgb, ${b.accent} 18%, white)` }, children: [
    /* @__PURE__ */ jsx("span", { style: { width: 42, height: 42, display: "grid", placeItems: "center", flexShrink: 0, background: "#ffffffb0", borderRadius: 10, padding: 6 }, children: b.asset && !failed ? /* @__PURE__ */ jsx("img", { src: "/model-logos/" + b.asset + ".svg", alt: b.name + " Logo", onError: () => setFailed(true), style: { width: "100%", height: "100%", objectFit: "contain" } }) : /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 32 32", fill: b.accent, width: "28", height: "28", children: [
      /* @__PURE__ */ jsx("path", { d: "M16 2 29 9v14l-13 7L3 23V9Zm0 6-8 4v8l8 4 8-4v-8Z", fillRule: "evenodd" }),
      /* @__PURE__ */ jsx("path", { d: "m16 11 5 3v5l-5 3-5-3v-5Z" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
      /* @__PURE__ */ jsxs("span", { style: { ...syncLabelStyle, fontSize: 11 }, children: [
        "\u5F53\u524D AI \u6A21\u578B \xB7 ",
        b.name
      ] }),
      /* @__PURE__ */ jsx("span", { style: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: b.accent, fontSize: 15, fontWeight: 650, marginTop: 3 }, children: model.modelId || model.error || "\u8BFB\u53D6\u4E2D" }),
      model.providerId && /* @__PURE__ */ jsxs("small", { style: { display: "block", color: C.textMuted, fontSize: 11, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
        "\u63A5\u5165\u6E20\u9053 \xB7 ",
        model.providerId
      ] })
    ] })
  ] });
}

// src/index.tsx
var index_default = Page;
export {
  index_default as default
};
