import * as path from "path";
import { expandTilde, looksLikeJavaHome } from "../utils";

export function candidates(): string[] {
    const ret = [];
    if (process.env.JAVA_HOME) {
        ret.push(process.env.JAVA_HOME.replace(/[\\\/]$/, "")); // remove trailing slash if exists
    }
    if (process.env.PATH) {
        const jdkBinFolderFromPath = process.env.PATH.split(path.delimiter).filter(looksLikeJavaHome);
        const homeDirs = jdkBinFolderFromPath.map(p => path.dirname(p));
        ret.push(...homeDirs);
    }
    return ret.map(expandTilde); // '~' can occur in envs in Unix-like systems
}
