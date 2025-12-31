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

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState('');

  // UI 제어용
  const [isMicOn, setIsMicOn] = useState(false);

  // 침묵 감지용 Ref
  const lastTextTimeRef = useRef<number>(0);

  // 중복 전송 방지용 Ref
  const isSendingRef = useRef(false);

  // ✅ 최신 텍스트를 항상 ref에 저장 (stop 시점에 state가 늦어도 전송 가능)
  const latestTextRef = useRef<string>('');

  const { adminId, kioskId } = useParams();
  const { language } = useLanguageStore();
  const langCode = language === 'en' ? 'en-US' : 'ko-KR';

  // DEV 모드 입력용 State
  const [devInput, setDevInput] = useState('');

  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setIsCapturing = useChatStore((state) => state.setIsCapturing);
  const isCapturing = useChatStore((state) => state.isCapturing);

  const { sendTextToApi } = useGpt({ apiUrl });

  // ✅ 소프트 stop: 최종 transcript 확정 이벤트가 오도록 stop만
  const stopSoft = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
    } catch {
      // ignore
    }
    setIsMicOn(false);
    setIsCapturing(false);
    setIsProcessing(false);
  }, [setIsCapturing]);

  // ✅ 하드 stop: 꼬였을 때만 abort+stop
  const stopHard = useCallback(() => {
    try {
      SpeechRecognition.abortListening();
      SpeechRecognition.stopListening();
    } catch {
      // ignore
    }
    setIsMicOn(false);
    setIsCapturing(false);
    setIsProcessing(false);
  }, [setIsCapturing]);

  // 🎤 마이크 버튼 핸들러
  const handleToggleMic = useCallback(async () => {
    try {
      // ====== 수동 종료 ======
      if (isMicOn || listening || isCapturing) {
        // ✅ abort 쓰면 최종 결과가 날아갈 수 있으므로 stop만
        stopSoft();

        // ✅ stop 직후 최종 transcript가 들어오는 환경이 있어 잠깐 대기
        await new Promise((r) => setTimeout(r, 250));

        const text = (latestTextRef.current || capturedText || transcript || '').trim();

        if (text && adminId && kioskId) {
          await sendTextToApi(text, adminId, kioskId);
        }

        resetTranscript();
        setCapturedText('');
        latestTextRef.current = '';
        return;
      }

      // ====== 시작 ======
      resetTranscript();
      setIsCapturing(true);
      setIsProcessing(true);
      setCapturedText('');
      latestTextRef.current = '';
      lastTextTimeRef.current = Date.now();

      // 빈 사용자 말풍선 생성
      addMessage({
        text: '...',
        isUser: true,
        timestamp: Date.now(),
      });

      // ✅ startListening 성공 이후에만 isMicOn=true
      SpeechRecognition.startListening({
        continuous: true,
        language: langCode,
        interimResults: true, // ✅ 배포에서 중간 transcript가 덜 오는 경우 대비
      });

      setIsMicOn(true);
    } catch (e) {
      console.error('Mic toggle failed:', e);
      // 시작 실패 시 하드 정리
      stopHard();
    }
  }, [
    isMicOn,
    listening,
    isCapturing,
    langCode,
    resetTranscript,
    setIsCapturing,
    addMessage,
    capturedText,
    transcript,
    adminId,
    kioskId,
    sendTextToApi,
    stopSoft,
    stopHard,
  ]);

  /**
   * DEV 모드: 키보드 입력을 WebSpeech 흐름처럼 처리
   */
  const runDevAsIfWebSpeech = useCallback(
    async (fullText: string) => {
      if (isSendingRef.current) return;
      isSendingRef.current = true;

      const now = Date.now();

      setIsProcessing(true);
      setIsCapturing(true);
      setCapturedText('');
      latestTextRef.current = '';
      lastTextTimeRef.current = now;

      addMessage({
        text: '',
        isUser: true,
        timestamp: now,
      });

      updateLastMessage(fullText);
      setCapturedText(fullText);
      latestTextRef.current = fullText;
      lastTextTimeRef.current = Date.now();

      try {
        if (adminId && kioskId) {
          await sendTextToApi(fullText, adminId, kioskId);
        }
      } catch (err) {
        console.error('Error processing DEV input:', err);
      } finally {
        isSendingRef.current = false;
        setIsCapturing(false);
        setIsProcessing(false);
        resetTranscript();
        setCapturedText('');
        latestTextRef.current = '';
      }
    },
    [addMessage, updateLastMessage, sendTextToApi, adminId, kioskId, resetTranscript, setIsCapturing]
  );

  // 📝 실시간 음성 감지 및 텍스트 업데이트
  useEffect(() => {
    if (isCapturing) {
      const currentText = (transcript || '').trim();
      if (currentText) {
        lastTextTimeRef.current = Date.now();
        setCapturedText(currentText);
        latestTextRef.current = currentText; // ✅ ref 갱신
        updateLastMessage(currentText);
      }
    }
  }, [transcript, isCapturing, updateLastMessage]);

  // 🔇 무음 감지 및 자동 전송
  useEffect(() => {
    if (!isCapturing) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();

      if (now - lastTextTimeRef.current > 2000) {
        // ✅ 자동 종료도 stopSoft로 최종 확정 유도
        stopSoft();

        const text = (latestTextRef.current || capturedText || transcript || '').trim();

        if (text && adminId && kioskId) {
          sendTextToApi(text, adminId, kioskId).catch((err) => {
            console.error('Error processing voice input:', err);
          });
        } else {
          resetTranscript();
        }

        resetTranscript();
        setCapturedText('');
        latestTextRef.current = '';
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isCapturing, capturedText, transcript, sendTextToApi, adminId, kioskId, resetTranscript, stopSoft]);

  // 언마운트 시 하드 정리(꼬임 방지)
  useEffect(() => {
    return () => {
      stopHard();
    };
  }, [stopHard]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-2">
      {/* 1. 마이크 버튼 */}
      {!isCovered && (
        <button
          type="button"
          onClick={handleToggleMic}
          className={`
            w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 flex-shrink-0
            ${isMicOn ? 'bg-[var(--color-red-600)] text-white animate-pulse' : 'bg-[var(--color-indigo-600)] text-white hover:bg-[var(--color-indigo-700)]'}
          `}
          title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
        >
          {isMicOn ? '■' : '🎤'}
        </button>
      )}

      {/* 2. DEV 전용 키보드 입력 UI */}
      {import.meta.env.DEV && (
        <div className="w-full max-w-[200px] flex-shrink-0">
          <div className="p-2 rounded-lg border border-[var(--color-indigo-200)] bg-white text-left shadow-sm">
            <div className="text-[10px] text-[var(--color-indigo-700)] mb-1 font-semibold">Developer Input</div>
            <div className="flex gap-2">
              <textarea
                className="flex-1 p-2 border rounded-md text-sm resize-none focus:outline-[var(--color-indigo-500)] bg-[var(--color-indigo-50)]"
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
                className="px-3 rounded-md bg-[var(--color-indigo-600)] text-white text-sm hover:bg-[var(--color-indigo-700)] font-bold whitespace-nowrap"
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
              <span className="text-xs text-[var(--color-indigo-600)] animate-pulse font-bold">인식 중...</span>
            ) : (
              <span className="text-[10px] text-[var(--color-gray-400)]">{isMicOn ? 'Listening...' : 'Click Mic to Speak'}</span>
            )}
          </div>
        </div>
      )}

      {isCovered && (
        <div
          className="fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-50 cursor-pointer"
          onClick={() => {
            setIsCovered(false);
          }}
        >
          <p className="text-4xl font-bold text-[var(--color-indigo-600)] animate-pulse">터치하여 시작</p>
        </div>
      )}
    </div>
  );
};

export default Voice;
