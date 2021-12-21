import * as fs from "fs";
import * as path from "path";
import { log } from "../logger";
import { deDup, getRealHome, looksLikeJavaHome } from "../utils";

/*
$ ls -l /usr/local/opt
openjdk -> ../Cellar/openjdk/15.0.1
openjdk@11 -> ../Cellar/openjdk@11/11.0.12
openjdk@15 -> ../Cellar/openjdk/15.0.1

$ ls -l /usr/local/opt/openjdk/bin/java
/usr/local/opt/openjdk/bin/java -> ../libexec/openjdk.jdk/Contents/Home/bin/java

# Real path is:
# /usr/local/Cellar/openjdk/15.0.1/libexec/openjdk.jdk/Contents/Home/bin/java

*/

/**
 * See: https://docs.brew.sh/Installation
 */
export const HOMEBREW_DIR_INTEL = "/usr/local/opt";
export const HOMEBREW_DIR_APPLE_SILLICON = "/opt/homebrew/opt";
export const HOMEBREW_DIR_LINUX = "/home/linuxbrew/.linuxbrew/opt";

export async function candidates(homebrewOptPath: string): Promise<string[]> {
    const ret = [];
    try {
        const files = await fs.promises.readdir(homebrewOptPath, { withFileTypes: true });
        const homeDirLinks = files.filter(file => file.isSymbolicLink() && looksLikeJavaHome(file.name)).map(file => path.join(homebrewOptPath, file.name));

        const actualHomeDirs = await Promise.all(deDup(homeDirLinks).map(file => getRealHome(file)))
        ret.push(...actualHomeDirs);
    } catch (error) {
        log(error);
    }
    return ret.filter(Boolean) as string[];
}
