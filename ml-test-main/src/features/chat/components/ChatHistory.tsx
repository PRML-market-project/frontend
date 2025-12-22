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
   * 버튼으로 "마이크 ON" 시:
   * - hotword detection 시작
   * - 실제 마이크(STT)도 시작(원하면 hotword만 시작하도록 바꿔도 됨)
   */
  const handleToggleMic = useCallback(async () => {
    try {
      if (isMicOn) {
        stopMic?.();
        stopHotwordDetection?.();
        return;
      }

      // hotword 감지 + 마이크 켜기
      await startHotwordDetection?.();
      await startMic?.({ lang: language === 'en' ? 'en' : 'ko' });
    } catch (e) {
      console.error('Mic/Hotword toggle failed:', e);
    }
  }, [
    isMicOn,
    language,
    startHotwordDetection,
    stopHotwordDetection,
    startMic,
    stopMic,
  ]);

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

      {/* 마이크 토글 버튼 (우하단) */}
      <button
        type="button"
        onClick={handleToggleMic}
        disabled={isCovered}
        aria-pressed={isMicOn}
        aria-label={isMicOn ? '마이크 끄기' : '마이크 켜기'}
        className={[
          'absolute bottom-4 right-4',
          'w-12 h-12 rounded-full shadow-lg',
          'flex items-center justify-center',
          'transition active:scale-95',
          isCovered ? 'opacity-50 cursor-not-allowed' : '',
          isMicOn
            ? 'bg-red-600 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-700',
        ].join(' ')}
        title={isMicOn ? '마이크/핫워드 감지 끄기' : '마이크/핫워드 감지 켜기'}
      >
        {/* 아이콘 라이브러리 없으면 텍스트로 */}
        {isMicOn ? '■' : '🎤'}
      </button>
    </div>
  );
};

export default ChatHistory;
