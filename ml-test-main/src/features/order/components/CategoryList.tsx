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

    if (currentCategoryType === type) {
        setCurrentCategoryType(null);
    } else {
        setCurrentMenu(null);
        setCurrentCategoryType(type);
        setCurrentCategory(null);
    }
  };

  const handleOrderHistoryClick = () => {
    if (currentView === 'orderHistory') {
        setCurrentView('menu');
    } else {
        setCurrentView('orderHistory');
        setCurrentCategoryType(null);
        setCurrentCategory(null);
    }
  };

  return (
    <>
      {/* shadow-sm 제거하여 상단 바 그림자 없앰 (원하시면 shadow-sm 다시 추가 가능) */}
      <div className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-border'>

        {/* 1. 상단: 카테고리 타입 + 지도 버튼 */}
        <div className='flex items-center w-full border-b border-border/40'>

          {/* 왼쪽: 스크롤 가능한 카테고리 영역 */}
          <div className='flex-1 overflow-x-auto no-scrollbar'>
            <nav className='flex items-center px-4'>
              {categoryTypes.map((type) => {
                const isActive =
                  currentView === 'menu' && currentCategoryType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    className={clsx(
                      'py-3 mr-6 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2 outline-none focus:outline-none',
                      isActive
                        ? 'border-[var(--color-indigo-500)] text-[var(--color-indigo-600)]'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {type}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 오른쪽: 지도 버튼 */}
          <div className='flex-none flex items-center pl-2 pr-4 py-2 bg-background/95 border-l border-border/50'>
            <button
              onClick={handleOrderHistoryClick}
              className={clsx(
                // shadow-sm, shadow-md 제거
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all outline-none focus:outline-none',
                currentView === 'orderHistory'
                  ? 'bg-primary text-primary-foreground' // 활성 상태 (그림자 제거)
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border/50' // 비활성 상태
              )}
            >
              <span>🗺️</span>
              <span>{language === 'en' ? 'Map' : '지도'}</span>
            </button>
          </div>
        </div>

        {/* 2. 하단: 가게 리스트 (소분류) */}
        {categoriesOfSelectedType.length > 0 && (
          <div className='w-full py-3 px-3 bg-secondary/30'>
            <div className='flex items-center gap-2 overflow-x-auto no-scrollbar'>
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
                      // shadow-sm 제거
                      'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border outline-none focus:outline-none',
                      isActive
                        ? 'bg-[var(--color-indigo-500)] text-white border-[var(--color-indigo-600)]'
                        // [수정] 호버 시 파란 테두리/텍스트 제거 -> 깔끔한 회색 배경(bg-accent)으로 변경
                        : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CategoryList;