import React, { useRef } from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
}

// --- 상수 및 설정 ---
const KIOSK = { id: "kiosk", x: 400, y: 3450, guideX: 400, guideY: 3450 };
const MAIN_CORRIDOR_X = 420; // 메인 세로 복도 위치
const TOP_CORRIDOR_Y = 290;  // 상단 가로 복도 위치

const categoryColors: Record<string, string> = {
  "식당": "#FFEDD5",
  "정육": "#FEE2E2",
  "수산": "#DBEAFE",
  "청과": "#DCFCE7",
  "식품": "#FEF9C3",
  "농산물 가공": "#E7DED0",
  "잡화": "#EDE9FE",
  "서비스업": "#FCE7F3",
  "공실": "#F3F4F6",
};

function isWestSide(shop: Shop) {
  const n = Number(shop.id);
  return (n >= 64 && n <= 100) || shop.section?.includes("서측");
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
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // 경로 데이터 생성 로직
  const getPathData = () => {
    if (!showNavigation || !selectedShop) return "";
    const pts: Array<{ x: number; y: number }> = [];
    pts.push({ x: KIOSK.guideX, y: KIOSK.guideY });
    pts.push({ x: MAIN_CORRIDOR_X, y: KIOSK.guideY });

    if (isWestSide(selectedShop)) {
      if (selectedShop.y < 300) {
        pts.push({ x: MAIN_CORRIDOR_X, y: TOP_CORRIDOR_Y });
        pts.push({ x: selectedShop.guideX, y: TOP_CORRIDOR_Y });
      } else {
        pts.push({ x: MAIN_CORRIDOR_X, y: selectedShop.guideY });
      }
    } else {
      pts.push({ x: MAIN_CORRIDOR_X, y: selectedShop.guideY });
    }
    pts.push({ x: selectedShop.guideX, y: selectedShop.guideY });
    return pointsToPath(pts);
  };

  // 폰트 크기 고정
  const fontSizeClass = "text-[42px]";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-[#f0f2f5] overflow-hidden flex justify-center items-center"
    >
      <svg
        viewBox="0 0 2800 3600"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-auto"
      >
        {/* 배경 및 도로 */}
        <rect x="0" y="0" width="2800" height="3600" fill="#e5e7eb" />
        <g fill="#ffffff" stroke="#cbd5e1" strokeWidth="2">
          <rect x="400" y="270" width="40" height="3300" />
          <rect x="20" y="270" width="2760" height="40" />
        </g>

        {/* 상점 리스트 렌더링 */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            const centerX = shop.x + shop.width / 2;
            const centerY = shop.y + shop.height / 2;

            const bgColor = isSelected
              ? "#FFFFFF"
              : (categoryColors[shop.category] || "#F3F4F6");

            const borderColor = isSelected ? "#ef4444" : "#334155";
            const borderThickness = isSelected ? "12" : "1.5";

            return (
              <g
                key={shop.id}
                className="cursor-pointer"
                style={{ opacity: selectedShopId && !isSelected ? 0.6 : 1 }}
                onClick={(e) => { e.stopPropagation(); onShopSelect(shop.id); }}
              >
                <rect
                  x={shop.x} y={shop.y} width={shop.width} height={shop.height} rx="6"
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={borderThickness}
                  className="transition-all duration-200"
                />

                <text
                  x={centerX} y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? "#ef4444" : "#1e293b"}
                  className={`select-none font-black ${fontSizeClass}`}
                  style={{ letterSpacing: "-0.05em" }}
                >
                  {(() => {
                    const words = shop.name.split(' ');
                    const initialDy = words.length === 1 ? "0.14em" : `-${(words.length - 1) * 0.55}em`;

                    return words.map((word, index) => (
                      <tspan
                        key={index}
                        x={centerX}
                        dy={index === 0 ? initialDy : "1.1em"}
                      >
                        {word}
                      </tspan>
                    ));
                  })()}
                </text>
              </g>
            );
          })}
        </g>

        {/* 경로 안내 선 */}
        {showNavigation && selectedShop && (
          <g className="pointer-events-none">
            <path
              d={getPathData()}
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="40, 40"
            >
              <animate attributeName="stroke-dashoffset" from="80" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
            <circle cx={selectedShop.guideX} cy={selectedShop.guideY} r="30" fill="#ef4444">
              <animate attributeName="r" values="25;35;25" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* 현위치 표시 */}
        <g transform={`translate(${KIOSK.x}, ${KIOSK.y})`} className="pointer-events-none">
          <circle r="120" fill="#3b82f6" fillOpacity="0.15">
             <animate attributeName="r" values="110;130;110" dur="2s" repeatCount="indefinite" />
          </circle>
          <rect width="220" height="110" x="-110" y="-55" rx="55" fill="#3b82f6" stroke="#ffffff" strokeWidth="4" />
          <text
            y="5" textAnchor="middle" dominantBaseline="middle" fill="white"
            className="text-[40px] font-black"
          >
            현위치
          </text>
        </g>
      </svg>

      {/* 우측 하단 범례 패널 */}
      <div className="absolute right-8 bottom-8 bg-white/95 backdrop-blur-md p-7 rounded-[32px] shadow-2xl border border-gray-100 pointer-events-none min-w-[280px]">
        {/* 추가된 메인 타이틀 */}
        <h3 className="text-[20px] font-black text-gray-900 mb-1 px-1">대조시장 배치도</h3>
        <h4 className="text-[10px] font-black text-gray-400 mb-5 uppercase tracking-[0.2em] px-1">Shop Categories</h4>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md border border-black/10 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-[14px] font-extrabold text-gray-700 whitespace-nowrap">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}