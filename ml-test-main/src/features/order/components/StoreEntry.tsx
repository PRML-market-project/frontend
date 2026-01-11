import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKioskStore } from '../../../store/kioskStore';
import { toast } from 'sonner';

const StoreEntry = () => {
  const [storeName, setStoreName] = useState('');
  const [kioskNumber, setTableNumber] = useState('');
  const navigate = useNavigate();
  const setKioskData = useKioskStore((state) => state.setKioskData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 백엔드 API 통신 시도
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/kiosk/activate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeName,
            kioskNumber: parseInt(kioskNumber, 10),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status}. Trying local fallback...`
        );
      }

      const data = await response.json();
      setKioskData(data);
      navigate(`/${data.adminId}/${data.kioskId}/${kioskNumber}/order`);

      toast.success('Kiosk activated successfully from backend!');
    } catch (error: any) {
      // API 통신 실패 시, 로컬 파일 읽기
      console.error('API communication failed, using local data:', error);
      toast.error('API communication failed. Using local data.');

      try {
        // public 폴더의 mock 데이터 파일을 불러옵니다.
        const mockResponse = await fetch('/mock-kiosk-data.json');
        const mockData = await mockResponse.json();

        if (!mockResponse.ok) {
          throw new Error('Failed to load local mock data.');
        }

        setKioskData(mockData);
        // mock 데이터에는 kioskId가 있지만, kioskNumber는 입력값 그대로 사용합니다.
        navigate(
          `/${mockData.adminId}/${mockData.kioskId}/${kioskNumber}/order`
        );

        toast.success('Kiosk activated successfully with local mock data!');
      } catch (localError: any) {
        console.error('Error with local data:', localError);
        toast.error(localError.message || 'Failed to activate kiosk');
      }
    }
  };

  return (
    // [변경] 전체 배경: bg-white -> bg-background (다크/라이트 자동 대응)
    <div className='w-screen h-screen flex flex-col md:flex-row bg-background'>
      
      {/* Left Section */}
      {/* [변경] 좌측 배경: bg-stone-50 -> bg-card/30 (배경보다 아주 살짝 다른 톤) */}
      <div className='w-full md:w-1/2 flex flex-col justify-center items-center px-10 space-y-6 bg-card/30'>
        {/* [변경] 타이틀 색상: indigo-600 -> primary (Gold) */}
        <h1 className='text-5xl font-bold text-primary mb-8'>
          Daejo Market
        </h1>

        <form onSubmit={handleSubmit} className='w-full max-w-sm space-y-5'>
          <div>
            <label
              htmlFor='store-name'
              // [변경] 라벨 색상: gray-700 -> muted-foreground (은은한 텍스트)
              className='block text-sm font-medium text-muted-foreground mb-1'
            >
              가게 이름
            </label>
            <input
              id='store-name'
              name='store-name'
              type='text'
              required
              // [변경] 인풋 스타일: 테두리, 배경, 링 색상을 테마 변수로 교체
              className='w-full px-4 py-3 bg-background border border-input rounded-lg shadow-sm text-foreground 
                         focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/50'
              placeholder='가게 이름을 입력하세요'
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='table-number'
              className='block text-sm font-medium text-muted-foreground mb-1'
            >
              키오스크 번호
            </label>
            <input
              id='table-number'
              name='table-number'
              type='number'
              required
              // [변경] 위와 동일하게 스타일 적용
              className='w-full px-4 py-3 bg-background border border-input rounded-lg shadow-sm text-foreground 
                         focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/50'
              placeholder='키오스크 번호를 입력하세요'
              value={kioskNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>

          <button
            type='submit'
            // [변경] 버튼 스타일: indigo-600 -> primary (Gold), text-white -> text-primary-foreground (Black on Gold)
            className='w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-md 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors'
          >
            키오스크 등록
          </button>
        </form>
      </div>

      {/* Right Section */}
      {/* [변경] 우측 배경: Indigo Gradient -> Secondary Background (Black/Bronze or Light Beige) */}
      <div className='w-full md:w-1/2 bg-secondary flex items-center justify-center border-l border-border'>
        <div
          // [변경] 원형 로고: Indigo -> Gold Gradient (Header와 동일한 스타일)
          className='w-48 h-48 rounded-full bg-gradient-to-br from-ml-yellow-light to-ml-yellow
              text-black font-extrabold text-7xl tracking-tight flex items-center justify-center
              border border-ml-yellow relative overflow-hidden'
          style={{
            // CSS 변수값은 이미 Gold 계열로 변경되어 있으므로 이름 유지
            boxShadow: '0 0 40px var(--color-indigo-shadow)', 
          }}
        >
          <span
            style={{
              // 골드 배경 위라 글자는 어둡게 처리
              background: `linear-gradient(135deg, #000 0%, #333 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 2px 2px rgba(255,255,255,0.2))`,
            }}
          >
            DM
          </span>
        </div>
      </div>
    </div>
  );
};
export default StoreEntry;