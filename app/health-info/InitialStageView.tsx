//app/health-info/InitialStageView.tsx

import React from 'react';
import { RecommendedGoal } from './HealthCalculator';
import { HealthRecord } from './HealthCalculatorForm';

interface InitialStageViewProps {
  healthRecord: HealthRecord;
  recommendedGoal: RecommendedGoal;
  onRecommendedGoalSelect: () => void;
  onCustomGoalSelect: () => void;
}

export const InitialStageView: React.FC<InitialStageViewProps> = ({
  healthRecord,
  recommendedGoal,
  onRecommendedGoalSelect,
  onCustomGoalSelect,
}) => {
  const activityLevelMap = {
    sedentary: '좌식 생활',
    light: '가벼운 활동',
    moderate: '보통 활동',
    active: '활발한 활동',
    very_active: '매우 활발한 활동',
  };

  // 목표 텍스트 생성 함수
  const getGoalParts = (recommendedGoal: RecommendedGoal) => {
    let duration = {
      value: recommendedGoal.duration,
      unit: '주간',
    };

    let change = {
      prefix: '',
      value: 0,
      unit: 'kg',
      type: '',
    };

    switch (recommendedGoal.recommendedGoal) {
      case 'maintain':
        change = {
          prefix: '',
          value: recommendedGoal.targetWeight,
          unit: 'kg',
          type: '유지',
        };
        break;
      case 'gain':
        change = {
          prefix: '+',
          value: recommendedGoal.weightDiff,
          unit: 'kg',
          type: '증량',
        };
        break;
      case 'lose':
        change = {
          prefix: '-',
          value: Math.abs(recommendedGoal.weightDiff),
          unit: 'kg',
          type: '감량',
        };
        break;
    }

    return { duration, change };
  };

  return (
    <div className="space-y-6">
      {/* 권장 목표 표시 */}
      {recommendedGoal && (
        <div className="p-4 bg-white rounded-xl shadow-xl border-2 border-gray-200">
          {/* 아이콘과 메시지 */}
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">{recommendedGoal.message}</h3>
          </div>

          {/* 그리드 레이아웃의 메시지 */}
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-12 bg-gray-50 rounded-xl">
            <div className="flex flex-col gap-4">
              <div className="flex-flex-col">
                <p className="font-medium text-gray-600 mb-2">
                  {recommendedGoal.messageGrid.title}
                </p>
                <div className="text-4xl gap-2 flex items-end font-bold">
                  <p className="tracking-tighter">{recommendedGoal.messageGrid.content1}</p>
                  {recommendedGoal.messageGrid.content2 && (
                    <p className="text-4xl">{recommendedGoal.messageGrid.content2}</p>
                  )}
                </div>
              </div>
              <hr className=" border-gray-400" />
              <div className="flex flex-col">
                {/* <p className="font-medium text-gray-600 mb-2">추천 목표</p> */}
                <div className="flex items-baseline justify-between gap-x-4 ">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold tracking-tighter text-gray-900">
                      {getGoalParts(recommendedGoal).duration.value}
                    </span>
                    <span className="text-xl text-gray-600">
                      {getGoalParts(recommendedGoal).duration.unit}
                    </span>
                    <p className="text-xl text-gray-600">&gt;</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-bold tracking-tighter text-gray-900">
                      {getGoalParts(recommendedGoal).change.prefix}
                      {getGoalParts(recommendedGoal).change.value}
                    </span>
                    <span className="text-xl text-gray-600 ">
                      {getGoalParts(recommendedGoal).change.unit}
                    </span>
                    <p className="text-xl text-gray-600  ">
                      {getGoalParts(recommendedGoal).change.type}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="mt-6 space-y-3">
            <button
              onClick={onRecommendedGoalSelect}
              className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
            >
              추천 목표로 시작하기
            </button>
            <button
              onClick={onCustomGoalSelect}
              className="w-full py-4 rounded-xl bg-gray-100 text-gray-900 text-lg font-medium"
            >
              직접 목표 설정하기
            </button>
          </div>
        </div>
      )}

      {/* 현재 상태 표시 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="font-medium text-lg mb-2">현재 신체 정보</div>
        <div className="space-y-2">
          <div>키: {healthRecord.height}cm</div>
          <div>체중: {healthRecord.weight}kg</div>
          <div>
            BMI: {healthRecord.bmi.toFixed(1)} ({healthRecord.bmi_status})
          </div>
          <div>기초대사량(BMR): {healthRecord.bmr.toLocaleString()} kcal</div>
          <div>일일 에너지 소비량(TDEE): {healthRecord.tdee?.toLocaleString()} kcal</div>
          <div>권장체중: {healthRecord.recommended_weight?.toLocaleString()} kg</div>
          <div>
            활동량:{' '}
            {activityLevelMap[healthRecord.activity_level as keyof typeof activityLevelMap] ||
              healthRecord.activity_level}
          </div>
        </div>
      </div>
    </div>
  );
};
