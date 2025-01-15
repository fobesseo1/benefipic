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
  onSaveToFoodLogs: () => void; // food_logs 테이블에 저장
  onSaveToCheckLogs: () => void; // food_check_logs 테이블에 저장
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
    if (score >= 8) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleClose = () => {
    onClose();
    setStep('complete');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        {/* 닫기 버튼 추가 */}
        <div className="flex justify-end">
          <AlertDialogCancel className="w-8" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </AlertDialogCancel>
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <h2 className="text-gray-900 text-2xl font-bold tracking-tighter">
              {healthCheck.message}
            </h2>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {/* 현재 음식 영양 정보 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center items-center gap-2 border-b-[1px] border-gray-200 pb-1">
                <p className="font-medium text-base">{healthCheck.currentFood.foodName} :</p>
                <p className={`text-3xl font-bold ${getScoreColor(healthCheck.score)}`}>
                  {healthCheck.score}
                  <span className="text-sm text-gray-900">/10</span>
                </p>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-sm ">
                <div>칼로리: {healthCheck.currentFood.nutrition.calories}kcal</div>
                <div>단백질: {healthCheck.currentFood.nutrition.protein}g</div>
                <div>지방: {healthCheck.currentFood.nutrition.fat}g</div>
                <div>탄수화물: {healthCheck.currentFood.nutrition.carbs}g</div>
              </div>
            </div>

            {/* 대체 음식 추천 (점수가 7 이하일 때만) */}
            {healthCheck.score <= 7 && healthCheck.alternatives && (
              <div>
                {/* <p className="font-medium mb-2">이런 음식은 어떠세요?</p> */}
                <div className="space-y-3">
                  {healthCheck.alternatives.map((alt, idx) => (
                    <div key={idx} className="p-3 bg-green-500 border rounded-lg tracking-tighter">
                      <p className="font-bold text-white text-lg border-b-[1px] border-gray-200">
                        <span className="text-sm font-normal">추천 {idx + 1}</span>. {alt.name}
                      </p>
                      <p className="text-sm text-gray-200 mt-1">{alt.reason}</p>
                      <p className="text-sm text-gray-200 mt-1">{alt.benefits}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <hr />
        <AlertDialogFooter className="space-y-4">
          {healthCheck.score <= 7 ? (
            <div className="flex flex-col gap-4">
              <AlertDialogAction
                onClick={() => {
                  onSaveToFoodLogs(); // food_logs에 저장하고 /main으로
                  onClose();
                }}
                className="bg-gray-100 text-gray-400"
              >
                그래도 먹을래요
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  onSaveToCheckLogs(); // food_check_logs에 저장하고 알럿창만 닫기
                }}
              >
                다른 음식 고를게요
              </AlertDialogAction>
            </div>
          ) : (
            <AlertDialogAction
              onClick={() => {
                // food_logs에 저장하고 /main으로
                onClose();
              }}
            >
              확인
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FoodCheckAlert;
