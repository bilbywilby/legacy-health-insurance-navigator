export const API_RESPONSES = {
  MISSING_MESSAGE: 'Message required',
  INVALID_MODEL: 'Invalid model',
  PROCESSING_ERROR: 'Failed to process message',
  NOT_FOUND: 'Not Found',
  AGENT_ROUTING_FAILED: 'Agent routing failed',
  INTERNAL_ERROR: 'Internal Server Error'
} as const;
/**
 * FORENSIC V2.1 CONSTANTS
 */
export const STANDARD_FORENSIC_BASELINE = 1.4; // 140% of Medicare/Bench
export const CRITICAL_OVERCHARGE_THRESHOLD = 40; // 40% variance trigger
export const FMV_STRIKE_ZONE = {
  MIN: -10, // Underpriced
  MAX: 15   // Acceptable variance
};