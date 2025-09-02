import { useState } from 'react';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';
import { useNavigationStore } from '@/store/navigationStore';
import { useOrderStore } from '../store/orderStore';
import { getSpeech } from '@/utils/getSpeech';
import { useLanguageStore } from '@/store/languageStore';
import { useParams } from 'react-router-dom';
import { useOrderHistoryStore } from '@/store/orderHistoryStore';

interface UseTextApiProps {
  apiUrl: string;
}

interface ResponseItem {
  menu_id?: number;
  category_id?: number;
  quantity?: number;
  state?: string;
}

interface TextApiResponse {
  user_message: string;
  chat_message: string;
  result: {
    status: string;
    intent: string;
    kiosk_id: number;
    admin_id: number;
    items: ResponseItem[];
  };
}

//TODO: 리턴값에서 ITEMS가 배열이어야 하는지 체크

export const useGpt = ({ apiUrl }: UseTextApiProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addMessage, updateLastMessage } = useChatStore();
  const { categories, getMenusByCategory } = useMenuStore();
  const { updateQuantity, removeItem, addItem } = useCartStore();
  const { setCurrentCategory, setCurrentMenu, setCurrentView } =
    useNavigationStore();
  const { setShowOrderModal } = useOrderStore();
  const { clearCart, cartItems } = useCartStore();
  const { language } = useLanguageStore();
  const { kioskId } = useParams();
  const { fetchOrders } = useOrderHistoryStore();

  const processIntent = (
    intent: string,
    items: ResponseItem[],
    admin_id: number,
    kiosk_id: number,
    chat_message: string
  ) => {
    let totalAmount: number;
    let formattedAmount: string;
    let historyMessage: string;
    let orders: ReturnType<typeof useOrderHistoryStore.getState>['orders'];

    if (!intent) {
      updateLastMessage(chat_message);
      getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
      return;
    }

    switch (intent) {
      case 'get_category':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
        console.log('카테고리 탐색:', items);
        if (items.length > 0 && items[0]?.category_id !== null) {
          setCurrentView('menu');
          if (items[0]?.menu_id !== null) {
            setCurrentMenu(items[0].menu_id);
          }
          setCurrentCategory(items[0].category_id);
        }
        break;

      case 'get_menu':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');

        console.log('메뉴 탐색:', items);
        if (
          items.length > 0 &&
          items[0]?.category_id !== null &&
          items[0]?.menu_id !== null
        ) {
          setCurrentCategory(items[0].category_id);
          setCurrentView('menu');
          setCurrentMenu(items[0].menu_id);
        }
        break;

      case 'update_cart':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');

        console.log('장바구니 수정:', items);
        items.forEach((item) => {
          // Handle removeall state first
          if (item.state === 'removeall') {
            clearCart();
            return;
          }

          // Handle other states (add, remove)
          if (
            item.menu_id !== undefined &&
            item.quantity !== undefined &&
            item.state
          ) {
            // Find the menu across all categories
            let foundMenu = null;
            for (const category of categories) {
              const menus = getMenusByCategory(category.categoryId);
              const menu = menus.find((m) => m.menuId === item.menu_id);
              if (menu) {
                foundMenu = menu;
                break;
              }
            }

            if (foundMenu) {
              switch (item.state) {
                case 'add':
                  addItem(foundMenu, item.quantity || 1);
                  break;
                case 'remove':
                  updateQuantity(item.menu_id, item.quantity * -1 || -1);
                  break;
              }
            }
          }
        });
        break;

      case 'place_order':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');

        if (cartItems.length === 0) {
          const failMessage =
            language === 'en'
              ? 'Your cart is empty. Please add items to your cart.'
              : '장바구니가 비어있습니다. 메뉴를 추가해주세요.';

          updateLastMessage(failMessage);
          getSpeech(failMessage, language === 'en' ? 'en' : 'ko');
          return;
        }

        try {
          const orderItems = cartItems.map((item) => ({
            menuId: item.menu.menuId,
            quantity: item.quantity,
          }));

          fetch(`${import.meta.env.VITE_API_URL}/api/order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kioskId: Number(kioskId),
              items: orderItems,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Failed to place order');
              }

              setShowOrderModal(true);
            })
            .catch((error) => {
              console.error('Error placing order:', error);
            });
        } catch (error) {
          console.error('Error in place_order intent:', error);
        }
        break;

      case 'get_order_history':
        console.log('주문 내역조회:', items);
        fetchOrders(Number(kioskId)).then(() => {
          const currentOrders = useOrderHistoryStore.getState().orders;
          totalAmount = currentOrders.reduce((sum, order) => {
            const orderTotal = order.items.reduce(
              (itemSum, item) => itemSum + item.menuPrice * item.quantity,
              0
            );
            return sum + orderTotal;
          }, 0);

          formattedAmount = new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
          }).format(totalAmount);

          historyMessage =
            language === 'en'
              ? `I'll show you your order history. Your total amount is ${formattedAmount}`
              : `주문 내역을 보여드리겠습니다. 총 주문 금액은 ${formattedAmount}입니다`;

          if (totalAmount === 0) {
            historyMessage =
              language === 'en'
                ? `I'll show you your order history.`
                : `주문 내역을 보여드리겠습니다. `;
          }

          updateLastMessage(historyMessage);
          getSpeech(historyMessage, language === 'en' ? 'en' : 'ko');
          setCurrentView('orderHistory');
        });
        break;

      default:
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
        break;
    }
  };

  const sendTextToApi = async (
    text: string,
    admin_id: string,
    kiosk_id: string
  ): Promise<TextApiResponse> => {
    if (!apiUrl) {
      throw new Error('API URL이 설정되지 않았습니다.');
    }

    setIsProcessing(true);
    addMessage({
      text: 'loading',
      isUser: false,
      timestamp: Date.now(),
    });
    setError(null);

    try {
      // Call GPT API
      const response = await fetch(`${apiUrl}/gpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: admin_id,
          kiosk_id: kiosk_id,
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error('GPT 서버 응답 오류');
      }

      const data = await response.json();
      console.log('GPT Response:', data);

      // Add chat message to chat

      // Process the intent
      if (data.chat_message) {
        processIntent(
          data.result.intent,
          data.result.items,
          data.result.admin_id,
          data.result.kiosk_id,
          data.chat_message
        );
      }

      return data;
    } catch (err) {
      console.error('Error sending text:', err);
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      const failMessage =
        language === 'en'
          ? 'Error has occurred'
          : '알 수 없는 오류가 발생했습니다.';
      updateLastMessage(failMessage);
      getSpeech(failMessage, language === 'en' ? 'en' : 'ko');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    sendTextToApi,
  };
};
