"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerDeviceCommand(program) {
  const device = program
    .command("device")
    .description("Device management and configuration backup");

  device
    .command("save")
    .description("Save running configuration to NVRAM")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        await client.post("/actions/saveConfiguration", {});
        process.stdout.write("Configuration saved to NVRAM.\n");
      } catch (err) {
        printError(err);
      }
    });

  device
    .command("backup")
    .description("Download device INI configuration file")
    .option("--output <file>", "output file path")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/files/ini", {
          responseType: "text",
          headers: { Accept: "text/plain" },
        });
        const deviceName =
          globalOpts.device ||
          require("../utils/config.js").getActiveDevice()?.name ||
          "device";
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19);
        const outputPath = path.resolve(
          cmdOpts.output || `${deviceName}-${timestamp}.ini`,
        );
        fs.writeFileSync(outputPath, resp.data, "utf8");
        process.stdout.write(`Configuration saved to ${outputPath}\n`);
      } catch (err) {
        printError(err);
      }
    });

  device
    .command("status")
    .description("Show device status information")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/status");
        await printResult(resp.data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  device
    .command("license")
    .description("Show license information")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/license");
        const data = resp.data;
        const display = {
          serialNumber: data.serialNumber,
          macAddress: data.macAddress,
          licenseVersion: data.licenseVersion,
          keyDescription: data.keyDescription,
        };
        await printResult(display, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });

  device
    .command("tls")
    .description("Show TLS certificate status")
    .action(async (cmdOpts, command) => {
      const globalOpts = command.optsWithGlobals();
      try {
        const client = await createClient(globalOpts);
        const resp = await client.get("/files/tls");
        const data = resp.data.files || resp.data;
        await printResult(data, globalOpts.format);
      } catch (err) {
        printError(err);
      }
    });
};
