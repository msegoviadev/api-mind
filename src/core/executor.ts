import type { ExecuteResult, ExecuteResultSuccess, ExecuteResultError, TransportErrorType } from "./types"

export interface HttpRequest {
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: string
}

export interface HttpExecutor {
  execute(request: HttpRequest): Promise<HttpResponse>
}

const CURL_EXIT_CODES: Record<number, TransportErrorType> = {
  6: "dns_failure",
  7: "connection_refused",
  28: "timeout",
  35: "ssl_error",
  52: "connection_refused",
  56: "connection_refused",
}

export function validatePath(path: string): { valid: boolean; error?: string } {
  if (!path.startsWith("/")) {
    return { valid: false, error: "Path must start with /" }
  }
  if (path.includes("..")) {
    return { valid: false, error: "Path cannot contain .." }
  }
  if (path.match(/^https?:\/\//i)) {
    return { valid: false, error: "Path cannot be a full URL" }
  }
  return { valid: true }
}

export function buildUrl(base: string, path: string, queryParams?: Record<string, string>, pathParams?: Record<string, string>): string {
  let url = base.endsWith("/")? base.slice(0, -1) : base
  let interpolatedPath = path
  
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      interpolatedPath = interpolatedPath.replace(`{${key}}`, encodeURIComponent(value))
    }
  }
  
  url += interpolatedPath.startsWith("/") ? interpolatedPath : "/" + interpolatedPath
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParams)) {
      params.append(key, value)
    }
    url += "?" + params.toString()
  }
  
  return url
}

export function parseCurlResponse(raw: string): HttpResponse {
  const lines = raw.split("\n")
  let status = 0
  const headers: Record<string, string> = {}
  let bodyStartIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("HTTP/")) {
      const match = line.match(/HTTP\/[\d.]+\s+(\d+)/)
      if (match) {
        status = parseInt(match[1], 10)
      }
    } else if (line.includes(": ") && !line.startsWith(" ")&& !line.startsWith("\t")) {
      const [name, ...valueParts] = line.split(": ")
      headers[name.toLowerCase()] = valueParts.join(": ").trim()
    } else if (line === ""|| line.trim() === "") {
      bodyStartIndex = i + 1
      break
    }
  }
  
  const body = lines.slice(bodyStartIndex).join("\n").trim()
  
  return { status, headers, body }
}

export function mapCurlError(exitCode: number, stderr: string): ExecuteResultError {
  const errorType = CURL_EXIT_CODES[exitCode]|| "unknown"
  let message = stderr || `Request failed with exit code ${exitCode}`
  
  switch (errorType) {
    case "timeout":
      message = "Request timed out"
      break
    case "connection_refused":
      message = "Connection refused"
      break
    case "dns_failure":
      message = "DNS resolution failed"
      break
    case "ssl_error":
      message = "SSL/TLS handshake failed"
      break
  }
  
  return { error: errorType, message }
}

export function createSuccessResponse(status: number, headers: Record<string, string>, body: string): ExecuteResultSuccess {
  return { status, headers, body }
}

export function createErrorResponse(error: TransportErrorType, message: string): ExecuteResultError {
  return { error, message }
}