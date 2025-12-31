import { useNavigationStore } from '@/store/navigationStore';
import { useMenuStore } from '@/store/menuStore';
import { useLanguageStore } from '@/store/languageStore'; // languageStore 가정
import clsx from 'clsx';

const CategoryList = () => {
  const {
    currentCategoryId,
    setCurrentCategory,
    initializeCategory,
    setCurrentView,
    currentView,
    setCurrentMenu,
  } = useNavigationStore();
  const { categories } = useMenuStore();
  const { language } = useLanguageStore(); // 'ko' 또는 'en'

  const filteredCategories = categories.filter(
    (category) => category.categoryName !== '전체'
  );

  if (!currentCategoryId) {
    initializeCategory();
  }

  const handleCategoryClick = (categoryId: number) => {
    setCurrentView('menu');
    setCurrentCategory(categoryId === currentCategoryId ? null : categoryId);
  };

  const handleOrderHistoryClick = () => {
    setCurrentView('orderHistory');
  };

  return (
    <div className='w-full bg-background/95 backdrop-blur-sm border-b border-border'>
      <div className='flex items-center gap-2 px-2 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--color-indigo-400)] scrollbar-track-transparent'>
        {/* 카테고리 탭들 - 가로 스크롤 */}
        <nav className='flex items-center gap-2 min-w-full'>
          {filteredCategories.map((category) => {
            const isActive =
              !isNaN(currentCategoryId) &&
              currentView === 'menu' &&
              category.categoryId === currentCategoryId;

            // 언어에 따라 이름 선택
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
                    ? 'bg-[var(--color-indigo-100)] text-[var(--color-indigo-900)] shadow-md border-2 border-[var(--color-indigo-300)]'
                    : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                )}
              >
                {categoryName}
              </button>
            );
          })}
          
          {/* 지도 버튼 - 탭 형태로 추가 */}
          <button
            onClick={handleOrderHistoryClick}
            className={clsx(
              'px-4 py-2 rounded-lg text-center transition-all duration-200 ease-in-out text-sm font-semibold whitespace-nowrap flex-shrink-0 ml-auto',
              currentView === 'orderHistory'
                ? 'bg-[var(--color-indigo-100)] text-[var(--color-indigo-900)] shadow-md border-2 border-[var(--color-indigo-300)]'
                : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
            )}
          >
            {language === 'en' ? '🗺️ Map' : '🗺️ 지도'}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default CategoryList;
