import React from 'react';
import { UserInput } from './HealthCalculator';
import { HealthRecord } from './HealthCalculatorForm';

interface GoalSettingViewProps {
  healthRecord: HealthRecord;
  formData: UserInput;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const GoalSettingView: React.FC<GoalSettingViewProps> = ({
  healthRecord,
  formData,
  onInputChange,
  onSubmit,
  onBack,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 목표 입력 폼 */}
      <div className="space-y-4">
        <h2 className="-mb-4 pl-4">*목표 선택*</h2>
        <select
          name="goal"
          className="w-full p-4 rounded-xl bg-gray-50"
          value={formData.goal}
          onChange={onInputChange}
        >
          <option value="maintain">현재 체중 유지</option>
          <option value="lose">체중 감량</option>
          <option value="gain">근육량 증가</option>
        </select>

        {formData.goal !== 'maintain' && (
          <>
            <div className="relative">
              <input
                type="number"
                name="targetWeight"
                className="w-full p-4 rounded-xl bg-gray-50"
                value={formData.targetWeight || ''}
                onChange={onInputChange}
                placeholder="목표 체중을 입력하세요"
                step="0.1"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">kg</span>
            </div>

            <div className="relative">
              <input
                type="number"
                name="targetDuration"
                className="w-full p-4 rounded-xl bg-gray-50"
                value={formData.targetDuration || ''}
                onChange={onInputChange}
                placeholder="목표 기간을 입력하세요"
                min="1"
                max="52"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">주</span>
            </div>
          </>
        )}
      </div>

      {/* 버튼 모음 */}
      <div className="space-y-3">
        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
        >
          계산하기
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-4 rounded-xl bg-gray-100 text-gray-900 text-lg font-medium"
        >
          추천 목표로 돌아가기
        </button>
      </div>
    </form>
  );
};
