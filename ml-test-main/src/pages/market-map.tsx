import React, { useEffect } from "react";
import { MapView } from "@/components/market/MapView";
import { ShopDetailsPanel } from "@/components/market/ShopDetailsPanel";
import { marketShops } from "@/data/market-shops";
import { useMapStore } from "@/store/mapStore";

export default function MarketMapPage() {
  const {
    selectedShopId,
    isNavigationActive,
    selectShop,
    setNavigation
  } = useMapStore();

  const currentShop = marketShops.find((s) => s.id === selectedShopId) || null;

  return (
    // [수정 핵심] h-screen -> h-full
    // h-screen: 화면 전체 높이 (레이아웃 무시하고 꽉 채움 -> 하단바와 겹침)
    // h-full: 부모(MainLayout의 Outlet 영역)가 주는 높이만큼만 채움 (하단바 위까지만 옴)
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-map-bg)] relative">
      
      {/* 지도 영역 컨테이너: flex-1로 남은 공간 꽉 채우기 */}
      <div className="flex-1 relative w-full h-full min-h-0">
        
        {/* 실제 지도 컴포넌트 */}
        <MapView
          shops={marketShops}
          selectedShopId={selectedShopId}
          onShopSelect={selectShop}
          showNavigation={isNavigationActive}
        />

        {/* 플로팅 팝업 */}
        {currentShop && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="pointer-events-auto">
              <ShopDetailsPanel
                shop={currentShop}
                isNavigating={isNavigationActive}
                onStartNavigation={() => setNavigation(!isNavigationActive)}
                onClose={() => selectShop(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}