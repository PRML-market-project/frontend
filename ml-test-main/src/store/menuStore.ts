import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Menu, Category, MenuResponse } from '../types/menu';
import { useNavigationStore } from './navigationStore';
// mock 데이터 임포트
import { mockCategories } from '../mock/categories';
import { mockMenuItems } from '../mock/menuItems';

// `Menu`와 `Category` 타입 재정의 (mock 데이터와 일치하도록)
// 실제 프로젝트에서는 백엔드 API 응답과 mock 데이터의 타입이 일치하는지 확인해야 합니다.
type LocalMenu = {
  menu_id: number;
  category_id: number;
  menu_name: string;
  menu_price: number;
  menu_img_url: string;
};

type LocalCategory = {
  category_id: number;
  category_name: string;
  category_name_en: string;
  menus: LocalMenu[];
};

interface MenuState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchMenusByCategory: (kioskId: number) => Promise<void>;
  getMenusByCategory: (categoryId: number) => Menu[];
  getCategoryById: (categoryId: number) => Category | undefined;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      fetchMenusByCategory: async (kioskId: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/kiosk/${kioskId}/menu-by-category`
          );

          if (!response.ok) {
            // API 요청 실패 시 에러를 던져 catch 블록으로 이동
            throw new Error('API request failed');
          }
          const data: MenuResponse = await response.json();

          // Filter out the "전체" category
          const filteredCategories = data.filter(
            (category) => category.categoryName !== '전체'
          );

          set({
            categories: filteredCategories,
            isLoading: false,
          });

          // Set the first category as selected if there are categories
          if (filteredCategories.length > 0) {
            useNavigationStore
              .getState()
              .setCurrentCategory(filteredCategories[0].categoryId);
          }
        } catch (error) {
          console.error('Failed to fetch menus from API, using mock data:', error);
          // API 통신 실패 시, 로컬 목업 데이터 사용
          const combinedMockData = mockCategories.map(category => {
            const menus = mockMenuItems
              .filter(menu => menu.category_id === category.category_id)
              .map(menu => ({
                menuId: menu.menu_id,
                menuName: menu.menu_name,
                menuNameEn: menu.menu_name_en,
                menuPrice: menu.menu_price,
                menuImgUrl: menu.menu_img_url,
                categoryId: menu.category_id,
              }));
            return {
              categoryId: category.category_id,
              categoryName: category.category_name,
              categoryNameEn: category.category_name_en, // 'Category' 타입에 필요한 속성 추가
              menus: menus,
            };
          });

          set({
            categories: combinedMockData as Category[],
            isLoading: false,
            error: null,
          });

          if (combinedMockData.length > 0) {
            useNavigationStore
              .getState()
              .setCurrentCategory(combinedMockData[0].categoryId);
          }
        }
      },

      getMenusByCategory: (categoryId: number) => {
        const category = get().categories.find(
          (category) => category.categoryId === categoryId
        );
        return category?.menus || [];
      },

      getCategoryById: (categoryId: number) => {
        return get().categories.find(
          (category) => category.categoryId === categoryId
        );
      },
    }),
    {
      name: 'menu-storage',
      partialize: (state) => ({
        categories: state.categories,
      }),
    }
  )
);
