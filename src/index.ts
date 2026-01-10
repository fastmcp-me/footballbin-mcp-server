#!/usr/bin/env node

/**
 * FootballBin MCP Server (npm package)
 *
 * A thin wrapper that provides MCP stdio transport
 * and calls the FootballBin remote API for predictions.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Remote API endpoint
const API_ENDPOINT = "https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp";

// Response types from the API
interface MCPAPIResponse {
    jsonrpc: string;
    id: number;
    result?: {
        content?: Array<{ type: string; text: string }>;
        structuredContent?: unknown;
        isError?: boolean;
    };
    error?: {
        code: number;
        message: string;
    };
}

/**
 * Call the remote FootballBin API
 */
async function callRemoteAPI(args: {
    league: string;
    matchweek?: number;
    home_team?: string;
    away_team?: string;
}): Promise<unknown> {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
                name: "get_match_predictions",
                arguments: args
            },
            id: Date.now()
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as MCPAPIResponse;

    if (data.error) {
        throw new Error(data.error.message || "API error");
    }

    // Extract the structured content from the response
    if (data.result?.structuredContent) {
        return data.result.structuredContent;
    }

    // Fallback to parsing the text content
    if (data.result?.content?.[0]?.text) {
        return JSON.parse(data.result.content[0].text);
    }

    return data.result;
}

/**
 * Main entry point
 */
async function main() {
    // Create the MCP server
    const server = new McpServer({
        name: "footballbin-mcp-server",
        version: "1.0.0"
    });

    // Register the get_match_predictions tool using shape syntax
    server.tool(
        "get_match_predictions",
        "Get AI-powered predictions for Premier League and Champions League matches including half-time score, full-time score, next goal scorer, and corner predictions.",
        {
            league: z.string().describe('League to get predictions for. Accepts: "premier_league", "epl", "pl", "champions_league", "ucl", "cl"'),
            matchweek: z.number().optional().describe("Matchweek number (optional, defaults to current matchweek)"),
            home_team: z.string().optional().describe('Filter by home team name (optional, e.g., "chelsea", "arsenal", "man_utd")'),
            away_team: z.string().optional().describe('Filter by away team name (optional, e.g., "liverpool", "wolves")')
        },
        async (args) => {
            try {
                const result = await callRemoteAPI(args);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
                        }
                    ],
                    isError: true
                };
            }
        }
    );

    // Create stdio transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log to stderr (stdout is used for MCP protocol)
    console.error("FootballBin MCP Server running on stdio");
}

// Run the server
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
