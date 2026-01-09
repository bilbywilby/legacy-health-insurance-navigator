import type { Message, ChatState, ToolCall, SessionInfo, InsuranceDocument, InsuranceState, AuditEntry, ForensicOutput } from '../../worker/types';
export interface ChatResponse {
  success: boolean;
  data?: ChatState & { forensicData?: ForensicOutput };
  error?: string;
}
export const MODELS = [
  { id: 'google-ai-studio/gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'google-ai-studio/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'google-ai-studio/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
];
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async syncContext(state: Partial<InsuranceState>, documents?: InsuranceDocument[]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insuranceState: state, documents }),
      });
      return await response.json();
    } catch (error) {
      console.error('Context sync error:', error);
      return { success: false, error: 'Context sync failed' };
    }
  }
  async getAuditLogs(): Promise<{ success: boolean; data?: AuditEntry[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/audit`);
      return await response.json();
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      return { success: false };
    }
  }
  async sendMessage(
    message: string,
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.data?.messages) {
        const lastMsg = data.data.messages[data.data.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          const match = lastMsg.content.match(/<forensic_data>([\s\S]*?)<\/forensic_data>/m);
          if (match) {
            try {
              data.data.forensicData = JSON.parse(match[1]);
            } catch (e) {
              console.warn("Forensic JSON Parsing Failed:", e, match[1]);
            }
          }
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }
  async addDocument(doc: Omit<InsuranceDocument, 'uploadDate' | 'status'>): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to upload document' };
    }
  }
  async deleteDocument(id: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete document' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to load messages' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to clear messages' };
    }
  }
  getSessionId(): string { return this.sessionId; }
  newSession(): void {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.baseUrl = `/api/chat/${sessionId}`;
  }
}
export const chatService = new ChatService();