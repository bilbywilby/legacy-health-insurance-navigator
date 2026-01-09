import type { InsuranceState, InsuranceDocumentType } from '../../worker/types';
export interface LegacyTemplate {
  id: string;
  title: string;
  type: InsuranceDocumentType;
  description: string;
  content: string;
}
export const getLegacyTemplates = (state?: InsuranceState): LegacyTemplate[] => [
  {
    id: 'ytd-tracker',
    title: 'YTD Financial Status Tracker',
    type: 'EOC',
    description: 'A markdown table summarizing current plan usage and limits.',
    content: `## Plan Status Tracker
| Metric | Current Value | Plan Limit | Status |
| :--- | :--- | :--- | :--- |
| **Individual Deductible** | $${state?.deductibleUsed?.toLocaleString() ?? '1,350'} | $${state?.deductibleTotal?.toLocaleString() ?? '3,000'} | ${((state?.deductibleUsed ?? 0) / (state?.deductibleTotal ?? 1) * 100).toFixed(0)}% Met |
| **Out-of-Pocket Max** | $${state?.oopUsed?.toLocaleString() ?? '2,100'} | $${state?.oopMax?.toLocaleString() ?? '6,500'} | ${((state?.oopUsed ?? 0) / (state?.oopMax ?? 1) * 100).toFixed(0)}% Met |
| **Last Updated** | ${new Date().toLocaleDateString()} | - | Active |
**Notes:** Current data pulled from claim audit log.`
  },
  {
    id: 'provider-whitelist',
    title: 'Provider & Facility Whitelist',
    type: 'SBC',
    description: 'A reference grid for NPIs, names, and verified network status.',
    content: `## Verified Network Whitelist
| Provider Name | NPI / Tax ID | Network Tier | Verification Date |
| :--- | :--- | :--- | :--- |
| St. Jude Memorial | 1294821092 | Tier 1 (Preferred) | 2024-01-15 |
| Dr. Jane Smith (PC) | 9938410221 | Tier 1 (Preferred) | 2024-02-10 |
| LabCorp | 1002938121 | In-Network | 2024-01-05 |
**Status:** All entries verified via VOB script.`
  },
  {
    id: 'medical-event-log',
    title: 'Medical Event & Claim Log',
    type: 'BILL',
    description: 'An audit trail for CPT codes, claim statuses, and forensic flags.',
    content: `## Audit Trail: Event Log
| Date | Procedure / CPT | Provider | Status | Forensic Flag |
| :--- | :--- | :--- | :--- | :--- |
| 2024-02-15 | 99213 (Office Visit) | Dr. Smith | Paid | OK |
| 2024-03-01 | 72141 (MRI Lumbar) | Imaging Ctr | Processing | Potential Unbundling |
| 2024-03-10 | 80053 (Bloodwork) | LabCorp | Denied | Duplicate Billing |
**Forensic Notes:** Claim 72141 requires review of unbundling errors.`
  }
];