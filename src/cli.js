#!/usr/bin/env node

/* eslint-disable */
// original commands
const cli = require("@lerna/cli");
const addCmd = require("@lerna/add/command");
const changedCmd = require("@lerna/changed/command");
const cleanCmd = require("@lerna/clean/command");
const createCmd = require("@lerna/create/command");
const diffCmd = require("@lerna/diff/command");
const execCmd = require("@lerna/exec/command");
const importCmd = require("@lerna/import/command");
const infoCmd = require("@lerna/info/command");
const initCmd = require("@lerna/init/command");
const linkCmd = require("@lerna/link/command");
const listCmd = require("@lerna/list/command");
const publishCmd = require("@lerna/publish/command");
const runCmd = require("@lerna/run/command");
const versionCmd = require("@lerna/version/command");
const pkg = require("lerna/package.json");

// override commands
const bootstrapCmd = require("./commands/bootstrap/command");

function main(argv) {
    const context = {
        lernaVersion: pkg.version,
    };

    return cli()
        .command(addCmd)
        .command(bootstrapCmd)
        .command(changedCmd)
        .command(cleanCmd)
        .command(createCmd)
        .command(diffCmd)
        .command(execCmd)
        .command(importCmd)
        .command(infoCmd)
        .command(initCmd)
        .command(linkCmd)
        .command(listCmd)
        .command(publishCmd)
        .command(runCmd)
        .command(versionCmd)
        .parse(argv, context);
}

main(process.argv.slice(2));
