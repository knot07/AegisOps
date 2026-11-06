const runtime = globalThis.__AEGISOPS_WEBUI_CONTRACT_SDK__;
if (!runtime?.jsx || !runtime?.jsxs) {
  throw new Error('AegisOps WebUI page runtime is not initialized (missing jsx runtime).');
}
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export const Fragment = runtime.React.Fragment;
