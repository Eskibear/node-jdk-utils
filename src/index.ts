import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
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

const JAVA_FILENAME = isWindows ? "java.exe" : "java";
const JAVAC_FILENAME = isWindows ? "javac.exe" : "javac";

interface IOptions {
    withVersion?: boolean;
    checkJavac?: boolean;
    fuzzy?: boolean;
}

interface IJavaVersion {
    openjdk_version: string;
    major: number;
}

interface IJavaRuntime {
    homedir: string;
    version?: IJavaVersion;
    hasJava?: boolean;
    hasJavac?: boolean;
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

    // dedup and construct runtimes
    let runtimes: IJavaRuntime[] = deDup(candidates).map((homedir) => ({ homedir }));


    // verification
    if (true /* always check java binary */) {
        runtimes = await Promise.all(runtimes.map(checkJavaFile));
        if (true /* java binary is required for a valid runtime */) {
            runtimes = runtimes.filter(r => r.hasJava);
        }
    }

    if (options?.checkJavac) {
        runtimes = await Promise.all(runtimes.map(checkJavacFile));
        if (!options?.fuzzy) {
            runtimes = runtimes.filter(r => r.hasJavac);
        }
    }

    if (options?.withVersion) {
        runtimes = await Promise.all(runtimes.map(parseVersion));
        if (!options?.fuzzy) {
            runtimes = runtimes.filter(r => r.version !== undefined);
        }
    }

    return runtimes;
}

async function checkJavaFile(runtime: IJavaRuntime): Promise<IJavaRuntime> {
    const { homedir } = runtime;
    const binary = path.join(homedir, "bin", JAVA_FILENAME);
    try {
        await fs.promises.access(binary, fs.constants.F_OK);
        runtime.hasJava = true;
    } catch (error) {
        runtime.hasJava = false;
    }
    return runtime;
}

async function checkJavacFile(runtime: IJavaRuntime): Promise<IJavaRuntime> {
    const { homedir } = runtime;
    const binary = path.join(homedir, "bin", JAVAC_FILENAME);
    try {
        await fs.promises.access(binary, fs.constants.F_OK);
        runtime.hasJavac = true;
    } catch (error) {
        runtime.hasJavac = false;
    }
    return runtime;
}

async function parseVersion(runtime: IJavaRuntime): Promise<IJavaRuntime> {
    const { homedir } = runtime;
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

    if (runtime.version === undefined) {
        // fallback to check version by CLI
        try {
            runtime.version = await checkJavaVersionByCLI(homedir);
        } catch (error) {
            logger.log(error);
        }
    }

    return runtime;
}

/**
 * Get version by parsing `JAVA_HOME/bin/java -version`, make sure binary file exists.
 * @deprecated as a fallback when file "release" not found
 */
async function checkJavaVersionByCLI(javaHome: string): Promise<IJavaVersion | undefined> {
    return new Promise((resolve, _reject) => {
        const javaBin = path.join(javaHome, "bin", JAVA_FILENAME); // assume java binary exists.
        cp.execFile(javaBin, ["-version"], {}, (_error, _stdout, stderr) => {
            const regexp = /version "(.*)"/g;
            const match = regexp.exec(stderr);
            if (!match) {
                return resolve(undefined);
            }
            const openjdk_version = match[1];
            const major = parseMajorVersion(openjdk_version);
            resolve({
                openjdk_version,
                major
            });
        });
    });
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
