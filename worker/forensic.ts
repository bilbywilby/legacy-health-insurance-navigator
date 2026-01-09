import { Cpt, BilledAmount, InsuranceState, ForensicOutput } from './types';
import { STANDARD_FORENSIC_BASELINE, CRITICAL_OVERCHARGE_THRESHOLD } from './config';
export class ForensicEngine {
  /**
   * Calculates FMV Variance based on benchmark records (Static + Dynamic).
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
   * Detects contradictions between Policy (EOC) and Billing data.
   */
  static detectDiscrepancies(state: InsuranceState, bill: ForensicOutput): {
    hasDiscrepancy: boolean;
    reason?: string;
    severity: 'info' | 'warning' | 'critical';
  } {
    const variance = bill.fmv_variance ?? 0;
    const liability = bill.liability_calc ?? 0;
    if (state.planType === 'PPO' && liability > 500 && variance > 30) {
      return {
        hasDiscrepancy: true,
        reason: "Liability exceeds PPO Network Benefit Schedule limits.",
        severity: 'critical'
      };
    }
    return { hasDiscrepancy: false, severity: 'info' };
  }
  /**
   * Calculates annual spend projections.
   */
  static calculateBurnRate(logs: any[], oopMax: number): { dailyBurn: number, projectedOopDate: number } {
    const validLogs = (logs || []).filter(l => l && l.timestamp);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31).getTime();
    if (validLogs.length < 2) {
      return { dailyBurn: 0, projectedOopDate: endOfYear };
    }
    const sortedLogs = [...validLogs].sort((a, b) => a.timestamp - b.timestamp);
    const firstDate = sortedLogs[0].timestamp;
    const lastDate = sortedLogs[sortedLogs.length - 1].timestamp;
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    const totalSpent = sortedLogs.reduce((acc, log) => acc + (log.metadata?.liability_calc ?? 0), 0);
    const dailyBurn = totalSpent / daysDiff;
    if (dailyBurn <= 0) return { dailyBurn: 0, projectedOopDate: endOfYear };
    const remainingOop = Math.max(0, oopMax - totalSpent);
    const daysToOop = remainingOop / dailyBurn;
    const projectedOopDate = Math.min(endOfYear, Date.now() + (daysToOop * 24 * 60 * 60 * 1000));
    return { dailyBurn, projectedOopDate };
  }
  /**
   * Generates a unique Strategic Dispute Token.
   */
  static generateDisputeToken(variance: number, bridgeFlag: boolean = false): string | null {
    if (variance < 10 && !bridgeFlag) return null;
    let prefix = bridgeFlag ? 'BRIDGE-DS' : (variance >= CRITICAL_OVERCHARGE_THRESHOLD ? 'NAV-DS-CRIT' : 'NAV-DS-STD');
    // Phase 13: Mark as Dynamic if over 20%
    if (variance > 20) prefix = `DYN-${prefix}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${randomSuffix}`;
  }
}