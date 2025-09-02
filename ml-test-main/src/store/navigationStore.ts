import { create } from 'zustand';
import { useMenuStore } from './menuStore';

type ViewType = 'menu' | 'orderHistory';

interface NavigationState {
  currentCategoryId: number | null;
  currentMenuId: number | null;
  currentView: ViewType;
  setCurrentCategory: (categoryId: number | null) => void;
  setCurrentMenu: (menuId: number | null) => void;
  setCurrentView: (view: ViewType) => void;
  resetNavigation: () => void;
  initializeCategory: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentCategoryId: null,
  currentMenuId: null,
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

  setCurrentView: (view) => set({ currentView: view }),

  resetNavigation: () =>
    set({
      currentCategoryId: null,
      currentMenuId: null,
      currentView: 'menu',
    }),

  initializeCategory: () => {
    const { categories } = useMenuStore.getState();
    if (categories.length > 0 && get().currentCategoryId === null) {
      set({ currentCategoryId: categories[0].categoryId });
    }
  },
}));
