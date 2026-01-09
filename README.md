# Cloudflare AI Chat Agents Template

[cloudflarebutton]

A production-ready Cloudflare Workers template for building AI-powered chat applications. Features persistent chat sessions using Durable Objects, tool calling (web search, weather, MCP integration), streaming responses, and a modern React frontend built with shadcn/ui.

## 🚀 Features

- **AI Chat Agents**: Serverless chat powered by Cloudflare AI Gateway (OpenAI-compatible)
- **Durable Objects**: Persistent sessions with real-time state management
- **Multi-Session Support**: Create, list, update, and delete chat sessions
- **Tool Calling**: Built-in tools for web search (SerpAPI), weather, and extensible MCP tools
- **Streaming Responses**: Real-time message streaming for natural conversations
- **Modern UI**: Responsive React app with Tailwind CSS, shadcn/ui components, and dark mode
- **TypeScript**: Fully type-safe with end-to-end types including Workers env
- **Session Management**: Auto-generated titles, activity tracking, and bulk operations
- **Observability**: Built-in logging and Cloudflare analytics

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Hono, Cloudflare Agents SDK, Durable Objects
- **AI**: Cloudflare AI Gateway (@ai.cloudflare), OpenAI SDK
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router
- **Tools**: SerpAPI (search), MCP (Model Context Protocol), Lucide Icons
- **Dev Tools**: Bun, TypeScript, ESLint, Wrangler

## 📦 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/)
- Cloudflare account with AI Gateway configured (for `@ai.cloudflare` models)
- SerpAPI key (optional, for web search)

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   bun install
   ```
3. Generate Worker types:
   ```bash
   bun run cf-typegen
   ```
4. Update `wrangler.jsonc` with your environment variables:
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/openai",
     "CF_AI_API_KEY": "{your_ai_gateway_token}",
     "SERPAPI_KEY": "{your_serpapi_key}",
     "OPENROUTER_API_KEY": "{optional_openrouter_key}"
   }
   ```

### Development

1. Start the dev server:
   ```bash
   bun dev
   ```
   - Frontend: http://localhost:3000 (Vite HMR)
   - Worker: Proxied at `/api/*`

2. Open http://localhost:3000 in your browser

3. Test chat:
   - Send messages via the UI
   - Try tools: "What's the weather in London?" or "Search for Cloudflare Workers"

### Build for Production

```bash
bun run build
```

## ⚡ Usage

### Chat API

All chat endpoints are routed via `/api/chat/{sessionId}/{route}`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/{sessionId}/messages` | Get session state |
| `POST` | `/api/chat/{sessionId}/chat` | Send message (`{message: string, model?: string, stream?: boolean}`) |
| `DELETE` | `/api/chat/{sessionId}/clear` | Clear messages |
| `POST` | `/api/chat/{sessionId}/model` | Update model (`{model: string}`) |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List sessions |
| `POST` | `/api/sessions` | Create session (`{title?, sessionId?, firstMessage?}`) |
| `DELETE` | `/api/sessions/{id}` | Delete session |
| `PUT` | `/api/sessions/{id}/title` | Update title |
| `GET` | `/api/sessions/stats` | Get stats |
| `DELETE` | `/api/sessions` | Clear all |

### Frontend Customization

- Edit `src/pages/HomePage.tsx` for the main UI
- Use `src/lib/chat.ts` for API integration
- Components in `src/components/ui/` (shadcn)
- Extend tools in `worker/tools.ts`
- Add routes in `worker/userRoutes.ts`

## ☁️ Deployment

1. Configure `wrangler.jsonc` with your vars and bindings
2. Login to Cloudflare:
   ```bash
   wrangler login
   ```
3. Deploy:
   ```bash
   bun run deploy
   ```
   Or:
   ```bash
   wrangler deploy
   ```

[cloudflarebutton]

Assets (frontend) are automatically bundled and served. Durable Objects migrate via `wrangler.jsonc`.

### Custom Domain

```bash
wrangler deploy --no-bundle
wrangler pages publish ./dist --project-name=your-project
```

## 🔧 Extending the Template

### Add Custom Tools

1. Define in `worker/tools.ts`:
   ```ts
   const customTools = [
     {
       type: 'function' as const,
       function: {
         name: 'my_tool',
         description: 'Description',
         parameters: { /* schema */ }
       }
     }
   ];
   ```

2. Implement `executeTool(name, args)` case

### MCP Tool Servers

Add to `worker/mcp-client.ts`:
```ts
const MCP_SERVERS = [
  {
    name: 'my-server',
    sseUrl: 'https://your-mcp-server/sse'
  }
];
```

### Custom AI Models

Update `src/lib/chat.ts` MODELS array and use via API.

## 🐛 Troubleshooting

- **AI Gateway 401**: Check `CF_AI_BASE_URL` and `CF_AI_API_KEY`
- **Types missing**: Run `bun run cf-typegen`
- **Sessions not persisting**: Verify Durable Objects bindings
- **Build errors**: Delete `node_modules/.vite`, `bun install`
- Logs: `wrangler tail`

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork and clone
2. `bun install`
3. Create feature branch
4. Submit PR

Built with ❤️ by Cloudflare Workers Templates.