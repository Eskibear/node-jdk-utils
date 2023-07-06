import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { looksLikeJavaHome } from "../utils";

const PROGRAM_DIRS = Array.from(new Set([
    process.env.ProgramW6432,
    process.env.ProgramFiles,
    process.env.LOCALAPPDATA,
    path.join(os.homedir(), "AppData", "Local")
])).filter(Boolean) as string[];

const POPULAR_DISTRIBUTIONS = [
    "Eclipse Foundation", // Adoptium
    "Eclipse Adoptium", // Eclipse Temurin
    "Java", // Oracle Java SE
    "Amazon Corretto",
    "Microsoft", // Microsoft OpenJDK
    path.join("SapMachine", "JDK"), // SAP Machine
    "Zulu", // Azul OpenJDK
];

export async function candidates(): Promise<string[]> {
    const ret = [];
    for (const programDir of PROGRAM_DIRS) {
        for (const distro of POPULAR_DISTRIBUTIONS) {
            const baseDir = path.join(programDir, distro);
            try {
                const files = await fs.promises.readdir(baseDir, { withFileTypes: true });
                const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(baseDir, file.name));
                ret.push(...homedirs);
            } catch (error) {
                log(error);
            }
        }
    }
    return ret.filter(looksLikeJavaHome);
}