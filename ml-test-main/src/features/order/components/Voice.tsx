import { useEffect, useState, useRef, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useVoiceStore } from '../store/voiceStore';

import { useGpt } from '../hooks/useGpt';
import { useLanguageStore } from '@/store/languageStore';
import { useParams } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_GPT_API_URL;

const Voice = () => {
  const { listening, transcript, resetTranscript } = useSpeechRecognition();
  const { isCovered, setIsCovered } = useVoiceStore();

  const [detectedCount, setDetectedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState('');

  const lastTextTimeRef = useRef<number>(0);
  const keywordIndexRef = useRef<number>(-1);
  const detectedKeywordRef = useRef<string | null>(null);

  const { adminId, kioskId } = useParams();

  const { language } = useLanguageStore();
  const langCode = language === 'en' ? 'en-US' : 'ko-KR';

  // ✅ DEV 입력 상태
  const [devInput, setDevInput] = useState('');

  // 여러 키워드 배열
  const KEYWORDS =
    language === 'en'
      ? [
          'malang',
          'hello',
          'Malang',
          'my love',
          'Milan',
          'Malone',
          'malang',
          'My love',
          'malone',
          'millione',
          'milan',
        ]
      : [
          '말랑아',
          '빨랑아',
          '빨랑 와',
          '말랑한',
          '빨리 와',
          '빨리와',
          '빨랑와',
          '몰라',
          '몰랑',
          '말랑은',
          '몰랑',
          '몰라',
          '빨랑',
        ];

  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setIsCapturing = useChatStore((state) => state.setIsCapturing);
  const isCapturing = useChatStore((state) => state.isCapturing);

  const { sendTextToApi } = useGpt({ apiUrl });

  /**
   * =========================================
   * ✅ DEV 전용: 키보드 입력을 "WebSpeech와 동일한 흐름"으로 실행
   * =========================================
   * - (키워드 감지 발생 시점과 동일하게) 빈 user 메시지 생성
   * - updateLastMessage로 텍스트를 넣어 "타이핑/갱신" 흐름 유지
   * - 마지막에 isCapturing false로 종료
   * - WebSpeech 종료 조건(2초 무음) 대신, 키보드에서는 즉시 API 호출
   *
   * 원하는 경우: 2초 타이머 방식도 그대로 타게 만들 수 있는데,
   * 키보드는 "최종 텍스트가 이미 확정"이라 보통 즉시 호출이 자연스러움.
   */
  const runDevAsIfWebSpeech = useCallback(
    async (fullText: string) => {
      const now = Date.now();

      // 1) "키워드 감지 후 캡처 시작" 상태 세팅을 그대로 흉내
      setIsProcessing(true);
      setDetectedCount((prev) => prev + 1);
      setIsCapturing(true);
      setCapturedText('');
      lastTextTimeRef.current = now;

      // keyword 관련 ref도 실제 흐름과 충돌 없게 리셋/지정
      keywordIndexRef.current = 0;
      detectedKeywordRef.current = 'DEV';

      // 2) WebSpeech에서 키워드 감지되면 빈 버블 먼저 생성하는 것과 동일
      addMessage({
        text: '',
        isUser: true,
        timestamp: now,
      });

      // 3) WebSpeech의 transcript 업데이트처럼 마지막 메시지 업데이트
      //    (짧은 딜레이를 주면 UI가 "업데이트되는" 느낌도 동일)
      window.setTimeout(() => {
        updateLastMessage(fullText);
        setCapturedText(fullText);
        lastTextTimeRef.current = Date.now();
      }, 30);

      // 4) 키보드는 최종값이 확정이므로, WebSpeech의 "무음 2초 후 처리" 대신 즉시 처리
      //    (원하면 아래를 setTimeout(2000)으로 바꿔서 완전히 동일하게도 가능)
      try {
        await sendTextToApi(fullText, adminId, kioskId);
      } catch (err) {
        console.error('Error processing DEV input:', err);
      } finally {
        // 5) 종료 처리(원래 WebSpeech 종료 처리와 동일하게 정리)
        setIsCapturing(false);
        setIsProcessing(false);

        resetTranscript();
        keywordIndexRef.current = -1;
        detectedKeywordRef.current = null;
        setCapturedText('');
      }
    },
    [
      addMessage,
      updateLastMessage,
      sendTextToApi,
      adminId,
      kioskId,
      resetTranscript,
      setIsCapturing,
      setIsProcessing,
    ]
  );

  /**
   * 🧠 실시간 텍스트 감지 (WebSpeech transcript)
   */
  useEffect(() => {
    if (transcript) {
      lastTextTimeRef.current = Date.now();

      if (isCapturing && keywordIndexRef.current !== -1 && detectedKeywordRef.current) {
        const textAfterKeyword = transcript
          .slice(keywordIndexRef.current + detectedKeywordRef.current.length)
          .trim();

        setCapturedText(textAfterKeyword);
        updateLastMessage(textAfterKeyword);
      }
    }
  }, [transcript, isCapturing, updateLastMessage]);

  /**
   * 🔁 일정 시간 텍스트 없으면 인식 종료 및 처리 (WebSpeech)
   */
  useEffect(() => {
    if (!isCapturing) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastTextTimeRef.current > 2000) {
        setIsCapturing(false);
        setIsProcessing(false);

        if (capturedText) {
          sendTextToApi(capturedText, adminId, kioskId).catch((err) => {
            console.error('Error processing voice input:', err);
          });
        }

        resetTranscript();
        keywordIndexRef.current = -1;
        detectedKeywordRef.current = null;
        setCapturedText('');
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isCapturing, capturedText, sendTextToApi, adminId, kioskId, resetTranscript, setIsCapturing]);

  /**
   * 🎯 키워드 감지 (WebSpeech transcript)
   */
  useEffect(() => {
    if (!transcript || isProcessing) return;

    let foundKeyword: string | null = null;
    let foundIndex = -1;

    for (const keyword of KEYWORDS) {
      const idx = transcript.indexOf(keyword);
      if (idx !== -1) {
        foundKeyword = keyword;
        foundIndex = idx;
        break;
      }
    }

    if (foundKeyword && keywordIndexRef.current === -1) {
      setIsProcessing(true);
      setDetectedCount((prev) => prev + 1);
      setIsCapturing(true);
      setCapturedText('');
      lastTextTimeRef.current = Date.now();
      keywordIndexRef.current = foundIndex;
      detectedKeywordRef.current = foundKeyword;

      addMessage({
        text: '',
        isUser: true,
        timestamp: Date.now(),
      });
    }
  }, [transcript, isProcessing, KEYWORDS, addMessage, setIsCapturing]);

  // 🔇 언마운트 시 마이크 정지
  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  // 🎧 listening 상태, transcript 실시간 로그 (디버깅용)
  useEffect(() => {
    console.log('🎧 listening 상태:', listening);
    console.log('🗣️ transcript:', transcript);
  }, [listening, transcript]);

  return (
    <div className="p-6 h-fit rounded-xl shadow-lg bg-white text-center">
      {/* ✅ DEV 전용 키보드 입력 UI */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-left">
          <div className="text-xs text-indigo-700 mb-2">
            DEV: 키보드 입력을 WebSpeech 파이프라인처럼 처리 (빈 버블 생성 → updateLastMessage → API 호출)
          </div>

          <div className="flex gap-2">
            <textarea
              className="flex-1 p-2 border rounded-md text-sm resize-none"
              rows={2}
              placeholder="DEV: 여기에 문장 입력 후 Enter (Shift+Enter 줄바꿈)"
              value={devInput}
              onChange={(e) => setDevInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const text = devInput.trim();
                  if (!text) return;
                  setDevInput('');
                  runDevAsIfWebSpeech(text);
                }
              }}
            />
            <button
              className="px-4 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              onClick={() => {
                const text = devInput.trim();
                if (!text) return;
                setDevInput('');
                runDevAsIfWebSpeech(text);
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {isCovered && (
        <div
          className="
            absolute top-0 left-0 w-screen h-screen p-6
            flex flex-col items-center justify-center
            cursor-pointer
            bg-white/80
            border-4 border-indigo-500
            rounded-none
            shadow-xl
            backdrop-blur-md
          "
          onClick={() => {
            setIsCovered(false);
            return SpeechRecognition.startListening({
              continuous: true,
              language: langCode,
            });
          }}
        >
          <div className="absolute top-6 left-6 text-2xl font-bold text-indigo-600 select-none drop-shadow-md">
            Mallang Order
          </div>

          <div className="absolute top-6 right-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCovered(true);
                useLanguageStore.setState((state) => ({
                  language: state.language === 'en' ? 'ko' : 'en',
                }));
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
            >
              {language === 'en' ? '한글' : 'ENG'}
            </button>
          </div>

          <div
            className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400
              text-indigo-900 font-extrabold text-7xl tracking-tight flex items-center justify-center
              shadow-[0_10px_30px_rgba(99,102,241,0.4)] border border-indigo-300 relative overflow-hidden"
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #5c6ac4 0%, #3b43a9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
              }}
            >
              ML
            </span>
          </div>

          <p className="text-[2.5rem] sm:text-4xl md:text-5xl font-bold text-indigo-600 text-center animate-pulse select-none leading-tight whitespace-pre-line">
            {language === 'en'
              ? 'Touch the screen\nto start your order'
              : '화면을 터치해\n주문을 시작하세요'}
          </p>
        </div>
      )}

      {isCapturing ? (
        <div className="bg-indigo-100 rounded-lg border border-indigo-300 p-2 mt-2 shadow-sm">
          <p className="text-sm text-indigo-900 mb-1">
            {language === 'en' ? 'Recognizing speech…' : '음성 인식 중…'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-sm text-indigo-600">
            {listening ? (
              language === 'en' ? (
                <>
                  Listening for
                  <br />
                  the keyword…
                </>
              ) : (
                <>
                  키워드 말랑아
                  <br />
                  감지중…
                </>
              )
            ) : language === 'en' ? (
              'Waiting…'
            ) : (
              '대기 중…'
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default Voice;
