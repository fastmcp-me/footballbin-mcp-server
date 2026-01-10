# FootballBin MCP Server

A Model Context Protocol (MCP) server that provides AI agents with access to football match predictions for the Premier League and Champions League.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open protocol that enables AI agents to securely access external tools and data sources. This server implements MCP to expose football match predictions to any MCP-compatible AI client.

## Features

- **AI Match Predictions**: Get predictions for upcoming matches including:
  - Half-time score
  - Full-time score
  - Next goal scorer
  - Corner count predictions

- **Supported Leagues**:
  - Premier League (EPL)
  - UEFA Champions League (UCL)

- **Key Players**: Each match includes key player insights with reasoning

## Live Endpoint

The FootballBin MCP server is publicly available:

```
https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp
```

No API key required.

## Usage

### Connect via Claude Desktop

Add this to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "footballbin": {
      "url": "https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp"
    }
  }
}
```

### Connect via Claude.ai

1. Go to **Settings > Connectors**
2. Click **Add custom connector**
3. Enter the endpoint URL
4. Start asking about football predictions!

### Direct API Usage

#### List Available Tools

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

#### Get Premier League Predictions

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_match_predictions",
      "arguments": {
        "league": "premier_league"
      }
    },
    "id": 1
  }'
```

#### Get Champions League Predictions

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_match_predictions",
      "arguments": {
        "league": "ucl"
      }
    },
    "id": 1
  }'
```

#### Filter by Team

```bash
curl -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_match_predictions",
      "arguments": {
        "league": "epl",
        "home_team": "liverpool"
      }
    },
    "id": 1
  }'
```

## Tool: get_match_predictions

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `league` | string | Yes | League identifier. Accepts: `premier_league`, `epl`, `pl`, `champions_league`, `ucl`, `cl` |
| `matchweek` | number | No | Matchweek number (defaults to current matchweek) |
| `home_team` | string | No | Filter by home team (e.g., `chelsea`, `arsenal`, `man_utd`) |
| `away_team` | string | No | Filter by away team (e.g., `liverpool`, `wolves`) |

### Team Aliases

The API supports common team aliases:

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
| `bayern_munich` | `bayern` |

### Response Format

```json
{
  "league": "premier_league",
  "matchweek": 22,
  "count": 10,
  "app_link": "https://apps.apple.com/app/footballbin/id6757111871",
  "note": "Download FootballBin for live match tracking, player valuations, and detailed predictions.",
  "matches": [
    {
      "match_id": "epl_mw22_liv_bur",
      "home_team": "Liverpool",
      "away_team": "Burnley",
      "kickoff_time": "2026-01-17T15:00:00Z",
      "kickoff_formatted": "Sat 17 Jan 15:00",
      "countdown": "7d 3h",
      "status": "scheduled",
      "predictions": [
        { "type": "Half Time Result", "value": "2:0", "confidence": 75 },
        { "type": "Full Time Result", "value": "4:0", "confidence": 75 },
        { "type": "Next Goal", "value": "Home,Wirtz", "confidence": 75 },
        { "type": "Corner Count", "value": "9:3", "confidence": 75 }
      ],
      "key_players": [
        {
          "player_id": "florian_wirtz",
          "player_name": "Florian Wirtz",
          "reason": "12 goals, 14 assists. Liverpool's creative hub with 89 form rating."
        },
        {
          "player_id": "zian_flemming",
          "player_name": "Zian Flemming",
          "reason": "6 goals, 3 assists. Burnley's top scorer and set-piece specialist."
        }
      ]
    }
  ]
}
```

## FootballBin App

Get the full experience with the FootballBin iOS app:

[![Download on App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/app/footballbin/id6757111871)

Features:
- Live match tracking
- AI player valuations
- Detailed match predictions
- Player news and discussions
- Squad browsers for all major leagues

## Technical Details

### Protocol

- **Protocol**: JSON-RPC 2.0
- **Transport**: HTTPS POST
- **Content-Type**: application/json

### Infrastructure

- **Runtime**: AWS Lambda (Node.js 20.x)
- **Database**: Amazon DynamoDB
- **API Gateway**: AWS API Gateway
- **Region**: eu-central-1 (Frankfurt)

### Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

## Self-Hosting

If you want to deploy your own instance:

### Prerequisites

- Node.js 20+
- AWS Account with DynamoDB access
- AWS SAM CLI

### Deploy

```bash
# Clone the repository
git clone https://github.com/billychl1/footballbin-mcp-server.git
cd footballbin-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Deploy with SAM
sam deploy --guided
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MATCHES_TABLE` | DynamoDB table for matches | `footballbin-matches-prod` |
| `MATCHWEEKS_TABLE` | DynamoDB table for matchweeks | `footballbin-matchweeks-prod` |
| `DEFAULT_REGION` | AWS region | `eu-central-1` |
| `APP_STORE_LINK` | App Store URL | `https://apps.apple.com/app/footballbin/id6757111871` |

## License

MIT License - see [LICENSE](LICENSE) file.

## Links

- [FootballBin App](https://apps.apple.com/app/footballbin/id6757111871)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
