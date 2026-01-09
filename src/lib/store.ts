import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InsuranceState, InsuranceDocument, AuditEntry, ComplianceLogEntry, SystemMetrics, BridgeStatus } from '../../worker/types';
interface TickerEvent {
  id: string;
  type: 'AUDIT' | 'COMPLIANCE' | 'SYNC';
  label: string;
  timestamp: number;
}
interface AppState {
  activeTab: string;
  isVobOpen: boolean;
  isAppealModalOpen: boolean;
  selectedAuditId: string | null;
  insuranceState: InsuranceState;
  documents: InsuranceDocument[];
  auditLogs: AuditEntry[];
  complianceLogs: ComplianceLogEntry[];
  bridgeStatus: BridgeStatus[];
  liveTicker: TickerEvent[];
  lastSync: number;
  systemMetrics: SystemMetrics;
  setActiveTab: (tab: string) => void;
  setIsVobOpen: (open: boolean) => void;
  openAppealGenerator: (auditId?: string) => void;
  closeAppealGenerator: () => void;
  setInsuranceState: (state: InsuranceState) => void;
  setDocuments: (docs: InsuranceDocument[]) => void;
  updateSystemMetrics: (metrics: Partial<SystemMetrics>) => void;
  pushTickerEvent: (event: Omit<TickerEvent, 'id' | 'timestamp'>) => void;
  setStoreState: (payload: Partial<AppState>) => void;
}
export const useAppStore = create<AppState>()(
  immer((set) => ({
    activeTab: 'dashboard',
    isVobOpen: false,
    isAppealModalOpen: false,
    selectedAuditId: null,
    insuranceState: {
      deductibleTotal: 3000,
      deductibleUsed: 1350,
      oopMax: 6500,
      oopUsed: 2100,
      planType: 'PPO',
      networkStatus: 'In-Network'
    },
    documents: [],
    auditLogs: [],
    complianceLogs: [],
    bridgeStatus: [],
    liveTicker: [],
    lastSync: Date.now(),
    systemMetrics: {
      worker_latency: 0,
      audit_count: 0,
      scrub_avg_confidence: 0.98,
    },
    setActiveTab: (tab) => set((state) => { state.activeTab = tab; }),
    setIsVobOpen: (open) => set((state) => { state.isVobOpen = open; }),
    openAppealGenerator: (auditId) => set((state) => {
      state.isAppealModalOpen = true;
      state.selectedAuditId = auditId || null;
    }),
    closeAppealGenerator: () => set((state) => {
      state.isAppealModalOpen = false;
      state.selectedAuditId = null;
    }),
    setInsuranceState: (insuranceState) => set((state) => {
      state.insuranceState = insuranceState;
    }),
    setDocuments: (documents) => set((state) => {
      state.documents = documents;
    }),
    updateSystemMetrics: (metrics) => set((state) => {
      state.systemMetrics = { ...state.systemMetrics, ...metrics };
    }),
    pushTickerEvent: (event) => set((state) => {
      const newEvent = { ...event, id: crypto.randomUUID(), timestamp: Date.now() };
      state.liveTicker = [newEvent, ...state.liveTicker].slice(0, 15);
    }),
    setStoreState: (payload) => set((state) => {
      Object.assign(state, payload);
    }),
  }))
);