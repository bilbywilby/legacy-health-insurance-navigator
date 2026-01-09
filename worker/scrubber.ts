import { ScrubResponse, ForensicRule } from './types';
export class ForensicScrubber {
  private static SALT = "LEGACY_NAV_V2.2_INTERNAL_SALT";
  private static RULES: ForensicRule[] = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacementLabel: 'SSN', confidenceWeight: 1.0 },
    { pattern: /\b\d{10}\b/g, replacementLabel: 'NPI', confidenceWeight: 0.9 },
    { pattern: /\b[A-Z][0-9][A-Z0-9]\.[A-Z0-9]{1,4}\b/g, replacementLabel: 'ICD10', confidenceWeight: 0.85 },
    { pattern: /\b\d{5}\b/g, replacementLabel: 'CPT_OR_ZIP', confidenceWeight: 0.6 },
    { pattern: /\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g, replacementLabel: 'EMAIL', confidenceWeight: 1.0 },
    { pattern: /\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b/g, replacementLabel: 'PHONE', confidenceWeight: 0.9 },
    { pattern: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g, replacementLabel: 'DOB', confidenceWeight: 0.95 },
    { pattern: /\bMRN-?[A-Z0-9]{6,12}\b/gi, replacementLabel: 'MRN', confidenceWeight: 1.0 },
    { pattern: /\b\d{1,5}\s(?:[A-Z0-9.-]+\s){1,5}(?:STREET|ST|AVE|AVENUE|ROAD|RD|BOULEVARD|BLVD|DRIVE|DR|LANE|LN|WAY)\b/gi, replacementLabel: 'ADDRESS', confidenceWeight: 0.8 },
    { pattern: /\b[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}\b/g, replacementLabel: 'INTERNAL_ID', confidenceWeight: 0.9 }
  ];
  public static CORPUS = [
    "Patient John Doe (DOB 05/12/1984) with MRN-9928341 registered at 123 Main Street, New York, NY 10001.",
    "Claim audit for NPI 1234567890 regarding ICD-10 code E11.9 and CPT 99214.",
    "Contact verified: j.smith@provider.com or call (555) 123-4567. SSN on file: 000-00-0000."
  ];
  private static async hashToken(text: string, salt: string = ForensicScrubber.SALT): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(salt);
    const msgData = encoder.encode(text.toLowerCase());
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `[PSEUDO-${hashHex.substring(0, 10).toUpperCase()}]`;
  }
  static async process(text: string): Promise<ScrubResponse> {
    let scrubbedText = text;
    const tokenMap: Record<string, string> = {};
    let totalDetected = 0;
    let confidenceSum = 0;
    for (const rule of this.RULES) {
      const matches = text.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          const hash = await this.hashToken(match);
          if (!tokenMap[hash]) {
            tokenMap[hash] = rule.replacementLabel;
          }
          scrubbedText = scrubbedText.replace(match, hash);
          totalDetected++;
          confidenceSum += rule.confidenceWeight;
        }
      }
    }
    const averageConfidence = totalDetected > 0 
      ? Math.min(1.0, confidenceSum / totalDetected) 
      : 1.0;
    return {
      scrubbedText,
      tokenMap,
      confidence: averageConfidence
    };
  }
  static async runSelfTest(): Promise<ScrubResponse> {
    const sample = this.CORPUS[Math.floor(Math.random() * this.CORPUS.length)];
    const result = await this.process(sample);
    const passed = Object.keys(result.tokenMap).length > 0;
    return {
      ...result,
      testResults: {
        passed,
        timestamp: Date.now(),
        sampleUsed: sample.substring(0, 20) + "...",
        rulesEvaluated: this.RULES.length
      }
    };
  }
}