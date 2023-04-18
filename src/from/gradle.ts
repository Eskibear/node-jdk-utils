import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { isMac } from "../utils";

/*
 * Gradle Toolchains JDKs path format
 *
 * Windows
 * >cd %HOMEPATH%\.gradle\jdks
 * >wsl find ./ -type f -name java.exe
 * ./adoptopenjdk-15-amd64-windows/jdk-15.0.2+7/bin/java.exe
 * ./amazon_com_inc_-18-amd64-windows/jdk18.0.2_9/bin/java.exe
 * ./eclipse_adoptium-18-amd64-windows/jdk-18.0.2.1+1/bin/java.exe
 * 
 * macOS
 * $ cd ~/.gradle/jdks
 * $ find ./ -type f -name java
 * ./adoptopenjdk-15-x64-mac_hotspot/jdk-15.0.2+7/Contents/Home/bin/java
 * ./amazon_com_inc_-18-x64-mac_hotspot/jdk18.0.2_9/Contents/Home/bin/java
 * ./eclipse_adoptium-18-x64-mac_hotspot/jdk-18.0.2.1+1/Contents/Home/bin/java
 * 
 * Linux
 * $ cd ~/.gradle/jdks
 * $ find ./ -type f -name java
 * ./adoptopenjdk-15-amd64-linux/jdk-15.0.2+7/bin/java
 * ./amazon_com_inc_-18-amd64-linux/18.0.2.9.1/bin/java
 * ./eclipse_adoptium-18-amd64-linux/jdk-18.0.2.1+1/bin/java
 * 
 * See https://docs.gradle.org/8.1/userguide/toolchains.html
 */
const GRADLE_USER_HOME = process.env.GRADLE_USER_HOME ?? path.join(os.homedir(), ".gradle");
const JDK_BASE_DIR = path.join(GRADLE_USER_HOME, "jdks");

export async function candidates(): Promise<string[]> {
    const ret = [];
    try {
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