# Claude Code Hooks for audiocodes-cli

[Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) let you enforce guardrails when AI agents use the CLI. The examples below block write operations so Claude can only read from AudioCodes SBCs.

## Block Write Operations

Add this to your `~/.claude/settings.json` (global) or `.claude/settings.json` (project-level) under `hooks.PreToolUse`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?audiocodes-cli (device save|test-call (dial|drop))'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: audiocodes-cli write operation. Get explicit user approval.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

### What it blocks

| Command                             | Blocked | Why                           |
| ----------------------------------- | ------- | ----------------------------- |
| `audiocodes-cli doctor`             | No      | Health check                  |
| `audiocodes-cli alarms list`        | No      | Read operation                |
| `audiocodes-cli alarms history`     | No      | Read operation                |
| `audiocodes-cli calls list`         | No      | Read operation                |
| `audiocodes-cli kpi show ...`       | No      | Read operation                |
| `audiocodes-cli device status`      | No      | Read operation                |
| `audiocodes-cli device license`     | No      | Read operation                |
| `audiocodes-cli device backup`      | No      | Downloads config (read)       |
| `audiocodes-cli device save`        | **Yes** | Saves running config to NVRAM |
| `audiocodes-cli test-call dial ...` | **Yes** | Initiates a SIP test call     |
| `audiocodes-cli test-call drop ...` | **Yes** | Drops an active test call     |

## Audit Logging

All audiocodes-cli operations are logged to `~/.audiocodes-cli/audit.jsonl` by default. This provides a record of every command run by Claude or any other agent.
