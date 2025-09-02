import { Outlet } from 'react-router-dom';
import { useNavigationStore } from '@/store/navigationStore';
import ChatHistory from '@/features/chat/components/ChatHistory';
import Cart from '@/features/order/components/Cart';
import Voice from '@/features/order/components/Voice';
import CategoryList from '@/features/order/components/CategoryList';
import Header from '@/features/order/components/Header';

const MainLayout = () => {
  return (
    <div className="flex flex-col w-screen h-screen bg-[url('/background.png')]  overflow-hidden">
        <Header />

      {/* 본문 영역 */}
      <div className="flex flex-1 overflow-hidden min-h-0 pt-1">
        {/* 왼쪽 카테고리 */}
        <CategoryList />

        {/* 가운데 콘텐츠 */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Outlet 영역 */}
          <main className="flex-1 overflow-y-auto bg-[url('/background.png')] min-h-0">
            <Outlet />
          </main>

          {/* 채팅 + 음성 */}
          <div className="flex h-[20%] p-4 gap-4 min-h-0 ">
            <div className="flex-1 bg-blue-100 rounded-2xl overflow-y-auto">
              <ChatHistory />
            </div>
            <Voice />
          </div>
        </div>

        {/* 오른쪽 장바구니*/}
          <Cart />
        </div>
      </div>
  );
};

export default MainLayout;

