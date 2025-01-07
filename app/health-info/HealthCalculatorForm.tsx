'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  HealthCalculator,
  type UserInput,
  type NutritionResult,
  RecommendedGoal,
  Gender,
  ActivityLevel,
} from './HealthCalculator';
import createSupabaseBrowserClient from '@/lib/supabse/client';
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
import { RecommendedResultView } from './RecommendedResultView';
import { CustomResultView } from './CustomResultView';
import { InitialStageView } from './InitialStageView';
import { GoalSettingView } from './GoalSettingView';

export interface HealthRecord {
  gender: string;
  activity_level: string;
  height: number;
  weight: number;
  birth_date: string;
  bmr: number;
  tdee: number;
  bmi: number;
  bmi_status: string;
  recommended_weight: number;
}

type CalculationStage = 'initial' | 'recommended' | 'custom' | 'result';

interface HealthCalculateFormProps {
  currentUser_id: string;
  initialHealthRecord: HealthRecord;
}

const HealthCalculateForm = ({ currentUser_id, initialHealthRecord }: HealthCalculateFormProps) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  // State 관리
  const [healthRecord] = useState<HealthRecord>(initialHealthRecord);
  const [formData, setFormData] = useState<UserInput>({
    age: 30,
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'sedentary',
    goal: 'maintain',
    targetWeight: undefined,
    targetDuration: undefined,
  });
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);
  const [stage, setStage] = useState<CalculationStage>('initial');
  const [recommendedGoal, setRecommendedGoal] = useState<RecommendedGoal | null>(null);
  const [showFullRecommendations, setShowFullRecommendations] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    // 권장 목표 계산
    const recommended = HealthCalculator.calculateRecommendedGoal(
      initialHealthRecord.weight,
      initialHealthRecord.height,
      initialHealthRecord.gender as Gender
    );
    setRecommendedGoal(recommended);

    // formData 초기값 설정
    const birthDate = new Date(initialHealthRecord.birth_date);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    setFormData((prev) => ({
      ...prev,
      age,
      gender: initialHealthRecord.gender as Gender,
      height: initialHealthRecord.height,
      weight: initialHealthRecord.weight,
      activityLevel: initialHealthRecord.activity_level as ActivityLevel,
    }));
  }, [initialHealthRecord]);

  // 권장 목표 선택 시 처리
  const handleRecommendedGoal = () => {
    if (recommendedGoal) {
      const updatedFormData = {
        ...formData,
        goal: recommendedGoal.recommendedGoal,
        targetWeight: recommendedGoal.targetWeight,
        targetDuration: recommendedGoal.duration,
      };

      setFormData(updatedFormData);
      const calculatedResult = HealthCalculator.calculateNutrition(updatedFormData);
      setResult(calculatedResult);
      setStage('recommended');
    }
  };

  // 직접 설정으로 전환
  const handleCustomGoal = () => {
    setStage('custom');
    setFormData((prev) => ({
      ...prev,
      goal: 'maintain',
      targetWeight: undefined,
      targetDuration: undefined,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === ''
          ? undefined
          : ['targetWeight', 'targetDuration'].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedResult = HealthCalculator.calculateNutrition(formData);
    setResult(calculatedResult);

    if (
      stage === 'custom' &&
      (calculatedResult.healthWarnings.length > 0 || calculatedResult.recommendations.length > 0)
    ) {
      setShowWarningDialog(true);
    } else {
      setStage('result');
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      const targetDate = new Date(
        Date.now() + (formData.targetDuration || 0) * 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];

      let targetWeight: number;
      if (formData.goal === 'maintain') {
        targetWeight = healthRecord.weight;
      } else if (formData.targetWeight) {
        targetWeight = formData.targetWeight;
      } else {
        throw new Error('Target weight is required for non-maintain goals');
      }

      const goalData = {
        user_id: currentUser_id,
        target_weight: Number(targetWeight.toFixed(1)),
        target_date: targetDate,
        daily_calories_target: Math.round(result.totalCalories),
        daily_protein_target: Number(result.protein.toFixed(1)),
        daily_fat_target: Number(result.fat.toFixed(1)),
        daily_carbs_target: Number(result.carbs.toFixed(1)),
        daily_exercise_minutes_target: result.exerciseMinutes,
        status: 'active',
      };

      const { error } = await supabase.from('fitness_goals').upsert(goalData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

      if (error) throw error;
      router.push('/main');
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  return (
    <div className="flex-1 px-4 pb-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
        >
          {stage === 'initial' && (
            <InitialStageView
              healthRecord={healthRecord}
              recommendedGoal={recommendedGoal!}
              onRecommendedGoalSelect={handleRecommendedGoal}
              onCustomGoalSelect={handleCustomGoal}
            />
          )}

          {stage === 'custom' && (
            <GoalSettingView
              healthRecord={healthRecord}
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onBack={() => setStage('initial')}
            />
          )}

          {(stage === 'result' || stage === 'recommended') && result && (
            <>
              {stage === 'recommended' && recommendedGoal ? (
                <RecommendedResultView
                  result={result}
                  recommendedGoal={recommendedGoal}
                  healthRecord={healthRecord}
                  showWarnings={showWarnings}
                  onSave={handleSave}
                />
              ) : (
                <CustomResultView
                  result={result}
                  formData={formData}
                  healthRecord={healthRecord}
                  showWarnings={showWarnings}
                  onSave={handleSave}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Alert Dialog */}
      <AlertDialog
        open={stage === 'custom' && showWarningDialog}
        onOpenChange={setShowWarningDialog}
      >
        <AlertDialogContent className="overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>목표 설정 검토</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 overflow-y-auto">
              {result?.healthWarnings && result.healthWarnings.length > 0 && (
                <div className="space-y-2 overflow-y-auto">
                  <p className="font-medium text-red-600">⚠️ 건강 관리 참고사항:</p>
                  {result.healthWarnings.map((warning, index) => (
                    <p key={index} className="text-sm">
                      {warning}
                    </p>
                  ))}
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <p className="font-medium mb-2">설정하신 목표</p>
                <p>
                  {formData.goal === 'lose'
                    ? `현재 체중 ${healthRecord?.weight}kg에서 ${formData.targetWeight}kg까지 
                      ${formData.targetDuration}주 동안 감량 시 주당 
                      ${Math.abs(
                        (healthRecord?.weight! - formData.targetWeight!) / formData.targetDuration!
                      ).toFixed(1)}kg의 감량이 필요합니다.`
                    : `현재 체중 ${healthRecord?.weight}kg에서 ${formData.targetWeight}kg까지 
                      ${formData.targetDuration}주 동안 증량 시 주당 
                      ${Math.abs(
                        (formData.targetWeight! - healthRecord?.weight!) / formData.targetDuration!
                      ).toFixed(1)}kg의 증량이 필요합니다.`}
                </p>
              </div>

              {result?.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="font-medium text-blue-600">💡 전문가 권장사항:</p>
                  <div
                    className={`relative ${
                      showFullRecommendations ? 'max-h-[200px] overflow-y-auto' : ''
                    }`}
                  >
                    <div className={!showFullRecommendations ? 'line-clamp-3' : ''}>
                      {result.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm">
                          {rec}
                        </p>
                      ))}
                    </div>
                    {result.recommendations.length > 3 && (
                      <button
                        onClick={() => setShowFullRecommendations(!showFullRecommendations)}
                        className="text-gray-600 text-sm mt-1 hover:underline"
                      >
                        {showFullRecommendations ? '접기' : '더보기'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-4 font-medium">설정하신 목표로 진행하시겠습니까?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowWarningDialog(false);
                setStage('custom');
              }}
            >
              목표 다시 설정하기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowWarningDialog(false);
                setShowWarnings(false);
                setStage('result');
              }}
            >
              설정한 목표로 진행하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HealthCalculateForm;
