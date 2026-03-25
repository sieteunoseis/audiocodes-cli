"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const assert = require("node:assert");

const BIN = path.join(__dirname, "..", "bin", "audiocodes-cli.js");

function run(args) {
  return execFileSync("node", [BIN, ...args], {
    encoding: "utf-8",
    timeout: 10000,
    env: {
      ...process.env,
      AUDIOCODES_CONFIG_DIR: "/tmp/audiocodes-cli-test-" + process.pid,
    },
  });
}

console.log("Test: config list with empty config");
const listOutput = run(["config", "list"]);
assert(listOutput.includes("No results found"), "should show no results");
console.log("  PASS");

console.log("\nAll tests passed.");
