# audiocodes-cli Design Spec

## Overview

A Node.js CLI tool for troubleshooting VoIP on AudioCodes Mediant VE SBCs via the REST API. Follows the established cisco-\* CLI patterns (Commander.js, 4-format output, config management, audit logging). Standalone tool — not yet integrated with the cisco-uc-engineer orchestration skill.

**Target:** AudioCodes Mediant VE (virtual edition)
**API:** AudioCodes REST API (Basic auth)
**Primary use cases:** Troubleshooting active calls, SIP trace capture, alarm monitoring
**No SDK/library layer** — this is a CLI-only tool. `cli/utils/connection.js` is the sole API client. A reusable library can be extracted later if needed.
**API validation required** — all API paths below are assumed based on AudioCodes REST API documentation. Exact endpoints, response shapes, and authentication behavior must be validated against the lab device before implementation begins.

## Project Structure

```
audiocodes-cli/
├── bin/
│   └── audiocodes-cli.js        # Shebang entry point
├── cli/
│   ├── index.js                 # Commander program setup
│   ├── commands/
│   │   ├── calls.js             # Active calls / sessions
│   │   ├── sip-trace.js         # SIP trace capture
│   │   ├── alarms.js            # Active alarms / alerts
│   │   ├── doctor.js            # Connectivity check
│   │   └── config.js            # Device config management
│   ├── formatters/
│   │   ├── table.js
│   │   ├── json.js
│   │   ├── csv.js
│   │   └── toon.js
│   └── utils/
│       ├── connection.js        # REST client + config resolution
│       ├── output.js            # Format dispatcher + printError
│       └── audit.js             # JSONL audit logging
├── test/
│   └── tests.js
├── package.json
└── README.md
```

## Stack

- **Runtime:** Node.js (CommonJS)
- **CLI framework:** Commander.js
- **HTTP client:** axios
- **Table output:** cli-table3
- **CSV output:** csv-stringify
- **Universal format:** @toon-format/toon
- **Update checks:** update-notifier

## Configuration & Authentication

### Config file

Location: `~/.audiocodes-cli/config.json` (mode 0o600). Override with `AUDIOCODES_CONFIG_DIR` env var (used for test isolation).

```json
{
  "activeDevice": "lab-ve",
  "devices": {
    "lab-ve": {
      "host": "10.0.0.50",
      "username": "Admin",
      "password": "Admin",
      "insecure": true
    }
  }
}
```

### Precedence (lowest → highest)

1. Config file (`~/.audiocodes-cli/config.json`)
2. Environment variables (`AUDIOCODES_HOST`, `AUDIOCODES_USERNAME`, `AUDIOCODES_PASSWORD`, `AUDIOCODES_CONFIG_DIR`)
3. CLI flags (`--host`, `--username`, `--password`)

### Secret Server support

`<ss:ID:field>` placeholders in config resolved via `ss-cli get`.

### Config commands

```
audiocodes-cli config add <name> --host <h> --username <u> --password <p> [--insecure]
audiocodes-cli config use <name>
audiocodes-cli config list
audiocodes-cli config show                                                    # passwords masked in output
audiocodes-cli config remove <name>
audiocodes-cli config test
```

## Global CLI Options

```
--format <type>    table | json | csv | toon (default: table)
--host <host>      Override device hostname
--username <user>  Override username
--password <pass>  Override password
--device <name>    Select named device from config
--insecure         Skip TLS verification
--clean            Remove empty/null values from results
--no-audit         Disable audit logging
--debug            Enable debug output
```

## Day-One Commands

### `audiocodes-cli calls list`

List active calls/sessions on the SBC.

```
audiocodes-cli calls list
audiocodes-cli calls list --format json
```

**API:** `GET /api/v1/activeCalls`
**Table columns:** Call ID, Source, Destination, Duration, Codec, SIP Status, IP Group

### `audiocodes-cli sip-trace start` (Pending Lab Validation)

Start capturing SIP signaling. This command's implementation depends on what the AudioCodes REST API exposes for debug/trace capture. Must be validated against the lab before implementation.

**Possible interfaces (to be confirmed):**

```
audiocodes-cli sip-trace start                    # Stream to stdout
audiocodes-cli sip-trace start --output trace.txt # Save to file
audiocodes-cli sip-trace start --filter <value>   # Filter by caller/callee/IP
audiocodes-cli sip-trace stop                     # Stop active trace
```

**Implementation risks:**

- API may use polling, WebSocket, or syslog — architecture differs based on mechanism
- Filtering capabilities depend on what the API supports
- If no trace API exists, this command will be deferred to a future release

**Fallback:** If the REST API does not support live SIP trace, this command may instead pull from debug recording or syslog endpoints.

### `audiocodes-cli alarms list`

Show active alarms and alerts.

```
audiocodes-cli alarms list
audiocodes-cli alarms list --severity critical
```

**API:** `GET /api/v1/alarms`
**Table columns:** Alarm ID, Severity, Source, Description, Timestamp

### `audiocodes-cli doctor`

Connectivity and health check.

- Verify config exists
- Test HTTP connectivity to device
- Test authentication
- Report TLS status
- Show device info (model, firmware version, uptime) — endpoint TBD, likely `GET /api/v1/status` or `/api/v1/deviceInfo`

```
audiocodes-cli doctor
```

## API Client

### Connection (`cli/utils/connection.js`)

- axios instance with base URL `https://<host>/api/v1`
- Basic auth header on every request
- Configurable timeout (default 10s)
- `--insecure` sets `NODE_TLS_REJECT_UNAUTHORIZED=0`
- TLS warning suppression (same pattern as cisco-yang)

### Error handling

Uses string matching in `printError()` for contextual hints (no custom error classes — same pragmatic approach as cisco-yang implementation).

```
try/catch at command level → printError() → process.exitCode = 1
```

Contextual hints:

- 401/403 → `Hint: Run "audiocodes-cli config test" to verify credentials.`
- ECONNREFUSED → `Hint: Check that the device is reachable and the REST API is enabled.`
- Certificate errors → `Hint: Try adding --insecure to skip TLS verification.`

## Audit Logging

Location: `~/.audiocodes-cli/audit.jsonl`

- Append-only JSONL
- Fields: timestamp, device, operation, duration_ms, status, error
- Credentials redacted from log entries
- 10 MB rotation threshold
- Fire-and-forget (never fails the command)

## Output Formatting

Four formats, identical pattern to other cisco-\* CLIs:

- **table** (default): cli-table3, horizontal for arrays, vertical key-value for single objects
- **json**: Pretty-printed `JSON.stringify(data, null, 2)`
- **csv**: csv-stringify with headers
- **toon**: @toon-format/toon encode

Special handling:

- Nested objects flattened to dot-notation in table view
- Empty results → "No results found"
- Array counts in footer for table view

## Testing

- Node.js assert module (no external test framework)
- CLI tests shell out to `bin/audiocodes-cli.js`, check output
- `--help` coverage for all commands
- Config add/use/list/remove round-trip tests
- Format flag tests (json, csv, table, toon)
- Integration tests against lab (`npm run test:integration`)
- Test isolation via `AUDIOCODES_CONFIG_DIR` env var pointing to temp dir

## Future Considerations (Not Day One)

- Integration with cisco-uc-engineer orchestration skill (after testing and publishing)
- Generic `get <path>` / `set <path>` REST commands
- Performance counters / statistics
- SIP trunk status
- Registration status
- Config backup / export
- Read-only mode
