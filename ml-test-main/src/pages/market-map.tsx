import React, { useState } from 'react';
import { motion } from 'framer-motion';
import stores from '@/data/stores.json';
import { useLanguageStore } from '@/store/languageStore';

const MarketMap: React.FC = () => {
  const { language } = useLanguageStore();
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (id: number) => {
    setSelected(id);
    // 3번 깜빡임 후 자동 해제 (3초 후)
    setTimeout(() => setSelected(null), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">
        {/*language === 'en' ? 'Daejo Market Map' : '대조시장 지도'*/}
      </h1>

      <div className="relative shadow-lg rounded-xl bg-white overflow-hidden">
        <svg
          width="2000"
          height="1600"
          viewBox="0 0 2200 1800"
          className="rounded-lg"
        >
          {/* 지도 이미지 */}
          <image href="/images/daecho_map.png" width="2000" height="1000" />

          {/* 점포 표시 */}
          {stores.map((store) => (
            <motion.rect
              key={store.id}
              x={store.x}
              y={store.y}
              width={store.width}
              height={store.height}
              rx="4"
              ry="4"
              fill="transparent" // ✅ 기본색 없음
              stroke="orange"
              strokeWidth="2"
              onClick={() => handleSelect(store.id)}
              cursor="pointer"
              animate={
                selected === store.id
                  ? { opacity: [1, 0.2, 1, 0.2, 1, 0.2, 1] } // ✅ 총 3번 깜빡임
                  : { opacity: 1 }
              }
              transition={{ duration: 3, ease: 'easeInOut' }} // 3초 동안 깜빡임 완료
            />
          ))}
        </svg>

        {/* 선택된 점포 이름 표시 */}
        {selected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-md text-gray-800 font-semibold">
            {stores.find((s) => s.id === selected)?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketMap;
