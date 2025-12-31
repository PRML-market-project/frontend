import React from "react";
import { Shop } from "@/types/shop";

interface ShopDetailsPanelProps {
  shop: Shop | null;
  isNavigating: boolean;
  onStartNavigation: () => void;
}

export function ShopDetailsPanel({
  shop,
  isNavigating,
  onStartNavigation,
}: ShopDetailsPanelProps) {
  if (!shop) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        {/* [변경] 아이콘 배경: gray-100 -> muted (은은한 베이지) */}
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {/* [변경] 아이콘 색상: gray-400 -> muted-foreground (따뜻한 회색) */}
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {/* [변경] 안내 문구: gray-500 -> muted-foreground */}
        <p className="text-muted-foreground">
          상점을 선택하여 정보를 확인하고
          <br />
          길안내를 받아보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-10 overflow-y-auto bg-card">
      <div className="mb-8">
        {/* [변경] 뱃지: blue 계열 -> secondary (연한 베이지 배경 + 진한 텍스트) */}
        <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full mb-3 uppercase tracking-wider border border-border">
          점포 {shop.number}
        </span>
        {/* [변경] 제목: gray-800 -> foreground (진한 브라운/그레이) */}
        <h2 className="text-3xl font-black text-foreground leading-tight">
          {shop.name}
        </h2>
        {/* [변경] 카테고리: gray-500 -> muted-foreground */}
        <p className="text-lg text-muted-foreground mt-2 font-medium">
          {shop.category}
        </p>
      </div>

      <div className="space-y-8">
        <button
          onClick={onStartNavigation}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
            isNavigating
              ? // [변경] 안내 중 (Red): destructive 사용 (파스텔톤 붉은색)
                "bg-destructive/10 text-destructive border-2 border-destructive/30"
              : // [변경] 안내 시작 (Blue): primary 사용 (샌드 골드)
                "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isNavigating ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            )}
          </svg>
          {isNavigating ? "안내 종료" : "여기까지 길안내"}
        </button>

        {/* [변경] 정보 박스 1: gray-50 -> muted/30 (아주 연한 배경) + border */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border">
          {/* [변경] 라벨: gray-400 -> muted-foreground */}
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-widest">
            상세 위치
          </h4>
          {/* [변경] 내용: gray-700 -> foreground */}
          <p className="text-foreground font-semibold">
            {shop.section}
          </p>
        </div>

        {/* [변경] 정보 박스 2 */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border">
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-widest">
            운영 정보
          </h4>
          <p className="text-foreground font-semibold leading-relaxed">
            {shop.hours || "오전 08:00 - 오후 07:00"}
          </p>
        </div>
      </div>
    </div>
  );
}