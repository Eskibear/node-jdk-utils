import * as path from "path";
import { expandTilde, looksLikeJavaHome } from "../utils";

export function candidatesFromPath(): string[] {
    const ret = [];
    if (process.env.PATH) {
        const jdkBinFolderFromPath = process.env.PATH.split(path.delimiter).filter(looksLikeJavaHome);
        const homeDirs = jdkBinFolderFromPath.map(p => path.dirname(p));
        ret.push(...homeDirs);
    }
    return ret.map(expandTilde); // '~' can occur in envs in Unix-like systems
}

export function candidatesFromSpecificEnv(envkey: string): string | undefined {
    if (process.env[envkey]) {
        const rmSlash = process.env[envkey]!.replace(/[\\\/]$/, ""); // remove trailing slash if exists
        return expandTilde(rmSlash);
    }
    return undefined;
}