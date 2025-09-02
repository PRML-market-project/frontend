import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  speed: number; // 각 글자가 나타나는 시간 간격 (ms)
  fadeDuration?: number; // 각 글자의 페이드 인 애니메이션 지속 시간 (ms)
}

const TypingText = ({
  text,
  speed,
  fadeDuration = 200, // 기본 페이드 인 지속 시간을 200ms로 늘려 더 부드럽게
}: TypingTextProps) => {
  const [displayedChars, setDisplayedChars] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        // 현재 문자가 공백이면 &nbsp;로 변환하여 추가합니다.
        const charToAdd =
          text.charAt(index) === ' ' ? '\u00A0' : text.charAt(index); // '\u00A0'는 &nbsp;의 유니코드 표현
        setDisplayedChars((prev) => [...prev, charToAdd]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  // text prop이 변경될 때 상태 초기화
  useEffect(() => {
    setDisplayedChars([]);
    setIndex(0);
  }, [text]);

  return (
    <span className='text-sm'>
      {displayedChars.map((char, charIdx) => (
        <span
          key={charIdx}
          className='inline-block animate-fadeIn' // Tailwind CSS 애니메이션 클래스
          style={{
            animationDuration: `${fadeDuration}ms`,
            animationTimingFunction: 'ease-out', // 부드러운 감속 효과
          }}
          // dangerouslySetInnerHTML을 사용하여 &nbsp;가 올바르게 렌더링되도록 합니다.
          dangerouslySetInnerHTML={{ __html: char }}
        />
      ))}
      {/* Tailwind CSS 애니메이션은 이전과 동일하게 외부에서 정의하거나,
          스타일드 컴포넌트 등으로 처리할 수 있습니다. */}
    </span>
  );
};

export default TypingText;
