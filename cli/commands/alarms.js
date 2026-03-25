"use strict";

const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerAlarmsCommand(program) {
  const alarms = program
    .command("alarms")
    .description("Device alarm management");

  alarms
    .command("list")
    .description("List active alarms on the SBC")
    .option("--severity <level>", "filter by severity (critical, major, minor)")
    .action(async (cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/alarms/active");
        let data = resp.data.alarms || resp.data;

        if (cmdOpts.severity) {
          const level = cmdOpts.severity.toLowerCase();
          if (Array.isArray(data)) {
            data = data.filter(
              (a) => a.severity && a.severity.toLowerCase() === level,
            );
          }
        }

        const format = globalOpts.format;
        await printResult(data, format);
      } catch (err) {
        status = "error";
        errorMsg = err.message;
        printError(err);
      } finally {
        if (globalOpts.audit !== false) {
          const { logAudit } = require("../utils/audit.js");
          const { getActiveDevice } = require("../utils/config.js");
          const deviceName =
            getActiveDevice(globalOpts.device)?.name || "env/flags";
          const entry = {
            device: deviceName,
            operation: "alarms.list",
            duration_ms: Date.now() - startTime,
            status,
          };
          if (errorMsg) entry.error = errorMsg;
          logAudit(entry);
        }
      }
    });
};
