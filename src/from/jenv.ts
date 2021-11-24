import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { log } from "../logger";
import { deDup } from "../utils";

const JENV_DIR = path.join(os.homedir(), ".jenv");
const JDK_LINK_BASE_DIR = path.join(JENV_DIR, "versions");

export async function candidates(): Promise<string[]> {
    const ret = [];
    try {
        const files = await fs.promises.readdir(JDK_LINK_BASE_DIR, { withFileTypes: true });
        const homeDirLinks = files.filter(file => file.isSymbolicLink()).map(file => path.join(JDK_LINK_BASE_DIR, file.name));
        const actualHomeDirs = await Promise.all(homeDirLinks.map(file => fs.promises.realpath(file)))
        const uniqHomes = deDup(actualHomeDirs);
        ret.push(...uniqHomes);
    } catch (error) {
        log(error);
    }
    return ret;
}