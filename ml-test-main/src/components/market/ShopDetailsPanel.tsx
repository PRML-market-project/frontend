import React from "react";
import { Shop } from "@/types/shop";

interface ShopDetailsPanelProps {
  shop: Shop | null;
  isNavigating: boolean;
  onStartNavigation: () => void;
  onClose?: () => void; // 패널 닫기용
}

export function ShopDetailsPanel({
  shop,
  isNavigating,
  onStartNavigation,
  onClose,
}: ShopDetailsPanelProps) {
  if (!shop) return null; // 선택된 상점이 없으면 아예 렌더링하지 않음 (지도를 넓게 보기 위해)

  return (
    // [변경] 전체 높이 사이드바 -> 플로팅 카드 스타일
    // max-h 설정으로 내용이 길어지면 카드 내부에서 스크롤
    <div 
      className="w-[380px] max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-md 
                 rounded-3xl shadow-2xl border border-white/20 overflow-hidden 
                 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
    >
      {/* 카드 헤더 영역 */}
      <div className="p-6 pb-0 relative">
        {/* 닫기 버튼 (옵션) */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
        
        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3 border border-amber-200">
          점포 {shop.number}
        </span>
        <h2 className="text-2xl font-black text-gray-900 leading-tight">
          {shop.name}
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          {shop.category}
        </p>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* 길안내 버튼 */}
        <button
          onClick={onStartNavigation}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-md ${
            isNavigating
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" // 안내 종료 스타일
              : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95" // 안내 시작 스타일
          }`}
        >
           {isNavigating ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              안내 종료
            </>
           ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              길안내 시작
            </>
           )}
        </button>

        {/* 정보 박스들 */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">상세 위치</h4>
          <p className="text-gray-800 font-semibold text-sm">{shop.section}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">운영 정보</h4>
          <p className="text-gray-800 font-semibold text-sm">{shop.hours || "08:00 - 19:00"}</p>
        </div>
      </div>
    </div>
  );
}