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

  const {
    isCovered,
    setIsCovered,
    isMicOn,
    startHotwordDetection,
    stopHotwordDetection,
    startMic,
    stopMic
  } = useVoiceStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState('');

  // Refs
  const lastTextTimeRef = useRef<number>(0);
  const keywordIndexRef = useRef<number>(-1);
  const detectedKeywordRef = useRef<string | null>(null);

  // 🔥 [중요] 중복 전송 방지용 Ref 추가
  const isSendingRef = useRef(false);

  const { adminId, kioskId } = useParams();
  const { language } = useLanguageStore();
  const langCode = language === 'en' ? 'en-US' : 'ko-KR';

  const [devInput, setDevInput] = useState('');

  const KEYWORDS = language === 'en'
    ? ['malang', 'hello', 'Malang']
    : ['말랑아', '빨랑아', '빨랑 와', '말랑한', '빨리 와', '빨리와', '빨랑와', '몰라', '몰랑', '말랑은', '빨랑'];

  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setIsCapturing = useChatStore((state) => state.setIsCapturing);
  const isCapturing = useChatStore((state) => state.isCapturing);

  const { sendTextToApi } = useGpt({ apiUrl });

  // 마이크 토글 핸들러
  const handleToggleMic = useCallback(async () => {
    try {
      if (isMicOn) {
        stopMic?.();
        stopHotwordDetection?.();
        return;
      }
      await startHotwordDetection?.();
      await startMic?.({ lang: langCode });
    } catch (e) {
      console.error('Mic/Hotword toggle failed:', e);
    }
  }, [isMicOn, langCode, startHotwordDetection, stopHotwordDetection, startMic, stopMic]);

  /**
   * ✅ DEV 모드: 키보드 입력을 WebSpeech 흐름처럼 처리
   * 🔥 수정사항: setTimeout 제거 + 중복 전송 방지(isSendingRef) 적용
   */
  const runDevAsIfWebSpeech = useCallback(async (fullText: string) => {
    // 1. 이미 전송 중이면 무시 (중복 방지 핵심)
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const now = Date.now();

    // 2. 상태 설정
    setIsProcessing(true);
    setIsCapturing(true);
    setCapturedText('');
    lastTextTimeRef.current = now;
    keywordIndexRef.current = 0;
    detectedKeywordRef.current = 'DEV';

    // 3. 빈 사용자 말풍선 생성 (오른쪽 파란색)
    addMessage({
      text: '',
      isUser: true,
      timestamp: now,
    });

    // 4. 🔥 [중요] setTimeout 없이 즉시 업데이트!
    // 이렇게 해야 API가 로딩 말풍선을 만들기 전에 '내 메시지'가 완성됩니다.
    updateLastMessage(fullText);
    setCapturedText(fullText);
    lastTextTimeRef.current = Date.now();

    // 5. API 호출
    try {
      await sendTextToApi(fullText, adminId, kioskId);
    } catch (err) {
      console.error('Error processing DEV input:', err);
    } finally {
      // 6. 종료 처리 및 락 해제
      isSendingRef.current = false; // 전송 완료, 락 해제
      setIsCapturing(false);
      setIsProcessing(false);
      resetTranscript();
      keywordIndexRef.current = -1;
      detectedKeywordRef.current = null;
      setCapturedText('');
    }
  }, [addMessage, updateLastMessage, sendTextToApi, adminId, kioskId, resetTranscript, setIsCapturing]);

  // ... (이하 useEffect 로직은 기존과 동일) ...
  // 실시간 음성 감지
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

  // 무음 감지 및 자동 전송
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

  // 키워드 감지
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

  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  return (
    <div className="p-4 h-fit flex flex-row items-end gap-3 justify-end">

      {/* 1. 마이크 버튼 */}
      {!isCovered && (
        <button
          type="button"
          onClick={handleToggleMic}
          className={`
            w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 flex-shrink-0
            ${isMicOn ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
          `}
          title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
        >
          {isMicOn ? '■' : '🎤'}
        </button>
      )}

      {/* 2. DEV 전용 키보드 입력 UI */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-[300px] flex-shrink-0">
          <div className="p-2 rounded-lg border border-indigo-200 bg-white text-left shadow-sm">
            <div className="text-[10px] text-indigo-700 mb-1 font-semibold">
              Developer Input
            </div>
            <div className="flex gap-2">
              <textarea
                className="flex-1 p-2 border rounded-md text-sm resize-none focus:outline-indigo-500 bg-indigo-50"
                rows={1}
                placeholder="입력..."
                value={devInput}
                onChange={(e) => setDevInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
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
                className="px-3 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 font-bold whitespace-nowrap"
                // 🔥 전송 중이면 버튼 비활성화 (선택 사항)
                disabled={isSendingRef.current}
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
          <div className="mt-1 text-center">
            {isCapturing ? (
               <span className="text-xs text-indigo-600 animate-pulse font-bold">인식 중...</span>
            ) : (
               <span className="text-[10px] text-gray-400">
                 {listening ? 'Listening...' : 'Waiting...'}
               </span>
            )}
          </div>
        </div>
      )}

      {isCovered && (
        <div
          className="fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-50 cursor-pointer"
          onClick={() => {
            setIsCovered(false);
            return SpeechRecognition.startListening({ continuous: true, language: langCode });
          }}
        >
          <p className="text-4xl font-bold text-indigo-600 animate-pulse">터치하여 시작</p>
        </div>
      )}
    </div>
  );
};

export default Voice;