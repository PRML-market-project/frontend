//MenuItemCard
import { Menu } from '@/types/menu';
import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';

interface MenuItemCardProps {
  menu: Menu;
  isSearched: boolean;
}

const MenuItemCard = ({ menu, isSearched }: MenuItemCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { language } = useLanguageStore();

  const translatedName =
    language === 'en' && menu.menuNameEn ? menu.menuNameEn : menu.menuName;

  const handleAddToCart = () => {
    console.log(`Adding ${translatedName} to cart`);
    addItem(menu);
  };

  console.log('language:', language, 'menu.menuNameEn:', menu.menuNameEn);
  // 상세 상태 콘솔 로그
  console.log('MenuItemCard Rendered');
  console.log('language:', language);
  console.log('menu:', menu);
  console.log('menu.menuNameEn:', menu.menuNameEn);
  console.log('translatedName:', translatedName);

  return (
    <div
      className={`bg-indigo-100 rounded-lg shadow hover:shadow-md transition-shadow duration-200 ease-in-out overflow-hidden flex flex-col p-4 gap-4 items-center ${
        isSearched
          ? 'animate-[pulse_1s_ease-in-out_5] border-2 border-indigo-300 ring-2 ring-indigo-300'
          : ''
      }`}
    >
      <img
        src={menu.imageUrl}
        alt={translatedName}
        className='w-[80%] aspect-square object-cover'
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
      />
      <div className='flex flex-col flex-grow w-full'>
        <div className='flex-grow mb-3'>
          <h3
            className='font-semibold text-md mb-1 truncate text-center text-indigo-900'
            title={translatedName}
          >
            {translatedName}
          </h3>
          <p className='text-sm text-indigo-700 text-center'>
            {menu.menuPrice.toLocaleString()} ₩
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          className='mt-auto w-full bg-white hover:bg-indigo-200 font-semibold py-2 px-3 rounded text-sm transition-colors duration-150 ease-in-out'
        >
          {language === 'en' ? 'Add to cart' : '담기'}
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
