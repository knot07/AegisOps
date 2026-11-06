export * from "./client.js"
export * from "./server.js"

import { createAegisOpsClient } from "./client.js"
import { createAegisOpsServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createAegisOps(options?: ServerOptions) {
  const server = await createAegisOpsServer({
    ...options,
  })

  const client = createAegisOpsClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
