import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, InsuranceState, InsuranceDocument, AuditEntry, Cpt, BilledAmount } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage } from './utils';
import { ForensicEngine } from './forensic';
import { ForensicScrubber } from './scrubber';
import { executeTool } from './tools';
const STATIC_BENCHMARKS: Record<string, number> = {
  '99213': 92.00, '99214': 128.00, '72141': 450.00, '80053': 14.50, '45378': 750.00, '90686': 19.00
};
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-1.5-flash',
    documents: [],
    auditLogs: [],
    lastContextSync: Date.now(),
    benchmarks: {},
    insuranceState: {
      deductibleTotal: 3000,
      deductibleUsed: 1350,
      oopMax: 6500,
      oopUsed: 2100,
      planType: 'PPO',
      networkStatus: 'In-Network'
    }
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(this.env.CF_AI_BASE_URL, this.env.CF_AI_API_KEY, this.state.model);
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') return Response.json({ success: true, data: this.state });
      if (method === 'POST' && url.pathname === '/chat') return this.handleChatMessage(await request.json());
      if (method === 'POST' && url.pathname === '/context') return this.handleContextSync(await request.json());
      if (method === 'POST' && url.pathname === '/documents') return this.handleDocumentUpload(await request.json());
      if (method === 'POST' && url.pathname === '/cpt-lookup') return this.handleCptLookup(await request.json());
      if (method === 'DELETE' && url.pathname.startsWith('/documents/')) {
        const docId = url.pathname.split('/').pop();
        if (docId) return this.handleDocumentDelete(docId);
      }
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async logAuditEvent(event: string, detail: string, severity: 'info' | 'warning' | 'critical' = 'info', metadata?: any): Promise<void> {
    const entry: AuditEntry = { id: crypto.randomUUID(), timestamp: Date.now(), event, detail, severity, metadata };
    const currentLogs = this.state.auditLogs || [];
    const auditLogs = [entry, ...currentLogs].slice(0, 50);
    this.setState({ ...this.state, auditLogs, lastContextSync: Date.now() });
  }
  private async handleCptLookup(body: { code: string; state?: string }): Promise<Response> {
    const { code, state } = body;
    const result = await executeTool('cpt_lookup', { code, state }) as any;
    if (result.rate) {
      const updatedBenchmarks = { ...this.state.benchmarks, [code]: result.rate };
      this.setState({ ...this.state, benchmarks: updatedBenchmarks });
      await this.logAuditEvent("Dynamic Benchmark", `Fetched FMV for CPT ${code} via Live Intelligence.`, "info", { code, rate: result.rate, source: result.source });
    }
    return Response.json({ success: true, data: result });
  }
  private async handleChatMessage(body: { message: string; model?: string }): Promise<Response> {
    const { message, model } = body;
    if (!this.chatHandler) throw new Error("ChatHandler failure.");
    const rawInput = message?.trim() || "";
    // Phase 13: Auto-CPT Detection & Dynamic Lookup
    const cptMatch = rawInput.match(/\b\d{5}\b/);
    if (cptMatch) {
      const code = cptMatch[0];
      const existing = (this.state.benchmarks || {})[code];
      if (!existing) {
        const lookup = await executeTool('cpt_lookup', { code }) as any;
        if (lookup.rate) {
          const benchmarks = { ...(this.state.benchmarks || {}), [code]: lookup.rate };
          this.setState({ ...this.state, benchmarks });
        }
      }
    }
    const scrubRes = await ForensicScrubber.process(rawInput);
    const cleanInput = scrubRes.scrubbedText;
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler.updateModel(model);
    }
    let bridgeMetadata: any = null;
    const amountMatch = cleanInput.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (cptMatch && amountMatch && this.state.insuranceState) {
      const cpt: Cpt = cptMatch[0];
      const billed: BilledAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      const mergedBenchmarks = { ...STATIC_BENCHMARKS, ...(this.state.benchmarks || {}) };
      const fmvResult = ForensicEngine.calculateFMV(cpt, billed, mergedBenchmarks);
      if (fmvResult.confidence > 0.5) {
        const bridgeRes = ForensicEngine.detectDiscrepancies(this.state.insuranceState, {
          liability_calc: billed,
          fmv_variance: fmvResult.variance,
          confidence_score: fmvResult.confidence,
          code_validation: true,
          strategic_disclaimer: "Bridge validation active."
        });
        if (bridgeRes.hasDiscrepancy) {
          bridgeMetadata = {
            cpt,
            fmv_variance: fmvResult.variance,
            dispute_token: ForensicEngine.generateDisputeToken(fmvResult.variance, true),
            liability_calc: billed
          };
          await this.logAuditEvent("Bridge Discrepancy", bridgeRes.reason || "Policy-Bill mismatch.", bridgeRes.severity, bridgeMetadata);
        }
      }
    }
    const userMessage = createMessage('user', cleanInput);
    this.setState({ ...this.state, messages: [...this.state.messages, userMessage], isProcessing: true });
    try {
      const response = await this.chatHandler.processMessage(cleanInput, this.state.messages, this.state.documents, this.state.insuranceState);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private async handleDocumentUpload(doc: any): Promise<Response> {
    const scrubRes = await ForensicScrubber.process(doc.content || "");
    const newDoc: InsuranceDocument = { ...doc, content: scrubRes.scrubbedText, uploadDate: Date.now(), status: 'active' };
    this.setState({ ...this.state, documents: [...(this.state.documents || []), newDoc], activeDocumentId: newDoc.id, lastContextSync: Date.now() });
    await this.logAuditEvent("Context Bridge Update", `New ${doc.type} integrated.`, "info");
    return Response.json({ success: true, data: this.state });
  }
  private async handleContextSync(body: any): Promise<Response> {
    this.setState({ ...this.state, ...body, lastContextSync: Date.now() });
    return Response.json({ success: true, data: this.state });
  }
  private async handleDocumentDelete(docId: string): Promise<Response> {
    const updatedDocs = (this.state.documents || []).filter(d => d.id !== docId);
    this.setState({ ...this.state, documents: updatedDocs, lastContextSync: Date.now() });
    return Response.json({ success: true, data: this.state });
  }
}