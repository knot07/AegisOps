import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"

let dir: string
const prevConfigDir = process.env.AEGISOPS_CONFIG_DIR

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "aegisops-sdk-token-"))
  process.env.AEGISOPS_CONFIG_DIR = dir
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  if (prevConfigDir === undefined) delete process.env.AEGISOPS_CONFIG_DIR
  else process.env.AEGISOPS_CONFIG_DIR = prevConfigDir
})

function writeSecret(token: string, mtimeSeconds: number) {
  const file = path.join(dir, ".secret.json")
  writeFileSync(file, JSON.stringify({ server_api_token: token }))
  utimesSync(file, mtimeSeconds, mtimeSeconds)
}

describe("createAegisOpsClient token handling", () => {
  test("re-reads a rotated server_api_token on the next request (mtime cache)", async () => {
    const { createAegisOpsClient } = await import("./client.ts")
    writeSecret("token-old", 1_700_000_000)
    const seen: string[] = []
    const fakeFetch: any = async (req: Request) => {
      seen.push(req.headers.get("authorization") ?? "")
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    }
    const client = createAegisOpsClient({ baseUrl: "http://127.0.0.1:9", fetch: fakeFetch })
    await client.config.get()
    writeSecret("token-new", 1_700_000_100)
    await client.config.get()
    expect(seen).toEqual(["Bearer token-old", "Bearer token-new"])
  })

  test("does not override an auth header supplied by the caller", async () => {
    const { createAegisOpsClient } = await import("./client.ts")
    writeSecret("token-old", 1_700_000_000)
    const seen: Record<string, string | null>[] = []
    const fakeFetch: any = async (req: Request) => {
      seen.push({ authorization: req.headers.get("authorization"), alt: req.headers.get("x-aegisops-api-token") })
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    }
    const client = createAegisOpsClient({ baseUrl: "http://127.0.0.1:9", fetch: fakeFetch, headers: { "x-aegisops-api-token": "abc" } })
    await client.config.get()
    expect(seen).toEqual([{ authorization: null, alt: "abc" }])
  })
})

describe("createAegisOpsClient identity (G05)", () => {
  const prevSession = process.env.AEGISOPS_SESSION
  const prevToken = process.env.AEGISOPS_API_TOKEN

  afterEach(() => {
    if (prevSession === undefined) delete process.env.AEGISOPS_SESSION
    else process.env.AEGISOPS_SESSION = prevSession
    if (prevToken === undefined) delete process.env.AEGISOPS_API_TOKEN
    else process.env.AEGISOPS_API_TOKEN = prevToken
  })

  function recordingFetch(seen: Record<string, string | null>[]): any {
    return async (req: Request) => {
      seen.push({ authorization: req.headers.get("authorization"), cookie: req.headers.get("cookie") })
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    }
  }

  test("a login session goes as the user's cookie, never with the machine token", async () => {
    const { createAegisOpsClient } = await import("./client.ts")
    writeSecret("machine-token", 1_700_000_000)
    process.env.AEGISOPS_SESSION = "sess-user-1"
    const seen: Record<string, string | null>[] = []
    const client = createAegisOpsClient({ baseUrl: "http://127.0.0.1:9", fetch: recordingFetch(seen) })
    await client.config.get()
    expect(seen).toEqual([{ authorization: null, cookie: "aegisops_session=sess-user-1" }])
  })

  test("an explicit token wins over the stored one", async () => {
    const { createAegisOpsClient } = await import("./client.ts")
    writeSecret("machine-token", 1_700_000_000)
    delete process.env.AEGISOPS_SESSION
    process.env.AEGISOPS_API_TOKEN = "tok-explicit"
    const seen: Record<string, string | null>[] = []
    const client = createAegisOpsClient({ baseUrl: "http://127.0.0.1:9", fetch: recordingFetch(seen) })
    await client.config.get()
    expect(seen).toEqual([{ authorization: "Bearer tok-explicit", cookie: null }])
  })
})
