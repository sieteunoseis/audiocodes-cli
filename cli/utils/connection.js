"use strict";

const axios = require("axios");
const {
  getActiveDevice,
  hasSsPlaceholders,
  resolveSsPlaceholders,
} = require("./config.js");

async function resolveConfig(flags = {}) {
  let cfgHost, cfgUsername, cfgPassword, cfgInsecure;

  const deviceName = flags.device || undefined;
  const device = getActiveDevice(deviceName);

  if (deviceName && !device) {
    throw new Error(`Device "${deviceName}" not found`);
  }

  if (device) {
    cfgHost = device.host;
    cfgUsername = device.username;
    cfgPassword = device.password;
    cfgInsecure = device.insecure;
  }

  const envHost = process.env.AUDIOCODES_HOST;
  const envUsername = process.env.AUDIOCODES_USERNAME;
  const envPassword = process.env.AUDIOCODES_PASSWORD;

  const flagHost = flags.host;
  const flagUsername = flags.username;
  const flagPassword = flags.password;
  const flagInsecure = flags.insecure;

  const host = flagHost || envHost || cfgHost;
  const username = flagUsername || envUsername || cfgUsername;
  const password = flagPassword || envPassword || cfgPassword;
  const insecure = flagInsecure !== undefined ? flagInsecure : cfgInsecure;

  if (!host) {
    throw new Error(
      "No device host configured. Provide --host, set AUDIOCODES_HOST, or add a device with: audiocodes-cli config add",
    );
  }
  if (!username) {
    throw new Error(
      "No username configured. Provide --username, set AUDIOCODES_USERNAME, or add a device with: audiocodes-cli config add",
    );
  }
  if (!password) {
    throw new Error(
      "No password configured. Provide --password, set AUDIOCODES_PASSWORD, or add a device with: audiocodes-cli config add",
    );
  }

  const result = { host, username, password };
  if (insecure !== undefined) {
    result.insecure = insecure;
  }

  if (hasSsPlaceholders(result)) {
    return resolveSsPlaceholders(result);
  }

  return result;
}

async function createClient(flags = {}) {
  const config = await resolveConfig(flags);

  if (config.insecure || flags.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    process.emitWarning = ((orig) =>
      function (warning, ...args) {
        if (
          typeof warning === "string" &&
          warning.includes("NODE_TLS_REJECT_UNAUTHORIZED")
        )
          return;
        return orig.call(process, warning, ...args);
      })(process.emitWarning);
  }

  let baseURL;
  if (config.host.startsWith("http://") || config.host.startsWith("https://")) {
    baseURL = config.host.replace(/\/+$/, "") + "/api/v1";
  } else {
    const protocol = config.insecure || flags.insecure ? "https" : "https";
    baseURL = `${protocol}://${config.host}/api/v1`;
  }

  const client = axios.create({
    baseURL,
    auth: {
      username: config.username,
      password: config.password,
    },
    timeout: 10000,
    headers: {
      Accept: "application/json",
    },
  });

  if (flags.debug) {
    client.interceptors.request.use((req) => {
      process.stderr.write(
        `DEBUG: ${req.method.toUpperCase()} ${req.baseURL}${req.url}\n`,
      );
      return req;
    });
    client.interceptors.response.use((resp) => {
      process.stderr.write(`DEBUG: ${resp.status} ${resp.statusText}\n`);
      return resp;
    });
  }

  return client;
}

module.exports = {
  resolveConfig,
  createClient,
};
