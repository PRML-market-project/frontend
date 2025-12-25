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
    // isMicOn, // 핫워드 방식이 아니므로 store의 isMicOn 상태보다 로컬 listening 상태가 더 직관적일 수 있으나, UI 유지를 위해 사용
    startMic, // store 함수 대신 직접 SpeechRecognition을 제어합니다.
    stopMic
  } = useVoiceStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState('');

  // Refs (핫워드 관련 Ref 제거)
  const lastTextTimeRef = useRef<number>(0);

  // 🔥 [중요] 중복 전송 방지용 Ref
  const isSendingRef = useRef(false);

  const { adminId, kioskId } = useParams();
  const { language } = useLanguageStore();
  const langCode = language === 'en' ? 'en-US' : 'ko-KR';

  const [devInput, setDevInput] = useState('');

  // KEYWORDS 배열 제거됨

  const addMessage = useChatStore((state) => state.addMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setIsCapturing = useChatStore((state) => state.setIsCapturing);
  const isCapturing = useChatStore((state) => state.isCapturing);

  const { sendTextToApi } = useGpt({ apiUrl });

  // 🎤 마이크 버튼 핸들러 (수정됨: 핫워드 없이 즉시 시작/중지)
  const handleToggleMic = useCallback(async () => {
    try {
      // 이미 듣고 있거나 캡처 중이라면 중지
      if (listening || isCapturing) {
        SpeechRecognition.stopListening();
        setIsCapturing(false);
        setIsProcessing(false);
        // 필요하다면 여기서 즉시 전송 로직을 넣을 수도 있지만,
        // 보통 말하다 끊으면 아래 무음 감지 로직이나 전송 로직이 처리하도록 둡니다.
        return;
      }

      // 시작 로직
      resetTranscript();      // 기존 자막 초기화
      setIsCapturing(true);   // 캡처 상태 시작
      setIsProcessing(true);  // 처리 중 상태
      setCapturedText('');
      lastTextTimeRef.current = Date.now();

      // 빈 사용자 말풍선 즉시 생성
      addMessage({
        text: '...', // 혹은 빈 문자열
        isUser: true,
        timestamp: Date.now(),
      });

      // 음성 인식 시작
      await SpeechRecognition.startListening({
        continuous: true,
        language: langCode
      });

    } catch (e) {
      console.error('Mic toggle failed:', e);
    }
  }, [listening, isCapturing, langCode, resetTranscript, setIsCapturing, addMessage]);

  /**
   * ✅ DEV 모드: 키보드 입력을 WebSpeech 흐름처럼 처리
   */
  const runDevAsIfWebSpeech = useCallback(async (fullText: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const now = Date.now();

    setIsProcessing(true);
    setIsCapturing(true);
    setCapturedText('');
    lastTextTimeRef.current = now;

    // 핫워드 관련 ref 설정 제거됨

    addMessage({
      text: '',
      isUser: true,
      timestamp: now,
    });

    updateLastMessage(fullText);
    setCapturedText(fullText);
    lastTextTimeRef.current = Date.now();

    try {
      await sendTextToApi(fullText, adminId, kioskId);
    } catch (err) {
      console.error('Error processing DEV input:', err);
    } finally {
      isSendingRef.current = false;
      setIsCapturing(false);
      setIsProcessing(false);
      resetTranscript();
      setCapturedText('');
    }
  }, [addMessage, updateLastMessage, sendTextToApi, adminId, kioskId, resetTranscript, setIsCapturing]);


  // 📝 실시간 음성 감지 및 텍스트 업데이트 (수정됨: 키워드 슬라이싱 로직 제거)
  useEffect(() => {
    if (transcript && isCapturing) {
      lastTextTimeRef.current = Date.now();

      // 키워드 잘라내기 없이 전체 transcript 사용
      const currentText = transcript.trim();

      setCapturedText(currentText);
      updateLastMessage(currentText);
    }
  }, [transcript, isCapturing, updateLastMessage]);

  // 🔇 무음 감지 및 자동 전송 (기존 유지)
  // 말하다가 2초간 침묵하면 자동으로 전송
  useEffect(() => {
    if (!isCapturing) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      // 마지막 입력 후 2초 경과 시
      if (now - lastTextTimeRef.current > 2000) {
        SpeechRecognition.stopListening(); // 듣기 중단
        setIsCapturing(false);
        setIsProcessing(false);

        if (capturedText) {
          sendTextToApi(capturedText, adminId, kioskId).catch((err) => {
            console.error('Error processing voice input:', err);
          });
        } else {
            // 아무 말도 안 하고 2초 지나면 그냥 꺼짐 (빈 말풍선 처리 필요시 로직 추가)
             resetTranscript();
        }

        // 상태 초기화
        resetTranscript();
        setCapturedText('');
      }
    }, 100);
    return () => clearInterval(checkInterval);
  }, [isCapturing, capturedText, sendTextToApi, adminId, kioskId, resetTranscript, setIsCapturing]);

  // ❌ 키워드 감지 useEffect 삭제됨 ❌

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
            ${listening ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
          `}
          title={listening ? '마이크 끄기' : '마이크 켜기'}
        >
          {listening ? '■' : '🎤'}
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
                 {listening ? 'Listening...' : 'Click Mic to Speak'}
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
            // 커버 클릭 시 바로 시작하고 싶다면 아래 주석 해제
            // handleToggleMic();
          }}
        >
          <p className="text-4xl font-bold text-indigo-600 animate-pulse">터치하여 시작</p>
        </div>
      )}
    </div>
  );
};

export default Voice;