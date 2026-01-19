// 현재 재생 중인 오디오를 추적하기 위한 변수
let currentAudio: HTMLAudioElement | null = null;

/**
 * 오픈소스 TTS API를 사용하여 텍스트를 음성으로 변환하고 재생합니다.
 * @param text - 음성으로 변환할 텍스트
 * @param language - 언어 코드 ('ko' 또는 'en')
 */
export const getSpeech = async (text: any, language: 'ko' | 'en' = 'ko') => {
  if (!text) {
    console.warn('No text provided for speech synthesis');
    return;
  }

  try {
    // 이전 재생 중인 오디오가 있으면 중지
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    // TTS API URL (환경 변수에서 가져오거나 기본값 사용)
    const ttsApiUrl = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000/api/tts';
    
    // API 요청
    const response = await fetch(ttsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify({
        text: String(text),
        language: language === 'ko' ? 'ko' : 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
    }

    // 오디오 데이터를 Blob으로 받기
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // 오디오 재생
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.volume = 0.2; // 기존 볼륨 설정과 동일

    // 재생 완료 시 URL 해제
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      console.log('Speech ended:', text);
    };

    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    };

    audio.onplay = () => {
      console.log('Speech started:', text);
    };

    await audio.play();
  } catch (error) {
    console.error('TTS API error:', error);
    
    // API 실패 시 폴백으로 크롬 웹 TTS 사용 (선택사항)
    // 주석을 해제하면 API 실패 시 자동으로 크롬 TTS로 전환됩니다.
    /*
    console.log('Falling back to browser TTS...');
    fallbackToBrowserTTS(text, language);
    */
  }
};

/**
 * 폴백용 브라우저 TTS 함수 (필요시 사용)
 */
function fallbackToBrowserTTS(text: string, language: 'ko' | 'en') {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }

  // 이전 재생 중지
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const lang = language === 'ko' ? 'ko-KR' : 'en-US';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.volume = 0.375;

  window.speechSynthesis.speak(utterance);
}
