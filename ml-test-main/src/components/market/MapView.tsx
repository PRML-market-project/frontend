import React, { useState, useRef, useEffect, useMemo } from "react";
import { Shop } from "@/types/shop";

interface MapViewProps {
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  showNavigation: boolean;
}

/**
 * Assumptions about Shop type:
 * - id: string
 * - number: string (ex: "1점" / "12" etc)
 * - name?: string (shop name in Korean)  ✅ used if exists
 * - x,y,width,height,guideX,guideY: number
 *
 * If your Shop uses a different name field, change `getShopLabel()`.
 */

// --- constants / helpers ---
const KIOSK = { id: "kiosk", x: 920, y: 3400, guideX: 920, guideY: 3425 };
const ENTRY = { x: 840, y: 3425 };
const WEST_TURN = { x: 840, y: 285 };
const Y_MIN = 285;
const Y_MAX = 3472.5;

function clampY(y: number) {
  return Math.min(Y_MAX, Math.max(Y_MIN, y));
}

function is64to100(shop: Shop) {
  const n = Number((shop as any).id);
  return Number.isFinite(n) && n >= 64 && n <= 100;
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

function getShopLabel(shop: Shop) {
  // ✅ show store name. If your type uses `shop.shopName` or `shop.title`, change here.
  const anyShop = shop as any;
  const name = (anyShop.name || anyShop.shopName || anyShop.title || "").toString().trim();
  const number = (anyShop.number || "").toString().trim();

  // If name exists: "가게명\n(번호)" 형태
  if (name) return { line1: name, line2: number ? number : "" };

  // fallback: number only
  return { line1: number || "상점", line2: "" };
}

export function MapView({ shops, selectedShopId, onShopSelect, showNavigation }: MapViewProps) {
  // true: fit screen / false: fit width + scroll
  const [isFitScreen, setIsFitScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) || null,
    [shops, selectedShopId]
  );

  // safer UX: background click toggles mode (keep your behavior)
  const handleBackgroundClick = () => setIsFitScreen((prev) => !prev);

  // scroll mode auto-focus selected shop
  useEffect(() => {
    if (!isFitScreen && selectedShop && containerRef.current) {
      const container = containerRef.current;
      const svgHeight = 3600;
      const scrollRatio = container.scrollHeight / svgHeight;
      const targetPixelY = selectedShop.y * scrollRatio;
      const centerOffset = container.clientHeight / 2;

      container.scrollTo({ top: targetPixelY - centerOffset, behavior: "smooth" });
    }
  }, [selectedShopId, isFitScreen, selectedShop]);

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

  /**
   * Visual scale:
   * - FitScreen: everything smaller (so labels should stay readable)
   * - FitWidth: bigger (scroll mode)
   */
  const labelSize = isFitScreen ? 12 : 14;
  const subLabelSize = isFitScreen ? 10 : 12;

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className={[
        "h-full w-full transition-all duration-300",
        isFitScreen
          ? "overflow-hidden flex justify-center items-center cursor-zoom-in"
          : "overflow-y-auto overflow-x-hidden cursor-zoom-out scroll-smooth custom-scrollbar",
      ].join(" ")}
      style={
        {
          // ✅ Light theme tokens
          "--map-bg": "#F5F7FB",
          "--map-surface": "#FFFFFF",
          "--map-surface-2": "#F0F3FA",
          "--map-border": "#D6DEEE",
          "--map-border-strong": "#B9C6E2",
          "--map-hall": "#EEF2FF",
          "--map-hall-stroke": "#CBD5FF",
          "--map-text": "#0F172A",
          "--map-muted": "#475569",
          "--map-shop": "#FFFFFF",
          "--map-shop-stroke": "#C8D2EA",
          "--map-shop-hover": "#F3F6FF",
          "--map-selected": "#2563EB",
          "--map-selected-stroke": "#1D4ED8",
          "--map-route": "#16A34A",
          "--map-route-glow": "rgba(22,163,74,0.25)",
          "--map-you": "#F59E0B",
          "--map-you-glow": "rgba(245,158,11,0.25)",
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 1200 3600"
        preserveAspectRatio={isFitScreen ? "xMidYMid meet" : "xMidYMin meet"}
        className={[
          "block transition-all duration-300",
          isFitScreen ? "h-full w-auto max-w-full" : "w-full h-auto min-w-[600px]",
        ].join(" ")}
      >
        <defs>
          {/* Soft shadow for the whole map panel */}
          <filter id="panelShadow" x="-20%" y="-5%" width="140%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#0B1220" floodOpacity="0.12" />
          </filter>

          {/* Card shadow for shops */}
          <filter id="shopShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0B1220" floodOpacity="0.10" />
          </filter>

          {/* Selected glow */}
          <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#2563EB" floodOpacity="0.35" />
          </filter>

          {/* Route glow */}
          <filter id="routeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.6 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Text outline for readability */}
          <style>
            {`
              .map-text-outline {
                paint-order: stroke;
                stroke: rgba(255,255,255,0.85);
                stroke-width: 3px;
                stroke-linejoin: round;
              }
            `}
          </style>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="1200" height="3600" fill="var(--map-bg)" />

        {/* Map panel */}
        <rect
          x="50"
          y="50"
          width="1100"
          height="3500"
          rx="28"
          fill="var(--map-surface)"
          stroke="var(--map-border)"
          strokeWidth="1"
          filter="url(#panelShadow)"
        />

        {/* Header area (optional visual polish) */}
        <rect x="70" y="70" width="1060" height="170" rx="20" fill="var(--map-surface-2)" />
        <text x="100" y="150" fontSize="28" fontWeight="700" fill="var(--map-text)">
          Market Map
        </text>
        <text x="100" y="190" fontSize="14" fontWeight="500" fill="var(--map-muted)">
          탭: 확대/축소 · 상점 선택: 길안내
        </text>

        {/* Hallways */}
        <g>
          <rect x="50" y="270" width="1100" height="30" fill="var(--map-hall)" stroke="var(--map-hall-stroke)" />
          <rect x="820" y="270" width="40" height="3280" fill="var(--map-hall)" stroke="var(--map-hall-stroke)" />
        </g>

        {/* Shops */}
        <g>
          {shops.map((shop) => {
            const isSelected = selectedShopId === shop.id;

            const centerX = shop.x + shop.width / 2;
            const centerY = shop.y + shop.height / 2;

            const { line1, line2 } = getShopLabel(shop);

            // label layout
            const hasTwoLines = Boolean(line2);
            const labelY1 = hasTwoLines ? centerY - 6 : centerY;
            const labelY2 = centerY + 14;

            return (
              <g
                key={shop.id}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: selectedShopId && !isSelected ? 0.68 : 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShopSelect(shop.id);
                }}
              >
                {/* Card */}
                <rect
                  x={shop.x}
                  y={shop.y}
                  width={shop.width}
                  height={shop.height}
                  rx="14"
                  fill={isSelected ? "var(--map-selected)" : "var(--map-shop)"}
                  stroke={isSelected ? "var(--map-selected-stroke)" : "var(--map-shop-stroke)"}
                  strokeWidth={isSelected ? 3 : 1.2}
                  filter={isSelected ? "url(#selectedGlow)" : "url(#shopShadow)"}
                />

                {/* Subtle hover overlay (works when not selected) */}
                {!isSelected && (
                  <rect
                    x={shop.x}
                    y={shop.y}
                    width={shop.width}
                    height={shop.height}
                    rx="14"
                    fill="transparent"
                    className="transition-colors duration-200"
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Label pill behind text (so it reads on any color) */}
                <g pointerEvents="none">
                  <rect
                    x={shop.x + 10}
                    y={shop.y + shop.height / 2 - (hasTwoLines ? 22 : 14)}
                    width={shop.width - 20}
                    height={hasTwoLines ? 44 : 28}
                    rx="14"
                    fill={isSelected ? "rgba(0,0,0,0.18)" : "rgba(15,23,42,0.04)"}
                    stroke={isSelected ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.08)"}
                  />

                  {/* Store name */}
                  <text
                    x={centerX}
                    y={labelY1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={labelSize}
                    fontWeight={800}
                    fill={isSelected ? "white" : "var(--map-text)"}
                    className={!isSelected ? "map-text-outline" : ""}
                  >
                    {line1}
                  </text>

                  {/* Number */}
                  {hasTwoLines && (
                    <text
                      x={centerX}
                      y={labelY2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={subLabelSize}
                      fontWeight={700}
                      fill={isSelected ? "rgba(255,255,255,0.92)" : "var(--map-muted)"}
                      className={!isSelected ? "map-text-outline" : ""}
                    >
                      {line2}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* Route */}
        {showNavigation && selectedShop && (
          <g className="pointer-events-none">
            {/* glow layer */}
            <path
              d={getPathData()}
              fill="none"
              stroke="var(--map-route-glow)"
              strokeWidth={isFitScreen ? 22 : 14}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="1"
              filter="url(#routeGlow)"
              vectorEffect="non-scaling-stroke"
            />
            {/* solid layer */}
            <path
              d={getPathData()}
              fill="none"
              stroke="var(--map-route)"
              strokeWidth={isFitScreen ? 14 : 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isFitScreen ? "26, 26" : "18, 18"}
              opacity="0.95"
              vectorEffect="non-scaling-stroke"
            >
              <animate attributeName="stroke-dashoffset" from="44" to="0" dur="1s" repeatCount="indefinite" />
            </path>

            {/* destination pin */}
            <g transform={`translate(${selectedShop.guideX}, ${selectedShop.guideY})`}>
              <circle r={isFitScreen ? 18 : 14} fill="var(--map-route)" />
              <circle r={isFitScreen ? 30 : 22} fill="var(--map-route)" opacity="0.15" />
            </g>
          </g>
        )}

        {/* Current location (kiosk) */}
        <g transform={`translate(${KIOSK.guideX}, ${KIOSK.guideY})`} className="pointer-events-none">
          <circle r={isFitScreen ? 46 : 30} fill="var(--map-you)" opacity="0.18" />
          <circle r={isFitScreen ? 62 : 42} fill="var(--map-you-glow)" opacity="0.22" />

          <rect
            width={isFitScreen ? 96 : 64}
            height={isFitScreen ? 96 : 64}
            x={isFitScreen ? -48 : -32}
            y={isFitScreen ? -48 : -32}
            rx="18"
            fill="var(--map-you)"
            filter="url(#shopShadow)"
          />

          <text
            x="0"
            y={isFitScreen ? 5 : 3}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={isFitScreen ? 16 : 12}
            fontWeight={900}
          >
            현위치
          </text>
        </g>
      </svg>
    </div>
  );
}
