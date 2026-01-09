import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
import { ForensicScrubber } from "./scrubber";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
            const url = new URL(c.req.url);
            url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
            return agent.fetch(new Request(url.toString(), {
                method: c.req.method,
                headers: c.req.header(),
                body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
            }));
        } catch (error) {
            console.error('Agent routing error:', error);
            return c.json({
                success: false,
                error: API_RESPONSES.AGENT_ROUTING_FAILED
            }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                if (firstMessage && firstMessage.trim()) {
                    const truncated = firstMessage.trim().length > 40 ? firstMessage.trim().slice(0, 37) + '...' : firstMessage.trim();
                    sessionTitle = `${truncated} • ${dateTime}`;
                } else {
                    sessionTitle = `Audit ${dateTime}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({ success: true, data: { sessionId, title: sessionTitle } });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) return c.json({ success: false, error: 'Session not found' }, { status: 404 });
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
        }
    });
    /**
     * Specialized Forensic PII Scrubbing (Standardized before catch-all)
     */
    app.post('/api/chat/:sessionId/scrub', async (c) => {
        try {
            const { text } = await c.req.json();
            if (!text || text.length > 5000) return c.json({ success: false, error: 'Text required' }, { status: 400 });
            const result = await ForensicScrubber.process(text);
            return c.json({ success: true, data: result });
        } catch (error) {
            return c.json({ success: false, error: 'Scrubbing failed' }, { status: 500 });
        }
    });
    app.get('/api/chat/:sessionId/scrub/test', async (c) => {
        try {
            const result = await ForensicScrubber.runSelfTest();
            return c.json({ success: true, data: result });
        } catch (error) {
            return c.json({ success: false, error: 'Self-test failed' }, { status: 500 });
        }
    });
    /**
     * Microservices Bridge Telemetry
     */
    app.get('/api/chat/:sessionId/bridge', async (c) => {
        return c.json({
            success: true,
            data: {
                services: [
                    { service: 'Audit Engine', latency: 42, status: 'UP' },
                    { service: 'FMV Bridge', latency: 124, status: 'UP' },
                    { service: 'NSA Monitor', latency: 12, status: 'UP' }
                ],
                integrity: 'SHA-256',
                timestamp: Date.now()
            }
        });
    });
    app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy' } }));
}