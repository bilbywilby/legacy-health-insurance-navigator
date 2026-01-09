import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, InsuranceState, InsuranceDocument, AuditEntry, Cpt, BilledAmount } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES, CRITICAL_OVERCHARGE_THRESHOLD } from './config';
import { createMessage } from './utils';
import { ForensicEngine } from './forensic';
import { ForensicScrubber } from './scrubber';
// Static CPT Benchmarks based on 2024 Medicare/National Averages
const CPT_BENCHMARKS: Record<string, number> = {
  '99213': 92.00,   // Mid-level office visit
  '99214': 128.00,  // Higher-level office visit
  '72141': 450.00,  // MRI Lumbar Spine w/o contrast
  '80053': 14.50,   // Comprehensive metabolic panel
  '45378': 750.00,  // Colonoscopy
  '90686': 19.00    // Flu vaccine
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
    this.chatHandler = new ChatHandler(
      this.env.CF_AI_BASE_URL,
      this.env.CF_AI_API_KEY,
      this.state.model
    );
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') {
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'POST' && url.pathname === '/chat') {
        return this.handleChatMessage(await request.json());
      }
      if (method === 'POST' && url.pathname === '/context') {
        return this.handleContextSync(await request.json());
      }
      if (method === 'POST' && url.pathname === '/documents') {
        return this.handleDocumentUpload(await request.json());
      }
      if (method === 'DELETE' && url.pathname.startsWith('/documents/')) {
        const docId = url.pathname.split('/').pop();
        if (docId) return this.handleDocumentDelete(docId);
      }
      if (method === 'POST' && url.pathname === '/insurance') {
        return this.handleInsuranceUpdate(await request.json());
      }
      if (method === 'GET' && url.pathname === '/audit') {
        return Response.json({ success: true, data: this.state.auditLogs || [] });
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        this.setState({ ...this.state, messages: [] });
        return Response.json({ success: true, data: this.state });
      }
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('Request error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async logAuditEvent(event: string, detail: string, severity: 'info' | 'warning' | 'critical' = 'info'): Promise<void> {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      event,
      detail,
      severity
    };
    const auditLogs = [entry, ...(this.state.auditLogs || [])].slice(0, 50);
    this.setState({ ...this.state, auditLogs });
    await this.ctx.storage.put(`audit_${entry.id}`, entry);
  }
  private async handleContextSync(body: { insuranceState?: Partial<InsuranceState>; documents?: InsuranceDocument[] }): Promise<Response> {
    const newState = {
      ...this.state,
      lastContextSync: Date.now(),
      insuranceState: body.insuranceState ? { ...this.state.insuranceState, ...body.insuranceState } : this.state.insuranceState,
      documents: body.documents || this.state.documents
    } as ChatState;
    this.setState(newState);
    await this.logAuditEvent("Context Sync", "External financial state and document registry updated.", "info");
    return Response.json({ success: true, data: this.state });
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model } = body;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    
    // Centralized Forensic Scrubbing
    const scrubRes = await ForensicScrubber.process(message.trim());
    const cleanInput = scrubRes.scrubbedText;
    
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    
    if (scrubRes.confidence < 1.0) {
      await this.logAuditEvent("Forensic De-identification", `Scrubbed ${Object.keys(scrubRes.tokenMap).length} tokens. Confidence: ${scrubRes.confidence}`, "info");
    }

    // Detect CPT and Amount for FMV Check
    const cptMatch = message.match(/\b\d{5}\b/);
    const amountMatch = cleanInput.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (cptMatch && amountMatch) {
      const cpt: Cpt = cptMatch[0];
      const billed: BilledAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      const fmvResult = ForensicEngine.calculateFMV(cpt, billed, CPT_BENCHMARKS);
      if (fmvResult.variance >= CRITICAL_OVERCHARGE_THRESHOLD) {
        await this.logAuditEvent(
          "Critical FMV Flag", 
          `CPT ${cpt} at ${billed} shows ${fmvResult.variance}% variance from FMV baseline of ${fmvResult.baseline}.`, 
          "critical"
        );
      }
    }
    const userMessage = createMessage('user', cleanInput);
    this.setState({ ...this.state, messages: [...this.state.messages, userMessage], isProcessing: true });
    try {
      if (!this.chatHandler) {
        this.chatHandler = new ChatHandler(this.env.CF_AI_BASE_URL, this.env.CF_AI_API_KEY, this.state.model);
      }
      const response = await this.chatHandler.processMessage(
        cleanInput,
        this.state.messages,
        this.state.documents,
        this.state.insuranceState
      );
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private async handleDocumentUpload(doc: Omit<InsuranceDocument, 'uploadDate' | 'status'>): Promise<Response> {
    const scrubRes = await ForensicScrubber.process(doc.content);
    const newDoc: InsuranceDocument = {
      ...doc,
      content: scrubRes.scrubbedText,
      uploadDate: Date.now(),
      status: 'active'
    };
    const updatedDocs = [...(this.state.documents || []), newDoc];
    this.setState({
      ...this.state,
      documents: updatedDocs,
      activeDocumentId: newDoc.id
    });
    await this.logAuditEvent("Document Registered", `New ${doc.type} added with PII Scrubbing active.`, "info");
    return Response.json({ success: true, data: this.state });
  }
  private async handleDocumentDelete(docId: string): Promise<Response> {
    const updatedDocs = (this.state.documents || []).filter(d => d.id !== docId);
    this.setState({
      ...this.state,
      documents: updatedDocs,
      activeDocumentId: this.state.activeDocumentId === docId ? undefined : this.state.activeDocumentId
    });
    await this.logAuditEvent("Document Removed", `Record ${docId} purged from session context.`, "info");
    return Response.json({ success: true, data: this.state });
  }
  private async handleInsuranceUpdate(body: Partial<InsuranceState>): Promise<Response> {
    if (!this.state.insuranceState) return Response.json({ success: false }, { status: 400 });
    const newState: InsuranceState = { ...this.state.insuranceState, ...body };
    this.setState({ ...this.state, insuranceState: newState });
    await this.logAuditEvent("Plan Update", "YTD financial metrics manually adjusted.", "info");
    return Response.json({ success: true, data: this.state });
  }
}