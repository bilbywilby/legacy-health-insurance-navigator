import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, InsuranceDocument, AuditEntry, ComplianceLogEntry } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage } from './utils';
import { calculateFMV, auditClaim, generateDisputeToken } from './forensic';
import { ForensicScrubber } from './scrubber';
import { ComplianceLogger } from './compliance';
import { executeTool } from './tools';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-1.5-flash',
    documents: [],
    auditLogs: [],
    complianceLogs: [],
    lastContextSync: Date.now(),
    benchmarks: {},
    metrics: {
      worker_latency: 0,
      audit_count: 0,
      scrub_avg_confidence: 0.98
    },
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
    if (!this.chatHandler) {
      this.chatHandler = new ChatHandler(this.env.CF_AI_BASE_URL, this.env.CF_AI_API_KEY, this.state.model);
    }
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') return Response.json({ success: true, data: this.state });
      if (method === 'POST' && url.pathname === '/chat') return this.handleChatMessage(await request.json());
      if (method === 'POST' && url.pathname === '/documents') return this.handleDocumentUpload(await request.json());
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async handleChatMessage(body: { message: string; model?: string }): Promise<Response> {
    const start = Date.now();
    const { message } = body;
    const scrubRes = await ForensicScrubber.process(message);
    const cleanInput = scrubRes.scrubbedText;
    // Detect Forensic Trigger (CPT + Amount)
    const cptMatch = cleanInput.match(/\b\d{5}\b/);
    const amountMatch = cleanInput.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (cptMatch && amountMatch && this.state.insuranceState) {
      const cpt = cptMatch[0];
      const billed = parseFloat(amountMatch[1].replace(/,/g, ''));
      const audit = auditClaim(cpt, billed, this.state.insuranceState, this.state.benchmarks || {});
      const log = await ComplianceLogger.logOperation('CLAIM_AUDIT', { cpt, billed }, audit, audit.risk);
      this.setState({
        ...this.state,
        auditLogs: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          event: "Forensic Audit",
          detail: `CPT ${cpt} at ${billed} detected. Variance: ${audit.variance}%. Risk: ${audit.risk}.`,
          severity: audit.risk === 'HIGH' ? 'critical' : audit.risk === 'MED' ? 'warning' : 'info',
          metadata: audit
        }, ...(this.state.auditLogs || [])],
        complianceLogs: [log, ...(this.state.complianceLogs || [])]
      });
    }
    const userMsg = createMessage('user', cleanInput);
    this.setState({ ...this.state, messages: [...this.state.messages, userMsg], isProcessing: true });
    try {
      const response = await this.chatHandler!.processMessage(cleanInput, this.state.messages, this.state.documents, this.state.insuranceState);
      const assistantMsg = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMsg], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private async handleDocumentUpload(doc: any): Promise<Response> {
    const scrubRes = await ForensicScrubber.process(doc.content || "");
    const newDoc = { ...doc, content: scrubRes.scrubbedText, uploadDate: Date.now(), status: 'active' };
    const log = await ComplianceLogger.logOperation('DOCUMENT_INGEST', { title: doc.title, type: doc.type }, { success: true });
    this.setState({
      ...this.state,
      documents: [...(this.state.documents || []), newDoc],
      complianceLogs: [log, ...(this.state.complianceLogs || [])]
    });
    return Response.json({ success: true, data: this.state });
  }
}