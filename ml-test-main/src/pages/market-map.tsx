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
    setNavigation,
    resetMap
  } = useMapStore();

  const currentShop = marketShops.find((s) => s.id === selectedShopId) || null;

  // 페이지 언마운트 시 상태 초기화 (선택 사항)
  // useEffect(() => {
  //   return () => resetMap();
  // }, []);

  return (
    // [변경] Grid 레이아웃 제거 -> 전체 화면을 사용하는 Relative 컨테이너
    // 상단 헤더 등을 제외한 높이 계산 (예: calc(100vh - 60px))
    <main className="relative w-full h-[calc(100vh-60px)] overflow-hidden bg-[var(--color-map-bg)]">
      
      {/* 1. 지도 영역 (배경) */}
      <div className="w-full h-full">
        <MapView
          shops={marketShops}
          selectedShopId={selectedShopId}
          onShopSelect={selectShop}
          showNavigation={isNavigationActive}
        />
      </div>

      {/* 2. 상세 정보 패널 (플로팅 카드) */}
      {/* 상점이 선택되었을 때만 우측 상단에 표시 */}
      {currentShop && (
        <div className="absolute top-6 right-6 z-20">
          <ShopDetailsPanel
            shop={currentShop}
            isNavigating={isNavigationActive}
            onStartNavigation={() => setNavigation(!isNavigationActive)}
            onClose={() => selectShop(null)} // 닫기 기능 추가 필요 시 사용
          />
        </div>
      )}
    </main>
  );
}