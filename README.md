[![Add to Cursor](https://fastmcp.me/badges/cursor_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)
[![Add to VS Code](https://fastmcp.me/badges/vscode_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)
[![Add to Claude](https://fastmcp.me/badges/claude_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)
[![Add to ChatGPT](https://fastmcp.me/badges/chatgpt_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)
[![Add to Codex](https://fastmcp.me/badges/codex_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)
[![Add to Gemini](https://fastmcp.me/badges/gemini_dark.svg)](https://fastmcp.me/MCP/Details/1669/footballbin)

# FootballBin MCP Server

[![npm version](https://img.shields.io/npm/v/footballbin-mcp-server.svg)](https://www.npmjs.com/package/footballbin-mcp-server)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI agents with access to football match predictions for the Premier League and Champions League.

## Requirements

- **Node.js 18+** (check with `node --version`)

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g footballbin-mcp-server
```

### Option 2: npx (No Install)

```bash
npx footballbin-mcp-server
```

### Option 3: Remote Endpoint

No installation required - use the hosted endpoint directly:
```
https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp
```

## Quick Start

### Claude.ai (Easiest - No Install)

1. Go to **Settings > Connectors**
2. Click **Add custom connector**
3. Enter: `https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp`

### Claude Desktop

**Requires Node.js 18+**

**Step 1:** Install globally
```bash
npm install -g footballbin-mcp-server
```

**Step 2:** Find your Node.js path (must be v18+)
```bash
which node && node --version
```

**Step 3:** Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "footballbin": {
      "command": "/path/to/node",
      "args": ["/path/to/node_modules/footballbin-mcp-server/dist/index.js"]
    }
  }
}
```

**Example configs:**

macOS with nvm:
```json
{
  "mcpServers": {
    "footballbin": {
      "command": "/Users/YOU/.nvm/versions/node/v20.x.x/bin/node",
      "args": ["/Users/YOU/.nvm/versions/node/v20.x.x/lib/node_modules/footballbin-mcp-server/dist/index.js"]
    }
  }
}
```

macOS with Homebrew:
```json
{
  "mcpServers": {
    "footballbin": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/opt/homebrew/lib/node_modules/footballbin-mcp-server/dist/index.js"]
    }
  }
}
```

Windows:
```json
{
  "mcpServers": {
    "footballbin": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Users\\YOU\\AppData\\Roaming\\npm\\node_modules\\footballbin-mcp-server\\dist\\index.js"]
    }
  }
}
```

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Other MCP Clients

Use the remote endpoint:
```
https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp
```

## Features

- **AI Match Predictions**:
  - Half-time score
  - Full-time score
  - Next goal scorer
  - Corner count predictions

- **Supported Leagues**:
  - Premier League (EPL)
  - UEFA Champions League (UCL)

- **Key Players**: Each match includes key player insights with reasoning

## Tool: get_match_predictions

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `league` | string | Yes | `premier_league`, `epl`, `pl`, `champions_league`, `ucl`, `cl` |
| `matchweek` | number | No | Matchweek number (defaults to current) |
| `home_team` | string | No | Filter by home team (e.g., `chelsea`, `arsenal`) |
| `away_team` | string | No | Filter by away team (e.g., `liverpool`, `wolves`) |

### Team Aliases

| Alias | Maps To |
|-------|---------|
| `united`, `mufc` | `man_utd` |
| `city`, `mcfc` | `man_city` |
| `spurs` | `tottenham` |
| `villa` | `aston_villa` |
| `forest` | `nottm_forest` |
| `palace` | `crystal_palace` |
| `gunners` | `arsenal` |
| `reds` | `liverpool` |
| `blues` | `chelsea` |
| `barca` | `barcelona` |
| `real` | `real_madrid` |

### Example Response

```json
{
  "league": "premier_league",
  "matchweek": 22,
  "count": 10,
  "app_link": "https://apps.apple.com/app/footballbin/id6757111871",
  "matches": [
    {
      "match_id": "epl_mw22_liv_bur",
      "home_team": "Liverpool",
      "away_team": "Burnley",
      "kickoff_time": "2026-01-17T15:00:00Z",
      "status": "scheduled",
      "predictions": [
        { "type": "Half Time Result", "value": "2:0", "confidence": 75 },
        { "type": "Full Time Result", "value": "4:0", "confidence": 75 },
        { "type": "Next Goal", "value": "Home,Wirtz", "confidence": 75 },
        { "type": "Corner Count", "value": "9:3", "confidence": 75 }
      ],
      "key_players": [
        {
          "player_name": "Florian Wirtz",
          "reason": "12 goals, 14 assists. Liverpool's creative hub."
        }
      ]
    }
  ]
}
```

## Direct API Usage

### List Tools

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Get Predictions

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_match_predictions",
      "arguments": {"league": "premier_league"}
    },
    "id": 1
  }'
```

## Registry Links

- **npm**: https://www.npmjs.com/package/footballbin-mcp-server
- **Official MCP Registry**: https://registry.modelcontextprotocol.io
- **GitHub**: https://github.com/billychl1/footballbin-mcp-server

## FootballBin App

Get the full experience with the FootballBin iOS app:

[![Download on App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/app/footballbin/id6757111871)

Features:
- Live match tracking
- AI player valuations
- Detailed match predictions
- Player news and discussions

## Technical Details

- **Protocol**: JSON-RPC 2.0 / MCP
- **Transport**: stdio (npm) or HTTPS (remote)
- **Runtime**: Node.js 20+

### Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |

## License

MIT License - see [LICENSE](LICENSE) file.

## Links

- [FootballBin App](https://apps.apple.com/app/footballbin/id6757111871)
- [Model Context Protocol](https://modelcontextprotocol.io)
