import { create } from 'zustand';
interface AppState {
  activeTab: string;
  isVobOpen: boolean;
  setActiveTab: (tab: string) => void;
  setIsVobOpen: (open: boolean) => void;
}
export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  isVobOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsVobOpen: (open) => set({ isVobOpen: open }),
}));