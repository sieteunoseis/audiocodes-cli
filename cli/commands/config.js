"use strict";

const configUtil = require("../utils/config.js");
const { printResult, printError } = require("../utils/output.js");
const { resolveConfig, createClient } = require("../utils/connection.js");

module.exports = function registerConfigCommand(program) {
  const config = program
    .command("config")
    .description("Manage AudioCodes device configuration");

  config
    .command("add <name>")
    .description(
      "Add a named device to config (use --host, --username, --password)",
    )
    .option("--insecure", "skip TLS verification for this device")
    .action((name, opts, cmd) => {
      try {
        const globalOpts = cmd.optsWithGlobals();
        const host = globalOpts.host;
        const username = globalOpts.username;
        const password = globalOpts.password;
        if (!host) throw new Error("Missing required option: --host");
        if (!username) throw new Error("Missing required option: --username");
        if (!password) throw new Error("Missing required option: --password");

        const deviceOpts = { host, username, password };
        if (opts.insecure || globalOpts.insecure) {
          deviceOpts.insecure = true;
        }

        configUtil.addDevice(name, deviceOpts);
        process.stdout.write(`Device "${name}" added successfully.\n`);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("use <name>")
    .description("Set a named device as the active device")
    .action((name) => {
      try {
        configUtil.useDevice(name);
        process.stdout.write(`Device "${name}" is now the active device.\n`);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("list")
    .description("List all configured devices")
    .action(async () => {
      try {
        const { activeDevice, devices } = configUtil.listDevices();
        const rows = Object.entries(devices).map(([name, device]) => ({
          name,
          active: name === activeDevice ? "\u2713" : "",
          host: device.host,
          username: device.username,
        }));
        const format = program.opts().format;
        await printResult(rows, format);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("show")
    .description("Show the active device configuration (passwords masked)")
    .action(async () => {
      try {
        const deviceName = program.opts().device;
        const device = configUtil.getActiveDevice(deviceName);
        if (!device) {
          printError(
            new Error(
              "No active device configured. Run: audiocodes-cli config add",
            ),
          );
          return;
        }
        const display = {
          ...device,
          password: configUtil.maskPassword(device.password),
        };
        const format = program.opts().format;
        await printResult(display, format);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("remove <name>")
    .description("Remove a named device from config")
    .action((name) => {
      try {
        configUtil.removeDevice(name);
        process.stdout.write(`Device "${name}" removed successfully.\n`);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("test")
    .description("Test connectivity to the active device")
    .action(async () => {
      try {
        const flags = program.opts();
        const client = await createClient(flags);
        const resp = await client.get("/");
        const deviceName =
          flags.device || configUtil.getActiveDevice()?.name || "unknown";
        const device = configUtil.getActiveDevice(flags.device);
        const host = device ? device.host : flags.host || "unknown";
        process.stdout.write(
          `Connection to ${deviceName} (${host}) successful — REST API is available\n`,
        );
      } catch (err) {
        printError(err);
      }
    });
};
