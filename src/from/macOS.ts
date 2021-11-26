import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";

const JDK_BASE_DIRS = [
    "/Library/Java/JavaVirtualMachines",
    path.join(os.homedir(), "Library/Java/JavaVirtualMachines")
];

export async function candidates(): Promise<string[]> {
    const ret = [];
    for (const baseDir of JDK_BASE_DIRS) {
        try {
            const files = await fs.promises.readdir(baseDir, { withFileTypes: true });
            const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(baseDir, file.name, "Contents", "Home" /** macOS specific subfolder */));
            ret.push(...homedirs);
        } catch (error) {
            log(error);
        }
    }
    return ret;
}
