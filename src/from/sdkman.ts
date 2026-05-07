import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { isArm, isLinux, isMac } from "../utils";

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
            ret.push(...homedirs);
        } catch (error) {
            log(error);
        }
    }
    return ret;
}