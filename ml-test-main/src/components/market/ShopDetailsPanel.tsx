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
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
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
        <p className="text-gray-500">
          상점을 선택하여 정보를 확인하고
          <br />
          길안내를 받아보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-10 overflow-y-auto">
      <div className="mb-8">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          점포 {shop.number}
        </span>
        <h2 className="text-3xl font-black text-gray-800 leading-tight">
          {shop.name}
        </h2>
        <p className="text-lg text-gray-500 mt-2 font-medium">
          {shop.category}
        </p>
      </div>

      <div className="space-y-8">
        <button
          onClick={onStartNavigation}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
            isNavigating
              ? "bg-red-50 text-red-600 border-2 border-red-200"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
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

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">
            상세 위치
          </h4>
          <p className="text-gray-700 font-semibold">
            {shop.section}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">
            운영 정보
          </h4>
          <p className="text-gray-700 font-semibold leading-relaxed">
            {shop.hours || "오전 08:00 - 오후 07:00"}
          </p>
        </div>
      </div>
    </div>
  );
}