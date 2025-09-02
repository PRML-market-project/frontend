import { useChatStore } from '../store/chatStore';
import ChatBubble from './ChatBubble';
import { useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { getSpeech } from '@/utils/getSpeech';
import { useVoiceStore } from '@/features/order/store/voiceStore';
const ChatHistory = () => {
  const messages = useChatStore((state) => state.messages);
  const isCapturing = useChatStore((state) => state.isCapturing);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguageStore();
  const { isCovered } = useVoiceStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isCovered) return;
    const testTTS = () => {
      try {
        const testMessage =
          language === 'en'
            ? 'Hi! How may I help you?'
            : '안녕하세요! 어떤 도움이 필요하신가요?';

        console.log('Testing TTS with message:', testMessage);
        getSpeech(testMessage, language === 'en' ? 'en' : 'ko');
      } catch (error) {
        console.error('TTS test failed:', error);
      }
    };

    testTTS();
  }, [language, isCovered]);

  return (
    <div className='flex flex-col h-full'>
      <div
        className='flex-1 p-4 overflow-y-auto bg-indigo-50 rounded-lg'
        style={{
          boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)', // indigo-600 투명한 그림자
          border: '1px solid rgba(79, 70, 229, 0.2)', // 연한 인디고 테두리
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
