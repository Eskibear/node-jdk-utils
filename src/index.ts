import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as jbang from "./from/jbang";
import * as asdf from "./from/asdf";
import * as envs from "./from/envs";
import * as gradle from "./from/gradle";
import * as homebrew from "./from/homebrew";
import * as jabba from "./from/jabba";
import * as jenv from "./from/jenv";
import * as linux from "./from/linux";
import * as macOS from "./from/macOS";
import * as mise from "./from/mise";
import * as sdkman from "./from/sdkman";
import * as windows from "./from/windows";
import * as logger from "./logger";
import { deDup, isArm, isLinux, isMac, isWindows, JAVAC_FILENAME, JAVA_FILENAME } from "./utils";

export { JAVAC_FILENAME, JAVA_FILENAME } from "./utils";

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
     * whether to include tags for detailed information
     */
    withTags?: boolean;

    /**
     * whether to skip resolving from a specific source
     */
    skipFrom?: {
        /**
         * from env.JAVA_HOME
         */
        javaHomeEnv?: boolean;
        /**
         * from env.JDK_HOME
         */
        jdkHomeEnv?: boolean;
        /**
         * from env.PATH
         */
        inPathEnv?: boolean;
        /**
         * from SDKMAN
         */
        sdkman?: boolean;
        /**
         * from JENV
         */
        jenv?: boolean;
        /**
         * from Jabba
         */
        jabba?: boolean;
        /**
         * from ASDF
         */
        asdf?: boolean;
        /**
         * from mise
         */
        mise?: boolean;
        /**
         * from Gradle locations
         */
        gradle?: boolean;
        /**
         * from JBang locations
         */
        jbang?: boolean;
    };
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
     * Whether javac or javac.exe exists.
     */
    hasJavac?: boolean;

    /**
     * whether is same as env.JAVA_HOME
     */
    isJavaHomeEnv?: boolean;

    /**
     * whether is same as env.JDK_HOME
     */
    isJdkHomeEnv?: boolean;

    /**
     * whether '<homedir>/bin' is one of env.PATH entries
     */
    isInPathEnv?: boolean;

    isFromSDKMAN?: boolean;
    isFromJENV?: boolean;
    isFromJabba?: boolean;
    isFromJBang?: boolean;
    isFromASDF?: boolean;
    isFromMise?: boolean;
    isFromGradle?: boolean;
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
    if (!options?.skipFrom?.sdkman) {
        const fromSdkman = await sdkman.candidates();
        updateCandidates(fromSdkman, (r) => ({ ...r, isFromSDKMAN: true }));
    }

    // platform-specific default location
    if (isLinux) {
        updateCandidates(await linux.candidates());
        updateCandidates(await homebrew.candidates(homebrew.HOMEBREW_DIR_LINUX)); // Homebrew
    }
    if (isMac) {
        updateCandidates(await macOS.candidates());
        const hbOptPath = isArm ? homebrew.HOMEBREW_DIR_APPLE_SILLICON : homebrew.HOMEBREW_DIR_INTEL;
        updateCandidates(await homebrew.candidates(hbOptPath)); // Homebrew
    }
    if (isWindows) {
        updateCandidates(await windows.candidates());
    }

    // from env: JDK_HOME
    if (!options?.skipFrom?.jdkHomeEnv) {
        const fromJdkHome = await envs.candidatesFromSpecificEnv("JDK_HOME");
        if (fromJdkHome) {
            updateCandidates([fromJdkHome], (r) => ({ ...r, isJdkHomeEnv: true }));
        }
    }

    // from env: JAVA_HOME
    if (!options?.skipFrom?.javaHomeEnv) {
        const fromJavaHome = await envs.candidatesFromSpecificEnv("JAVA_HOME");
        if (fromJavaHome) {
            updateCandidates([fromJavaHome], (r) => ({ ...r, isJavaHomeEnv: true }));
        }
    }

    // from env: PATH
    if (!options?.skipFrom?.inPathEnv) {
        const fromPath = await envs.candidatesFromPath();
        updateCandidates(fromPath, (r) => ({ ...r, isInPathEnv: true }));
    }

    // jEnv
    if (!options?.skipFrom?.jenv) {
        const fromJENV = await jenv.candidates();
        updateCandidates(fromJENV, (r) => ({ ...r, isFromJENV: true }));
    }

    // jabba
    if (!options?.skipFrom?.jabba) {
        const fromJabba = await jabba.candidates();
        updateCandidates(fromJabba, (r) => ({ ...r, isFromJabba: true }));
    }

    // jbang
    if (!options?.skipFrom?.jbang) {
        const fromJBang = await jbang.candidates();
        updateCandidates(fromJBang, (r) => ({ ...r, isFromJBang: true }));
    }
    // asdf
    if (!options?.skipFrom?.asdf) {
        const fromASDF = await asdf.candidates();
        updateCandidates(fromASDF, (r) => ({ ...r, isFromASDF: true }));
    }

    // mise
    if (!options?.skipFrom?.mise) {
        const fromMise = await mise.candidates();
        updateCandidates(fromMise, (r) => ({ ...r, isFromMise: true }));
    }

    // Gradle
    if (!options?.skipFrom?.gradle) {
        const fromGradle = await gradle.candidates();
        updateCandidates(fromGradle, (r) => ({ ...r, isFromGradle: true }));
    }
    
    // dedup and construct runtimes
    let runtimes: IJavaRuntime[] = options?.withTags ? store.allRuntimes()
        : deDup(candidates).map((homedir) => ({ homedir }));

    // verification
    if (true /* always check java binary */) {
        runtimes = await Promise.all(runtimes.map(checkJavaFile));
        if (true /* java binary is required for a valid runtime */) {
            runtimes = (runtimes as Array<IJavaRuntime & CanValidate>).filter(r => r.isValid);
        }
    }

    if (options?.checkJavac) {
        runtimes = await Promise.all(runtimes.map(checkJavacFile));
    }

    if (options?.withVersion) {
        runtimes = await Promise.all(runtimes.map(parseVersion));
    }

    // clean up private fields by default
    for (const r of runtimes) {
        delete (r as CanValidate).isValid;
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
export async function getRuntime(homedir: string, options?: IOptions): Promise<IJavaRuntime | undefined> {
    let runtime: IJavaRuntime = { homedir };
    runtime = await checkJavaFile(runtime);
    if (!(runtime as CanValidate).isValid) {
        return undefined;
    }

    if (options?.checkJavac) {
        runtime = await checkJavacFile(runtime);
    }
    if (options?.withVersion) {
        runtime = await parseVersion(runtime);
    }

    if (options?.withTags) {
        const gList = await gradle.candidates();
        if (gList.includes(homedir)) {
            runtime.isFromGradle = true;
        }
        const jbangList = await jbang.candidates();
        if (jbangList.includes(homedir)) {
            runtime.isFromJBang = true;
        }
        const aList = await asdf.candidates();
        if (aList.includes(homedir)) {
            runtime.isFromASDF = true;
        }
        const mList = await mise.candidates();
        if (mList.includes(homedir)) {
            runtime.isFromMise = true;
        }
        const jList = await jenv.candidates();
        if (jList.includes(homedir)) {
            runtime.isFromJENV = true;
        }
        const sList = await sdkman.candidates();
        if (sList.includes(homedir)) {
            runtime.isFromSDKMAN = true;
        }
        const jbList = await jabba.candidates();
        if (jbList.includes(homedir)) {
            runtime.isFromJabba = true;
        }
        const pList = await envs.candidatesFromPath();
        if (pList.includes(homedir)) {
            runtime.isInPathEnv = true;
        }
        if (await envs.candidatesFromSpecificEnv("JAVA_HOME") === homedir) {
            runtime.isJavaHomeEnv = true;
        }
        if (await envs.candidatesFromSpecificEnv("JDK_HOME") === homedir) {
            runtime.isJdkHomeEnv = true;
        }
    }
    return runtime;
}

/**
 * A utility to list all sources where given Java runtime is found.
 *
 * @param r given IJavaRuntime
 * @returns list of sources where given runtime is found.
 */
export function getSources(r: IJavaRuntime): string[] {
    const sources: string[] = [];
    if (r.isJdkHomeEnv) {
        sources.push("JDK_HOME");
    }
    if (r.isJavaHomeEnv) {
        sources.push("JAVA_HOME");
    }
    if (r.isInPathEnv) {
        sources.push("PATH");
    }
    if (r.isFromSDKMAN) {
        sources.push("SDKMAN");
    }
    if (r.isFromJENV) {
        sources.push("jEnv");
    }
    if (r.isFromJabba) {
        sources.push("jabba");
    }
    if (r.isFromJBang) {
        sources.push("JBang");
    }
    if (r.isFromASDF) {
        sources.push("asdf");
    }
    if (r.isFromMise) {
        sources.push("mise");
    }
    if (r.isFromGradle) {
        sources.push("Gradle");
    }
    return sources;
}

async function checkJavaFile(runtime: IJavaRuntime): Promise<IJavaRuntime & CanValidate> {
    const { homedir } = runtime;
    const binary = path.join(homedir, "bin", JAVA_FILENAME);
    try {
        await fs.promises.access(binary, fs.constants.F_OK);
        (runtime as IJavaRuntime & CanValidate).isValid = true;
    } catch (error) {
        (runtime as IJavaRuntime & CanValidate).isValid = false;
    }
    return runtime as IJavaRuntime & CanValidate;
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
    constructor() { }

    public updateRuntimes(homedirs: string[], updater?: (r: IJavaRuntime) => IJavaRuntime) {
        for (const h of homedirs) {
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

interface CanValidate {
    /**
     * Whether java or java.exe exists, indicating it's a valid runtime.
     */
    isValid?: boolean;
}
