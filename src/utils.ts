import * as fs from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import * as logger from "./logger";

export const isWindows: boolean = process.platform.indexOf("win") === 0;
export const isMac: boolean = process.platform.indexOf("darwin") === 0;
export const isLinux: boolean = process.platform.indexOf("linux") === 0;

export const JAVA_FILENAME = isWindows ? "java.exe" : "java";
export const JAVAC_FILENAME = isWindows ? "javac.exe" : "javac";

export function looksLikeJavaHome(dir: string) {
    const lower = dir.toLocaleLowerCase();
    return lower.includes("jdk") || lower.includes("java");
}

export function deDup(arr: string[]) {
    return Array.from(new Set(arr));
}

export function expandTilde(filepath: string) {
    if (filepath.charCodeAt(0) === 126 /* ~ */) {
        return join(homedir(), filepath.slice(1));
    } else {

        return filepath;
    }
}

/**
 * Get real Java Home directory, deducted from real path of 'bin/java', with symbolic links resolved.
 * Mainly for Homebrew.
 * @param javaHomePathLike e.g. some-path supposed to have 'bin/java' under it.
 * @returns a valid java home
 */
export async function getRealHome(javaHomePathLike: string): Promise<string | undefined> {
    const javaBinaryPath = expandTilde(join(javaHomePathLike, "bin", JAVA_FILENAME));
    try {
        const rp = await fs.promises.realpath(javaBinaryPath);
        return dirname(dirname(rp));
    } catch (error) {
        logger.log(error);
    }
    return undefined;
}
