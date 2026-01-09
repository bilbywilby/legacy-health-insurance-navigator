export type ApiResponse<T = unknown> = { success: boolean; data?: T; error?: string; };
export type FinancialPhase = 'PRE_SERVICE' | 'POST_SERVICE' | 'DISPUTE' | 'RESOLVED';
export type Cpt = string;
export type BilledAmount = number;
export enum AuditResultTag {
  UNBUNDLED = 'UNBUNDLED',
  OVERCHARGE = 'OVERCHARGE',
  NSA_PROTECTED = 'NSA_PROTECTED',
  FMV_MATCH = 'FMV_MATCH'
}
export type RiskLevel = 'LOW' | 'MED' | 'HIGH';
export interface WeatherResult {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
}
export interface ErrorResult {
  error: string;
}
export interface ScrubResponse {
  scrubbedText: string;
  tokenMap: Record<string, string>;
  confidence: number;
}
export interface ForensicRule {
  pattern: RegExp;
  replacementLabel: string;
  confidenceWeight: number;
}
export interface BenchmarkSource {
  url?: string;
  timestamp: number;
  confidence: number;
  provider?: string;
}
export interface ComplianceLogEntry {
  id: string;
  timestamp: number;
  operation: string;
  args_hash: string;
  outcome_hash: string;
  risk_level: RiskLevel;
  metadata: Record<string, unknown>;
}
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  id: string;
  toolCalls?: ToolCall[];
}
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}
export type InsuranceDocumentType = 'SBC' | 'EOC' | 'EOB' | 'FORMULARY' | 'BILL';
export interface InsuranceDocument {
  id: string;
  title: string;
  content: string;
  type: InsuranceDocumentType;
  uploadDate: number;
  status: 'parsing' | 'active' | 'verified';
}
export interface InsuranceState {
  deductibleTotal: number;
  deductibleUsed: number;
  oopMax: number;
  oopUsed: number;
  planType?: 'PPO' | 'HMO' | 'HDHP' | 'EPO';
  networkStatus?: 'Preferred' | 'In-Network' | 'Out-of-Network';
}
export interface AuditEntry {
  id: string;
  timestamp: number;
  event: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: any;
}
export interface BridgeStatus {
  service: string;
  latency: number;
  status: 'UP' | 'DOWN' | 'DEGRADED';
}
export interface SystemMetrics {
  worker_latency: number;
  audit_count: number;
  scrub_avg_confidence: number;
  bridge_status?: BridgeStatus[];
}
export interface ForensicOutput {
  liability_calc: number;
  confidence_score: number;
  code_validation: boolean;
  strategic_disclaimer: string;
  fmv_variance?: number;
  dispute_token?: string | null;
  is_overcharge?: boolean;
  benchmark_source?: BenchmarkSource;
  compliance_hash?: string;
  risk_level?: RiskLevel;
  performance?: {
    audit_ms: number;
  };
}
export interface AuditState {
  claimId: string;
  phase: FinancialPhase;
  tag: AuditResultTag;
  risk: RiskLevel;
  variance: number;
  timestamp: number;
}
export interface ChatState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  streamingMessage?: string;
  insuranceState?: InsuranceState;
  documents: InsuranceDocument[];
  activeDocumentId?: string;
  auditLogs?: AuditEntry[];
  complianceLogs?: ComplianceLogEntry[];
  lastContextSync?: number;
  benchmarks?: Record<string, number>;
  metrics?: SystemMetrics;
}
export interface SessionInfo {
  id: string;
  title: string;
  createdAt: number;
  lastActive: number;
}