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

  async runTest(): Promise<ApiResponse<ScrubResponse>> {
    try {
      const sessionId = chatService.getSessionId();
      const response = await fetch(`/api/chat/${sessionId}/scrub/test`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Self-test failed' };
    }
  }

  async getCorpusSample(): Promise<string> {
    // Mirroring worker's static corpus for instant UI response
    const samples = [
      "Patient John Doe (DOB 05/12/1984) with MRN-9928341 registered at 123 Main Street, New York, NY 10001.",
      "Claim audit for NPI 1234567890 regarding ICD-10 code E11.9 and CPT 99214.",
      "Contact verified: j.smith@provider.com or call (555) 123-4567. SSN on file: 000-00-0000."
    ];
    return samples[Math.floor(Math.random() * samples.length)];
  }
}
export const scrubService = new ScrubService();