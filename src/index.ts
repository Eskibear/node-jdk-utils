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

export const JAVA_FILENAME = isWindows ? "java.exe" : "java";
export const JAVAC_FILENAME = isWindows ? "javac.exe" : "javac";

export interface IOptions {
    /**
     * whether to parse version.
     */
    withVersion?: boolean;
    /**
     * whether to check existence of javac or javac.exe
     */
    checkJavac?: boolean;
    /**
     * whether to include all invalid runtimes, e.g. when JAVA_HOME points to an invalid folder.
     */
    fuzzy?: boolean;
    /**
     * whether to include tags for detailed information
     */
    withTags?: boolean;
}

export interface IJavaVersion {
    java_version: string;
    major: number;
}

export interface IJavaRuntime {
    /**
     * Home directory of Java runtime.
     */
    homedir: string;
    /**
     * Version information. 
     */
    version?: IJavaVersion;
    /**
     * Whether java or java.exe exists, indicating it's a valid runtime. Only available when `options.fuzzy` provided.
     */
    isValid?: boolean;
    /**
     * Whether javac or javac.exe exists.
     */
    hasJavac?: boolean;

    /**
     * is same as env.JAVA_HOME
     */
    isJavaHomeEnv?: boolean;

    /**
     * is same as env.JDK_HOME
     */
    isJdkHomeEnv?: boolean;

    /**
     * '<homedir>/bin' is one of env.PATH entries
     */
    isInPathEnv?: boolean;

    isFromSDKMAN?: boolean;
    isFromJENV?: boolean;
}

/**
 * Find Java runtime from all possible locations on your machine.
 * 
 * @param options advanced options
 * @returns 
 */
export async function findRuntimes(options?: IOptions): Promise<IJavaRuntime[]> {
    const store = new RuntimeStore();
    const candidates: string[] = [];

    const updateCandidates = (homedirs: string[], updater?: (r: IJavaRuntime) => IJavaRuntime) => {
        if (options?.withTags) {
            store.updateRuntimes(homedirs, updater);
        } else {
            candidates.push(...homedirs);
        }
    }

    // SDKMAN
    const fromSdkman = await sdkman.candidates();
    updateCandidates(fromSdkman, (r) => ({ ...r, isFromSDKMAN: true }));
    
    // platform-specific default location
    if (isLinux) {
        updateCandidates(await linux.candidates());
    }
    if (isMac) {
        updateCandidates(await macOS.candidates());
    }
    if (isWindows) {
        updateCandidates(await windows.candidates());
    }

    // from env: JDK_HOME
    const fromJdkHome = envs.candidatesFromSpecificEnv("JDK_HOME");
    if (fromJdkHome) {
        updateCandidates([fromJdkHome], (r) => ({ ...r, isJdkHomeEnv: true }));
    }

    // from env: JAVA_HOME
    const fromJavaHome = envs.candidatesFromSpecificEnv("JAVA_HOME");
    if (fromJavaHome) {
        updateCandidates([fromJavaHome], (r) => ({ ...r, isJavaHomeEnv: true }));
    }

    // from env: PATH
    const fromPath = envs.candidatesFromPath();
    updateCandidates(fromPath, (r) => ({ ...r, isInPathEnv: true }));

    // jEnv
    const fromJENV = await jenv.candidates();
    updateCandidates(fromJENV, (r) => ({ ...r, isFromJENV: true }));

    // dedup and construct runtimes
    let runtimes: IJavaRuntime[] = options?.withTags ? store.allRuntimes()
        : deDup(candidates).map((homedir) => ({ homedir }));

    // verification
    if (true /* always check java binary */) {
        runtimes = await Promise.all(runtimes.map(checkJavaFile));
        if (true /* java binary is required for a valid runtime */) {
            runtimes = runtimes.filter(r => r.isValid);
        }
    }

    if (options?.checkJavac) {
        runtimes = await Promise.all(runtimes.map(checkJavacFile));
    }

    if (options?.withVersion) {
        runtimes = await Promise.all(runtimes.map(parseVersion));
    }

    // clean up private fields by default
    if (!options?.fuzzy) {
        for (const r of runtimes) {
            delete r.isValid;
        }
    }

    return runtimes;
}

/**
 * Verify if given directory contains a valid Java runtime, and provide details if it is.
 * 
 * @param homedir home directory of a Java runtime
 * @param options 
 * @returns 
 */
export async function getRuntime(homedir: string, options?: IOptions): Promise<IJavaRuntime> {
    let runtime : IJavaRuntime= {homedir};
    runtime = await checkJavaFile(runtime);
    if (!runtime.isValid) {
        return runtime;
    }

    if (options?.checkJavac) {
        runtime = await checkJavacFile(runtime);
    }
    if (options?.withVersion) {
        runtime = await parseVersion(runtime);
    }

    if (options?.withTags) {
        const jList = await jenv.candidates();
        if (jList.includes(homedir)) {
            runtime.isFromJENV = true;
        }
        const sList = await sdkman.candidates();
        if (sList.includes(homedir)) {
            runtime.isFromSDKMAN = true;
        }
        const pList = envs.candidatesFromPath();
        if (pList.includes(homedir)) {
            runtime.isInPathEnv = true;
        }
        if (envs.candidatesFromSpecificEnv("JAVA_HOME") === homedir) {
            runtime.isJavaHomeEnv = true;
        }
        if (envs.candidatesFromSpecificEnv("JDK_HOME") === homedir) {
            runtime.isJdkHomeEnv = true;
        }
    }
    return runtime;
}

async function checkJavaFile(runtime: IJavaRuntime): Promise<IJavaRuntime> {
    const { homedir } = runtime;
    const binary = path.join(homedir, "bin", JAVA_FILENAME);
    try {
        await fs.promises.access(binary, fs.constants.F_OK);
        runtime.isValid = true;
    } catch (error) {
        runtime.isValid = false;
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
        const java_version = match[1];
        const major = parseMajorVersion(java_version);

        runtime.version = {
            java_version,
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
            const java_version = match[1];
            const major = parseMajorVersion(java_version);
            resolve({
                java_version,
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

class RuntimeStore {
    private map: Map<string, IJavaRuntime> = new Map();
    constructor() {}

    public updateRuntimes(homedirs: string[], updater?: (r: IJavaRuntime) => IJavaRuntime) {
        for(const h of homedirs) {
            this.updateRuntime(h, updater);
        }
    }

    public updateRuntime(homedir: string, updater?: (r: IJavaRuntime) => IJavaRuntime) {
        const runtime = this.map.get(homedir) || { homedir };
        this.map.set(homedir, updater?.(runtime) ?? runtime);
    }

    public allRuntimes() {
        return Array.from(this.map.values());
    }
}
