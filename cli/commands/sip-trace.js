"use strict";

const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerSipTraceCommand(program) {
  const sipTrace = program
    .command("sip-trace")
    .description("SIP signaling trace capture (requires lab validation)");

  sipTrace
    .command("start")
    .description("Start capturing SIP signaling")
    .option("--output <file>", "save trace output to file")
    .option("--filter <value>", "filter by caller, callee, or IP")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();

      try {
        const client = await createClient(globalOpts);
        // TODO: Validate actual API endpoint against lab device
        // Possible endpoints: /api/v1/sipTrace, /api/v1/debug, /api/v1/syslog
        printError(
          new Error(
            "sip-trace start is pending lab validation. " +
              "The AudioCodes REST API endpoint for SIP trace capture has not been confirmed yet.",
          ),
        );
      } catch (err) {
        printError(err);
      }
    });

  sipTrace
    .command("stop")
    .description("Stop an active SIP trace")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();

      try {
        const client = await createClient(globalOpts);
        // TODO: Validate actual API endpoint against lab device
        printError(
          new Error(
            "sip-trace stop is pending lab validation. " +
              "The AudioCodes REST API endpoint for SIP trace capture has not been confirmed yet.",
          ),
        );
      } catch (err) {
        printError(err);
      }
    });
};
