import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { getRealHome, isArm, isLinux, isMac } from "../utils";

const SDKMAN_DIR = process.env.SDKMAN_DIR ?? path.join(os.homedir(), ".sdkman");

// Homebrew-installed SDKMAN locations (sdkman-cli formula).
// See: https://formulae.brew.sh/formula/sdkman-cli
const HOMEBREW_SDKMAN_APPLE_SILLICON = "/opt/homebrew/opt/sdkman-cli/libexec";
const HOMEBREW_SDKMAN_INTEL = "/usr/local/opt/sdkman-cli/libexec";
const HOMEBREW_SDKMAN_LINUX = "/home/linuxbrew/.linuxbrew/opt/sdkman-cli/libexec";

export async function candidates(): Promise<string[]> {
    const sdkmanDirs = [SDKMAN_DIR];
    if (isMac) {
        sdkmanDirs.push(isArm ? HOMEBREW_SDKMAN_APPLE_SILLICON : HOMEBREW_SDKMAN_INTEL);
    } else if (isLinux) {
        sdkmanDirs.push(HOMEBREW_SDKMAN_LINUX);
    }

    const ret: string[] = [];
    for (const sdkmanDir of sdkmanDirs) {
        const jdkBaseDir = path.join(sdkmanDir, "candidates", "java");
        try {
            const files = await fs.promises.readdir(jdkBaseDir, { withFileTypes: true });
            const homedirs = files.filter(file => file.isDirectory()).map(file => path.join(jdkBaseDir, file.name));
            // Resolve real Java Home by following bin/java. For some distributions (e.g. Zulu on macOS),
            // bin/java is a symlink into a nested .../Contents/Home folder, and tools like the Gradle
            // daemon reject the surface path as a mismatched JAVA_HOME. Falls back to the original path
            // when bin/java cannot be resolved.
            const resolved = await Promise.all(homedirs.map(async (h) => (await getRealHome(h)) ?? h));
            ret.push(...resolved);
        } catch (error) {
            log(error);
        }
    }
    return ret;
}