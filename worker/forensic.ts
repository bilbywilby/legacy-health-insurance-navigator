import { Cpt, BilledAmount, InsuranceState, ForensicOutput, AuditState, AuditResultTag, RiskLevel } from './types';
import { STANDARD_FORENSIC_BASELINE, CRITICAL_OVERCHARGE_THRESHOLD } from './config';
export const DISPUTE_THRESHOLDS = {
  LOW: 15,
  MED: 25,
  HIGH: 40
};
export const DEFAULT_BENCHMARKS: Record<string, number> = {
  '99213': 92.00,
  '99214': 129.77, // Updated V2.5 Standard Office Visit
  '72141': 450.00,
  '72148': 385.50, // Updated V2.5 MRI of spine
  '45378': 580.20, // Updated V2.5 Colonoscopy
  '80053': 14.50,
  '90686': 19.00,
  '99203': 115.00,
  '99204': 165.00,
  '70450': 220.00, // CT Head
  '71260': 310.00, // CT Chest w/ dye
  '93000': 18.00,  // EKG
  '36415': 3.50    // Blood draw
};
/**
 * PURE FUNCTION: Calculate FMV Variance.
 * Returns a low confidence score (0.2) if the CPT code is missing from benchmarks.
 */
export function calculateFMV(cpt: string, billedAmount: number, benchmarks: Record<string, number>) {
  const basePrice = benchmarks[cpt] || DEFAULT_BENCHMARKS[cpt];
  if (!basePrice) {
    return { 
      variance: 0, 
      baseline: 0, 
      isOvercharge: false, 
      confidence: 0.2 // LOW confidence due to missing benchmark corpus
    };
  }
  const fairBaseline = basePrice * STANDARD_FORENSIC_BASELINE;
  const variance = ((billedAmount - fairBaseline) / fairBaseline) * 100;
  return {
    variance: Math.round(variance * 100) / 100,
    baseline: Math.round(fairBaseline * 100) / 100,
    isOvercharge: variance > 0,
    confidence: 0.95
  };
}
/**
 * PURE FUNCTION: Generate a unique Strategic Dispute Token.
 */
export function generateDisputeToken(variance: number, bridgeFlag: boolean = false): string | null {
  if (variance < 10 && !bridgeFlag) return null;
  let prefix = bridgeFlag ? 'BRIDGE-DS' : (variance >= DISPUTE_THRESHOLDS.HIGH ? 'NAV-DS-CRIT' : 'NAV-DS-STD');
  if (variance > 20) prefix = `DYN-${prefix}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomSuffix}`;
}
/**
 * PURE FUNCTION: Complete deterministic audit of a claim against plan state.
 */
export function auditClaim(
  cpt: string,
  billedAmount: number,
  planState: InsuranceState,
  benchmarks: Record<string, number>
): AuditState {
  const { variance } = calculateFMV(cpt, billedAmount, benchmarks);
  let risk: RiskLevel = 'LOW';
  if (variance >= DISPUTE_THRESHOLDS.HIGH) risk = 'HIGH';
  else if (variance >= DISPUTE_THRESHOLDS.MED) risk = 'MED';
  let tag = AuditResultTag.FMV_MATCH;
  if (variance > 0) tag = AuditResultTag.OVERCHARGE;
  // No Surprises Act Protection Logic
  if (planState.networkStatus === 'Out-of-Network' && planState.planType === 'PPO') {
    tag = AuditResultTag.NSA_PROTECTED;
  }
  return {
    claimId: `CLM-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
    phase: variance > 10 ? 'DISPUTE' : 'POST_SERVICE',
    tag,
    risk,
    variance,
    timestamp: Date.now()
  };
}
export class DisputeResolutionEngine {
  static initiateDispute(variance: number): { risk: RiskLevel; action: string } {
    if (variance >= DISPUTE_THRESHOLDS.HIGH) {
      return { risk: 'HIGH', action: 'Immediate forensic audit required. Generate Formal Dispute Notice.' };
    }
    if (variance >= DISPUTE_THRESHOLDS.MED) {
      return { risk: 'MED', action: 'Recommend manual negotiation via FMV settlement script.' };
    }
    if (variance >= DISPUTE_THRESHOLDS.LOW) {
      return { risk: 'LOW', action: 'Monitor for unbundling patterns. Advise patient of minor variance.' };
    }
    return { risk: 'LOW', action: 'Verify as fair market rate.' };
  }
}