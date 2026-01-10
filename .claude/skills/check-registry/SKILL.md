# Check MCP Registry Status

Verify the FootballBin MCP server listing status across all MCP registries.

## Quick Start

Run this skill with: `/check-registry`

## Registries to Check

### 1. npm (Published)
- **URL**: https://www.npmjs.com/package/footballbin-mcp-server
- **Check**: `npm view footballbin-mcp-server version`

### 2. Official MCP Registry (Published)
- **URL**: https://registry.modelcontextprotocol.io
- **Server Name**: `io.github.billychl1/footballbin-mcp-server`
- **Check**: Search registry API or web interface

### 3. GitHub (Published)
- **URL**: https://github.com/billychl1/footballbin-mcp-server
- **Check**: `gh repo view billychl1/footballbin-mcp-server --json name,description`

### 4. Glama (Pending Auto-Discovery)
- **URL**: https://glama.ai/mcp/servers
- **Check**: WebFetch `https://glama.ai/mcp/servers?query=footballbin`
- **Status**: Pending - Glama auto-indexes GitHub repos periodically

### 5. MCP.so (Pending Manual Submission)
- **URL**: https://mcp.so
- **Check**: WebFetch `https://mcp.so/server/billychl1/footballbin-mcp-server`
- **Submit at**: https://mcp.so/submit

### 6. Smithery (Not Submitted)
- **URL**: https://smithery.ai
- **Requires**: CLI publish with `smithery publish`

## Verification Commands

```bash
# Check npm
npm view footballbin-mcp-server version

# Check GitHub
gh repo view billychl1/footballbin-mcp-server --json name,url

# Check remote endpoint is working
curl -s -X POST https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' | jq '.result.tools[0].name'
```

## Web Checks

Use WebFetch to check these URLs:

1. **Glama**: `https://glama.ai/mcp/servers?query=footballbin`
2. **MCP.so**: `https://mcp.so/server/billychl1/footballbin-mcp-server`

## Expected Output

Generate a status table:

| Registry | URL | Status | Version |
|----------|-----|--------|---------|
| npm | npmjs.com/package/footballbin-mcp-server | ✅ Published | 1.0.1 |
| MCP Registry | registry.modelcontextprotocol.io | ✅ Published | 1.0.1 |
| GitHub | github.com/billychl1/footballbin-mcp-server | ✅ Published | 1.0.1 |
| Glama | glama.ai/mcp/servers | ⏳ Pending | - |
| MCP.so | mcp.so | ⏳ Pending | - |
| Smithery | smithery.ai | ❌ Not Submitted | - |
| Remote API | AWS Lambda | ✅ Live | - |

## Actions for Pending Registries

### If Glama not indexed:
- Wait for auto-discovery (can take 24-48 hours)
- Or contact Glama support

### If MCP.so not listed:
1. Go to https://mcp.so/submit
2. Sign in with GitHub
3. Submit:
   - Name: `FootballBin MCP Server`
   - Type: `MCP Server`
   - URL: `https://github.com/billychl1/footballbin-mcp-server`

### To submit to Smithery:
```bash
cd /Users/billy/Documents/development/footballbin-mcp-server
npm install -g @smithery/cli
smithery publish
```
