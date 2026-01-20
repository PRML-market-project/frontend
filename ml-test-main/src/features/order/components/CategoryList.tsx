import { useNavigationStore } from '@/store/navigationStore';
import { useMenuStore } from '@/store/menuStore';
import { useLanguageStore } from '@/store/languageStore';
import clsx from 'clsx';
import { useMemo } from 'react';

const CategoryList = () => {
  const {
    currentCategoryId,
    setCurrentCategory,
    setCurrentView,
    currentView,
    setCurrentMenu,
    currentCategoryType,
    setCurrentCategoryType,
  } = useNavigationStore();
  const { categories } = useMenuStore();
  const { language } = useLanguageStore();

  const filteredCategories = categories.filter(
    (category) => category.categoryName !== '전체'
  );

  const categoryTypes = useMemo(() => {
    const types = filteredCategories
      .map((c) => c.categoryType || '기타')
      .filter((t): t is string => Boolean(t && t.trim()));
    return Array.from(new Set(types));
  }, [filteredCategories]);

  // ★ 수정: 가게(Category ID)가 선택되지 않았을 때 true
  const showDefaultBackground = !currentCategoryId;

  const categoriesOfSelectedType = useMemo(() => {
    if (!currentCategoryType) return [];
    return filteredCategories.filter(
      (c) => (c.categoryType || '기타') === currentCategoryType
    );
  }, [filteredCategories, currentCategoryType]);

  const handleCategoryClick = (categoryId: number) => {
    setCurrentView('menu');
    setCurrentCategory(categoryId === currentCategoryId ? null : categoryId);
  };

  const handleTypeClick = (type: string) => {
    setCurrentView('menu');
    setCurrentMenu(null);
    setCurrentCategoryType(type);
    setCurrentCategory(null);
  };

  const handleOrderHistoryClick = () => {
    setCurrentView('orderHistory');
  };

  return (
    <>

      {/* 네비게이션 바 (z-10 유지하여 배경보다 위에 표시) */}
      <div className='relative w-full bg-background/95 backdrop-blur-sm border-b border-border z-10'>
        {/* 타입 리스트 */}
        <div className='flex items-center gap-2 px-2 pt-2 pb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--color-indigo-400)] scrollbar-track-transparent'>
          <nav className='flex items-center gap-2 min-w-full'>
            {categoryTypes.map((type) => {
              const isActive =
                currentView === 'menu' && currentCategoryType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeClick(type)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-center transition-all duration-200 ease-in-out text-sm font-semibold whitespace-nowrap flex-shrink-0',
                    isActive
                      ? 'bg-[var(--color-indigo-100)] text-[var(--color-indigo-900)] shadow-md border border-[var(--color-indigo-300)]'
                      : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                  )}
                >
                  {type}
                </button>
              );
            })}

            <button
              onClick={handleOrderHistoryClick}
              className={clsx(
                'px-4 py-2 rounded-lg text-center transition-all duration-200 ease-in-out text-sm font-semibold whitespace-nowrap flex-shrink-0 ml-auto',
                currentView === 'orderHistory'
                  ? 'bg-[var(--color-indigo-100)] text-[var(--color-indigo-900)] shadow-md border border-[var(--color-indigo-300)]'
                  : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
              )}
            >
              {language === 'en' ? '🗺️ Map' : '🗺️ 지도'}
            </button>
          </nav>
        </div>

        {/* 가게(카테고리) 리스트 */}
        <div className='flex items-center gap-2 px-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--color-indigo-400)] scrollbar-track-transparent'>
          <nav className='flex items-center gap-2 min-w-full'>
            {categoriesOfSelectedType.map((category) => {
              const isActive =
                currentCategoryId !== null &&
                currentView === 'menu' &&
                category.categoryId === currentCategoryId;

              const categoryName =
                language === 'en'
                  ? category.categoryNameEn
                  : category.categoryName;

              return (
                <button
                  key={category.categoryId}
                  onClick={() => handleCategoryClick(category.categoryId)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-center transition-all duration-200 ease-in-out text-sm font-semibold whitespace-nowrap flex-shrink-0',
                    isActive
                      ? 'bg-[var(--color-indigo-100)] text-[var(--color-indigo-900)] shadow-md border border-[var(--color-indigo-300)]'
                      : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                  )}
                >
                  {categoryName}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default CategoryList;