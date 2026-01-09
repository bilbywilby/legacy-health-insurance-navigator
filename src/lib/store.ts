import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InsuranceState, InsuranceDocument, AuditEntry, ComplianceLogEntry, SystemMetrics } from '../../worker/types';
interface AppState {
  // Navigation
  activeTab: string;
  isVobOpen: boolean;
  isAppealModalOpen: boolean;
  selectedAuditId: string | null;
  // Insurance State
  insuranceState: InsuranceState;
  documents: InsuranceDocument[];
  auditLogs: AuditEntry[];
  complianceLogs: ComplianceLogEntry[];
  lastSync: number;
  systemMetrics: SystemMetrics;
  // Actions
  setActiveTab: (tab: string) => void;
  setIsVobOpen: (open: boolean) => void;
  openAppealGenerator: (auditId?: string) => void;
  closeAppealGenerator: () => void;
  setInsuranceState: (state: InsuranceState) => void;
  setDocuments: (docs: InsuranceDocument[]) => void;
  updateSystemMetrics: (metrics: Partial<SystemMetrics>) => void;
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
    setStoreState: (payload) => set((state) => {
      Object.assign(state, payload);
    }),
  }))
);