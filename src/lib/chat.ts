import type { Message, ChatState, InsuranceDocument, InsuranceState, AuditEntry, ForensicOutput, Cpt } from '../../worker/types';
import { useAppStore } from './store';
import { perfMonitor } from './perf';
export const MODELS = [
  { id: 'google-ai-studio/gemini-1.5-flash', name: 'Gemini 1.5 Flash (Speed)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (Reasoning)' },
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Logic)' }
];
export interface ChatResponse {
  success: boolean;
  data?: ChatState & { forensicData?: ForensicOutput; rate?: number; source?: string };
  error?: string;
}
const SESSION_KEY = 'legacy_session_id';
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    const saved = localStorage.getItem(SESSION_KEY);
    this.sessionId = saved || crypto.randomUUID();
    if (!saved) localStorage.setItem(SESSION_KEY, this.sessionId);
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async lookupCpt(code: string, state?: string): Promise<ChatResponse> {
    return perfMonitor.track('lookup', async () => {
      try {
        const response = await fetch(`${this.baseUrl}/cpt-lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: 'CPT Lookup failed' };
      }
    });
  }
  async syncContext(state: Partial<InsuranceState>, documents?: InsuranceDocument[]): Promise<ChatResponse> {
    return perfMonitor.track('sync', async () => {
      try {
        const response = await fetch(`${this.baseUrl}/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insuranceState: state, documents }),
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: 'Context sync failed' };
      }
    });
  }
  async sendMessage(message: string, model?: string): Promise<ChatResponse> {
    return perfMonitor.track('audit', async () => {
      try {
        const response = await fetch(`${this.baseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, model }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success && data.data?.messages) {
          const lastMsg = data.data.messages[data.data.messages.length - 1];
          if (lastMsg?.role === 'assistant') {
            const match = lastMsg.content.match(/<forensic_data>([\s\S]*?)<\/forensic_data>/m);
            if (match) {
              try {
                let cleanedJson = match[1].trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
                data.data.forensicData = JSON.parse(cleanedJson);
              } catch (e) {
                console.warn("Forensic JSON Parsing Failed", e);
              }
            }
          }
        }
        return data;
      } catch (error) {
        return { success: false, error: 'Failed to send message' };
      }
    });
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
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to load messages' };
    }
  }
  getSessionId(): string { return this.sessionId; }
}
export const chatService = new ChatService();