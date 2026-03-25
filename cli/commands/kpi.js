"use strict";

const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerKpiCommand(program) {
  const kpi = program
    .command("kpi")
    .description("Query real-time and historical KPI metrics");

  kpi
    .command("list")
    .description("List available KPI categories")
    .action(async (cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/kpi/current");
        const items = resp.data.items || resp.data;
        const data = Array.isArray(items)
          ? items.map((i) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              groups: Array.isArray(i.groups) ? i.groups.join(", ") : "",
            }))
          : items;
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
            operation: "kpi.list",
            duration_ms: Date.now() - startTime,
            status,
            ...(errorMsg && { error: errorMsg }),
          });
        }
      }
    });

  kpi
    .command("show <path>")
    .description(
      "Show KPI metrics at a path (e.g. system/cpuStats, media/mediaStats/global)",
    )
    .action(async (kpiPath, cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);
        const resp = await client.get(`/kpi/current/${kpiPath}`);
        const items = resp.data.items || resp.data;

        let data;
        if (Array.isArray(items) && items.length > 0) {
          const hasValues = items.some((i) => i.value !== undefined);
          if (hasValues) {
            data = items.map((i) => ({
              name: i.name,
              value: i.value,
              description: i.description,
            }));
          } else {
            data = items.map((i) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              ...(i.groups && { groups: i.groups.join(", ") }),
            }));
          }
        } else {
          data = items;
        }

        await printResult(data, globalOpts.format);
      } catch (err) {
        status = "error";
        errorMsg = err.message;
        if (err.response && err.response.status === 404) {
          printError(
            new Error(
              `KPI path "${kpiPath}" not found. Run "audiocodes-cli kpi list" to see available categories.`,
            ),
          );
        } else {
          printError(err);
        }
      } finally {
        if (globalOpts.audit !== false) {
          const { logAudit } = require("../utils/audit.js");
          const { getActiveDevice } = require("../utils/config.js");
          const deviceName =
            getActiveDevice(globalOpts.device)?.name || "env/flags";
          logAudit({
            device: deviceName,
            operation: `kpi.show.${kpiPath}`,
            duration_ms: Date.now() - startTime,
            status,
            ...(errorMsg && { error: errorMsg }),
          });
        }
      }
    });

  kpi
    .command("history <path>")
    .description("Show historical KPI metrics (e.g. sbc/callStats/global)")
    .option("--interval <id>", "interval ID (use --intervals to list)")
    .option("--intervals", "list available intervals")
    .action(async (kpiPath, cmdOpts, command) => {
      const startTime = Date.now();
      const globalOpts = command.optsWithGlobals();
      let status = "success";
      let errorMsg;

      try {
        const client = await createClient(globalOpts);

        if (cmdOpts.intervals) {
          const resp = await client.get("/kpi/interval");
          const intervals = resp.data.intervals || resp.data;
          const data = Array.isArray(intervals)
            ? intervals.slice(0, 20).map((i) => ({
                id: i.id,
                start: i.start,
                end: i.end,
              }))
            : intervals;
          await printResult(data, globalOpts.format);
          return;
        }

        if (!cmdOpts.interval) {
          const intResp = await client.get("/kpi/interval");
          const intervals = intResp.data.intervals || [];
          if (intervals.length === 0) {
            printError(new Error("No intervals available"));
            return;
          }
          cmdOpts.interval = intervals[0].id;
        }

        const resp = await client.get(
          `/kpi/history/${kpiPath}?interval=${cmdOpts.interval}`,
        );
        const items = resp.data.items || resp.data;
        const data = Array.isArray(items)
          ? items.map((i) => ({
              name: i.name,
              value: i.value,
              description: i.description,
            }))
          : items;
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
            operation: `kpi.history.${kpiPath}`,
            duration_ms: Date.now() - startTime,
            status,
            ...(errorMsg && { error: errorMsg }),
          });
        }
      }
    });
};
