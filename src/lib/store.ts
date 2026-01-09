import { create } from 'zustand';
import { chatService } from '@/lib/chat';
import type { InsuranceState, InsuranceDocument, AuditEntry } from '../../worker/types';
interface AppState {
  // Navigation
  activeTab: string;
  isVobOpen: boolean;
  // Insurance State
  insuranceState: InsuranceState;
  documents: InsuranceDocument[];
  auditLogs: AuditEntry[];
  lastSync: number;
  // Actions
  setActiveTab: (tab: string) => void;
  setIsVobOpen: (open: boolean) => void;
  setInsuranceState: (state: InsuranceState) => void;
  setDocuments: (docs: InsuranceDocument[]) => void;
}
export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  isVobOpen: false,
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
  setInsuranceState: (insuranceState) => set({ insuranceState }),
  setDocuments: (documents) => set({ documents }),
}));