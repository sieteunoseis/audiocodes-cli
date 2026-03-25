# audiocodes-cli

CLI for AudioCodes Mediant VE SBCs via REST API.

## Install

```bash
npm install -g audiocodes-cli
```

## Quick Start

```bash
# Add a device
audiocodes-cli config add lab-ve --host 10.0.0.50 --username Admin --password Admin --insecure

# Check connectivity
audiocodes-cli doctor

# List active calls
audiocodes-cli calls list

# List alarms
audiocodes-cli alarms list
audiocodes-cli alarms list --severity critical
```

## Configuration

Devices are stored in `~/.audiocodes-cli/config.json`.

```bash
audiocodes-cli config add <name> --host <h> --username <u> --password <p>
audiocodes-cli config use <name>
audiocodes-cli config list
audiocodes-cli config show
audiocodes-cli config remove <name>
audiocodes-cli config test
```

### Environment Variables

- `AUDIOCODES_HOST` — device hostname
- `AUDIOCODES_USERNAME` — device username
- `AUDIOCODES_PASSWORD` — device password
- `AUDIOCODES_CONFIG_DIR` — override config directory

### Secret Server

Use `<ss:ID:field>` placeholders in config for credentials managed by [ss-cli](https://github.com/sieteunoseis/ss-cli).

## Output Formats

All commands support `--format <type>`:

- `table` (default) — ASCII table
- `json` — pretty-printed JSON
- `csv` — CSV with headers
- `toon` — TOON format

## Global Options

```
--format <type>    Output format (table, json, csv, toon)
--host <host>      Override device hostname
--username <user>  Override username
--password <pass>  Override password
--device <name>    Select named device from config
--clean            Remove empty/null values from results
--insecure         Skip TLS certificate verification
--no-audit         Disable audit logging
--debug            Enable debug logging
```

## License

MIT
