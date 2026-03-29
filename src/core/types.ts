import { z } from "zod"

export interface ApiMeta {
  filePath: string
  title: string
  defaultUrl: string
  servers: Record<string, string>
}

export interface EndpointEntry {
  api: string
  section: string
  method: string
  path: string
  auth?: string
}

export interface EndpointIndex {
  environments: string[]
  apis: Record<string, ApiMeta>
  endpoints: EndpointEntry[]
}

export interface ApiInfo {
  name: string
  title: string
  defaultUrl: string
  environments: Record<string, string>
}

export interface ListApisResult {
  apis: ApiInfo[]
}

export interface ListEndpointsResult {
  environments: string[]
  endpoints: EndpointEntry[]
}

export interface GetEndpointSchemaInput {
  api: string
  method: string
  path: string
}

export interface ExecuteRequestInput {
  api: string
  method: string
  path: string
  env?: string
  headers?: Record<string, string>
  body?: string
  query_params?: Record<string, string>
  path_params?: Record<string, string>
}

export interface ExecuteResultSuccess {
  status: number
  headers: Record<string, string>
  body: string
}

export interface ExecuteResultError {
  error: TransportErrorType
  message: string
}

export type TransportErrorType = 
  | "timeout"
  | "connection_refused"
  | "dns_failure"
  | "ssl_error"
  | "unknown_environment"
  | "unknown"

export type ExecuteResult = ExecuteResultSuccess | ExecuteResultError

export interface InitOptions {
  specsDir: string
}

export interface ParsedApiHeader {
  title: string
  defaultUrl: string
}

export interface ParsedEndpoint {
  method: string
  path: string
  auth?: string
  section: string
}