// ===========================
// MapView.tsx
// - ✅ "대조시장 배치도" 범례처럼 SVG 내부에 팝업(overlay)을 고정 배치
// - ✅ overlay(ShopDetailsPanel)의 실제 폭(420px)에 맞춰 foreignObject 사이즈 자동 계산
//   → 범례(LEGEND)와 겹치지 않도록 POPUP_H를 LEGEND_Y 기준으로 자동 산출
// ===========================
import React, { useRef } from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
  overlay?: React.ReactNode; // ✅ SVG 내부에 넣을 팝업(ShopDetailsPanel 등)
}

// --- 상수 및 설정 ---
const KIOSK = { id: "kiosk", x: 250, y: 3450, guideX: 250, guideY: 3450 };
const MAIN_CORRIDOR_X = 420;
const TOP_CORRIDOR_Y = 290;

const SVG_W = 2800;
const SVG_H = 3600;

const LEGEND_W = 1400;
const LEGEND_H = 1300;
const LEGEND_PAD = 80;
const LEGEND_X = SVG_W - LEGEND_W - LEGEND_PAD;
const LEGEND_Y = SVG_H - LEGEND_H - LEGEND_PAD;

const LEGEND_RADIUS = 120;
const LEGEND_TITLE_SIZE = 88;
const LEGEND_SUBTITLE_SIZE = 32;
const LEGEND_TITLE_Y = 160;
const LEGEND_SUBTITLE_Y = 230;

const LEGEND_ITEMS_START_Y = 350;
const LEGEND_COL_GAP = 540;
const LEGEND_ROW_GAP = 155;
const LEGEND_LEFT_X = 130;
const LEGEND_CIRCLE_R = 38;
const LEGEND_LABEL_X = 100;
const LEGEND_LABEL_SIZE = 56;

const POPUP_W = LEGEND_W;

const POPUP_BOTTOM_GAP = 80; // 범례와 팝업 사이 간격
const POPUP_X = LEGEND_X;    // 범례와 X축 라인을 맞춤 (우측 정렬)

const POPUP_H = 1100;
const POPUP_Y = LEGEND_Y - POPUP_H - POPUP_BOTTOM_GAP;


const categoryColors: Record<string, string> = {
  식당: "#FFEDD5",
  정육: "#FEE2E2",
  수산: "#DBEAFE",
  청과: "#DCFCE7",
  식품: "#FEF9C3",
  "농산물 가공": "#E7DED0",
  잡화: "#EDE9FE",
  서비스업: "#FCE7F3",
  공실: "#F3F4F6",
};

function isWestSide(shop: Shop) {
  const n = Number(shop.id);
  return (n >= 64 && n <= 100) || shop.section?.includes("서측");
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
}

const legendOrder: Array<keyof typeof categoryColors> = [
  "식당",
  "정육",
  "수산",
  "청과",
  "식품",
  "농산물 가공",
  "잡화",
  "서비스업",
  "공실",
];

export function MapView({
  shops,
  selectedShopId,
  onShopSelect,
  showNavigation,
  overlay,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  const getPathData = () => {
    if (!showNavigation || !selectedShop) return "";
    const pts: Array<{ x: number; y: number }> = [];

    // 1) 키오스크 -> 메인 복도 (가로)
    pts.push({ x: KIOSK.guideX, y: KIOSK.guideY });
    pts.push({ x: MAIN_CORRIDOR_X, y: KIOSK.guideY });

    // 2) 분기
    if (isWestSide(selectedShop)) {
      pts.push({ x: MAIN_CORRIDOR_X, y: TOP_CORRIDOR_Y });
      pts.push({ x: selectedShop.guideX, y: TOP_CORRIDOR_Y });
    } else {
      pts.push({ x: MAIN_CORRIDOR_X, y: selectedShop.guideY });
    }

    // 3) 마지막: 상점 guide point로
    pts.push({ x: selectedShop.guideX, y: selectedShop.guideY });

    return pointsToPath(pts);
  };

  const fontSizeClass = "text-[36px]";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-[#f0f2f5] overflow-hidden flex justify-center items-center"
    >
      <svg viewBox="0 0 2800 3600" preserveAspectRatio="xMidYMid meet" className="block h-full w-auto">
        {/* 배경 및 도로 */}
        <rect x="0" y="0" width="2800" height="3600" fill="#e5e7eb" />
        <g fill="#ffffff" stroke="#cbd5e1" strokeWidth="2">
          <rect x="400" y="270" width="40" height="3300" />
          <rect x="20" y="270" width="2760" height="40" />
        </g>

        {/* 상점 */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            const centerX = shop.x + shop.width / 2;
            const centerY = shop.y + shop.height / 2;

            const bgColor = isSelected ? "#FFFFFF" : categoryColors[shop.category] || "#F3F4F6";
            const borderColor = isSelected ? "#ef4444" : "#334155";
            const borderThickness = isSelected ? "12" : "1.5";

            return (
              <g
                key={shop.id}
                className="cursor-pointer"
                style={{ opacity: selectedShopId && !isSelected ? 0.6 : 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShopSelect(shop.id);
                }}
              >
                <rect
                  x={shop.x}
                  y={shop.y}
                  width={shop.width}
                  height={shop.height}
                  rx="6"
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={borderThickness}
                  className="transition-all duration-200"
                />

                <text
                  x={centerX}
                  y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? "#ef4444" : "#1e293b"}
                  className={`select-none font-black ${fontSizeClass}`}
                  style={{ letterSpacing: "-0.05em" }}
                >
                  {(() => {
                    const words = shop.name.split(" ");
                    const initialDy =
                      words.length === 1 ? "0.14em" : `-${(words.length - 1) * 0.55}em`;

                    return words.map((word, index) => (
                      <tspan key={index} x={centerX} dy={index === 0 ? initialDy : "1.1em"}>
                        {word}
                      </tspan>
                    ));
                  })()}
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
              stroke="#ef4444"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="40, 40"
            >
              <animate attributeName="stroke-dashoffset" from="80" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
            <circle cx={selectedShop.guideX} cy={selectedShop.guideY} r="30" fill="#ef4444">
              <animate attributeName="r" values="25;35;25" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* 현위치 */}
        <g transform={`translate(${KIOSK.x}, ${KIOSK.y})`} className="pointer-events-none">
          <circle r="120" fill="#3b82f6" fillOpacity="0.15">
            <animate attributeName="r" values="110;130;110" dur="2s" repeatCount="indefinite" />
          </circle>
          <rect width="220" height="110" x="-110" y="-55" rx="55" fill="#3b82f6" stroke="#ffffff" strokeWidth="4" />
          <text y="5" textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[40px] font-black">
            현위치
          </text>
        </g>

        {/* ✅ 범례(기존 스타일 유지) */}
        <g transform={`translate(${LEGEND_X}, ${LEGEND_Y})`} pointerEvents="none">
          {/*
          <rect x="18" y="26" width={LEGEND_W} height={LEGEND_H} rx={LEGEND_RADIUS} fill="#000" opacity="0.12" />
          <rect x="10" y="16" width={LEGEND_W} height={LEGEND_H} rx={LEGEND_RADIUS} fill="#000" opacity="0.08" />
          */}

          <rect
            width={LEGEND_W}
            height={LEGEND_H}
            rx={LEGEND_RADIUS}
            fill="#ffffff"
            fillOpacity="0.96"
            stroke="#e5e7eb"
            strokeWidth="3"
          />

          <text x={120} y={LEGEND_TITLE_Y} textAnchor="start" fontSize={LEGEND_TITLE_SIZE} fontWeight={900} fill="#111827">
            대조시장 배치도
          </text>

          <text
            x={120}
            y={LEGEND_SUBTITLE_Y}
            textAnchor="start"
            fontSize={LEGEND_SUBTITLE_SIZE}
            fontWeight={800}
            fill="#9ca3af"
            letterSpacing="0.28em"
          >
            SHOP CATEGORIES
          </text>

          {legendOrder.map((category, index) => {
            const color = categoryColors[category];
            const col = index % 2;
            const row = Math.floor(index / 2);

            const x = LEGEND_LEFT_X + col * LEGEND_COL_GAP;
            const y = LEGEND_ITEMS_START_Y + row * LEGEND_ROW_GAP;

            return (
              <g key={category} transform={`translate(${x}, ${y})`}>
                <circle
                  cx={LEGEND_CIRCLE_R}
                  cy={LEGEND_CIRCLE_R}
                  r={LEGEND_CIRCLE_R}
                  fill={color}
                  stroke="#111827"
                  strokeOpacity="0.12"
                  strokeWidth="3"
                />
                <circle
                  cx={LEGEND_CIRCLE_R - 10}
                  cy={LEGEND_CIRCLE_R - 12}
                  r={LEGEND_CIRCLE_R - 18}
                  fill="#ffffff"
                  opacity="0.25"
                />
                <text
                  x={LEGEND_LABEL_X}
                  y={LEGEND_CIRCLE_R + 16}
                  textAnchor="start"
                  fontSize={LEGEND_LABEL_SIZE}
                  fontWeight={800}
                  fill="#111827"
                >
                  {category}
                </text>
              </g>
            );
          })}
        </g>

        {/* ✅ SVG 내부 팝업(ShopDetailsPanel) - 폭/높이 자동 맞춤(범례와 안 겹치게) */}
        {overlay && (
          <foreignObject x={POPUP_X} y={POPUP_Y} width={POPUP_W} height={POPUP_H} pointerEvents="auto">
            <div
              {...({ xmlns: "http://www.w3.org/1999/xhtml" } as any)}
              style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
            >
              {overlay}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
