"use strict";

const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerTestCallCommand(program) {
  const testCall = program
    .command("test-call")
    .description("SIP test call generation from the SBC");

  testCall
    .command("dial")
    .description("Start a test call")
    .requiredOption("--source <number>", "source/caller number")
    .requiredOption("--destination <number>", "destination/callee number")
    .option("--ip-group <name>", "IP Group to route through")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const body = {
          source: cmdOpts.source,
          destination: cmdOpts.destination,
        };
        if (cmdOpts.ipGroup) body.ipGroup = cmdOpts.ipGroup;
        const resp = await client.post("/sipTestCall/dial", body);
        process.stdout.write("Test call initiated.\n");
        if (resp.data) await printResult(resp.data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  testCall
    .command("status")
    .description("Get test call status and results")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/sipTestCall/getStatus");
        await printResult(resp.data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  testCall
    .command("drop")
    .description("End an active test call")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        await client.post("/sipTestCall/drop", {});
        process.stdout.write("Test call dropped.\n");
      } catch (err) {
        printError(err);
      }
    });
};
