/**
 * FootballBin MCP Server Handler
 * JSON-RPC 2.0 based Model Context Protocol implementation
 *
 * Provides AI agents with access to football match predictions
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// ============================================================================
// Configuration
// ============================================================================

const config = {
    MATCHES_TABLE: process.env.MATCHES_TABLE || 'footballbin-matches-prod',
    MATCHWEEKS_TABLE: process.env.MATCHWEEKS_TABLE || 'footballbin-matchweeks-prod',
    DEFAULT_REGION: process.env.DEFAULT_REGION || 'eu-central-1',
    APP_STORE_LINK: process.env.APP_STORE_LINK || 'https://apps.apple.com/app/footballbin/id6757111871'
};

// ============================================================================
// Types
// ============================================================================

interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: 'tools/list' | 'tools/call';
    params?: {
        name?: string;
        arguments?: Record<string, unknown>;
    };
}

interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number | null;
    result?: unknown;
    error?: { code: number; message: string };
}

interface MCPTool {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, { type: string; description?: string }>;
        required?: string[];
    };
}

interface Match {
    league: string;
    match_id: string;
    matchweek: number;
    home_club_id: string;
    away_club_id: string;
    kickoff_time: string;
    predictions: Record<string, string> | Array<{ type: string; value: string; confidence: number }>;
    key_players?: Array<{ player_id: string; player_name: string; reason: string }>;
}

interface Matchweek {
    league: string;
    matchweek_number: number;
    is_current: boolean;
}

// JSON-RPC error codes
const MCPErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603
} as const;

// ============================================================================
// DynamoDB Client
// ============================================================================

const client = new DynamoDBClient({ region: config.DEFAULT_REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function getCurrentMatchweeks(): Promise<Matchweek[]> {
    const result = await docClient.send(new ScanCommand({
        TableName: config.MATCHWEEKS_TABLE,
        FilterExpression: 'is_current = :isCurrent',
        ExpressionAttributeValues: { ':isCurrent': true }
    }));
    return (result.Items || []) as Matchweek[];
}

async function getMatchesByLeague(league: string, matchweek?: number): Promise<Match[]> {
    const result = await docClient.send(new QueryCommand({
        TableName: config.MATCHES_TABLE,
        KeyConditionExpression: 'league = :league',
        ExpressionAttributeValues: { ':league': league }
    }));

    let matches = (result.Items || []) as Match[];

    if (matchweek !== undefined) {
        matches = matches.filter(m => m.matchweek === matchweek);
    }

    return matches.sort((a, b) =>
        new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    );
}

// ============================================================================
// Tool Definition
// ============================================================================

const tools: MCPTool[] = [
    {
        name: 'get_match_predictions',
        title: 'Get AI Match Predictions',
        description: 'Get AI-powered predictions for Premier League and Champions League matches including half-time score, full-time score, next goal scorer, and corner predictions. Real-time predictions available in FootballBin iOS app.',
        inputSchema: {
            type: 'object',
            properties: {
                league: {
                    type: 'string',
                    description: 'League to get predictions for. Accepts: "premier_league", "epl", "pl", "champions_league", "ucl", "cl"'
                },
                matchweek: {
                    type: 'number',
                    description: 'Matchweek number (optional, defaults to current matchweek)'
                },
                home_team: {
                    type: 'string',
                    description: 'Filter by home team name (optional, e.g., "chelsea", "arsenal", "man_utd")'
                },
                away_team: {
                    type: 'string',
                    description: 'Filter by away team name (optional, e.g., "liverpool", "wolves")'
                }
            },
            required: ['league']
        }
    }
];

// ============================================================================
// League & Team Aliases
// ============================================================================

const LEAGUE_ALIASES: Record<string, string> = {
    'epl': 'premier_league',
    'pl': 'premier_league',
    'english_premier_league': 'premier_league',
    'prem': 'premier_league',
    'england': 'premier_league',
    'ucl': 'champions_league',
    'cl': 'champions_league',
    'uefa_champions_league': 'champions_league',
    'champions': 'champions_league',
};

const TEAM_ALIASES: Record<string, string> = {
    'manchester_united': 'man_utd',
    'manchester_utd': 'man_utd',
    'united': 'man_utd',
    'mufc': 'man_utd',
    'manchester_city': 'man_city',
    'city': 'man_city',
    'mcfc': 'man_city',
    'nottingham_forest': 'nottm_forest',
    'forest': 'nottm_forest',
    'tottenham_hotspur': 'tottenham',
    'spurs': 'tottenham',
    'west_ham_united': 'west_ham',
    'wolverhampton': 'wolves',
    'brighton_hove_albion': 'brighton',
    'newcastle_united': 'newcastle',
    'palace': 'crystal_palace',
    'gunners': 'arsenal',
    'reds': 'liverpool',
    'blues': 'chelsea',
    'villa': 'aston_villa',
    'real': 'real_madrid',
    'barca': 'barcelona',
    'bayern_munich': 'bayern',
    'borussia_dortmund': 'dortmund',
    'inter_milan': 'inter',
    'paris_saint_germain': 'psg',
};

function normalizeLeague(input: string): string {
    const normalized = input.toLowerCase().replace(/\s+/g, '_');
    return LEAGUE_ALIASES[normalized] || normalized;
}

function normalizeTeamName(input: string): string {
    const normalized = input.toLowerCase().replace(/\s+/g, '_');
    return TEAM_ALIASES[normalized] || normalized;
}

// ============================================================================
// Formatters
// ============================================================================

function formatMatchDate(isoDate: string): string {
    const date = new Date(isoDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatCountdown(kickoffTime: string): string {
    const diffMs = new Date(kickoffTime).getTime() - Date.now();
    if (diffMs <= 0) return 'now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
}

function getMatchStatus(kickoffTime: string): 'scheduled' | 'live' | 'finished' {
    const now = Date.now();
    const kickoff = new Date(kickoffTime).getTime();
    if (now < kickoff) return 'scheduled';
    if (now < kickoff + 2 * 60 * 60 * 1000) return 'live';
    return 'finished';
}

function formatClubId(clubId: string): string {
    return clubId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPredictionType(type: string): string {
    const typeMap: Record<string, string> = {
        'ht_result': 'Half Time Result',
        'ft_result': 'Full Time Result',
        'next_goal': 'Next Goal',
        'corner_count': 'Corner Count'
    };
    return typeMap[type] || type;
}

// ============================================================================
// Tool Execution
// ============================================================================

interface GetMatchPredictionsInput {
    league: string;
    matchweek?: number;
    home_team?: string;
    away_team?: string;
}

async function getMatchPredictions(input: GetMatchPredictionsInput) {
    const league = normalizeLeague(input.league);

    let matchweekNumber = input.matchweek;
    if (!matchweekNumber) {
        const currentMatchweeks = await getCurrentMatchweeks();
        const leagueMatchweek = currentMatchweeks.find(mw => mw.league === league);
        if (leagueMatchweek) {
            matchweekNumber = leagueMatchweek.matchweek_number;
        } else {
            throw new Error(`No current matchweek found for ${league}`);
        }
    }

    let matches = await getMatchesByLeague(league, matchweekNumber);

    if (input.home_team) {
        const homeFilter = normalizeTeamName(input.home_team);
        matches = matches.filter(m =>
            m.home_club_id.toLowerCase() === homeFilter ||
            m.home_club_id.toLowerCase().includes(homeFilter)
        );
    }
    if (input.away_team) {
        const awayFilter = normalizeTeamName(input.away_team);
        matches = matches.filter(m =>
            m.away_club_id.toLowerCase() === awayFilter ||
            m.away_club_id.toLowerCase().includes(awayFilter)
        );
    }

    if (matches.length === 0) {
        throw new Error(`No matches found for ${league} matchweek ${matchweekNumber}`);
    }

    const formattedMatches = matches.map(match => {
        let predictions: Array<{ type: string; value: string; confidence: number }> = [];
        if (Array.isArray(match.predictions)) {
            predictions = match.predictions.map(p => ({
                type: formatPredictionType(p.type),
                value: p.value,
                confidence: p.confidence || 75
            }));
        } else if (match.predictions && typeof match.predictions === 'object') {
            predictions = Object.entries(match.predictions).map(([type, value]) => ({
                type: formatPredictionType(type),
                value: value as string,
                confidence: 75
            }));
        }

        return {
            match_id: match.match_id,
            home_team: formatClubId(match.home_club_id),
            away_team: formatClubId(match.away_club_id),
            kickoff_time: match.kickoff_time,
            kickoff_formatted: formatMatchDate(match.kickoff_time),
            countdown: formatCountdown(match.kickoff_time),
            status: getMatchStatus(match.kickoff_time),
            predictions,
            key_players: (match.key_players || []).map(kp => ({
                player_id: kp.player_id,
                player_name: kp.player_name,
                reason: kp.reason
            }))
        };
    });

    return {
        league,
        matchweek: matchweekNumber,
        matches: formattedMatches,
        count: formattedMatches.length,
        app_link: config.APP_STORE_LINK,
        note: 'Download FootballBin for live match tracking, player valuations, and detailed predictions.'
    };
}

// ============================================================================
// HTTP Helpers
// ============================================================================

function corsHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    };
}

function errorResponse(code: number, message: string, id: string | number | null = null): APIGatewayProxyResult {
    const response: MCPResponse = { jsonrpc: '2.0', id, error: { code, message } };
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(response) };
}

function successResponse(id: string | number, result: unknown): APIGatewayProxyResult {
    const response: MCPResponse = { jsonrpc: '2.0', id, result };
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(response) };
}

// ============================================================================
// Main Handler
// ============================================================================

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    console.log('MCP Server request:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders(), body: '' };
    }

    let request: MCPRequest;
    try {
        request = JSON.parse(event.body || '{}');
    } catch {
        return errorResponse(MCPErrorCodes.PARSE_ERROR, 'Parse error: Invalid JSON');
    }

    if (request.jsonrpc !== '2.0') {
        return errorResponse(MCPErrorCodes.INVALID_REQUEST, 'Invalid JSON-RPC version');
    }
    if (!request.id) {
        return errorResponse(MCPErrorCodes.INVALID_REQUEST, 'Missing request ID');
    }
    if (!request.method) {
        return errorResponse(MCPErrorCodes.INVALID_REQUEST, 'Missing method', request.id);
    }

    switch (request.method) {
        case 'tools/list':
            return successResponse(request.id, {
                tools: tools.map(t => ({
                    name: t.name,
                    title: t.title,
                    description: t.description,
                    inputSchema: t.inputSchema
                }))
            });

        case 'tools/call':
            const toolName = request.params?.name;
            const args = request.params?.arguments || {};

            if (toolName !== 'get_match_predictions') {
                return errorResponse(MCPErrorCodes.INVALID_PARAMS, `Unknown tool: ${toolName}`, request.id);
            }

            try {
                const result = await getMatchPredictions(args as GetMatchPredictionsInput);
                return successResponse(request.id, {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    structuredContent: result,
                    isError: false
                });
            } catch (error) {
                return successResponse(request.id, {
                    content: [{ type: 'text', text: error instanceof Error ? error.message : 'Tool execution failed' }],
                    isError: true
                });
            }

        default:
            return errorResponse(MCPErrorCodes.METHOD_NOT_FOUND, `Method not found: ${request.method}`, request.id);
    }
};
