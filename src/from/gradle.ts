// See https://docs.gradle.org/8.1/userguide/toolchains.html

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { isMac } from "../utils";

const GRADLE_USER_HOME = process.env.GRADLE_USER_HOME ?? path.join(os.homedir(), ".gradle");
const JDK_BASE_DIR = path.join(GRADLE_USER_HOME, "jdks");

export async function candidates(): Promise<string[]> {
    const ret = [];
    try {
        // e.g. jdks/adoptopenjdk-13-x86_64-os_x/jdk-13.0.2+8
        for (const distro of await fs.promises.readdir(JDK_BASE_DIR, { withFileTypes: true })) {
            if (distro.isDirectory()) {
                const distroDir = path.join(JDK_BASE_DIR, distro.name);
                const files = await fs.promises.readdir(distroDir, { withFileTypes: true });
                const homedirs = files.filter(file => file.isDirectory()).map(file => {
                    if (isMac) {
                        return path.join(distroDir, file.name, "Contents", "Home");
                    } else {
                        return path.join(distroDir, file.name);
                    }
                });
                ret.push(...homedirs);
            }
        }
    } catch (error) {
        log(error);
    }
    return ret;
}