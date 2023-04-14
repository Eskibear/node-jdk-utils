import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";

const GRADLE_USER_HOME = process.env.GRADLE_USER_HOME ?? path.join(os.homedir(), ".gradle");
const JDK_BASE_DIR = path.join(GRADLE_USER_HOME, "jdks");

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