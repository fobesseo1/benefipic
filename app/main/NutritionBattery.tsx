import React from 'react';
import { BatteryWarning, Beef, Droplet, Flame, Wheat } from 'lucide-react';

// 스타일 정의
const styles = `
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes pulse-bar-1 {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes pulse-bar-2 {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.75;
    }
  }

  @keyframes pulse-bar-3 {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes pulse-bar-4 {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-pulse-bar-1 {
    animation: pulse-bar-1 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-pulse-bar-2 {
    animation: pulse-bar-2 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s;
  }

  .animate-pulse-bar-3 {
    animation: pulse-bar-3 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.6s;
  }

  .animate-pulse-bar-4 {
    animation: pulse-bar-4 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.9s;
  }
`;

interface NutritionBatteryProps {
  data?: {
    calories?: { current: number; target: number };
    protein?: { current: number; target: number };
    fat?: { current: number; target: number };
    carbs?: { current: number; target: number };
  };
}

const DEFAULT_DATA = {
  calories: { current: 2411, target: 2500 },
  protein: { current: 76, target: 100 },
  fat: { current: 66, target: 70 },
  carbs: { current: 377, target: 300 },
};

const STATUS_CONFIG = {
  calories: {
    icon: Flame,
    name: '칼로리',
    getMessage: (percentage: number) => {
      if (percentage >= 100) return { text: '목표 달성! 🎯', color: 'text-green-600' };
      if (percentage >= 80) return { text: '조금만 더! ✨', color: 'text-green-600' };
      return { text: `${Math.round(100 - percentage)}% 남았어요`, color: 'text-blue-500' };
    },
    getColor: (percentage: number) => (percentage >= 100 ? 'bg-green-600' : 'bg-blue-500'),
  },
  protein: {
    icon: Beef,
    name: '단백질',
    getMessage: (percentage: number) => {
      if (percentage >= 100) return { text: '단백질 섭취 완료! 💪', color: 'text-green-600' };
      return { text: '더 섭취해도 좋아요! 💪', color: 'text-blue-500' };
    },
    getColor: () => 'bg-blue-500',
  },
  fat: {
    icon: Droplet,
    name: '지방',
    getMessage: (percentage: number) => {
      if (percentage >= 100) return { text: '적정량을 초과했어요! ⚠️', color: 'text-orange-500' };
      if (percentage >= 80) return { text: '조금만 주의하세요! 🚦', color: 'text-orange-400' };
      return { text: '적절한 섭취량이에요 👍', color: 'text-green-600' };
    },
    getColor: (percentage: number) =>
      percentage >= 100 ? 'bg-orange-500' : percentage >= 80 ? 'bg-orange-400' : 'bg-green-500',
  },
  carbs: {
    icon: Wheat,
    name: '탄수화물',
    getMessage: (percentage: number) => {
      if (percentage >= 100) return { text: '탄수화물 과다섭취! ⚠️', color: 'text-red-500' };
      if (percentage >= 80)
        return { text: '적정량에 거의 도달했어요! 🎯', color: 'text-orange-400' };
      return { text: '적절한 섭취량이에요 👍', color: 'text-green-600' };
    },
    getColor: (percentage: number) =>
      percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-orange-400' : 'bg-green-500',
  },
} as const;

function NutritionBatteryItem({
  type,
  current,
  target,
}: {
  type: keyof typeof STATUS_CONFIG;
  current: number;
  target: number;
}) {
  const percentage = Math.min(Math.round((current / target) * 100), 120);
  const config = STATUS_CONFIG[type];
  const Icon = config.icon;
  const status = config.getMessage(percentage);
  const color = config.getColor(percentage);

  const activeBars = Math.min(Math.ceil((percentage / 120) * 4), 4);
  const bars = Array(4)
    .fill(false)
    .map((_, i) => i < activeBars);

  const isWarning = (type === 'carbs' || type === 'fat') && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-700">{config.name}</span>
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
      </div>
      <div className="flex items-start justify-center relative">
        <div className="border-2 border-gray-400 rounded-lg w-42 h-16 flex items-center justify-start gap-2 px-2 relative">
          {isWarning && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <BatteryWarning className="w-8 h-8 text-red-500 animate-pulse-slow" />
            </div>
          )}

          {bars.map((isActive, index) => (
            <div
              key={index}
              className={`rounded w-8 h-12 transition-colors duration-500 ${
                isActive
                  ? `${color} ${!isWarning ? `animate-pulse-bar-${index + 1}` : ''}`
                  : 'bg-gray-200'
              } ${isWarning ? 'opacity-20' : ''}`}
            />
          ))}
        </div>
        <div className="bg-gray-400 rounded w-3 h-8 ml-1 my-auto" />
      </div>
      <div className="text-center text-sm text-gray-600">
        {current} / {target} {type === 'calories' ? 'kcal' : 'g'}
      </div>
    </div>
  );
}

export default function NutritionBatteryGroup({ data = DEFAULT_DATA }: NutritionBatteryProps) {
  // Add styles to document head
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const mergedData = {
    ...DEFAULT_DATA,
    ...data,
  };

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[]).map((type) => (
        <NutritionBatteryItem
          key={type}
          type={type}
          current={mergedData[type].current}
          target={mergedData[type].target}
        />
      ))}
    </div>
  );
}
