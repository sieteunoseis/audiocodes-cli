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

Tested with AudioCodes Mediant VE SBC firmware `7.40A.250.265` and `7.40A.600.203`.

## Quick Start

```bash
# Configure a device
audiocodes-cli config add lab-ve --host 10.0.0.50 --username Admin --password "$AUDIOCODES_PASSWORD" --insecure

# Test the connection
audiocodes-cli config test

# Check device health
audiocodes-cli doctor

# List active alarms
audiocodes-cli alarms list

# View call statistics
audiocodes-cli calls list

# Browse KPI metrics
audiocodes-cli kpi list
audiocodes-cli kpi show system/licenseStats/global

# Backup device config
audiocodes-cli device backup
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

The host field supports both `https://hostname` (default) and `http://hostname` for devices without TLS.

## CLI Commands

| Command                                | Description                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `calls list`                           | View call statistics (global, per-IP-group, per-SRD) |
| `alarms list`                          | List active alarms with optional severity filter     |
| `alarms history`                       | View alarm history                                   |
| `kpi list`                             | List available KPI categories                        |
| `kpi show <path>`                      | Show real-time KPI metrics at a path                 |
| `kpi history <path>`                   | Show historical KPI metrics (15-min intervals)       |
| `device status`                        | Show device status information                       |
| `device backup`                        | Download device INI configuration                    |
| `device save`                          | Save running config to NVRAM                         |
| `device license`                       | Show license information                             |
| `device tls`                           | Show TLS certificate status                          |
| `test-call dial`                       | Start a SIP test call from the SBC                   |
| `test-call status <id>`                | Get test call status and results                     |
| `test-call show`                       | Show test call configuration                         |
| `test-call drop <id>`                  | End an active test call                              |
| `debug collect`                        | Trigger and download debug file                      |
| `doctor`                               | Check REST API connectivity and device health        |
| `config add/use/list/show/remove/test` | Manage device configurations                         |

## Firmware Compatibility

Not all CLI commands are available on every firmware version. The table below shows command availability by firmware build:

| Command                      | 7.40A.250 (LTS) | 7.40A.600+ (LR) | 7.40A.604+ (LTS) |
| ---------------------------- | :-------------: | :-------------: | :--------------: |
| `calls list`                 |       Yes       |       Yes       |       Yes        |
| `alarms list`                |       Yes       |       Yes       |       Yes        |
| `alarms history`             |       Yes       |       Yes       |       Yes        |
| `kpi list/show/history`      |       Yes       |       Yes       |       Yes        |
| `device status`              |       Yes       |       Yes       |       Yes        |
| `device backup`              |       Yes       |       Yes       |       Yes        |
| `device save`                |       Yes       |       Yes       |       Yes        |
| `device license`             |       Yes       |       Yes       |       Yes        |
| `device tls`                 |       Yes       |       Yes       |       Yes        |
| `debug collect`              |       No        |       Yes       |       Yes        |
| `test-call dial/status/drop` |       No        |       Yes       |       Yes        |
| `doctor`                     |       Yes       |       Yes       |       Yes        |
| `config *`                   |       Yes       |       Yes       |       Yes        |

> **Note:** The `test-call` and `debug collect` commands require firmware 7.40A.600 or later. Devices on 7.40A.250.x will return errors for these commands.

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
