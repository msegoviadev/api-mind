import { tool } from "@opencode-ai/plugin"
import { initIndex, getEndpointSchema, getSpecsDir } from "./_lib"

export default tool({
  description: `Returns the full context for a specific endpoint including resolved URL, auth requirements, and schema.

Use this to understand an endpoint before constructing a curl command to execute via the bash tool.
Call this after list_endpoints to get the endpoint contract.`,
  args: {
    api: tool.schema.string().describe("API name matching the .mind filename"),
    method: tool.schema.string().describe("HTTP method (GET, POST, PUT, PATCH, DELETE)"),
    path: tool.schema.string().describe("Endpoint path")
  },
  async execute(args, context) {
    const specsDir = getSpecsDir() || `${context.directory}/specs`
    await initIndex({ specsDir })
    const result = await getEndpointSchema(args.api, args.method, args.path)
    
    const envList = Object.entries(result.environments)
      .map(([name, url]) => `  ${name}: ${url}`)
      .join("\n")
    
    const authLine = result.auth ? `Auth: ${result.auth}` : "Auth: None"
    
    const output = `# API: ${result.title}
# Base URL: ${result.defaultUrl}
# Environments:
${envList}

## Endpoint
${result.method} ${result.path}
${authLine}

## Schema
${result.schema}`
    
    return output
  }
})