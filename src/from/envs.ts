import * as fs from "fs/promises";
import * as path from "path";
import * as logger from "../logger";

import { JAVA_FILENAME } from "..";
import { expandTilde, looksLikeJavaHome } from "../utils";

export async function candidatesFromPath(): Promise<string[]> {
    const ret = [];
    if (process.env.PATH) {
        const jdkBinFolderFromPath = process.env.PATH.split(path.delimiter).filter(looksLikeJavaHome)
            .map(expandTilde); // '~' can occur in envs in Unix-like systems

        /**
         * Fix for https://github.com/Eskibear/node-jdk-utils/issues/2
         * Homebrew creates symbolic links for each binary instead of folder.
         */
        const homeDirs = await Promise.all(jdkBinFolderFromPath.map(p => getRealHome(path.join(p, JAVA_FILENAME))));
        ret.push(...homeDirs);
    }
    return ret.filter(Boolean) as string[]; 
}

export async function candidatesFromSpecificEnv(envkey: string): Promise<string | undefined> {
    if (process.env[envkey]) {
        const rmSlash = process.env[envkey]!.replace(/[\\\/]$/, ""); // remove trailing slash if exists
        return getRealHome(path.join(rmSlash, "bin", JAVA_FILENAME));
    }
    return undefined;
}

/**
 * Get real Java Home directory, with symbolic links resolved.
 * @param javaBinaryPathLike e.g. some-path/bin/java
 * @returns some-path
 */
async function getRealHome(javaBinaryPathLike: string): Promise<string | undefined> {
    const javaBinaryPath = expandTilde(javaBinaryPathLike);
    try {
        const rp = await fs.realpath(javaBinaryPath);
        return path.dirname(path.dirname(rp));
    } catch (error) {
        logger.log(error);
    }
    return undefined; 
}