import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | { rate?: number; source?: string } | ErrorResult;
interface SerpApiResponse {
  knowledge_graph?: { title?: string; description?: string; source?: { link?: string } };
  answer_box?: { answer?: string; snippet?: string; title?: string; link?: string };
  organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  local_results?: Array<{ title?: string; address?: string; phone?: string; rating?: number }>;
  error?: string;
}
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string', description: 'The city or location name' } },
        required: ['location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web using Google or fetch content from a specific URL',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for Google search' },
          url: { type: 'string', description: 'Specific URL to fetch content from (alternative to search)' },
          num_results: { type: 'number', description: 'Number of search results to return (default: 5, max: 10)', default: 5 }
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'cpt_lookup',
      description: 'Lookup real-time Medicare allowed amounts or Fair Market Value for a medical CPT code',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'The 5-digit CPT code' },
          state: { type: 'string', description: 'Optional US state for localized pricing' }
        },
        required: ['code']
      }
    }
  }
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
const createSearchUrl = (query: string, apiKey: string, numResults: number) => {
  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('num', Math.min(numResults, 10).toString());
  return url.toString();
};
async function performWebSearch(query: string, numResults = 5): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return `🔍 Search unavailable: missing API key. Query: ${query}`;
  try {
    const response = await fetch(createSearchUrl(query, apiKey, numResults), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebBot/1.0)', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
    const data: SerpApiResponse = await response.json();
    // Simplistic formatting for generic web search
    const results = data.organic_results?.map(r => r.snippet).join('\n') || '';
    return results || `No results for "${query}"`;
  } catch (error) {
    return `Search error: ${String(error)}`;
  }
}
async function lookupCptRate(code: string, state?: string): Promise<{ rate?: number; source?: string }> {
  const query = `CPT ${code} Medicare allowed amount ${state || ''} 2024 2025`;
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return {};
  try {
    const response = await fetch(createSearchUrl(query, apiKey, 3), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    const data: SerpApiResponse = await response.json();
    const text = [
      data.answer_box?.answer,
      data.answer_box?.snippet,
      data.knowledge_graph?.description,
      ...(data.organic_results?.map(r => r.snippet) || [])
    ].join(' ').toLowerCase();
    // Look for patterns like "$123.45" or "allowed: 123"
    const moneyMatch = text.match(/\$\s?(\d+(?:\.\d{2})?)/);
    if (moneyMatch) {
      return { 
        rate: parseFloat(moneyMatch[1]), 
        source: data.answer_box?.link || data.organic_results?.[0]?.link 
      };
    }
    return {};
  } catch {
    return {};
  }
}
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'get_weather':
        return {
          location: args.location as string,
          temperature: 20,
          condition: 'Sunny',
          humidity: 50
        };
      case 'web_search': {
        const query = args.query as string;
        const content = await performWebSearch(query);
        return { content };
      }
      case 'cpt_lookup': {
        const code = args.code as string;
        const state = args.state as string;
        const result = await lookupCptRate(code, state);
        return result;
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}