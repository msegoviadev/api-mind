import { tool } from "@opencode-ai/plugin"
import { initIndex, getIndex, getSpecsDir } from "./_lib"
import { executeBunRequest } from "./_lib"

export default tool({
  description: `Executes an HTTP request via curl and returns the status code, headers, and body.

Provide only the relative path — the base URL is resolved from the .mind header.
Use get_endpoint_schema first to understand the request/response contract.
Auth headers are your responsibility.`,
  args: {
    api: tool.schema.string().describe("API name matching the .mind filename"),
    method: tool.schema.string().describe("HTTP method: GET, POST, PUT, PATCH, DELETE"),
    path: tool.schema.string().describe("Relative path"),
    env: tool.schema.string().optional().describe("Server environment label"),
    headers: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Request headers"),
    body: tool.schema.string().optional().describe("JSON body"),
    query_params: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Query parameters"),
    path_params: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Path parameters")
  },
  async execute(args, context) {
    const specsDir = getSpecsDir() || `${context.directory}/specs`
    await initIndex({ specsDir })
    
    const result = await executeBunRequest(
      {
        api: args.api,
        method: args.method,
        path: args.path,
        env: args.env,
        headers: args.headers as Record<string, string> | undefined,
        body: args.body,
        query_params: args.query_params as Record<string, string> | undefined,
        path_params: args.path_params as Record<string, string> | undefined
      },
      getIndex
    )
    
    return JSON.stringify(result, null, 2)
  }
})