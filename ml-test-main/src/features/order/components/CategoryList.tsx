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
    highlightedCategoryIds, // ✅ 여러 가게 깜빡임을 위한 상태 추가
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
    // ✅ 카테고리 타입을 다시 눌러서 닫을 때
      setCurrentCategoryType(null);
      setCurrentCategory(null); // 👈 추가: 선택된 가게(소분류)도 함께 해제
      setCurrentMenu(null);     // 👈 추가: 혹시 깜빡이던 메뉴가 있다면 해제
    }
    else {
    // 새로운 타입을 선택할 때
    setCurrentMenu(null);
    setCurrentCategoryType(type);
    setCurrentCategory(null); // 다른 타입으로 옮겨갈 때도 기존 선택 가게 해제
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
      <div className='sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-border'>

        {/* 1. 상단: 카테고리 타입 (대분류) + 지도 버튼 */}
        <div className='flex items-start w-full border-b border-border/40'>
          <div className='flex-1'>
            <nav className='flex flex-wrap items-center px-4'>
              {categoryTypes.map((type) => {
                const isActive =
                  currentView === 'menu' && currentCategoryType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    className={clsx(
                      'py-3 mr-4 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2 outline-none focus:outline-none',
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

          <div className='flex-none flex items-center pl-2 pr-4 py-3 bg-background/95 border-l border-border/50 self-stretch'>
            <button
              onClick={handleOrderHistoryClick}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all outline-none focus:outline-none',
                currentView === 'orderHistory'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border/50'
              )}
            >
              <span>🗺️</span>
              <span>{language === 'en' ? 'Map' : '지도'}</span>
            </button>
          </div>
        </div>

        {/* 2. 하단: 가게 리스트 (소분류) */}
        {categoriesOfSelectedType.length > 0 && (
          <div className='w-full py-2 px-3 bg-secondary/30'>
            <div className='flex flex-wrap items-center gap-x-1.5 gap-y-2'>
              {categoriesOfSelectedType.map((category) => {
                const isActive =
                  currentCategoryId !== null &&
                  currentView === 'menu' &&
                  category.categoryId === currentCategoryId;

                // ✅ 해당 카테고리가 강조(깜빡임) 대상인지 확인
                const isHighlighted = highlightedCategoryIds.includes(category.categoryId);

                const categoryName =
                  language === 'en'
                    ? category.categoryNameEn
                    : category.categoryName;

                return (
                  <button
                    key={category.categoryId}
                    onClick={() => handleCategoryClick(category.categoryId)}
                    className={clsx(
                      'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border outline-none focus:outline-none',
                      isActive
                        ? 'bg-[var(--color-indigo-500)] text-white border-[var(--color-indigo-600)]'
                        : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground',
                      // ✅ 강조 대상일 때 애니메이션 및 테두리 효과 적용
                      isHighlighted && 'animate-[pulse_1s_ease-in-out_infinite] ring-2 ring-[var(--color-indigo-400)] border-[var(--color-indigo-500)] shadow-sm'
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