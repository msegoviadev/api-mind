import { tool, type Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { initIndex, listApis, listEndpoints, getEndpointSchema, getIndex, getSpecsDir } from "./tools/_lib"
import { executeBunRequest } from "./tools/_lib"

const __dirname = dirname(fileURLToPath(import.meta.url))
const curlMindContext = readFileSync(join(__dirname, "curl-mind.md"), "utf-8")

export const CurlMindPlugin: Plugin = async (ctx) => {
  const specsDir = `${ctx.directory}/specs`
  await initIndex({ specsDir })
  
  return {
    "session.created": async (input: { sessionID: string }, output: unknown) => {
      await ctx.client.session.prompt({
        path: { id: input.sessionID },
        body: {
          noReply: true,
          parts: [{ type: "text", text: curlMindContext }],
        },
      })
    },
    
    tool: {
      list_apis: tool({
        description: `Lists all APIs loaded from the specs folder, with their names, titles, base URLs, and available environments.

Use this when you need to know what APIs are loaded or what environments a specific API supports.
Call this first when the user references an API you haven't seen yet, or when you need to know what environments are configured before calling execute_request.`,
        args: {},
        async execute() {
          const result = await listApis()
          return JSON.stringify(result, null, 2)
        },
      }),
      
      list_endpoints: tool({
        description: `Lists all available endpoints across all loaded .mind files. Also surfaces the available environment names.

Use this to discover what endpoints exist across all APIs. Filter by method, path, or section.
Call this first when the user references an API or asks what's available.`,
        args: {
          filter: tool.schema.string().optional().describe("Substring match on method, path, or section name"),
        },
        async execute(args) {
          const result = await listEndpoints(args.filter)
          return JSON.stringify(result, null, 2)
        },
      }),
      
      get_endpoint_schema: tool({
        description: `Returns the full request/response contract for a specific endpoint in .mind notation.

Use this before execute_request to understand exactly what to send.
Call this after list_endpoints and before execute_request.`,
        args: {
          api: tool.schema.string().describe("API name matching the .mind filename"),
          method: tool.schema.string().describe("HTTP method"),
          path: tool.schema.string().describe("Endpoint path"),
        },
        async execute(args) {
          const result = await getEndpointSchema(args.api, args.method, args.path)
          return result
        },
      }),
      
      execute_request: tool({
        description: `Executes an HTTP request via curl and returns the status code, headers, and body.

Provide only the relative path — the base URL is resolved from the .mind header.
Use get_endpoint_schema first to understand the request/response contract.
Auth headers are your responsibility.`,
        args: {
          api: tool.schema.string().describe("API name"),
          method: tool.schema.string().describe("HTTP method: GET, POST, PUT, PATCH, DELETE"),
          path: tool.schema.string().describe("Relative path"),
          env: tool.schema.string().optional().describe("Server environment label"),
          headers: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Request headers"),
          body: tool.schema.string().optional().describe("JSON body"),
          query_params: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Query parameters"),
          path_params: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Path parameters"),
        },
        async execute(args) {
          const result = await executeBunRequest(
            {
              api: args.api,
              method: args.method,
              path: args.path,
              env: args.env,
              headers: args.headers as Record<string, string> | undefined,
              body: args.body,
              query_params: args.query_params as Record<string, string> | undefined,
              path_params: args.path_params as Record<string, string> | undefined,
            },
            getIndex
          )
          return JSON.stringify(result, null, 2)
        },
      }),
    },
  }
}