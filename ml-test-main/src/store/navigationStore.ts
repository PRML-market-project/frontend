import { create } from 'zustand';
import { useMenuStore } from './menuStore';

type ViewType = 'menu' | 'orderHistory' | 'map';

interface NavigationState {
  currentCategoryId: number | null;
  currentMenuId: number | null;
  currentCategoryType: string | null;
  currentView: ViewType;
  setCurrentCategory: (categoryId: number | null) => void;
  setCurrentMenu: (menuId: number | null) => void;
  setCurrentCategoryType: (categoryType: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  resetNavigation: () => void;
  initializeCategory: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentCategoryId: null,
  currentMenuId: null,
  currentCategoryType: null,
  currentView: 'menu',

  setCurrentCategory: (categoryId) => set({ currentCategoryId: categoryId }),

  setCurrentMenu: (menuId) => {
    set({ currentMenuId: menuId });

    if (menuId !== null) {
      const timer = setTimeout(() => {
        set({ currentMenuId: null });
      }, 4000);
    }
  },

  setCurrentCategoryType: (categoryType) =>
    set({ currentCategoryType: categoryType }),

  setCurrentView: (view) => set({ currentView: view }),

  resetNavigation: () =>
    set({
      currentCategoryId: null,
      currentMenuId: null,
      currentCategoryType: null,
      currentView: 'menu',
    }),

  initializeCategory: () => {
    // 기본 상태에서는 아무 것도 자동 선택하지 않음
  },
}));

