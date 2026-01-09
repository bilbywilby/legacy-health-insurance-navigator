import { chatService } from './chat';
import type { ScrubResponse, ApiResponse } from '../../worker/types';
class ScrubService {
  async scrubText(text: string): Promise<ApiResponse<ScrubResponse>> {
    try {
      const sessionId = chatService.getSessionId();
      const response = await fetch(`/api/chat/${sessionId}/scrub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Frontend scrub request failed:', error);
      return { success: false, error: 'Failed to reach de-identification engine' };
    }
  }
}
export const scrubService = new ScrubService();