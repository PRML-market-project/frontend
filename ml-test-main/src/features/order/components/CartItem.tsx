import { useCartStore } from '@/store/cartStore';
import { useLanguageStore } from '@/store/languageStore';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid';
import { CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
}

const CartItem = ({ item }: CartItemProps) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { language } = useLanguageStore();

  const handleIncrease = () => {
    updateQuantity(item.menu.menuId, 1);
  };

  const handleDecrease = () => {
    if (item.quantity - 1 <= 0) {
      handleRemove();
    } else {
      updateQuantity(item.menu.menuId, -1);
    }
  };

  const handleRemove = () => {
    removeItem(item.menu.menuId);
  };

  const translatedName =
    language === 'en' && item.menu.menuNameEn
      ? item.menu.menuNameEn
      : item.menu.menuName;

  const translatedCurrency = language === 'en' ? '₩' : '₩';

  return (
    <div className='flex items-center py-2 border-b border-indigo-100 last:border-b-0 mb-1 last:mb-0'>
      {/* Left: Image */}
      <img
        src={item.menu.imageUrl}
        alt={translatedName}
        className='w-12 h-12 object-cover rounded mr-3 flex-shrink-0'
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/logo.png';
        }}
      />

      {/* Middle: Name and Price */}
      <div className='flex-grow mr-3 min-w-0'>
        <p className='font-semibold text-sm mb-1 text-slate-800 whitespace-nowrap'>
          {translatedName}
        </p>
        <p className='text-xs text-slate-600 whitespace-nowrap'>
          {item.menu.menuPrice.toLocaleString()} {translatedCurrency}
        </p>
      </div>

      {/* Right: Quantity Controls */}
      <div className='flex items-center flex-shrink-0 space-x-1'>
        <button
          onClick={handleDecrease}
          className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-100 transition-colors'
          aria-label='Decrease quantity'
        >
          <MinusIcon className='w-3.5 h-3.5 text-indigo-500' />
        </button>
        <span className='text-center font-medium text-sm w-5 text-slate-700'>
          {item.quantity}
        </span>
        <button
          onClick={handleIncrease}
          className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-100 transition-colors'
          aria-label='Increase quantity'
        >
          <PlusIcon className='w-3.5 h-3.5 text-indigo-500' />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
