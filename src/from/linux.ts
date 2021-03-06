import * as fs from "fs";
import * as path from "path";
import { log } from "../logger";

const JDK_BASE_DIRS = [
    "/usr/lib/jvm", // Ubuntu
    "/usr/java", // Java 8 on CentOS?
    // ... add more if necessary
];

export async function candidates(): Promise<string[]> {
    const ret = [];
    for (const baseDir of JDK_BASE_DIRS) {
        try {
            const files = await fs.promises.readdir(baseDir, { withFileTypes: true });
            const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(baseDir, file.name));
            ret.push(...homedirs);
        } catch (error) {
            log(error);
        }
    }
    return ret;
}