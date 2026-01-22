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
import { useMapStore } from '@/store/mapStore';
import { marketShops } from '@/data/market-shops';

interface UseTextApiProps {
  apiUrl: string;
}

// [수정] category_type 추가
interface ResponseItem {
  menu_id?: number;
  category_id?: number;
  category_type?: string; // 추가됨
  quantity?: number;
  state?: string;
  target_id?: string;
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

export const useGpt = ({ apiUrl }: UseTextApiProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addMessage, updateLastMessage } = useChatStore();
  const { categories, getMenusByCategory } = useMenuStore();
  const { updateQuantity, removeItem, addItem } = useCartStore();
  const {
    setCurrentCategory,
    setCurrentMenu,
    setCurrentView,
    setCurrentCategoryType,
  } = useNavigationStore();
  const { setShowOrderModal } = useOrderStore();
  const { clearCart, cartItems } = useCartStore();
  const { language } = useLanguageStore();
  const { kioskId } = useParams();
  const { fetchOrders } = useOrderHistoryStore();
  const { selectAndNavigate } = useMapStore();

  const getJosa = (word: string, josa1: string, josa2: string) => {
    const lastChar = word.charCodeAt(word.length - 1);
    const hasJongseong = (lastChar - 0xAC00) % 28 > 0;
    return hasJongseong ? josa1 : josa2;
  };

  const processIntent = (
    intent: string,
    items: ResponseItem[],
    admin_id: number,
    kiosk_id: number,
    chat_message: string
  ) => {

    // 만약 items에 category_type이 있다면 여기서 활용 가능
    // 예: console.log("가게 타입:", items[0]?.category_type);

    if (!intent) {
      updateLastMessage(chat_message);
      getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
      return;
    }

    switch (intent) {
      case 'get_store':
  updateLastMessage(chat_message);
  getSpeech(chat_message, language === 'en' ? 'en' : 'ko');

  if (items.length > 0) {
    const { category_type } = items[0] ?? {};

    // 1) 상위 타입 선택 (예: 농산물)
    if (category_type) {
      setCurrentCategoryType(category_type);
    }
    setCurrentView('menu');

    // 2) ✅ 관련된 모든 카테고리 ID 추출하여 깜빡임 설정
    const categoryIds = items
      .map(item => item.category_id)
      .filter((id): id is number => id != null);

    // navigationStore에 추가한 함수 호출
    const { setHighlightedCategoryIds } = useNavigationStore.getState();
    setHighlightedCategoryIds(categoryIds);

    // 3) 그 중 최저가 가게(첫 번째 아이템)를 기본 선택
    if (categoryIds.length > 0) {
      setCurrentCategory(categoryIds[0]);
    }
  }
  break;

      case 'get_menu':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');

        console.log('메뉴 탐색:', items);
        if (items.length > 0) {
          const { category_id, category_type, menu_id } = items[0] ?? {};
          if (category_type) {
            setCurrentCategoryType(category_type);
          }
          if (category_id != null) {
            setCurrentCategory(category_id);
          }
          if (menu_id != null) {
            setCurrentView('menu');
            setCurrentMenu(menu_id);
          }
        }
        break;

      // 위치 안내 처리
      case 'get_location':
        let finalMessage = chat_message;

        console.log('위치 안내:', items);

        if (items.length > 0 && items[0]?.target_id) {
          const targetId = String(items[0].target_id);

          const shopInfo = marketShops.find((s) => s.id === targetId);

          if (shopInfo) {
            const josa = getJosa(shopInfo.name, '은', '는');
            finalMessage = `${shopInfo.name}${josa} ${shopInfo.section} ${shopInfo.number}번에 있어요.`;
          }

          updateLastMessage(finalMessage);
          getSpeech(finalMessage, language === 'en' ? 'en' : 'ko');

          setCurrentView('map');
          selectAndNavigate(targetId);
        } else {
          updateLastMessage(chat_message);
          getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
        }
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

      const responseText = await response.text();
      let data: any;
      let isJson = false;

      try {
        data = JSON.parse(responseText);
        if (data && typeof data === 'object') {
          isJson = true;
        }
      } catch (e) {
        isJson = false;
      }

      if (!isJson) {
        console.log('Non-JSON Response received:', responseText);

        updateLastMessage(responseText);
        getSpeech(responseText, language === 'en' ? 'en' : 'ko');

        return {
          user_message: text,
          chat_message: responseText,
          result: {
            status: 'success',
            intent: '',
            kiosk_id: Number(kiosk_id),
            admin_id: Number(admin_id),
            items: [],
          },
        };
      }

      console.log('GPT Response:', data);

      if (data.chat_message) {
        processIntent(
          data.result.intent,
          data.result.items,
          data.result.admin_id,
          data.result.kiosk_id,
          data.chat_message
        );
      }

      return data as TextApiResponse;

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