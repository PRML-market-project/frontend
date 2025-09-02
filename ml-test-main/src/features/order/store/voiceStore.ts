import { create } from 'zustand';

interface VoiceStore {
  isCovered: boolean;
  setIsCovered: (isCovered: boolean) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isCovered: true,
  setIsCovered: (isCovered) => set({ isCovered }),
}));
