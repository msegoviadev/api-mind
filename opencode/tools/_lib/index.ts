import { setFileReader, setDirReader, setPathJoiner, initIndex, getSpecsDir, listApis, listEndpoints, getEndpointSchema, getIndex } from "../../../src/core/loader"
import { join } from "path"

export { initIndex, getSpecsDir, listApis, listEndpoints, getEndpointSchema, getIndex }

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