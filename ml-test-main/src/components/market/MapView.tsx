import React from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
}

const KIOSK = {
  id: "kiosk",
  x: 920,
  y: 3400,
  guideX: 920,
  guideY: 3425,
};

const ENTRY = { x: 840, y: 3425 };
const WEST_TURN = { x: 840, y: 285 };
const Y_MIN = 285;
const Y_MAX = 3472.5;

function clampY(y: number) {
  return Math.min(Y_MAX, Math.max(Y_MIN, y));
}

function is64to100(shop: Shop) {
  const n = Number(shop.id);
  return Number.isFinite(n) && n >= 64 && n <= 100;
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

export function MapView({
  shops,
  selectedShopId,
  onShopSelect,
  showNavigation,
}: MapViewProps) {
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  const getPathData = () => {
    if (!showNavigation || !selectedShop) return "";

    const target = {
      x: selectedShop.guideX,
      y: selectedShop.guideY,
    };

    // 회전 후에는 Y축이 메인 통로가 됨
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
    // 가로 스크롤 대신 세로 스크롤이 필요할 수 있으나, 요구사항에 맞춰 레이아웃 유지
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[var(--color-map-bg)]">
      <svg
        viewBox="0 0 1200 3600"
        style={{ width: "100%", aspectRatio: "1200/3600" }}
        className="block"
        preserveAspectRatio="xMidYMin meet"
      >
        {/* 배경 전 영역 */}
        <rect x="0" y="0" width="1200" height="3600" fill="var(--color-map-bg)" />

        {/* 전체 테두리 라인 */}
        <rect
          x="50"
          y="50"
          width="1100"
          height="3500"
          fill="var(--color-map-bg)"
          stroke="var(--color-map-border-light)"
          strokeWidth="1"
          rx="8"
        />

        {/* 복도(길) 영역 회전 반영 */}
        <g fill="var(--color-map-white)" stroke="var(--color-map-border)">
          {/* 세로로 긴 복도 */}
          <rect x="50" y="270" width="1100" height="30" />
          {/* 하단 가로 복도 */}
          <rect x="820" y="270" width="40" height="3280" />
        </g>

        {/* 상점 레이어 */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            return (
              <g
                key={shop.id}
                className="cursor-pointer"
                onClick={() => onShopSelect(shop.id)}
              >
                <rect
                  x={shop.x}
                  y={shop.y}
                  width={shop.width}
                  height={shop.height}
                  rx="2"
                  fill={isSelected ? "var(--color-map-shop-selected)" : "var(--color-map-white)"}
                  stroke={isSelected ? "var(--color-map-shop-selected-stroke)" : "var(--color-map-shop-stroke)"}
                  strokeWidth={isSelected ? "2" : "1"}
                  className="transition-colors duration-200"
                />
                <text
                  x={shop.x + shop.width / 2}
                  y={shop.y + shop.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? "white" : "var(--color-map-text-gray)"}
                  className="select-none text-[12px]"
                  // 텍스트가 세로로 긴 상점에서 깨지지 않도록 회전이 필요하면 아래 속성 추가 가능
                  // transform={`rotate(90, ${shop.x + shop.width / 2}, ${shop.y + shop.height / 2})`}
                >
                  {shop.number}
                </text>
              </g>
            );
          })}
        </g>

        {/* 경로 안내 레이어 */}
        {showNavigation && selectedShop && (
          <g>
            <path
              d={getPathData()}
              fill="none"
              stroke="var(--color-map-shop-selected)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="15, 15"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="30"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>

            {/* 목적지 표시 */}
            <circle
              cx={selectedShop.guideX}
              cy={selectedShop.guideY}
              r="12"
              fill="var(--color-map-destination)"
              className="animate-pulse"
            />
          </g>
        )}

        {/* 현위치 (키오스크) */}
        <g transform={`translate(${KIOSK.x}, ${KIOSK.y})`}>
          <rect width="50" height="50" rx="4" fill="var(--color-map-current-location)" />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fill="white"
            className="text-[10px] font-bold"
          >
            현위치
          </text>
        </g>
      </svg>
    </div>
  );
}