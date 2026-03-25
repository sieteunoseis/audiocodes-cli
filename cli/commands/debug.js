"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("../utils/connection.js");
const { printError } = require("../utils/output.js");

module.exports = function registerDebugCommand(program) {
  const debug = program
    .command("debug")
    .description("Debug file collection and diagnostics");

  debug
    .command("collect")
    .description("Trigger debug file creation and download it")
    .option("--output <file>", "output file path", "debug-file.tar.gz")
    .option("--no-core-dump", "exclude core dump from debug file")
    .action(async (cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);

        process.stdout.write("Triggering debug file creation...\n");
        const createResp = await client.post("/files/create/debugFile", {
          attachCoreDump: cmdOpts.coreDump !== false,
        });
        const txId =
          createResp.data && createResp.data.transactionId
            ? createResp.data.transactionId
            : null;
        if (txId) {
          process.stdout.write(`Transaction: ${txId}\n`);
        }

        process.stdout.write("Waiting for debug file to be ready");
        let ready = false;
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          process.stdout.write(".");
          try {
            const resp = await client.get("/files/debugFile", {
              responseType: "arraybuffer",
              validateStatus: (s) => s < 500,
            });
            if (
              (resp.status === 200 || resp.status === 201) &&
              resp.data.length > 0
            ) {
              ready = true;
              const outputPath = path.resolve(cmdOpts.output);
              fs.writeFileSync(outputPath, resp.data);
              process.stdout.write(
                `\nDebug file saved to ${outputPath} (${(resp.data.length / 1024).toFixed(1)}KB)\n`,
              );
              break;
            }
          } catch {
            // Still generating, keep polling
          }
        }

        if (!ready) {
          printError(
            new Error(
              "Debug file was not ready after 5 minutes. Try downloading manually.",
            ),
          );
        }
      } catch (err) {
        status = "error";
        errorMsg = err.message;
        process.stdout.write("\n");
        printError(err);
      } finally {
        if (globalOpts.audit !== false) {
          const { logAudit } = require("../utils/audit.js");
          const { getActiveDevice } = require("../utils/config.js");
          const deviceName =
            getActiveDevice(globalOpts.device)?.name || "env/flags";
          logAudit({
            device: deviceName,
            operation: "debug.collect",
            duration_ms: Date.now() - startTime,
            status,
            ...(errorMsg && { error: errorMsg }),
          });
        }
      }
    });
};
