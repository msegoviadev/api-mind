import { setFileReader, setDirReader, setPathJoiner, initIndex, getSpecsDir, listApis, listEndpoints, getEndpointSchema, getIndex } from "../../../src/core/loader"
import type { HttpExecutor, HttpRequest, HttpResponse } from "../../../src/core/executor"
import { parseCurlResponse, mapCurlError, validatePath, buildUrl, createSuccessResponse, createErrorResponse } from "../../../src/core/executor"
import type { ExecuteResult } from "../../../src/core/types"
import { join } from "path"

export { initIndex, getSpecsDir, listApis, listEndpoints, getEndpointSchema, getIndex, validatePath, buildUrl, createSuccessResponse, createErrorResponse }

export function initBunBindings(): void {
  setFileReader(async (path: string) => {
    return await Bun.file(path).text()
  })
  
  setDirReader(async (dir: string) => {
    const { readdir } = await import("fs/promises")
    return await readdir(dir)
  })
  
  setPathJoiner((...parts: string[]) => join(...parts))
}

export class BunExecutor implements HttpExecutor {
  async execute(request: HttpRequest): Promise<HttpResponse> {
    const url = request.url
    const method = request.method
    const timeout = request.timeout ?? 30
    
    const args: string[] = ["curl", "-i", "-X", method, "--max-time", String(timeout)]
    
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        args.push("-H", `${key}: ${value}`)
      }
    }
    
    if (request.body) {
      args.push("-d", request.body)
    }
    
    args.push(url)
    
    try {
      const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" })
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited
      
      if (exitCode !== 0) {
        throw mapCurlError(exitCode, stderr)
      }
      
      return parseCurlResponse(stdout)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "error" in error) {
        throw error
      }
      throw mapCurlError(1, String(error))
    }
  }
}

export async function executeBunRequest(input: {
  api: string
  method: string
  path: string
  env?: string
  headers?: Record<string, string>
  body?: string
  query_params?: Record<string, string>
  path_params?: Record<string, string>
  timeout?: number
}, getIndexFn: () => Promise<unknown>): Promise<ExecuteResult> {
  const validation = validatePath(input.path)
  if (!validation.valid) {
    return createErrorResponse("unknown", validation.error || "Invalid path")
  }
  
  const index = await getIndexFn() as { apis: Record<string, { filePath: string; title: string; defaultUrl: string; servers: Record<string, string> }> }
  const apiMeta = index.apis[input.api]
  
  if (!apiMeta) {
    return createErrorResponse(
      "unknown",
      `API "${input.api}" not found. Available: ${Object.keys(index.apis).join(", ")}`
    )
  }
  
  let baseUrl: string
  if (input.env) {
    const envKey = Object.keys(apiMeta.servers).find(
      k => k.toLowerCase() === input.env!.toLowerCase()
    )
    if (!envKey) {
      return createErrorResponse(
        "unknown_environment",
        `Environment "${input.env}" not found for API "${input.api}". Available: ${Object.keys(apiMeta.servers).join(", ")}`
      )
    }
    baseUrl = apiMeta.servers[envKey]
  } else {
    baseUrl = apiMeta.defaultUrl
  }
  
  const url = buildUrl(baseUrl, input.path, input.query_params, input.path_params)
  
  const executor = new BunExecutor()
  
  try {
    const response = await executor.execute({
      url,
      method: input.method,
      headers: input.headers,
      body: input.body,
      timeout: input.timeout,
    })
    
    return createSuccessResponse(response.status, response.headers, response.body)
  } catch (error: unknown) {
    return error as ExecuteResult
  }
}