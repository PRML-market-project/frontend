import { create } from 'zustand';

interface VoiceStore {
  isCovered: boolean;
  setIsCovered: (isCovered: boolean) => void;

  isMicOn: boolean;
  startMic: () => void;
  stopMic: () => void;
  startHotwordDetection: () => void;
  stopHotwordDetection: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isCovered: true,
  setIsCovered: (isCovered) => set({ isCovered }),

  isMicOn: false,
  startMic: () => set({ isMicOn: true }),
  stopMic: () => set({ isMicOn: false }),

  startHotwordDetection: () => {},
  stopHotwordDetection: () => {},
}));
