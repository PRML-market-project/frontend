import { useState } from 'react';
import { data, useNavigate } from 'react-router-dom';
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
    <div className='w-screen h-screen flex flex-col md:flex-row bg-white'>
      {/* Left Section */}
      <div className='w-full md:w-1/2 flex flex-col justify-center items-center px-10 space-y-6 bg-stone-50'>
        <h1 className='text-5xl font-bold text-indigo-600 mb-8'>
          Daejo Market
        </h1>

        <form onSubmit={handleSubmit} className='w-full max-w-sm space-y-5'>
          <div>
            <label
              htmlFor='store-name'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              가게 이름
            </label>
            <input
              id='store-name'
              name='store-name'
              type='text'
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='가게 이름을 입력하세요'
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='table-number'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              테이블 번호
            </label>
            <input
              id='table-number'
              name='table-number'
              type='number'
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
              placeholder='테이블 번호를 입력하세요'
              value={kioskNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>

          <button
            type='submit'
            className='w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            키오스크 등록
          </button>
        </form>
      </div>

      {/* Right Section */}
      <div className='w-full md:w-1/2 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center'>
        <div
          className='w-48 h-48 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400
              text-indigo-900 font-extrabold text-7xl tracking-tight flex items-center justify-center
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
            DM
          </span>
        </div>
      </div>
    </div>
  );
};
export default StoreEntry;
