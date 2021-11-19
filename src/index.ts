import * as fs from "fs";
import * as path from "path";
import * as sdkman from "./sdkman";

const isWindows: boolean = process.platform.indexOf("win") === 0;
const isMac: boolean = process.platform.indexOf("darwin") === 0;
const isLinux: boolean = process.platform.indexOf("linux") === 0;

interface IOptions {
    withVersion?: boolean;
}

interface IJavaVersion {
    openjdk_version: string;
    major: number;
}

interface IJavaRuntime {
    homedir: string;
    version?: IJavaVersion;
}

export async function findRuntimes(options?: IOptions): Promise<IJavaRuntime[]> {
    const candidates: string[] = [];
    // SDKMAN
    candidates.push(...await sdkman.candidates());
    // TBD: other candidates
    
    // dedup
    const candidateSet = new Set(candidates);
    const promises: Promise<IJavaRuntime>[] = Array.from(candidateSet).map(parseRuntime);
    return Promise.all(promises);
}

async function parseRuntime(homedir: string): Promise<IJavaRuntime> {
    const releaseFile = path.join(homedir, "release");
    const content = await fs.promises.readFile(releaseFile, {encoding: "utf-8"});
    const regexp = /^JAVA_VERSION="(.*)"/gm;
    const match = regexp.exec(content.toString());
    if (!match) {
        return { homedir };
    }
    const openjdk_version = match[1];
    const major = parseMajorVersion(openjdk_version);

    return {
        homedir,
        version: {
            openjdk_version,
            major
        }
    }
}

function parseMajorVersion(version: string): number {
    if (!version) {
        return 0;
    }
    // Ignore '1.' prefix for legacy Java versions
    if (version.startsWith("1.")) {
        version = version.substring(2);
    }
    // look into the interesting bits now
    const regexp = /\d+/g;
    const match = regexp.exec(version);
    let javaVersion = 0;
    if (match) {
        javaVersion = parseInt(match[0]);
    }
    return javaVersion;
}
