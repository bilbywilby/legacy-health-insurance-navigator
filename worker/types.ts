export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }
export interface WeatherResult {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
}
export interface MCPResult {
  content: string;
}
export interface ErrorResult {
  error: string;
}
export type Cpt = string;
export type BilledAmount = number;
export interface BenchmarkSource {
  url?: string;
  timestamp: number;
  confidence: number;
  provider?: string;
}
export interface ScrubResponse {
  scrubbedText: string;
  tokenMap: Record<string, string>;
  confidence: number;
  testResults?: {
    passed: boolean;
    timestamp: number;
    sampleUsed: string;
    rulesEvaluated: number;
  };
}
export interface ForensicRule {
  pattern: RegExp;
  replacementLabel: string;
  confidenceWeight: number;
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
  metadata?: Record<string, unknown>;
}
export interface SystemMetrics {
  worker_latency: number;
  audit_count: number;
  scrub_avg_confidence: number;
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
  performance?: {
    audit_ms: number;
  };
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
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}