import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";

const JABBA_DIR = path.join(os.homedir(), ".jabba");
const JDK_BASE_DIR = path.join(JABBA_DIR, "jdk");

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