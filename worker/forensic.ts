import { Cpt, BilledAmount } from './types';
import { STANDARD_FORENSIC_BASELINE, CRITICAL_OVERCHARGE_THRESHOLD } from './config';
export class ForensicEngine {
  /**
   * Calculates FMV Variance based on benchmark records.
   * Returns a percentage variance from the fair market baseline.
   */
  static calculateFMV(cpt: Cpt, billedAmount: BilledAmount, benchmarks: Record<string, number>): {
    variance: number;
    baseline: number;
    isOvercharge: boolean;
    confidence: number;
  } {
    try {
      const basePrice = benchmarks[cpt];
      if (!basePrice) {
        return { variance: 0, baseline: 0, isOvercharge: false, confidence: 0.2 };
      }
      const fairBaseline = basePrice * STANDARD_FORENSIC_BASELINE;
      const variance = ((billedAmount - fairBaseline) / fairBaseline) * 100;
      return {
        variance: Math.round(variance * 100) / 100,
        baseline: Math.round(fairBaseline * 100) / 100,
        isOvercharge: variance > 0,
        confidence: 0.95
      };
    } catch (error) {
      console.error("[Forensic Engine] FMV Calculation Failed:", error);
      return { variance: 0, baseline: 0, isOvercharge: false, confidence: 0 };
    }
  }
  /**
   * Generates a unique Strategic Dispute Token for tracking disputes.
   */
  static generateDisputeToken(variance: number): string | null {
    if (variance < 10) return null;
    const prefix = variance >= CRITICAL_OVERCHARGE_THRESHOLD ? 'NAV-DS-CRIT' : 'NAV-DS-STD';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${randomSuffix}`;
  }
}