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
    <div className='flex'>
      <aside className='bg-slate-800 rounded-xl shadow-lg p-4 mt-4 mb-6 ml-4 w-40 flex flex-col select-none'>
        {/* 카테고리 목록 */}
        <nav className='flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-indigo-900/30'>
          <ul className='flex flex-col gap-2'>
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
                <li key={category.categoryId}>
                  <button
                    onClick={() => handleCategoryClick(category.categoryId)}
                    className={clsx(
                      'w-full py-3 rounded-lg text-center transition-colors duration-300 ease-in-out text-sm font-semibold',
                      isActive
                        ? 'bg-indigo-100 text-indigo-900 shadow-lg underline decoration-indigo-600 decoration-2 underline-offset-4'
                        : 'text-indigo-200 hover:bg-indigo-200 hover:text-indigo-800'
                    )}
                  >
                    {categoryName}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 주문내역조회 버튼 */}
        <div className='w-full mt-6'>
          <button
            onClick={handleOrderHistoryClick}
            className={clsx(
              'w-full font-semibold py-3 rounded-md text-sm bg-indigo-100 text-indigo-900 transition duration-200 ease-in-out hover:brightness-90 shadow-sm',
              currentView === 'orderHistory' &&
                'shadow-inner ring-2 ring-indigo-500'
            )}
          >
            {language === 'en' ? 'Order History' : '주문 내역 조회'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CategoryList;
