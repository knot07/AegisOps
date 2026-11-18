// ../../../../../../projects/aegisops/aegisops/contracts/webui/shims/jsx-runtime.js
var runtime = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__;
if (!runtime?.jsx || !runtime?.jsxs) {
  throw new Error("AegisOps WebUI page runtime is not initialized (missing jsx runtime).");
}
var jsx = runtime.jsx;
var jsxs = runtime.jsxs;
var Fragment = runtime.React.Fragment;

// src/index.tsx
function Page() {
  return /* @__PURE__ */ jsx("iframe", { title: "\u5A01\u80C1\u60C5\u62A5\u5DE5\u4F5C\u53F0", src: "/api/scenes/vulnops/intelligence" + location.search, style: { display: "block", width: "100%", height: "calc(100dvh - 16px)", border: 0, background: "transparent" } });
}
export {
  Page as default
};
