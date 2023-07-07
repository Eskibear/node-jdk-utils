import * as cp from "child_process";
import * as path from "path";
import { expandTilde, getRealHome, looksLikeJavaHome } from "../utils";
import { log } from "../logger";

const JAVA_HOME_PREFIX = "java.home = ";

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
    ret.push(await candidateFromExecutable())
    return ret.filter(Boolean) as string[];
}

function candidateFromExecutable(): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        cp.exec("java -XshowSettings:properties -version", (error, _stdout, stderr) => {
            if (error) {
                resolve(undefined);
            } else {
                const javaHome = stderr.split(/\r?\n/)
                    .find(line => line.search(JAVA_HOME_PREFIX) > 0)
                    ?.replace(JAVA_HOME_PREFIX, "")
                    ?.trimStart()
                    ?.trimEnd();
                if (!javaHome) {
                    log("Failed to get 'java.home' from java properties");
                }
                resolve(javaHome);
            }
        });
    });
}

export async function candidatesFromSpecificEnv(envkey: string): Promise<string | undefined> {
    if (process.env[envkey]) {
        const rmSlash = process.env[envkey]!.replace(/[\\\/]$/, ""); // remove trailing slash if exists
        return getRealHome(rmSlash);
    }
    return undefined;
}
