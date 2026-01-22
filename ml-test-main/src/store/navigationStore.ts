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
  highlightedCategoryIds: number[]; // ✅ 여러 가게 깜빡임용 배열 추가
  setHighlightedCategoryIds: (ids: number[]) => void;

}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentCategoryId: null,
  currentMenuId: null,
  currentCategoryType: null,
  currentView: 'menu',
  highlightedCategoryIds: [], // ✅ 여러 가게 강조 상태 추가

  setCurrentCategory: (categoryId) => set({ currentCategoryId: categoryId }),

  // 메뉴 깜빡임 (타이머 제거하여 탭 이동 전까지 유지)
  setCurrentMenu: (menuId) => set({ currentMenuId: menuId }),

  // ✅ 여러 가게 깜빡임 설정 함수
  setHighlightedCategoryIds: (ids) => set({ highlightedCategoryIds: ids }),

  setCurrentCategoryType: (categoryType) =>
    set({ currentCategoryType: categoryType }),

  // ✅ 핵심: 다른 동작(탭 이동) 시 모든 깜빡임 효과 제거
  setCurrentView: (view) => set({
    currentView: view,
    currentMenuId: null,           // 메뉴 깜빡임 해제
    highlightedCategoryIds: []     // 가게 리스트 깜빡임 해제
  }),

  resetNavigation: () =>
    set({
      currentCategoryId: null,
      currentMenuId: null,
      currentCategoryType: null,
      highlightedCategoryIds: [], // 초기화 시 해제
      currentView: 'menu',
    }),

  initializeCategory: () => {},
}));
