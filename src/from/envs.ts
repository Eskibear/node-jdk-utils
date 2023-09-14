import * as fs from "fs";
import * as path from "path";
import { expandTilde, getRealHome, looksLikeJavaHome, JAVA_FILENAME, isMac } from "../utils";

const EXCLUSIONS_ON_MAC: Set<string> = new Set([
    "/usr",
    "/usr/"
]);
export async function candidatesFromPath(): Promise<string[]> {
    const ret = [];
    if (process.env.PATH) {
        const jdkBinFolderFromPath = process.env.PATH.split(path.delimiter)
            .filter(p => looksLikeJavaHome(p) || fs.existsSync(path.join(p, JAVA_FILENAME)))
            .map(expandTilde); // '~' can occur in envs in Unix-like systems

        /**
         * Fix for https://github.com/Eskibear/node-jdk-utils/issues/2
         * Homebrew creates symbolic links for each binary instead of folder.
         */
        const homeDirs = (await Promise.all(jdkBinFolderFromPath.map(p => getRealHome(path.dirname(p))))).filter(homeDir => {
            /**
             * Fix for https://github.com/Eskibear/node-jdk-utils/issues/15
             * /usr/bin/java is a preserved shortcut program on macOS, which is not a real java home.
             */
            return homeDir && !(isMac && EXCLUSIONS_ON_MAC.has(homeDir));
        });
        ret.push(...homeDirs);
    }
    return ret.filter(Boolean) as string[];
}

export async function candidatesFromSpecificEnv(envkey: string): Promise<string | undefined> {
    if (process.env[envkey]) {
        const rmSlash = process.env[envkey]!.replace(/[\\\/]$/, ""); // remove trailing slash if exists
        return getRealHome(rmSlash);
    }
    return undefined;
}
