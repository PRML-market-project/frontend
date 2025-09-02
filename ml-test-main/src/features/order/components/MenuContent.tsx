import { Menu } from '@/types/menu';
import MenuItemCard from './MenuItemCard';
import { useNavigationStore } from '@/store/navigationStore';
import { useMenuStore } from '@/store/menuStore';
import { useLanguageStore } from '@/store/languageStore';

const MenuContent = () => {
  const { currentCategoryId, currentMenuId } = useNavigationStore();
  const { categories, getMenusByCategory } = useMenuStore();
  const { language } = useLanguageStore();

  // 현재 선택된 카테고리의 메뉴들을 가져옴
  const currentMenus = currentCategoryId
    ? getMenusByCategory(currentCategoryId)
    : [];

  console.log('currentMenus:', currentMenus);

  // 검색된 메뉴가 있다면 해당 메뉴를 맨 앞으로 정렬
  const filteredItems = currentMenus.reduce<Menu[]>((items, item) => {
    if (currentMenuId !== null && item.menuId === currentMenuId) {
      return [item, ...items];
    }
    return [...items, item];
  }, []);

  if (filteredItems.length === 0) {
    return (
      <div className='flex items-center justify-center h-full p-8'>
        <p className='text-gray-500 text-lg'>
          {language === 'en'
            ? 'No menus available in this category'
            : '해당 카테고리에 메뉴가 없습니다'}
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4'>
      {filteredItems.map((menu) => (
        <MenuItemCard
          key={menu.menuId}
          menu={menu}
          isSearched={menu.menuId === currentMenuId}
        />
      ))}
    </div>
  );
};

export default MenuContent;
