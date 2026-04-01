import { tool, type Plugin } from "@opencode-ai/plugin"
import { initIndex, initBunBindings, listApis, listEndpoints, getEndpointSchema } from "./lib"
import { join } from "path"

initBunBindings()

export const ApiMindPlugin: Plugin = async (ctx) => {
  let specsDir = join(ctx.directory, "specs")

  try {
    const configPath = join(ctx.directory, "api-mind.json")
    const configFile = await Bun.file(configPath).text()
    const config = JSON.parse(configFile)
    if (config.specsDir) {
      specsDir = join(ctx.directory, config.specsDir)
    }
  } catch {
    // Config file not found or invalid, use default
  }

  await initIndex({ specsDir })
  
  return {
    tool: {
      list_apis: tool({
        description: `Lists all APIs loaded from the specs folder, with their names, titles, base URLs, and available environments.

Use this when you need to know what APIs are loaded or what environments a specific API supports.
Call this first when the user references an API you haven't seen yet.`,
        args: {},
        async execute() {
          const result = await listApis()
          return JSON.stringify(result, null, 2)
        },
      }),
      
      list_endpoints: tool({
        description: `Lists all available endpoints across all loaded .mind files. Also surfaces the available environment names.

Use this to discover what endpoints exist across all APIs. Filter by method, path, or section.
Call this when the user references an API or asks what's available.`,
        args: {
          filter: tool.schema.string().optional().describe("Substring match on method, path, or section name"),
        },
        async execute(args) {
          const result = await listEndpoints(args.filter)
          return JSON.stringify(result, null, 2)
        },
      }),
      
      get_endpoint_schema: tool({
        description: `Returns the full context for a specific endpoint including resolved URL, auth requirements, and schema.

Use this to understand an endpoint before constructing a curl command to execute via the bash tool.
Call this after list_endpoints to get the endpoint contract.`,
        args: {
          api: tool.schema.string().describe("API name matching the .mind filename"),
          method: tool.schema.string().describe("HTTP method (GET, POST, PUT, PATCH, DELETE)"),
          path: tool.schema.string().describe("Endpoint path"),
        },
        async execute(args) {
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
        },
      }),
    },
  }
}

export default ApiMindPlugin