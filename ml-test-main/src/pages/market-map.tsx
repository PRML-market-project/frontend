import React, { useEffect } from "react"; // useEffect 필요할 수 있음
import { MapView } from "@/components/market/MapView";
import { ShopDetailsPanel } from "@/components/market/ShopDetailsPanel";
import { marketShops } from "@/data/market-shops";
import { useMapStore } from "@/store/mapStore"; // Store Import

export default function MarketMapPage() {
  // const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // const [showNavigation, setShowNavigation] = useState(false);

  // ✅ 전역 Store 사용
  const {
    selectedShopId,
    isNavigationActive,
    selectShop,
    setNavigation,
    resetMap
  } = useMapStore();

  // 컴포넌트 마운트 시 초기화가 필요하다면 사용 (선택사항)
  // useEffect(() => {
  //   return () => resetMap(); // 페이지 나갈 때 초기화
  // }, []);

  const handleShopSelect = (id: string) => {
    // 가게를 직접 클릭했을 때는 길안내는 끄고 가게만 선택
    selectShop(id);
  };

  const currentShop = marketShops.find((s) => s.id === selectedShopId) || null;

  return (
    <main className="grid grid-cols-[1fr_24rem] h-screen w-full bg-[#F5F3F0] overflow-hidden font-sans">
      <div className="min-w-0 h-[calc(100vh-320px)] relative overflow-hidden shadow-inner">
        <MapView
          shops={marketShops}
          selectedShopId={selectedShopId} // Store 값 전달
          onShopSelect={handleShopSelect}
          showNavigation={isNavigationActive} // Store 값 전달
        />
      </div>

      <aside className="h-[calc(100vh-320px)] bg-white shadow-2xl z-10 border-l border-[#E5E3E0] overflow-hidden">
        <ShopDetailsPanel
          shop={currentShop}
          isNavigating={isNavigationActive} // Store 값 전달
          // 버튼 클릭 시 길안내 토글 (스토어 함수 사용)
          onStartNavigation={() => setNavigation(!isNavigationActive)}
        />
      </aside>
    </main>
  );
}