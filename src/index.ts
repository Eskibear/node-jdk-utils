import * as fs from "fs";
import * as path from "path";
import * as envs from "./from/envs";
import * as jenv from "./from/jenv";
import * as linux from "./from/linux";
import * as macOS from "./from/macOS";
import * as sdkman from "./from/sdkman";
import * as windows from "./from/windows";
import * as logger from "./logger";
import { deDup } from "./utils";

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
    
    // platform-specific default location
    if (isLinux) {
        candidates.push(...await linux.candidates());
    }
    if (isMac) {
        candidates.push(...await macOS.candidates());
    }
    if (isWindows) {
        candidates.push(...await windows.candidates());
    }

    // from envs, e.g. JAVA_HOME, PATH
    candidates.push(...envs.candidates());

    // jEnv
    candidates.push(...await jenv.candidates())

    // dedup
    const promises: Promise<IJavaRuntime>[] = deDup(candidates).map(parseRuntime);
    const runtimes = await Promise.all(promises);
    return runtimes.filter(r => r.version !== undefined);
}

async function parseRuntime(homedir: string): Promise<IJavaRuntime> {
    const runtime: IJavaRuntime = { homedir };
    const releaseFile = path.join(homedir, "release");
    try {
        const content = await fs.promises.readFile(releaseFile, { encoding: "utf-8" });
        const regexp = /^JAVA_VERSION="(.*)"/gm;
        const match = regexp.exec(content.toString());
        if (!match) {
            return runtime;
        }
        const openjdk_version = match[1];
        const major = parseMajorVersion(openjdk_version);

        runtime.version = {
            openjdk_version,
            major
        };
    } catch (error) {
        logger.log(error);
    }
    return runtime;
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
