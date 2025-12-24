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
import { marketShops } from '@/data/market-shops'; // 경로에 맞게 수정해주세요

interface UseTextApiProps {
  apiUrl: string;
}

interface ResponseItem {
  menu_id?: number;
  category_id?: number;
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
      case 'get_store':
        updateLastMessage(chat_message);
        getSpeech(chat_message, language === 'en' ? 'en' : 'ko');
        console.log('카테고리 탐색:', items);
        if (items.length > 0 && items[0]?.category_id != null) {
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

      //위치 안내 처리
      case 'get_location':
        let finalMessage = chat_message; // 기본값은 GPT가 준 메시지

        console.log('위치 안내:', items);

        if (items.length > 0 && items[0]?.target_id) {
          const targetId = String(items[0].target_id);

      // 1. 전체 데이터에서 해당 ID의 가게 정보를 찾음
          const shopInfo = marketShops.find((s) => s.id === targetId);

      // 2. 가게 정보가 있다면 메시지 강제 변경
          if (shopInfo) {
        // "골드축산은" vs "다이소는" 처리
            const josa = getJosa(shopInfo.name, '은', '는');

        // 예: "골드축산은 서측 A구역 84번에 있어요."
            finalMessage = `${shopInfo.name}${josa} ${shopInfo.section} ${shopInfo.number}번에 있어요.`;
           }

      // 3. 변경된 메시지로 업데이트 및 음성 출력
          updateLastMessage(finalMessage);
          getSpeech(finalMessage, language === 'en' ? 'en' : 'ko');

      // 4. 뷰 변경 및 지도 활성화
          setCurrentView('map');
          selectAndNavigate(targetId);
        } else {
      // ID를 못 찾았을 경우 GPT 원본 메시지 출력
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
