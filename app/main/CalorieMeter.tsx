import React from 'react';
import { Beef, Droplet, Flame, Wheat, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface CalorieMeterProps {
  title?: string;
  currentCalories: number;
  dailyGoal: number;
  nutrition: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

const CalorieMeter = ({ currentCalories, dailyGoal, nutrition, title }: CalorieMeterProps) => {
  // viewBox 기준 값 설정
  const vbWidth = 400;
  const vbHeight = 200;
  const centerX = vbWidth / 2;
  const centerY = vbHeight;
  const radius = 180;
  const strokeWidth = 32;

  const arcPath = `
  M ${centerX - radius} ${centerY}
  A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
`;

  const progress = Math.min(Math.max((dailyGoal - currentCalories) / dailyGoal, 0), 1);
  const progressAngle = Math.PI - Math.PI * progress;
  const progressEnd = {
    x: centerX + radius * Math.cos(progressAngle),
    y: centerY - radius * Math.sin(progressAngle),
  };

  const progressPath = `
  M ${centerX - radius} ${centerY}
  A ${radius} ${radius} 0 0 1 ${progressEnd.x} ${progressEnd.y}
`;

  const basePath = `
  M ${centerX - radius} ${centerY}
  A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
`;

  return (
    <Card className="w-full max-w-lg bg-white p-4 ">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        <div className="relative w-full aspect-[2/1]">
          <svg
            viewBox={`0 0 ${vbWidth} ${vbHeight}`}
            className="w-full "
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="1" dy="1" result="offsetblur" />
                <feFlood floodColor="#ff0000" floodOpacity="0.2" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d={basePath}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            <motion.path
              d={basePath}
              fill="none"
              stroke="#333333"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#shadow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress }} // 여기가 문제였네요. 1이 아닌 progress 값을 써야 합니다
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            />
          </svg>

          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 mb-4 bg-gray-50 p-2 shadow-md">
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            {/* <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
              <div className="w-4 h-4 bg-red-600 rounded-full"></div> */}
          </div>

          <div className="flex flex-col   items-center justify-center  absolute -bottom-8 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
            <div className="flex items-end">
              <p
                className={`text-4xl font-semibold tracking-tighter ${(() => {
                  const remainingPercent = ((dailyGoal - currentCalories) / dailyGoal) * 100;

                  if (remainingPercent <= 30) return 'text-gray-400';
                  return 'text-green-600';
                })()}`}
              >
                {dailyGoal - currentCalories}
              </p>
              <p className="text-base text-gray-600 ml-1">kcal</p>
            </div>

            <hr className="border-gray-400  w-full mb-1" />
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <Beef size={16} color="#4b5563" />
                <p
                  className={`text-sm ${nutrition.protein < 0 ? 'text-red-600' : 'text-gray-600'}`}
                >
                  {Math.round(nutrition.protein)}
                  <span className="text-xs text-gray-600 tracking-tighter">g</span>
                </p>
              </div>
              <p className="text-gray-400 text-sm">/</p>
              <div className="flex items-center">
                <Droplet size={16} color="#4b5563" />
                <p className={`text-sm ${nutrition.fat < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {Math.round(nutrition.fat)}
                  <span className="text-xs text-gray-600 tracking-tighter">g</span>
                </p>
              </div>
              <p className="text-gray-400 text-sm">/</p>
              <div className="flex items-center">
                <Wheat size={16} color="#4b5563" />
                <p className={`text-sm ${nutrition.carbs < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {Math.round(nutrition.carbs)}
                  <span className="text-xs text-gray-600 tracking-tighter">g</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CalorieMeter;
