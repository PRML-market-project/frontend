import React from "react";
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
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-map-bg)] touch-none overscroll-none">
      {/* 지도 영역 컨테이너 */}
      <div className="absolute inset-0 w-full h-full">
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