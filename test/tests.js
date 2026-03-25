"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const assert = require("node:assert");
const fs = require("node:fs");

const BIN = path.join(__dirname, "..", "bin", "audiocodes-cli.js");
const TEST_CONFIG_DIR = "/tmp/audiocodes-cli-test-" + process.pid;

function run(args) {
  return execFileSync("node", [BIN, ...args], {
    encoding: "utf-8",
    timeout: 10000,
    env: {
      ...process.env,
      AUDIOCODES_CONFIG_DIR: TEST_CONFIG_DIR,
    },
  });
}

function cleanup() {
  try {
    fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  } catch {}
}

// Clean up before tests
cleanup();

// --help
console.log("Test: --help lists all commands");
const help = run(["--help"]);
assert(help.includes("calls"), "should list calls command");
assert(help.includes("alarms"), "should list alarms command");
assert(help.includes("sip-trace"), "should list sip-trace command");
assert(help.includes("doctor"), "should list doctor command");
assert(help.includes("config"), "should list config command");
console.log("  PASS");

// --version
console.log("Test: --version shows version");
const version = run(["--version"]);
assert(
  version.trim().match(/^\d+\.\d+\.\d+$/),
  `expected semver, got ${version.trim()}`,
);
console.log("  PASS");

// config list (empty)
console.log("Test: config list with empty config");
const listOutput = run(["config", "list"]);
assert(listOutput.includes("No results found"), "should show no results");
console.log("  PASS");

// config add
console.log("Test: config add creates device");
const addOutput = run([
  "config",
  "add",
  "test-device",
  "--host",
  "10.0.0.1",
  "--username",
  "admin",
  "--password",
  "secret",
]);
assert(addOutput.includes("added successfully"), "should confirm add");
console.log("  PASS");

// config list (with device)
console.log("Test: config list shows added device");
const listAfterAdd = run(["config", "list"]);
assert(listAfterAdd.includes("test-device"), "should show device name");
assert(listAfterAdd.includes("10.0.0.1"), "should show host");
console.log("  PASS");

// config show (password masked)
console.log("Test: config show masks password");
const showOutput = run(["config", "show"]);
assert(!showOutput.includes("secret"), "should not show plaintext password");
assert(showOutput.includes("******"), "should show masked password");
console.log("  PASS");

// config use
console.log("Test: config add second device and use");
run([
  "config",
  "add",
  "second-device",
  "--host",
  "10.0.0.2",
  "--username",
  "admin2",
  "--password",
  "secret2",
]);
const useOutput = run(["config", "use", "second-device"]);
assert(useOutput.includes("second-device"), "should confirm use");
console.log("  PASS");

// config remove
console.log("Test: config remove deletes device");
const removeOutput = run(["config", "remove", "second-device"]);
assert(removeOutput.includes("removed successfully"), "should confirm remove");
const listAfterRemove = run(["config", "list"]);
assert(
  !listAfterRemove.includes("second-device"),
  "should not show removed device",
);
console.log("  PASS");

// Format flags
console.log("Test: config list --format json outputs valid JSON");
const jsonOutput = run(["config", "list", "--format", "json"]);
JSON.parse(jsonOutput); // throws if invalid
console.log("  PASS");

console.log("Test: config list --format csv outputs CSV");
const csvOutput = run(["config", "list", "--format", "csv"]);
assert(csvOutput.includes("name"), "should have CSV header");
console.log("  PASS");

// calls --help
console.log("Test: calls --help shows list subcommand");
const callsHelp = run(["calls", "--help"]);
assert(callsHelp.includes("list"), "should list 'list' subcommand");
console.log("  PASS");

// alarms --help
console.log("Test: alarms --help shows list subcommand");
const alarmsHelp = run(["alarms", "--help"]);
assert(alarmsHelp.includes("list"), "should list 'list' subcommand");
console.log("  PASS");

// sip-trace --help
console.log("Test: sip-trace --help shows subcommands");
const sipTraceHelp = run(["sip-trace", "--help"]);
assert(sipTraceHelp.includes("start"), "should list start subcommand");
assert(sipTraceHelp.includes("stop"), "should list stop subcommand");
console.log("  PASS");

// Clean up
cleanup();

console.log("\nAll tests passed.");
