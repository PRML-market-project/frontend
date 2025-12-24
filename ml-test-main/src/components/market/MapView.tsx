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
  x: 3400,
  y: 920,
  guideX: 3425,
  guideY: 920,
};

const ENTRY = { x: 3425, y: 840 };
const WEST_TURN = { x: 285, y: 840 };
const X_MIN = 285;
const X_MAX = 3472.5;

function clampX(x: number) {
  return Math.min(X_MAX, Math.max(X_MIN, x));
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

    const targetXOnHall = clampX(target.x);
    const pts: Array<{ x: number; y: number }> = [];

    pts.push({ x: KIOSK.guideX, y: KIOSK.guideY });
    pts.push({ x: ENTRY.x, y: ENTRY.y });

    if (is64to100(selectedShop)) {
      pts.push({ x: WEST_TURN.x, y: ENTRY.y });
      pts.push({ x: WEST_TURN.x, y: WEST_TURN.y });
      pts.push({ x: WEST_TURN.x, y: target.y });
      pts.push({ x: target.x, y: target.y });
      return pointsToPath(pts);
    }

    pts.push({ x: targetXOnHall, y: ENTRY.y });
    pts.push({ x: targetXOnHall, y: target.y });
    pts.push({ x: target.x, y: target.y });

    return pointsToPath(pts);
  };

  return (
    /* 수정 포인트:
      1. h-full w-full: 부모 영역 꽉 채움
      2. overflow-x-auto: 가로 스크롤 허용
      3. overflow-y-hidden: 세로 스크롤 방지
    */
    <div className="h-full overflow-x-auto overflow-y-hidden bg-[#FAFAF9]">
      <svg
        viewBox="0 0 3600 1200"
        /* 핵심 수정 사항:
           1. height: "100%" -> 화면 세로 높이에 강제로 맞춤.
           2. aspectRatio: "3600/1200" -> 높이가 100%일 때 비율에 맞춰 가로 길이를 강제로 늘림.
              (이렇게 해야 화면이 좁아도 지도가 찌그러지지 않고 옆으로 넘어갑니다)
        */
        style={{ height: "100%", aspectRatio: "3600/1200" }}
        className="block"
        // preserveAspectRatio를 제거하거나 none으로 두는 것보다,
        // CSS로 크기를 강제했으므로 xMinYMid meet을 유지해도 꽉 차게 나옵니다.
        preserveAspectRatio="xMinYMid meet"
      >
        <rect x="0" y="0" width="3600" height="1200" fill="#FAFAF9" />

        <rect
          x="50"
          y="50"
          width="3500"
          height="1100"
          fill="#FAFAF9"
          stroke="#D4D1CC"
          strokeWidth="1"
          rx="8"
        />

        <g fill="#FFFFFF" stroke="#E5E3E0">
          <rect x="270" y="50" width="30" height="1100" />
          <rect x="270" y="820" width="3280" height="40" />
        </g>

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
                  fill={isSelected ? "#3B82F6" : "#FFFFFF"}
                  stroke={isSelected ? "#2563EB" : "#D1D5DB"}
                  strokeWidth={isSelected ? "2" : "1"}
                  className="transition-colors duration-200"
                />
                <text
                  x={shop.x + shop.width / 2}
                  y={shop.y + shop.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? "white" : "#6B7280"}
                  className="select-none text-[12px]"
                >
                  {shop.number}
                </text>
              </g>
            );
          })}
        </g>

        {showNavigation && selectedShop && (
          <g>
            <path
              d={getPathData()}
              fill="none"
              stroke="#3B82F6"
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

            <circle
              cx={selectedShop.guideX}
              cy={selectedShop.guideY}
              r="12"
              fill="#EF4444"
              className="animate-pulse"
            />
          </g>
        )}

        <g transform={`translate(${KIOSK.x}, ${KIOSK.y})`}>
          <rect width="50" height="50" rx="4" fill="#1F2937" />
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