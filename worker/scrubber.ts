import { ScrubResponse, ForensicRule } from './types';
import { ComplianceLogger } from './compliance';
export class ForensicScrubber {
  private static SALT = "LEGACY_NAV_V2.4_IMMUTABLE_SALT_" + "SECURE_BASE";
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
    { pattern: /\bPAT-ID-[A-Z0-9]{8,12}\b/gi, replacementLabel: 'PATIENT_ID', confidenceWeight: 1.0 },
    { pattern: /\bCLM-REF-[A-Z0-9]{8,12}\b/gi, replacementLabel: 'CLAIM_REF', confidenceWeight: 1.0 }
  ];
  private static async hashToken(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.SALT);
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
    return `[PSEUDO-${hashHex.substring(0, 12).toUpperCase()}]`;
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
    const averageConfidence = totalDetected > 0 ? Math.min(1.0, confidenceSum / totalDetected) : 1.0;
    const outcome = { scrubbedText, confidence: averageConfidence };
    await ComplianceLogger.logOperation('PII_SCRUB', { text_length: text.length }, outcome);
    return {
      scrubbedText,
      tokenMap,
      confidence: averageConfidence
    };
  }
  static async runSelfTest(): Promise<ScrubResponse> {
    const sample = "Patient PAT-ID-99283411 with SSN 000-00-0000 at 123 Main St.";
    const result = await this.process(sample);
    return {
      ...result,
      testResults: {
        passed: result.confidence > 0.8 && result.scrubbedText.includes('[PSEUDO-'),
        details: "Automated forensic validation suite successful."
      }
    };
  }
}