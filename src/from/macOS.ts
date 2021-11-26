import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { deDup } from "../utils";

const JDK_BASE_DIRS = [
    "/Library/Java/JavaVirtualMachines",
    path.join(os.homedir(), "Library/Java/JavaVirtualMachines")
];

export async function candidates(): Promise<string[]> {
    const ret: string[] = [];
    ret.push(...await fromJavaHomeUtil());
    ret.push(...await fromDefaultIntallationLocation());
    return deDup(ret);
}

async function fromDefaultIntallationLocation(): Promise<string[]> {
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

/**
 * from `/usr/libexec/java_home -V`
 * @returns list of jvm homes
 */
async function fromJavaHomeUtil(): Promise<string[]> {
    const ret: string[] = [];
    const javaHomeUtility = "/usr/libexec/java_home";
    try {
        await fs.promises.access(javaHomeUtility, fs.constants.F_OK);
        await new Promise<void>((resolve, _reject) => {
            cp.execFile(javaHomeUtility, ["-V"], {}, (_error, _stdout, stderr) => {
                const regexp = /".*" - ".*" (.*)/g;
                let match;
                do{
                    match = regexp.exec(stderr);
                    if (match) {
                        ret.push(match[1]);
                    }
                } while (match !== null);
                resolve();
            });
        });
    } catch (e) {
        log(e);
    }
    return ret;
}
