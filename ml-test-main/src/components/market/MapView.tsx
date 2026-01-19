import React, { useState, useRef, useEffect } from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
}

// --- 상수 및 헬퍼 함수 (이전과 동일) ---
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
  // [상태] true: 한 화면에 꽉 참 (Fit Screen) / false: 가로 꽉 참 + 스크롤 (Fit Width)
  const [isFitScreen, setIsFitScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // [기능] 빈 공간 클릭 시 뷰 모드 토글
  const handleBackgroundClick = () => {
    setIsFitScreen((prev) => !prev);
  };

  // [기능] 스크롤 모드(isFitScreen === false)일 때 선택된 상점으로 자동 이동
  useEffect(() => {
    if (!isFitScreen && selectedShop && containerRef.current) {
      const container = containerRef.current;
      const svgHeight = 3600;
      const scrollRatio = container.scrollHeight / svgHeight;
      const targetPixelY = selectedShop.y * scrollRatio;
      const centerOffset = container.clientHeight / 2;

      container.scrollTo({
        top: targetPixelY - centerOffset,
        behavior: "smooth",
      });
    }
  }, [selectedShopId, isFitScreen]); // 모드가 바뀌거나 샵이 바뀌면 실행

  // 경로 데이터 계산
  const getPathData = () => {
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

  // [스타일] 모드에 따른 폰트 크기 설정
  // Fit Screen(작아짐) -> text-[10px] (약 12px의 80%)
  // Fit Width(커짐) -> text-[12px]
  const fontSizeClass = isFitScreen ? "text-[10px]" : "text-[12px]";

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick} // 배경 클릭 감지
      className={`
        h-full w-full bg-[var(--color-map-bg)] transition-all duration-300
        ${isFitScreen 
          ? "overflow-hidden flex justify-center items-center cursor-zoom-in" // 한눈에 보기
          : "overflow-y-auto overflow-x-hidden cursor-zoom-out scroll-smooth custom-scrollbar" // 스크롤 모드
        }
      `}
    >
      <svg
        viewBox="0 0 1200 3600"
        preserveAspectRatio={isFitScreen ? "xMidYMid meet" : "xMidYMin meet"}
        className={`
          block transition-all duration-300
          ${isFitScreen 
            ? "h-full w-auto max-w-full" // 높이에 맞춤 (전체 보기)
            : "w-full h-auto min-w-[600px]" // 너비에 맞춤 (스크롤 보기)
          }
        `}
      >
        {/* 배경 (클릭 이벤트를 확실히 받기 위해 rect에 이벤트 추가) */}
        <rect
          x="0" y="0" width="1200" height="3600"
          fill="var(--color-map-bg)"
          // SVG 내부 요소 클릭도 배경 클릭으로 간주 (상점 제외)
        />
        <rect
          x="50" y="50" width="1100" height="3500"
          fill="var(--color-map-bg)" stroke="var(--color-map-border-light)"
          strokeWidth="1" rx="8"
        />

        <g fill="var(--color-map-white)" stroke="var(--color-map-border)">
          <rect x="50" y="270" width="1100" height="30" />
          <rect x="820" y="270" width="40" height="3280" />
        </g>

        {/* 상점들 */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            const n = Number(shop.id);
            const isVerticalText = n >= 64 && n <= 83;
            const centerX = shop.x + shop.width / 2;
            const centerY = shop.y + shop.height / 2;

            return (
              <g
                key={shop.id}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: selectedShopId && !isSelected ? 0.6 : 1 }}
                onClick={(e) => {
                  e.stopPropagation(); // [중요] 상점 클릭 시 줌 토글 방지
                  onShopSelect(shop.id);
                }}
              >
                <rect
                  x={shop.x} y={shop.y} width={shop.width} height={shop.height} rx="2"
                  fill={isSelected ? "var(--color-map-shop-selected)" : "var(--color-map-white)"}
                  stroke={isSelected ? "var(--color-map-shop-selected-stroke)" : "var(--color-map-shop-stroke)"}
                  strokeWidth={isSelected ? "3" : "1"}
                  className="transition-all duration-300"
                />

                <text
                  x={centerX} y={centerY}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isSelected ? "white" : "var(--color-map-text-gray)"}
                  // [핵심] 상태에 따라 폰트 크기 변경
                  className={`select-none font-medium transition-all duration-300 ${fontSizeClass}`}
                >
                  {isVerticalText ? (
                    <>
                      <tspan x={centerX} dy="-0.6em">점</tspan>
                      <tspan x={centerX} dy="1.2em">{shop.number.replace('점', '').trim()}</tspan>
                    </>
                  ) : (
                    shop.number
                  )}
                </text>
              </g>
            );
          })}
        </g>

        {/* 경로 안내 */}
        {showNavigation && selectedShop && (
          <g className="pointer-events-none">
            <path
              d={getPathData()}
              fill="none"
              stroke="var(--color-map-destination)"
              // 전체 보기일 때 경로가 너무 얇아 보이지 않도록 두께 조정
              strokeWidth={isFitScreen ? "20" : "12"}
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={isFitScreen ? "30, 30" : "20, 20"}
              opacity="0.8"
            >
              <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1s" repeatCount="indefinite" />
            </path>

            <circle
              cx={selectedShop.guideX}
              cy={selectedShop.guideY}
              r={isFitScreen ? "24" : "16"} // 점 크기도 모드에 따라 조정
              fill="var(--color-map-destination)"
            />
          </g>
        )}

        {/* 현위치 */}
        <g transform={`translate(${KIOSK.guideX}, ${KIOSK.guideY})`} className="pointer-events-none">

          {/* 2. 내부 요소들을 모두 (0,0)을 중심으로 다시 그리기 */}
          <circle
            r={isFitScreen ? "50" : "30"}
            cx="0" cy="0" // 중심을 0,0으로 설정
            fill="var(--color-map-current-location)" fillOpacity="0.2"
          />
          <rect
            width={isFitScreen ? "80" : "50"}
            height={isFitScreen ? "80" : "50"}
            // 너비/높이의 절반만큼 왼쪽/위로 이동하여 중앙 정렬
            x={isFitScreen ? "-40" : "-25"}
            y={isFitScreen ? "-40" : "-25"}
            rx="12" fill="var(--color-map-current-location)"
          />
          <text
            x="0" // 가로 중앙
            y={isFitScreen ? "5" : "1.6"} // 세로 중앙 (텍스트 높이 고려하여 약간 아래로)
            textAnchor="middle"
            dominantBaseline="middle" // 수직 중앙 정렬 추가
            fill="white"
            className={`${isFitScreen ? "text-[16px]" : "text-[10px]"} font-bold select-none`}
          >
            현위치
          </text>
        </g>
      </svg>
    </div>
  );
}