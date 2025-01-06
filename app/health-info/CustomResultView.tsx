// CustomResultView.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { NutritionResult, UserInput } from './HealthCalculator';
import { HealthRecord } from './HealthCalculatorForm';

interface CustomResultViewProps {
  result: NutritionResult;
  formData: UserInput;
  healthRecord: HealthRecord;
  showWarnings: boolean;
  onSave: () => void;
}

export const CustomResultView: React.FC<CustomResultViewProps> = ({
  result,
  formData,
  healthRecord,
  showWarnings,
  onSave,
}) => {
  const displayWeight = formData.goal === 'maintain' ? healthRecord.weight : formData.targetWeight;

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

      <div className="p-4 bg-gray-200 rounded-xl shadow-lg">
        <div className="font-medium mb-2">목표 체중</div>
        <p className="text-2xl font-bold">{displayWeight}kg</p>
      </div>

      {formData.goal !== 'maintain' && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="font-medium mb-2">목표 기간</div>
          <p className="text-2xl font-bold">{formData.targetDuration}주</p>
        </div>
      )}

      {/* <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium mb-2">영양소 섭취 목표</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">단백질</div>
            <div className="text-xl font-bold">{result.protein}g</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">지방</div>
            <div className="text-xl font-bold">{result.fat}g</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">탄수화물</div>
            <div className="text-xl font-bold">{result.carbs}g</div>
          </div>
        </div>
      </div> */}

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

      {/* <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium mb-2">운동 가이드</div>
        <div className="text-2xl font-bold">하루 {result.exerciseMinutes}분</div>
        <div className="mt-2 space-y-1">
          <div className="text-sm">
            <span className="text-gray-500">빈도: </span>
            {result.strengthTraining.frequency}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">세트: </span>
            {result.strengthTraining.sets}
          </div>
          <div className="text-sm">
            <span className="text-gray-500">반복: </span>
            {result.strengthTraining.reps}
          </div>
        </div>
      </div> */}

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
