import { setFileReader, setDirReader, setPathJoiner, initIndex, getSpecsDirs, listApis, listEndpoints, getEndpointSchema, getCallContext } from "../core/loader"
import { join } from "path"

export { initIndex, getSpecsDirs, listApis, listEndpoints, getEndpointSchema, getCallContext }

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