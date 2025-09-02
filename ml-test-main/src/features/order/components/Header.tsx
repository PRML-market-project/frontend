import { useLanguageStore } from '@/store/languageStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SpeechRecognition from 'react-speech-recognition';
const Header = () => {
  const { language, toggleLanguage } = useLanguageStore();
  const { kioskId, kioskNumber } = useParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeactivate = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/kiosk/deactivate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ kioskId }),
        }
      );

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to deactivate kiosk:', error);
    }
  };

  return (
    <header className="w-full h-16 bg-[url('/background.png')] shadow-md flex items-center justify-between px-6">
      <div className='flex items-center justify-center gap-2'>
        <div
          className='w-9 aspect-square text-sm rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400
              text-indigo-900 font-extrabold tracking-tight flex items-center justify-center
              shadow-[0_10px_30px_rgba(99,102,241,0.4)] border border-indigo-300 relative overflow-hidden'
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
        <h1 className='text-xl font-extrabold text-indigo-900 tracking-tight whitespace-nowrap'>
          {language === 'en' ? 'Malang Order' : '말랑 오더'}
        </h1>

        {/* Settings Button */}
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className='p-2 hover:bg-indigo-100 rounded-full transition-colors'
            aria-label='Settings'
          >
            <img src='/settings.svg' alt='Settings' className='w-5 h-5' />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className='absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50'>
              <button
                onClick={handleDeactivate}
                className='w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors'
              >
                {language === 'en' ? 'Deactivate Table' : '테이블 비활성화'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 중간 문구 */}
      <span className='text-lg text-indigo-900 font-medium ml-4 whitespace-nowrap'>
        {language === 'en'
          ? 'Call "Mallang" to start ordering.'
          : '"말랑아" 라고 불러 주문을 시작해 보세요'}
      </span>

      <div className='flex items-center gap-4'>
        <div className='text-lg font-semibold text-indigo-900 flex items-center gap-2'>
          <span>{language === 'en' ? 'Table Number:' : '테이블 번호:'}</span>
          <span className='bg-indigo-300 w-10 h-10 rounded-full flex items-center justify-center text-2xl text-indigo-900 font-bold shadow-sm select-none'>
            {kioskNumber}
          </span>
        </div>

        {/* 언어 토글 버튼 */}
        <button
          onClick={() => {
            console.log('한영 전환');
            toggleLanguage();
            SpeechRecognition.stopListening();
            return SpeechRecognition.startListening({
              continuous: true,
              language: language === 'ko' ? 'en-US' : 'ko-KR',
            });
          }}
          className='bg-indigo-200 hover:bg-indigo-300 text-indigo-900 font-semibold py-1 px-3 rounded transition-colors'
          aria-label='Toggle language'
        >
          {language === 'en' ? 'KO' : 'ENG'}
        </button>
      </div>
    </header>
  );
};

export default Header;
