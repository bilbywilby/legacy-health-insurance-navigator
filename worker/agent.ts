import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, InsuranceState, InsuranceDocument, AuditEntry } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage } from './utils';
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
  private scrubPII(content: string): string {
    return content
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN-REDACTED]")
      .replace(/\b\d{10,12}\b/g, "[ID-REDACTED]")
      .replace(/\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g, "[EMAIL-REDACTED]")
      .replace(/\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g, "[DOB-REDACTED]")
      .replace(/\b[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}\b/g, "[POLICY-REDACTED]");
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
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    this.setState({ ...this.state, messages: [...this.state.messages, userMessage], isProcessing: true });
    try {
      if (!this.chatHandler) {
        this.chatHandler = new ChatHandler(this.env.CF_AI_BASE_URL, this.env.CF_AI_API_KEY, this.state.model);
      }
      const response = await this.chatHandler.processMessage(
        message,
        this.state.messages,
        this.state.documents,
        this.state.insuranceState
      );
      if (this.state.insuranceState && response.content.includes('$')) {
        const costMatch = response.content.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
        if (costMatch) {
          const rawVal = parseFloat(costMatch[0].replace(/[$,]/g, ''));
          const remainingLimit = this.state.insuranceState.oopMax - this.state.insuranceState.oopUsed;
          if (rawVal > remainingLimit) {
            await this.logAuditEvent("Liability Flag", `Calculated liability ($${rawVal}) exceeds remaining OOP Max ($${remainingLimit}). High-priority review required.`, "critical");
          }
        }
      }
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private async handleDocumentUpload(doc: Omit<InsuranceDocument, 'uploadDate' | 'status'>): Promise<Response> {
    const scrubbedContent = this.scrubPII(doc.content);
    const newDoc: InsuranceDocument = {
      ...doc,
      content: scrubbedContent,
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