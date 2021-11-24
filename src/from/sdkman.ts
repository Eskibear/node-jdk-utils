import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";

const SDKMAN_DIR = process.env.SDKMAN_DIR ?? path.join(os.homedir(), ".sdkman");
const JDK_BASE_DIR = path.join(SDKMAN_DIR, "candidates", "java");

export async function candidates(): Promise<string[]> {
    const ret = [];
    try {
        const files = await fs.promises.readdir(JDK_BASE_DIR, { withFileTypes: true });
        const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(JDK_BASE_DIR, file.name));
        ret.push(...homedirs);
    } catch (error) {
        log(error);
    }
    return ret;
}