# AudioCodes CLI

[![npm version](https://img.shields.io/npm/v/audiocodes-cli.svg)](https://www.npmjs.com/package/audiocodes-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/audiocodes-cli.svg)](https://nodejs.org)
[![Skills](https://img.shields.io/badge/skills.sh-audiocodes--cli-blue)](https://skills.sh/sieteunoseis/audiocodes-cli)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

A CLI tool for troubleshooting VoIP on AudioCodes Mediant VE SBCs via the REST API. Query call statistics, monitor alarms, check device health, and manage device configurations.

AudioCodes REST API information can be found at:
[AudioCodes REST API Reference](https://www.audiocodes.com/media/lbjffjkf/rest-api-for-mediant-sbc-devices.pdf).

## Installation

```bash
npm install -g audiocodes-cli
```

Or run without installing:

```bash
npx audiocodes-cli --help
```

### AI Agent Skills

```bash
npx skills add sieteunoseis/audiocodes-cli
```

## Requirements

If you are using self-signed certificates on AudioCodes devices you may need to disable TLS verification, or use the `--insecure` CLI flag.

Tested with AudioCodes Mediant VE SBC firmware `7.40A.250.265`.

## Quick Start

```bash
# Configure a device
audiocodes-cli config add lab-ve --host 10.0.0.50 --username Admin --password Admin --insecure

# Test the connection
audiocodes-cli config test

# Check device health
audiocodes-cli doctor

# List active alarms
audiocodes-cli alarms list

# View call statistics
audiocodes-cli calls list

# View per-IP-group stats
audiocodes-cli calls list --scope ipGroup
```

## Configuration

```bash
audiocodes-cli config add <name> --host <host> --username <user> --password <pass> --insecure
audiocodes-cli config use <name>       # switch active device
audiocodes-cli config list             # list all devices
audiocodes-cli config show             # show active device (masks passwords)
audiocodes-cli config remove <name>    # remove a device
audiocodes-cli config test             # test connectivity
```

Auth precedence: CLI flags > env vars (`AUDIOCODES_HOST`, `AUDIOCODES_USERNAME`, `AUDIOCODES_PASSWORD`) > config file.

Config stored at `~/.audiocodes-cli/config.json`. Supports [ss-cli](https://github.com/sieteunoseis/ss-cli) `<ss:ID:field>` placeholders.

## CLI Commands

| Command                                | Description                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `calls list`                           | View call statistics (global, per-IP-group, per-SRD) |
| `alarms list`                          | List active alarms with optional severity filter     |
| `sip-trace start/stop`                 | SIP signaling trace capture (pending lab validation) |
| `doctor`                               | Check REST API connectivity and device health        |
| `config add/use/list/show/remove/test` | Manage device configurations                         |

## Global Flags

| Flag                              | Description                           |
| --------------------------------- | ------------------------------------- |
| `--format table\|json\|toon\|csv` | Output format (default: table)        |
| `--host <host>`                   | Override device hostname              |
| `--username <user>`               | Override username                     |
| `--password <pass>`               | Override password                     |
| `--device <name>`                 | Select named device from config       |
| `--insecure`                      | Skip TLS certificate verification     |
| `--clean`                         | Remove empty/null values from results |
| `--no-audit`                      | Disable audit logging                 |
| `--debug`                         | Enable debug logging                  |

## Giving Back

If you found this helpful, consider:

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/automatebldrs)

## License

MIT
