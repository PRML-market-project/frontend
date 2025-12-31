import { Outlet } from 'react-router-dom';
import { useNavigationStore } from '@/store/navigationStore';
import ChatHistory from '@/features/chat/components/ChatHistory';
import Cart from '@/features/order/components/Cart';
import Voice from '@/features/order/components/Voice';
import CategoryList from '@/features/order/components/CategoryList';
import Header from '@/features/order/components/Header';

const MainLayout = () => {
  return (
    <div className="flex flex-col w-screen h-screen bg-[url('/background.png')] overflow-hidden">
      {/* 헤더 - 상단 고정 */}
      <Header />

      {/* 카테고리 - 상단 가로 탭 형태 */}
      <div className="flex-shrink-0">
        <CategoryList />
      </div>

      {/* 메인 콘텐츠 영역 - 중앙 큰 영역 */}
      <main className="flex-1 overflow-y-auto bg-[url('/background.png')] min-h-0 px-2">
        <Outlet />
      </main>

      {/* 채팅 + 음성 - 하단 고정 */}
      <div className="flex-shrink-0 flex gap-2 p-2 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex-1 bg-[var(--color-blue-100)] rounded-xl overflow-hidden min-h-[120px] max-h-[150px]">
          <ChatHistory />
        </div>
        <div className="flex-shrink-0">
          <Voice />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

