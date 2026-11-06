import fs from "fs/promises"
import path from "path"
import os from "os"

const app = "aegisops"

/**
 * Get aegisops root directory
 * Default: ~/.aegisops
 * Override: AEGISOPS_ROOT environment variable
 */
function getAegisOpsRoot(): string {
  return process.env.AEGISOPS_ROOT || path.join(os.homedir(), `.${app}`)
}

const root = getAegisOpsRoot()

export namespace Global {
  export const Path = {
    /**
     * User home directory
     * Can be overridden by AEGISOPS_TEST_HOME for testing
     */
    get home() {
      return process.env.AEGISOPS_TEST_HOME || os.homedir()
    },
    
    /** Root directory: ~/.aegisops */
    root,
    
    /** Data directory: ~/.aegisops/data */
    data: process.env.AEGISOPS_DATA_DIR || path.join(root, "data"),
    
    /** Config directory: ~/.aegisops/config */
    config: process.env.AEGISOPS_CONFIG_DIR || path.join(root, "config"),
    
    /** Log directory: ~/.aegisops/logs */
    log: process.env.AEGISOPS_LOG_DIR || path.join(root, "logs"),
    
    /** Binary tools directory: ~/.aegisops/bin */
    bin: path.join(process.env.AEGISOPS_DATA_DIR || path.join(root, "data"), "bin"),
    
    /** Cache directory: ~/.aegisops/cache */
    cache: process.env.AEGISOPS_CACHE_DIR || path.join(root, "cache"),
    
    /** State directory (alias for root, for compatibility) */
    state: root,
    
    /** Memory directory: ~/.aegisops/data/memory (统一存储) */
    memory: path.join(process.env.AEGISOPS_DATA_DIR || path.join(root, "data"), "memory"),

    /** Workspace directory: ~/.aegisops/workspace */
    workspace: process.env.AEGISOPS_WORKSPACE_DIR || path.join(root, "workspace"),
  }
}

// Create all required directories
await Promise.all([
  fs.mkdir(Global.Path.data, { recursive: true }),
  fs.mkdir(Global.Path.config, { recursive: true }),
  fs.mkdir(Global.Path.log, { recursive: true }),
  fs.mkdir(Global.Path.bin, { recursive: true }),
  fs.mkdir(Global.Path.cache, { recursive: true }),
  fs.mkdir(Global.Path.workspace, { recursive: true }),
])

// Note: Memory directory (data/memory/) is created by Python backend

const CACHE_VERSION = "18"

const version = await Bun.file(path.join(Global.Path.cache, "version"))
  .text()
  .catch(() => "0")

if (version !== CACHE_VERSION) {
  try {
    const contents = await fs.readdir(Global.Path.cache)
    await Promise.all(
      contents.map((item) =>
        fs.rm(path.join(Global.Path.cache, item), {
          recursive: true,
          force: true,
        }),
      ),
    )
  } catch (e) {}
  await Bun.file(path.join(Global.Path.cache, "version")).write(CACHE_VERSION)
}
