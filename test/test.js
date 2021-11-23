'use strict'
const expect = require("chai").expect;

describe("test this module", () => {
    const utils = require("../dist/index");
    it("should work with require", () => {
        expect(utils).to.not.undefined;
    });
    it("should list installed JDKs", async () => {
        const label = "findRuntimes";
        console.time(label);
        const jdks = await utils.findRuntimes();
        console.log(jdks);
        console.timeEnd(label);
    });
});