import * as path from "path";
import { expandTilde, getRealHome, looksLikeJavaHome } from "../utils";

export async function candidatesFromPath(): Promise<string[]> {
    const ret = [];
    if (process.env.PATH) {
        const jdkBinFolderFromPath = process.env.PATH.split(path.delimiter).filter(looksLikeJavaHome)
            .map(expandTilde); // '~' can occur in envs in Unix-like systems

        /**
         * Fix for https://github.com/Eskibear/node-jdk-utils/issues/2
         * Homebrew creates symbolic links for each binary instead of folder.
         */
        const homeDirs = await Promise.all(jdkBinFolderFromPath.map(p => getRealHome(path.dirname(p))));
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
