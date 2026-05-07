'use strict'
const expect = require("chai").expect;
const fs = require("fs");
const os = require("os");
const path = require("path");

describe("test this module", () => {
    const utils = require("../dist/index");
    it("should work with require", () => {
        expect(utils).to.not.undefined;
    });

    it("should list valid JDKs", async () => {
        const label = "cost";
        console.time(label);
        const jdks = await utils.findRuntimes();
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        jdks.forEach(jdk => console.log(jdk.homedir));
    });

    it("should fetch versions", async () => {
        const label = "withVersion";
        console.time(label);
        const jdks = await utils.findRuntimes({ withVersion: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log("homedir", "majorVersion");
        jdks.forEach(jdk => console.log(jdk.homedir, jdk.version?.major));
    });

    it("should check javac", async () => {
        const label = "checkJavac";
        console.time(label);
        const jdks = await utils.findRuntimes({ checkJavac: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log("homedir", "hasJavac");
        jdks.forEach(jdk => console.log(jdk.homedir, jdk.hasJavac));
    });

    it("should list all possible JDKs with version", async () => {
        const label = "checkJavac,withVersion";
        console.time(label);
        const jdks = await utils.findRuntimes({ checkJavac: true, withVersion: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log("homedir", "hasJava", "hasJavac", "majorVersion");
        jdks.forEach(jdk => console.log(jdk.homedir, jdk.hasJavac, jdk.version?.major));
    });

    it("should list with tags", async () => {
        const label = "withTags";
        console.time(label);
        const jdks = await utils.findRuntimes({ withTags: true, withVersion: true, checkJavac: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log(jdks);
    });
    it("should list sources", async () => {
        const label = "getSources";
        console.time(label);
        const jdks = await utils.findRuntimes({ withTags: true, withVersion: true, checkJavac: true });
        console.timeEnd(label);
        jdks.forEach(jdk => console.log(jdk.homedir, utils.getSources(jdk)));
    });

    it("should pick up JDKs from additionalLocations", async () => {
        const isWindows = process.platform.indexOf("win") === 0;
        const javaBinName = isWindows ? "java.exe" : "java";
        const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "jdk-utils-test-"));
        const fakeHome = path.join(tempRoot, "fake-jdk-21");
        await fs.promises.mkdir(path.join(fakeHome, "bin"), { recursive: true });
        await fs.promises.writeFile(path.join(fakeHome, "bin", javaBinName), "");
        try {
            const jdks = await utils.findRuntimes({ additionalLocations: [tempRoot] });
            const homedirs = jdks.map(j => j.homedir);
            expect(homedirs).to.include(fakeHome);
        } finally {
            await fs.promises.rm(tempRoot, { recursive: true, force: true });
        }
    });
});
