"use strict";

const { Command } = require("commander");
const pkg = require("../package.json");

const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (
    typeof warning === "string" &&
    warning.includes("NODE_TLS_REJECT_UNAUTHORIZED")
  )
    return;
  originalEmitWarning.call(process, warning, ...args);
};

try {
  const updateNotifier =
    require("update-notifier").default || require("update-notifier");
  updateNotifier({ pkg }).notify();
} catch {}

const program = new Command();

program
  .name("audiocodes-cli")
  .description("CLI for AudioCodes Mediant VE SBCs via REST API")
  .version(pkg.version)
  .option("--format <type>", "output format: table, json, toon, csv", "table")
  .option("--host <host>", "device hostname (overrides config/env)")
  .option("--username <user>", "device username (overrides config/env)")
  .option("--password <pass>", "device password (overrides config/env)")
  .option("--device <name>", "use a specific named device from config")
  .option("--clean", "remove empty/null values from results")
  .option("--insecure", "skip TLS certificate verification")
  .option("--no-audit", "disable audit logging for this command")
  .option("--debug", "enable debug logging");

// Commands registered in subsequent tasks
require("./commands/config.js")(program);
require("./commands/doctor.js")(program);
require("./commands/calls.js")(program);
require("./commands/alarms.js")(program);
// require("./commands/sip-trace.js")(program);

program.parse();
