import { tool } from "@opencode-ai/plugin"
import { initIndex, getEndpointSchema, getSpecsDir } from "./_lib"

export default tool({
  description: `Returns the full request/response contract for a specific endpoint in .mind notation.

Use this before execute_request to understand exactly what to send.
Call this after list_endpoints and before execute_request.`,
  args: {
    api: tool.schema.string().describe("API name matching the .mind filename"),
    method: tool.schema.string().describe("HTTP method"),
    path: tool.schema.string().describe("Endpoint path")
  },
  async execute(args, context) {
    const specsDir = getSpecsDir() || `${context.directory}/specs`
    await initIndex({ specsDir })
    const result = await getEndpointSchema(args.api, args.method, args.path)
    return result
  }
})