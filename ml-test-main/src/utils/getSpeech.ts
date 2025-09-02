export const getSpeech = (text: any, language: 'ko' | 'en' = 'ko') => {
  let voices: any[] = [];
  let isSpeaking = false;

  //디바이스에 내장된 voice를 가져온다.
  const setVoiceList = () => {
    voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices);
  };

  // Initialize voices
  setVoiceList();

  // Handle voice loading
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setVoiceList;
  }

  const speech = (txt: string | undefined) => {
    if (!txt) {
      console.warn('No text provided for speech synthesis');
      return;
    }

    try {
      // Cancel any ongoing speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        console.log('Cancelled ongoing speech');
      }

      const lang = language === 'ko' ? 'ko-KR' : 'en-US';
      const utterThis = new SpeechSynthesisUtterance(txt);
      utterThis.lang = lang;
      utterThis.volume = 0.375;

      // Wait for voices to be loaded if they're not available yet
      if (voices.length === 0) {
        console.log('Waiting for voices to load...');
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          console.log('Voices loaded:', voices);
          speakWithVoice();
        };
        return;
      }

      speakWithVoice();

      function speakWithVoice() {
        /* 
          Find voice based on language
          For Korean: ko-KR or ko_KR
          For English: en-US or en_US
        */
        const targetVoice = voices.find(
          (elem) => elem.lang === lang || elem.lang === lang.replace('-', '_')
        );

        console.log(`Found ${language} voice:`, targetVoice);

        // Set voice if found, otherwise return
        if (targetVoice) {
          utterThis.voice = targetVoice;
        } else {
          console.warn(`No ${language} voice found. Available voices:`, voices);
          return;
        }

        // Add event listeners for debugging
        utterThis.onstart = () => {
          console.log('Speech started:', txt);
          isSpeaking = true;
        };

        utterThis.onend = () => {
          console.log('Speech ended:', txt);
          isSpeaking = false;
        };

        utterThis.onerror = (event) => {
          console.error('Speech error:', event);
          isSpeaking = false;

          // If the error is 'not-allowed', try again after a short delay
          if (event.error === 'not-allowed') {
            console.log('Retrying speech after error...');
            setTimeout(() => {
              if (!isSpeaking) {
                window.speechSynthesis.speak(utterThis);
              }
            }, 1000);
          }
        };

        //utterance를 재생(speak)한다.
        window.speechSynthesis.speak(utterThis);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      isSpeaking = false;
    }
  };

  speech(text);
};
