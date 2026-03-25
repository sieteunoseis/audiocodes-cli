"use strict";

const {
  loadConfig,
  getConfigPath,
  getConfigDir,
} = require("../utils/config.js");
const { resolveConfig, createClient } = require("../utils/connection.js");

module.exports = function registerDoctorCommand(program) {
  program
    .command("doctor")
    .description("Check REST API connectivity and configuration health")
    .action(async (opts, command) => {
      const globalOpts = command.optsWithGlobals();
      let passed = 0;
      let warned = 0;
      let failed = 0;

      const ok = (msg) => {
        console.log(`  \u2713 ${msg}`);
        passed++;
      };
      const warn = (msg) => {
        console.log(`  \u26A0 ${msg}`);
        warned++;
      };
      const fail = (msg) => {
        console.log(`  \u2717 ${msg}`);
        failed++;
      };

      console.log("\n  audiocodes-cli doctor");
      console.log("  " + "\u2500".repeat(50));

      console.log("\n  Configuration");
      let conn;
      try {
        const data = loadConfig();
        if (!data.activeDevice) {
          fail("No active device configured");
          console.log(
            "    Run: audiocodes-cli config add <name> --host <host> --username <user> --password <pass>",
          );
          printSummary(passed, warned, failed);
          return;
        }
        ok(`Active device: ${data.activeDevice}`);
        const device = data.devices[data.activeDevice];
        ok(`Host: ${device.host}`);
        ok(`Username: ${device.username}`);

        if (device.insecure) warn("TLS verification: disabled (--insecure)");
        else ok("TLS verification: enabled");

        conn = await resolveConfig(globalOpts);
      } catch (err) {
        fail(`Config error: ${err.message}`);
        printSummary(passed, warned, failed);
        return;
      }

      console.log("\n  REST API");
      try {
        if (conn.insecure) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        const client = await createClient(globalOpts);

        const resp = await client.get("/status");
        ok("REST API: connected");

        if (resp.data) {
          const info = resp.data;
          if (info.productType) ok(`Model: ${info.productType}`);
          if (info.versionID) ok(`Firmware: ${info.versionID}`);
          if (info.systemUpTime != null) {
            const days = Math.floor(info.systemUpTime / 8640000);
            const hours = Math.floor((info.systemUpTime % 8640000) / 360000);
            ok(`Uptime: ${days}d ${hours}h`);
          }
          if (info.serialNumber) ok(`Serial: ${info.serialNumber}`);
          if (info.operationalState) ok(`State: ${info.operationalState}`);
        }
      } catch (err) {
        const msg = err.message || String(err);
        if (
          msg.includes("401") ||
          msg.includes("Authentication") ||
          msg.includes("Unauthorized")
        ) {
          fail(
            "REST API: authentication failed \u2014 check username/password",
          );
        } else if (msg.includes("ECONNREFUSED")) {
          fail(
            "REST API: connection refused \u2014 check host and verify REST API is enabled",
          );
        } else if (msg.includes("ENOTFOUND")) {
          fail("REST API: hostname not found \u2014 check host");
        } else if (msg.includes("certificate")) {
          fail(
            "REST API: TLS certificate error \u2014 try adding --insecure to the device config",
          );
        } else {
          fail(`REST API: ${msg}`);
        }
      }

      console.log("\n  Security");
      try {
        const fs = require("node:fs");
        const configPath = getConfigPath();
        const stats = fs.statSync(configPath);
        const mode = (stats.mode & 0o777).toString(8);
        if (mode === "600") ok(`Config file permissions: ${mode} (secure)`);
        else
          warn(
            `Config file permissions: ${mode} \u2014 should be 600. Run: chmod 600 ${configPath}`,
          );
      } catch {
        /* config file may not exist yet */
      }

      try {
        const fs = require("node:fs");
        const path = require("node:path");
        const auditPath = path.join(getConfigDir(), "audit.jsonl");
        if (fs.existsSync(auditPath)) {
          const stats = fs.statSync(auditPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
          ok(`Audit trail: ${sizeMB}MB`);
          if (stats.size > 8 * 1024 * 1024)
            warn("Audit trail approaching 10MB rotation limit");
        } else {
          ok("Audit trail: empty (no operations logged yet)");
        }
      } catch {
        /* ignore */
      }

      printSummary(passed, warned, failed);
    });

  function printSummary(passed, warned, failed) {
    console.log("\n  " + "\u2500".repeat(50));
    console.log(
      `  Results: ${passed} passed, ${warned} warning${warned !== 1 ? "s" : ""}, ${failed} failed`,
    );
    if (failed > 0) {
      process.exitCode = 1;
      console.log("  Status:  issues found \u2014 review failures above");
    } else if (warned > 0) {
      console.log("  Status:  healthy with warnings");
    } else {
      console.log("  Status:  all systems healthy");
    }
    console.log("");
  }
};
