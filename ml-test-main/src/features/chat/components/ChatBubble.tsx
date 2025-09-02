import TypingText from './TypingText';
interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  isUpdating?: boolean;
}

export default function ChatBubble({
  message,
  isUser,
  isUpdating = false,
}: ChatBubbleProps) {
  const isLoading = message === 'loading';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 shadow-md ${
          isUser
            ? isUpdating
              ? 'bg-indigo-300 text-indigo-900 rounded-br-none'
              : 'bg-indigo-200 text-indigo-900 rounded-br-none'
            : 'bg-indigo-100 text-indigo-700 rounded-bl-none'
        }`}
      >
        {isLoading ? (
          <div className='w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin' />
        ) : isUser ? (
          <span className='text-sm'>{message}</span>
        ) : (
          <TypingText text={message} speed={50} />
        )}
      </div>
    </div>
  );
}
