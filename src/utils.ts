export function looksLikeJavaHome(dir: string) {
    const lower = dir.toLocaleLowerCase();
    return lower.includes("jdk") || lower.includes("java");
}