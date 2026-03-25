"use strict";

const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerCallsCommand(program) {
  const calls = program.command("calls").description("Active call management");

  calls
    .command("list")
    .description("List call statistics on the SBC")
    .option("--scope <scope>", "stats scope: global, ipGroup, srd", "global")
    .action(async (cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);
        const scope = cmdOpts.scope || "global";
        const resp = await client.get(`/kpi/current/sbc/callStats/${scope}`);
        const items = resp.data.items || resp.data;
        const data = Array.isArray(items)
          ? items.map((i) => ({
              name: i.name,
              value: i.value,
              description: i.description,
            }))
          : items;
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
            operation: "calls.list",
            duration_ms: Date.now() - startTime,
            status,
          };
          if (errorMsg) entry.error = errorMsg;
          logAudit(entry);
        }
      }
    });
};
