'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CornerDownLeft } from 'lucide-react';
import { processApiResponse } from './../../utils/food-analysis';

const ActionMenu = ({
  centerX,
  centerY,
  onClose,
}: {
  centerX: number;
  centerY: number;
  onClose: () => void;
}) => {
  const verticalSpacing = 60; // 메뉴 간 수직 간격
  const menuItems = [1, 2, 3, 4]; // 4개의 메뉴 아이템

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/75 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed z-50 bg-red-400"
        style={{ left: centerX + 40, top: centerY - 114 }} // 시작 위치 조정
      >
        {menuItems.map((item, index) => (
          <motion.div
            key={item}
            className="absolute w-36 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white shadow-lg"
            style={{
              top: index * verticalSpacing,
            }}
            initial={{ scale: 0, x: -50, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            {item}
            <p className="text-sm">먹을까? 말까?</p>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

const SpeechAnalyzerActionMenu = () => {
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const micButtonRef = useRef<HTMLButtonElement>(null);

  const handleMicClick = () => {
    if (micButtonRef.current) {
      const rect = micButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setShowActions(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="flex items-center rounded-2xl shadow-sm border px-4 py-4 bg-black">
          <button
            ref={micButtonRef}
            type="button"
            className="rounded-full w-12 h-12 bg-gray-50 shadow-md flex items-center justify-center"
            onClick={handleMicClick}
          >
            <Mic className="h-6 w-6 text-gray-600" />
          </button>

          <input
            placeholder="음식을 말하거나 직접 입력하세요..."
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent p-2 text-sm tracking-tighter text-white"
            onClick={handleMicClick}
          />
          <button className="rounded-full">
            <CornerDownLeft className="h-5 w-5 text-gray-400" size={12} />
          </button>
        </div>

        <AnimatePresence>
          {showActions && (
            <ActionMenu
              centerX={menuPosition.x}
              centerY={menuPosition.y}
              onClose={() => setShowActions(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpeechAnalyzerActionMenu;
