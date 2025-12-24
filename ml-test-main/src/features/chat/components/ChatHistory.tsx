import { useChatStore } from '../store/chatStore';
import ChatBubble from './ChatBubble';
import { useEffect, useRef, useCallback } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { getSpeech } from '@/utils/getSpeech';
import { useVoiceStore } from '@/features/order/store/voiceStore';

const ChatHistory = () => {
  const messages = useChatStore((state) => state.messages);
  const isCapturing = useChatStore((state) => state.isCapturing);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguageStore();

  /**
   * 아래 4개/5개는 voiceStore에 있어야 하는 액션/상태 이름입니다.
   * (이미 비슷한게 있으면 그 이름으로 바꿔 끼우면 됨)
   */
  const {
    isCovered,
    isMicOn, // boolean: 현재 마이크 ON/OFF
    startHotwordDetection, // () => Promise<void> | void
    stopHotwordDetection, // () => void
    startMic, // (opts?: { lang?: 'ko'|'en' }) => Promise<void> | void
    stopMic, // () => void
  } = useVoiceStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 언어 바뀔 때 TTS 테스트
  useEffect(() => {
    if (isCovered) return;

    try {
      const testMessage =
        language === 'en'
          ? 'Hi! How may I help you?'
          : '안녕하세요! 어떤 도움이 필요하신가요?';

      getSpeech(testMessage, language === 'en' ? 'en' : 'ko');
    } catch (error) {
      console.error('TTS test failed:', error);
    }
  }, [language, isCovered]);
  /**
   * 화면 덮힘(예: 주문 플로우/모달 등) 상태면 자동으로 마이크/감지 끄기
   */
  useEffect(() => {
    if (!isCovered) return;
    if (!isMicOn) return;

    stopMic?.();
    stopHotwordDetection?.();
  }, [isCovered, isMicOn, stopMic, stopHotwordDetection]);

  return (
    <div className="flex flex-col h-full relative">
      <div
        className="flex-1 p-4 overflow-y-auto bg-indigo-50 rounded-lg"
        style={{
          boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
        }}
      >
        {messages.length === 0 ? (
          <ChatBubble
            message={
              language === 'en'
                ? 'Hi! How may I help you?'
                : '안녕하세요! 어떤 도움이 필요하신가요?'
            }
            isUser={false}
          />
        ) : (
          messages.map((message, index) => (
            <ChatBubble
              key={index}
              message={message.text}
              isUser={message.isUser}
              isUpdating={
                message.isUser && index === messages.length - 1 && isCapturing
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

    </div>
  );
};

export default ChatHistory;
