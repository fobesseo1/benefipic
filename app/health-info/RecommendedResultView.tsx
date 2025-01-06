// RecommendedResultView.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { NutritionResult, RecommendedGoal } from './HealthCalculator';
import { HealthRecord } from './HealthCalculatorForm';

interface RecommendedResultViewProps {
  result: NutritionResult;
  recommendedGoal: RecommendedGoal;
  healthRecord: HealthRecord;
  showWarnings: boolean;
  onSave: () => void;
}

export const RecommendedResultView: React.FC<RecommendedResultViewProps> = ({
  result,
  recommendedGoal,
  healthRecord,
  showWarnings,
  onSave,
}) => {
  return (
    <div className="space-y-4">
      {showWarnings && result.healthWarnings && result.healthWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>건강 관리 참고사항</AlertTitle>
          {result.healthWarnings.map((warning, index) => (
            <AlertDescription key={index}>{warning}</AlertDescription>
          ))}
        </Alert>
      )}

      <div className="p-4 bg-red-200 rounded-xl">
        <div className="font-medium mb-2">목표 체중</div>
        <p className="text-2xl font-bold">{recommendedGoal.targetWeight}kg</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium mb-2">권장 운동 시간</div>
        <div className="text-2xl font-bold">하루 {result.exerciseMinutes}분</div>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium mb-2">일일 권장 칼로리</div>
        <div className="text-2xl font-bold">{result.totalCalories.toLocaleString()} kcal</div>
      </div>

      {result.weightChangePerWeek !== 0 && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-medium mb-2">주간 목표 변화량</div>
          <div className="text-2xl font-bold flex items-center gap-1">
            <p>{result.weightChangePerWeek > 0 ? '+' : '-'}</p>
            <p>{Math.abs(result.weightChangePerWeek).toFixed(2)}kg</p>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium mb-2">기초대사량 (BMR)</div>
        <div className="text-2xl font-bold">{result.bmr.toLocaleString()} kcal</div>
      </div>

      {showWarnings && result.recommendations && result.recommendations.length > 0 && (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>권장사항</AlertTitle>
          {result.recommendations.map((recommendation, index) => (
            <AlertDescription key={index}>{recommendation}</AlertDescription>
          ))}
        </Alert>
      )}

      <div className="mt-6">
        <button
          onClick={onSave}
          className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
        >
          저장하기
        </button>
      </div>
    </div>
  );
};
