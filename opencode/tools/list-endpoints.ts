import { tool } from "@opencode-ai/plugin"
import { initIndex, listEndpoints, getSpecsDir } from "./_lib"

export default tool({
  description: `Lists all available endpoints across all loaded .mind files. Also surfaces the available environment names.

Use this to discover what endpoints exist across all APIs. Filter by method, path, or section.
Call this first when the user references an API or asks what's available.`,
  args: {
    filter: tool.schema.string().optional().describe("Substring match on method, path, or section name")
  },
  async execute(args, context) {
    const specsDir = getSpecsDir() || `${context.directory}/specs`
    await initIndex({ specsDir })
    const result = await listEndpoints(args.filter)
    return JSON.stringify(result, null, 2)
  }
})