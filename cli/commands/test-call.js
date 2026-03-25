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
    .requiredOption("--calling-number <number>", "calling party number (URI)")
    .requiredOption("--called-number <number>", "called party number (URI)")
    .option("--dest-address <address>", "destination IP address")
    .option("--dest-ip-group <name>", "destination IP Group (name or ID)")
    .option("--transport-type <type>", "transport protocol (UDP, TCP, TLS)")
    .option("--out-interface <id>", "outgoing SIP interface ID")
    .option("--timeout <seconds>", "max call duration in seconds", "20")
    .option("--play-dtmf <digits>", "DTMF digits to play (up to 16 digits)")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        if (!cmdOpts.destAddress && !cmdOpts.destIpGroup) {
          printError(
            new Error("Either --dest-address or --dest-ip-group is required."),
          );
          return;
        }
        const client = await createClient(globalOpts);
        const body = {
          callingNumber: cmdOpts.callingNumber,
          calledNumber: cmdOpts.calledNumber,
          timeout: parseInt(cmdOpts.timeout, 10),
        };
        if (cmdOpts.destAddress) body.destAddress = cmdOpts.destAddress;
        if (cmdOpts.destIpGroup) body.destIpGroup = cmdOpts.destIpGroup;
        if (cmdOpts.transportType) body.transportType = cmdOpts.transportType;
        if (cmdOpts.outInterface)
          body.outInterface = parseInt(cmdOpts.outInterface, 10);
        if (cmdOpts.playDtmf) body.playDtmfString = cmdOpts.playDtmf;

        const resp = await client.post("/sipTestCall/dial", body);
        const data = resp.data;
        process.stdout.write(
          `Test call initiated (session: ${data.sessionId})\n`,
        );
        await printResult(data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  testCall
    .command("status <sessionId>")
    .description("Get test call status and results")
    .action(async (sessionId, cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get(
          `/sipTestCall/getStatus?sessionId=${sessionId}`,
        );
        await printResult(resp.data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  testCall
    .command("show [sessionId]")
    .description("Show test call configuration")
    .action(async (sessionId, cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const url = sessionId
          ? `/sipTestCall/show?sessionId=${sessionId}`
          : "/sipTestCall/show";
        const resp = await client.get(url);
        await printResult(resp.data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  testCall
    .command("drop <sessionId>")
    .description("End an active test call")
    .action(async (sessionId, cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        await client.delete(`/sipTestCall/drop?sessionId=${sessionId}`);
        process.stdout.write(`Test call ${sessionId} dropped.\n`);
      } catch (err) {
        printError(err);
      }
    });
};
