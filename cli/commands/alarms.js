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
        let raw = resp.data.alarms || resp.data;
        let data = Array.isArray(raw)
          ? raw.map((a) => ({ id: a.id, description: a.description }))
          : raw;

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

  alarms
    .command("history")
    .description("List alarm history")
    .action(async (cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/alarms/history");
        let raw = resp.data.alarms || resp.data;
        let data = Array.isArray(raw)
          ? raw.map((a) => ({ id: a.id, description: a.description }))
          : raw;
        await printResult(data, globalOpts.format);
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
          logAudit({
            device: deviceName,
            operation: "alarms.history",
            duration_ms: Date.now() - startTime,
            status,
            ...(errorMsg && { error: errorMsg }),
          });
        }
      }
    });
};
