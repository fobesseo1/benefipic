import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface FoodCheckAlertProps {
  isOpen: boolean;
  onClose: () => void;
  setStep: (step: 'complete') => void;
  healthCheck: {
    score: number;
    message: string;
    currentFood: {
      foodName: string;
      nutrition: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
      };
    };
    alternatives?: {
      name: string;
      reason: string;
      benefits: string;
    }[];
  };
  onSaveToFoodLogs: () => void;
  onSaveToCheckLogs: () => void;
}

const FoodCheckAlert: React.FC<FoodCheckAlertProps> = ({
  isOpen,
  onClose,
  setStep,
  healthCheck,
  onSaveToFoodLogs,
  onSaveToCheckLogs,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22c55e'; // green-600
    if (score >= 7) return '#eab308'; // yellow-600
    return '#dc2626'; // red-600
  };

  const getMessage = (score: number) => {
    if (score >= 8)
      return {
        title: '와! 완벽한 선택이에요 ✨',
        subtitle: '오늘의 영양소 밸런스에 딱 맞아요!',
        emoji: '🌟',
      };
    if (score >= 7)
      return {
        title: '음.. 괜찮은 선택이에요 🤔',
        subtitle: '이런 점들만 주의하면 더 좋을 것 같아요',
        emoji: '👀',
      };
    return {
      title: '잠깐만요! 다시 한번 생각봐요 ',
      subtitle: '더 좋은 메뉴를 추천해드릴게요!',
      emoji: '💭',
    };
  };

  const handleClose = () => {
    onClose();
    setStep('complete');
  };

  const nutritionItems = [
    { label: '칼로리', value: `${healthCheck.currentFood.nutrition.calories}`, icon: '🔥' },
    // { label: '단백질', value: `${healthCheck.currentFood.nutrition.protein}g`, icon: '💪' },
    // { label: '지방', value: `${healthCheck.currentFood.nutrition.fat}g`, icon: '🥑' },
    // { label: '탄수화물', value: `${healthCheck.currentFood.nutrition.carbs}g`, icon: '🍚' },
  ];

  const messageData = getMessage(healthCheck.score);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <div className="flex justify-end">
          <AlertDialogCancel className="w-6 h-6 " onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </AlertDialogCancel>
        </div>

        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle>
            <div className="text-center ">
              <div className="text-4xl">{messageData.emoji}</div>
              <h2 className="text-2xl font-bold tracking-tight">{messageData.title}</h2>
              <p className="text-sm text-gray-500">{messageData.subtitle}</p>
            </div>
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-4">
            {/* 음식 정보 및 점수 */}
            <div className="bg-gray-50 rounded-xl px-6 py-2">
              <div className="text-center">
                <div className="w-36 h-36 mx-auto mb-4 relative flex items-center justify-center">
                  <CircularProgressbar
                    value={healthCheck.score * 10}
                    strokeWidth={12}
                    styles={buildStyles({
                      textSize: '32px',
                      pathColor: getScoreColor(healthCheck.score),
                      textColor: getScoreColor(healthCheck.score),
                      trailColor: '#f3f4f6',
                    })}
                  />
                  <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-semibold text-red-600">
                    {healthCheck.score}
                    <span className="text-xl text-gray-600">/10</span>
                  </p>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <p className="text-lg font-bold text-gray-900 ">
                    {healthCheck.currentFood.foodName}
                  </p>
                  <p className="text-lg text-gray-400">/</p>
                  {/* 영양소 정보 */}
                  <div className="grid grid-cols-1 gap-2">
                    {nutritionItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center ">
                        {/* <span className="text-xl">{item.icon}</span> */}
                        <p className="font-bold text-xl text-gray-900 tracking-tighter">
                          {item.value}
                          <span className="text-sm font-normal text-gray-600"> Kcal</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <hr />

            {/* 대체 메뉴 추천 */}
            {healthCheck.score <= 7 && healthCheck.alternatives && (
              <div className="space-y-4">
                {/* <p className="font-medium text-lg flex items-center gap-2">
                  <span>이런 메뉴는 어때요?</span>
                  <span className="text-xl">💁‍♀️</span>
                </p> */}
                <div className="space-y-2">
                  {healthCheck.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <h3 className="font-bold text-green-800">{alt.name}</h3>
                      </div>
                      <div className="text-xs tracking-tighter text-start ">
                        <p className="text-green-600">{alt.reason}</p>
                        <p className="text-green-600 ">{alt.benefits}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="space-y-4 w-full ">
          {healthCheck.score <= 7 ? (
            <div className="flex flex-col gap-2">
              <AlertDialogAction
                onClick={() => {
                  onSaveToCheckLogs();
                  onClose();
                }}
                className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
              >
                에잇 참자!!
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  onSaveToFoodLogs();
                  onClose();
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200"
              >
                그래도 먹을래
              </AlertDialogAction>
            </div>
          ) : (
            <AlertDialogAction
              onClick={() => {
                onSaveToFoodLogs();
                onClose();
              }}
              className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
            >
              맛있게 먹을게요! 😋
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FoodCheckAlert;
