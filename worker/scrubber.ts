import { ScrubResponse } from './types';
export class ForensicScrubber {
  private static PII_PATTERNS = {
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    NPI: /\b\d{10}\b/g,
    EMAIL: /\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g,
    DOB: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
    PHONE: /\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b/g,
    POLICY: /\b[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}\b/g,
    ADDRESS: /\b\d{1,5}\s(?:[A-Z0-9.-]+\s){1,5}(?:STREET|ST|AVE|AVENUE|ROAD|RD|BOULEVARD|BLVD|DRIVE|DR|LANE|LN|WAY)\b/gi
  };
  /**
   * Deterministic hashing for PII tokens using SHA-256 via Web Crypto API.
   * This ensures the same PII string results in the same hash within a session context.
   */
  private static async hashToken(text: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(text.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `[HASH-${hashHex.substring(0, 12).toUpperCase()}]`;
  }
  /**
   * Processes text to identify and replace PII with deterministic hash tokens.
   */
  static async process(text: string): Promise<ScrubResponse> {
    let scrubbedText = text;
    const tokenMap: Record<string, string> = {};
    let matchCount = 0;
    // Iterate through all PII patterns
    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const hash = await this.hashToken(match);
          if (!tokenMap[hash]) {
            tokenMap[hash] = `REDACTED_${type}`; // Mapping to category for forensic structure
          }
          scrubbedText = scrubbedText.replace(match, hash);
          matchCount++;
        }
      }
    }
    // Confidence score based on detection density
    const confidence = text.length > 0 ? Math.min(1.0, 1.0 - (matchCount / (text.split(' ').length || 1))) : 1.0;
    return {
      scrubbedText,
      tokenMap,
      confidence
    };
  }
}