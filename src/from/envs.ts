import * as path from "path";

export function candidates(): string[] {
    const ret = [];
    if (process.env.JAVA_HOME) {
        ret.push(process.env.JAVA_HOME.replace(/[\\\/]$/, "")); // remove trailing slash if exists
    }
    const jdkBinFolderFromPath = process.env.PATH?.split(path.delimiter).filter(looksLikeJavaHome);
    if (jdkBinFolderFromPath !== undefined) {
        const homedirs = jdkBinFolderFromPath.map(p => path.dirname(p));
        ret.push(...homedirs);
    }
    return ret;
}

function looksLikeJavaHome(dir: string) {
    const lower = dir.toLocaleLowerCase();
    return lower.includes("jdk") || lower.includes("java");
}