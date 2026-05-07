import * as fs from "fs";
import * as path from "path";
import { log } from "../logger";

/**
 * List candidate Java homes under the given parent folders.
 *
 * Each entry is treated as a parent folder of possible Java Homes (not a Java
 * Home itself). Lookup is shallow: only direct subdirectories are returned.
 */
export async function candidates(parentDirs: string[]): Promise<string[]> {
    const ret: string[] = [];
    for (const parent of parentDirs) {
        try {
            const files = await fs.promises.readdir(parent, { withFileTypes: true });
            const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(parent, file.name));
            ret.push(...homedirs);
        } catch (error) {
            log(error);
        }
    }
    return ret;
}
