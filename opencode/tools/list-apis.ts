import { tool } from "@opencode-ai/plugin"
import { initIndex, listApis, getSpecsDir } from "./_lib"

export default tool({
  description: `Lists all APIs loaded from the specs folder, with their names, titles, base URLs, and available environments.

Use this when you need to know what APIs are loaded or what environments a specific API supports.
Call this first when the user references an API you haven't seen yet, or when you need to know what environments are configured before calling execute_request.`,
  args: {},
  async execute(args, context) {
    const specsDir = getSpecsDir() || `${context.directory}/specs`
    await initIndex({ specsDir })
    const result = await listApis()
    return JSON.stringify(result, null, 2)
  }
})