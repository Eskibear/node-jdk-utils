import { join } from "path";
import { homedir } from "os";

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