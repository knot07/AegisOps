export * from "./gen/types.gen.js"

import { readFileSync, statSync } from "fs"
import os from "os"
import path from "path"
import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { AegisOpsClient } from "./gen/sdk.gen.js"
export { type Config as AegisOpsClientConfig, AegisOpsClient }

const API_TOKEN_SECRET_ID = "server_api_token"

let tokenCache: { path: string; mtimeMs: number; value: string | undefined } | undefined

function getStoredApiToken(): string | undefined {
  if (typeof process === "undefined") return undefined
  const configDir = process.env.AEGISOPS_CONFIG_DIR || path.join(os.homedir(), ".aegisops", "config")
  const secretFile = path.join(configDir, ".secret.json")

  try {
    const stat = statSync(secretFile)
    if (
      tokenCache &&
      tokenCache.path === secretFile &&
      tokenCache.mtimeMs === stat.mtimeMs
    ) {
      return tokenCache.value
    }
    const parsed = JSON.parse(readFileSync(secretFile, "utf-8")) as Record<string, unknown>
    const raw = parsed[API_TOKEN_SECRET_ID]
    const value = typeof raw === "string" && raw.trim() ? raw.trim() : undefined
    tokenCache = { path: secretFile, mtimeMs: stat.mtimeMs, value }
    return value
  } catch {
    tokenCache = undefined
    return undefined
  }
}

function hasAuthHeader(headers: Headers) {
  return (
    headers.has("authorization") ||
    headers.has("x-aegisops-api-token") ||
    (headers.get("cookie") ?? "").includes("aegisops_session=")
  )
}

// Who the calls are made as, besides this machine's stored service token:
// AEGISOPS_SESSION is a login session (the user's own identity and permissions,
// as in the WebUI); AEGISOPS_API_TOKEN is a token given explicitly. Read on every
// request, like the stored token, so a changed value applies at once.
function envSession(): string | undefined {
  if (typeof process === "undefined") return undefined
  const value = process.env.AEGISOPS_SESSION?.trim()
  return value || undefined
}

function envApiToken(): string | undefined {
  if (typeof process === "undefined") return undefined
  const value = process.env.AEGISOPS_API_TOKEN?.trim()
  return value || undefined
}

function applyAuth(headers: Headers) {
  const session = envSession()
  if (session) {
    headers.set("Cookie", `aegisops_session=${session}`)
    headers.delete("Authorization")
    return
  }
  const apiToken = envApiToken() ?? getStoredApiToken() // secret-guard: allow 误报：从环境变量或本机存储读取
  if (apiToken) headers.set("Authorization", `Bearer ${apiToken}`)
}

function withAuthHeaders(config?: Config & { directory?: string }) {
  const headers = new Headers(config?.headers as HeadersInit | undefined)
  if (!hasAuthHeader(headers)) applyAuth(headers)
  return headers
}

export function createAegisOpsClient(config?: Config & { directory?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  const callerHasAuth = hasAuthHeader(new Headers(config?.headers as HeadersInit | undefined))
  const headers = withAuthHeaders(config)

  if (config?.directory) {
    headers.set("x-aegisops-directory", config.directory)
  }
  config = { ...config, headers: Object.fromEntries(headers.entries()) }

  const client = createClient(config)
  if (!callerHasAuth) {
    // token 轮换（.secret.json 被改写、mtime 变化）后新请求要带新 token：
    // 创建 client 时只读一次会让运行中的 TUI 一直用旧 token 报 401，直到重启
    client.interceptors.request.use((request) => {
      applyAuth(request.headers)
      return request
    })
  }
  return new AegisOpsClient({ client })
}
