export function looksLikeJavaHome(dir: string) {
    const lower = dir.toLocaleLowerCase();
    return lower.includes("jdk") || lower.includes("java");
}

export function deDup(arr: string[]) {
    return Array.from(new Set(arr));
}