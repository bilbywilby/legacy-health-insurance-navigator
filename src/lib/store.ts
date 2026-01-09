import { create } from 'zustand';
import { chatService } from '@/lib/chat';
import type { InsuranceState, InsuranceDocument, AuditEntry } from '../../worker/types';
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
  lastSync: number;
  // Actions
  setActiveTab: (tab: string) => void;
  setIsVobOpen: (open: boolean) => void;
  openAppealGenerator: (auditId?: string) => void;
  closeAppealGenerator: () => void;
  setInsuranceState: (state: InsuranceState) => void;
  setDocuments: (docs: InsuranceDocument[]) => void;
}
export const useAppStore = create<AppState>((set) => ({
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
  lastSync: Date.now(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsVobOpen: (open) => set({ isVobOpen: open }),
  openAppealGenerator: (auditId) => set({ isAppealModalOpen: true, selectedAuditId: auditId || null }),
  closeAppealGenerator: () => set({ isAppealModalOpen: false, selectedAuditId: null }),
  setInsuranceState: (insuranceState) => set({ insuranceState }),
  setDocuments: (documents) => set({ documents }),
}));