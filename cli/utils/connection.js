"use strict";

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
    baseURL = `https://${config.host}/api/v1`;
  }

  const authHeader =
    "Basic " +
    Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const debug = !!flags.debug;

  async function request(method, urlPath, options = {}) {
    const url = `${baseURL}${urlPath}`;

    if (debug) {
      process.stderr.write(`DEBUG: ${method.toUpperCase()} ${url}\n`);
    }

    const fetchOpts = {
      method,
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000),
    };

    if (options.data !== undefined) {
      fetchOpts.body = JSON.stringify(options.data);
      fetchOpts.headers["Content-Type"] = "application/json";
    }

    if (options.responseType === "text") {
      fetchOpts.headers.Accept = "text/plain";
    }

    const response = await fetch(url, fetchOpts);

    if (debug) {
      process.stderr.write(
        `DEBUG: ${response.status} ${response.statusText}\n`,
      );
    }

    if (
      !response.ok &&
      !(options.validateStatus && options.validateStatus(response.status))
    ) {
      const body = await response.text();
      const err = new Error(`HTTP ${response.status}: ${body}`);
      err.response = { status: response.status, data: body };
      throw err;
    }

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (options.responseType === "arraybuffer") {
      data = Buffer.from(await response.arrayBuffer());
    } else if (
      options.responseType === "text" ||
      !contentType.includes("json")
    ) {
      data = await response.text();
    } else {
      data = await response.json();
    }

    return { status: response.status, statusText: response.statusText, data };
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, data, opts) => request("POST", path, { ...opts, data }),
    put: (path, data, opts) => request("PUT", path, { ...opts, data }),
    delete: (path, opts) => request("DELETE", path, opts),
    patch: (path, data, opts) => request("PATCH", path, { ...opts, data }),
    defaults: { baseURL },
  };
}

module.exports = {
  resolveConfig,
  createClient,
};
