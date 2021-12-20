#! /usr/bin/env node

async function listAll() {
    const utils = require("../dist/index");
    const label = "Listing JDKs";
    console.time(label);
    const jdks = await utils.findRuntimes({ withTags: true, withVersion: true, checkJavac: true });
    console.timeEnd(label);
    console.log("Found: ", jdks.length);
    console.log(jdks);
}

listAll();
