import React, { useEffect, useRef } from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
}

// ... (상수 및 헬퍼 함수들은 기존 코드 유지: KIOSK, ENTRY, pointsToPath 등) ...
const KIOSK = { id: "kiosk", x: 920, y: 3400, guideX: 920, guideY: 3425 };
const ENTRY = { x: 840, y: 3425 };
const WEST_TURN = { x: 840, y: 285 };
const Y_MIN = 285;
const Y_MAX = 3472.5;

function clampY(y: number) { return Math.min(Y_MAX, Math.max(Y_MIN, y)); }

function is64to100(shop: Shop) {
  const n = Number(shop.id);
  return Number.isFinite(n) && n >= 64 && n <= 100;
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
}

export function MapView({
  shops,
  selectedShopId,
  onShopSelect,
  showNavigation,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null); // 스크롤 제어를 위한 Ref
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // [추가] 상점 선택 시 자동 스크롤 로직
  useEffect(() => {
    if (selectedShop && containerRef.current) {
      const container = containerRef.current;
      const svgHeight = 3600; // SVG 원본 높이
      
      // 현재 컨테이너의 실제 스크롤 높이와 SVG 비율 계산
      const scrollRatio = container.scrollHeight / svgHeight;
      
      // 타겟 Y 위치 (SVG 좌표 -> 픽셀 좌표 변환)
      const targetPixelY = selectedShop.y * scrollRatio;
      
      // 화면 중앙에 오도록 계산 (뷰포트 높이의 절반을 뺌)
      const centerOffset = container.clientHeight / 2;
      
      container.scrollTo({
        top: targetPixelY - centerOffset,
        behavior: "smooth",
      });
    }
  }, [selectedShopId, showNavigation]); // 상점이 바뀌거나 내비게이션 시작 시 동작

  const getPathData = () => {
     // ... (기존 로직 동일) ...
     if (!showNavigation || !selectedShop) return "";
     const target = { x: selectedShop.guideX, y: selectedShop.guideY };
     const targetYOnHall = clampY(target.y);
     const pts: Array<{ x: number; y: number }> = [];

     pts.push({ x: KIOSK.guideX, y: KIOSK.guideY });
     pts.push({ x: ENTRY.x, y: ENTRY.y });

     if (is64to100(selectedShop)) {
       pts.push({ x: ENTRY.x, y: WEST_TURN.y });
       pts.push({ x: WEST_TURN.x, y: WEST_TURN.y });
       pts.push({ x: target.x, y: WEST_TURN.y });
       pts.push({ x: target.x, y: target.y });
       return pointsToPath(pts);
     }
     pts.push({ x: ENTRY.x, y: targetYOnHall });
     pts.push({ x: target.x, y: targetYOnHall });
     pts.push({ x: target.x, y: target.y });
     return pointsToPath(pts);
  };

  return (
    // [변경] h-full로 부모 높이 상속, 부드러운 스크롤
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden bg-[var(--color-map-bg)] scroll-smooth custom-scrollbar"
    >
      <svg
        viewBox="0 0 1200 3600"
        style={{ width: "100%", aspectRatio: "1200/3600" }} // 반응형 유지
        className="block min-w-[600px]" // 너무 작아지지 않도록 최소 너비 설정
        preserveAspectRatio="xMidYMin meet"
      >
        {/* 배경 및 구조물 */}
        <rect x="0" y="0" width="1200" height="3600" fill="var(--color-map-bg)" />
        <rect x="50" y="50" width="1100" height="3500" fill="var(--color-map-bg)" stroke="var(--color-map-border-light)" strokeWidth="1" rx="8" />
        
        <g fill="var(--color-map-white)" stroke="var(--color-map-border)">
          <rect x="50" y="270" width="1100" height="30" />
          <rect x="820" y="270" width="40" height="3280" />
        </g>

        {/* 상점들 */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            return (
              <g
                key={shop.id}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: selectedShopId && !isSelected ? 0.6 : 1 }} // 선택 안된 상점은 약간 흐리게
                onClick={() => onShopSelect(shop.id)}
              >
                <rect
                  x={shop.x} y={shop.y} width={shop.width} height={shop.height} rx="2"
                  fill={isSelected ? "var(--color-map-shop-selected)" : "var(--color-map-white)"}
                  stroke={isSelected ? "var(--color-map-shop-selected-stroke)" : "var(--color-map-shop-stroke)"}
                  strokeWidth={isSelected ? "3" : "1"}
                  className="transition-all duration-300"
                />
                <text
                  x={shop.x + shop.width / 2} y={shop.y + shop.height / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isSelected ? "white" : "var(--color-map-text-gray)"}
                  className="select-none text-[12px] font-medium"
                >
                  {shop.number}
                </text>
              </g>
            );
          })}
        </g>

        {/* 경로 안내 */}
        {showNavigation && selectedShop && (
          <g>
            <path
              d={getPathData()}
              fill="none"
              stroke="var(--color-map-shop-selected)"
              strokeWidth="12" // 경로 두께 약간 증가
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="20, 20"
              opacity="0.8"
            >
              <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            {/* 목적지 핑핑이 효과 */}
            <circle cx={selectedShop.guideX} cy={selectedShop.guideY} r="16" fill="var(--color-map-destination)" className="animate-pulse" />
          </g>
        )}

        {/* 키오스크 위치 */}
        <g transform={`translate(${KIOSK.x}, ${KIOSK.y})`}>
          <circle r="30" cx="25" cy="25" fill="var(--color-map-current-location)" fillOpacity="0.2" />
          <rect width="50" height="50" rx="12" fill="var(--color-map-current-location)" />
          <text x="25" y="30" textAnchor="middle" fill="white" className="text-[10px] font-bold">현위치</text>
        </g>
      </svg>
    </div>
  );
}