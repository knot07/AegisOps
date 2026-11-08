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
function Page() {
  const frame = useRef(null);
  const initial = useRef(new URLSearchParams(location.search).get("view") || "overview");
  useEffect(() => {
    const message = (event) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== "aegis:vuln-view") return;
      const view = event.data.view;
      if (!["overview", "ledger", "remediation", "assets", "users", "audit"].includes(view)) return;
      const url = new URL(location.href);
      url.searchParams.set("view", view);
      history.replaceState(history.state, "", url);
      window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
    };
    window.addEventListener("message", message);
    return () => window.removeEventListener("message", message);
  }, []);
  return /* @__PURE__ */ jsx("iframe", { ref: frame, title: "\u6F0F\u6D1E\u8FD0\u8425\u573A\u666F", src: "/api/scenes/vulnops/?view=" + encodeURIComponent(initial.current) + "&vulnerability=" + encodeURIComponent(new URLSearchParams(location.search).get("vulnerability") || ""), style: { display: "block", width: "100%", height: "calc(100dvh - 16px)", border: 0, background: "transparent" } });
}
export {
  Page as default
};
