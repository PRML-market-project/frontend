import { create } from 'zustand';

interface MapState {
  selectedShopId: string | null;
  isNavigationActive: boolean;

  // 액션
  selectShop: (id: string | null) => void;
  setNavigation: (isActive: boolean) => void;
  selectAndNavigate: (id: string) => void; // 한 번에 선택+길안내
  resetMap: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedShopId: null,
  isNavigationActive: false,

  selectShop: (id) => set({ selectedShopId: id, isNavigationActive: false }),
  setNavigation: (isActive) => set({ isNavigationActive: isActive }),

  // GPT가 호출할 함수: 가게 선택 후 바로 길안내 켜기
  selectAndNavigate: (id) => set({ selectedShopId: id, isNavigationActive: true }),

  resetMap: () => set({ selectedShopId: null, isNavigationActive: false }),
}));