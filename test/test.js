'use strict'
const expect = require("chai").expect;

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

    it("should check java binary with fuzzy search", async () => {
        const label = "fuzzy";
        console.time(label);
        const jdks = await utils.findRuntimes({ fuzzy: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log("homedir", "hasJava", "hasJavac", "majorVersion");
        jdks.forEach(jdk => console.log(jdk.homedir, jdk.hasJava, jdk.hasJavac, jdk.version?.major));
    });

    it("should list all possible locations with full-fuzzy search", async () => {
        const label = "fuzzy,checkJavac,withVersion";
        console.time(label);
        const jdks = await utils.findRuntimes({ fuzzy: true, checkJavac: true, withVersion: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log("homedir", "hasJava", "hasJavac", "majorVersion");
        jdks.forEach(jdk => console.log(jdk.homedir, jdk.hasJava, jdk.hasJavac, jdk.version?.major));
    });

    it("should list with tags", async () => {
        const label = "withTags";
        console.time(label);
        const jdks = await utils.findRuntimes({ withTags: true, withVersion: true, checkJavac: true });
        console.timeEnd(label);
        console.log("JDK found: ", jdks.length);
        console.log(jdks);
    });
});
