'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  ChevronLeft,
  Info,
  Plus,
} from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

interface CalculationStage {
  type: 'initial' | 'recommended' | 'custom' | 'result';
}

const HealthCalculateForm = ({ currentUser_id }: { currentUser_id: string }) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
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
  const [stage, setStage] = useState<CalculationStage['type']>('initial');
  const [recommendedGoal, setRecommendedGoal] = useState<RecommendedGoal | null>(null);
  const [showFullRecommendations, setShowFullRecommendations] = useState(false);

  useEffect(() => {
    if (healthRecord) {
      // 건강 기록이 로드되면 권장 목표 계산
      const recommended = HealthCalculator.calculateRecommendedGoal(
        healthRecord.weight,
        healthRecord.height,
        healthRecord.gender as Gender
      );
      setRecommendedGoal(recommended);

      // formData 업데이트
      const birthDate = new Date(healthRecord.birth_date);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      setFormData((prev) => ({
        ...prev,
        age,
        gender: healthRecord.gender as Gender,
        height: healthRecord.height,
        weight: healthRecord.weight,
        activityLevel: healthRecord.activity_level as ActivityLevel,
      }));
    }
  }, [healthRecord]);

  // 권장 목표 선택 시 처리
  const handleRecommendedGoal = () => {
    if (recommendedGoal && healthRecord) {
      // formData 업데이트
      const updatedFormData = {
        ...formData,
        goal: recommendedGoal.recommendedGoal,
        targetWeight: recommendedGoal.targetWeight,
        targetDuration: recommendedGoal.duration,
      };

      setFormData(updatedFormData);

      // 결과 계산
      const calculatedResult = HealthCalculator.calculateNutrition(updatedFormData);
      setResult(calculatedResult);

      // 바로 결과 화면으로 이동
      setStage('recommended');
    }
  };

  // 직접 설정으로 전환
  const handleCustomGoal = () => {
    setStage('custom');
    // 기존 입력값 초기화
    setFormData((prev) => ({
      ...prev,
      goal: 'maintain',
      targetWeight: undefined,
      targetDuration: undefined,
    }));
  };

  // health_records에서 데이터 가져오기
  useEffect(() => {
    const fetchHealthRecord = async () => {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', currentUser_id)
        .single();

      if (error) {
        console.error('Error fetching health record:', error);
        return;
      }

      setHealthRecord(data);
      // 가져온 데이터로 formData 업데이트
      const birthDate = new Date(data.birth_date);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      setFormData((prev) => ({
        ...prev,
        age,
        gender: data.gender as 'male' | 'female',
        height: data.height,
        weight: data.weight,
        activityLevel: data.workout_frequency as any,
      }));
    };

    fetchHealthRecord();
  }, [currentUser_id, supabase]);

  useEffect(() => {
    console.log('formData updated:', formData);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 직접 설정한 목표 계산
    const calculatedResult = HealthCalculator.calculateNutrition(formData);
    setResult(calculatedResult);

    // stage가 custom일 때만 경고 다이얼로그 표시
    if (
      stage === 'custom' &&
      (calculatedResult.healthWarnings.length > 0 || calculatedResult.recommendations.length > 0)
    ) {
      setShowWarningDialog(true);
    } else {
      // 경고사항이 없거나 추천 목표를 선택한 경우 바로 결과로 이동
      setStage('result');
    }
  };

  const handleBack = () => {
    if (currentSlide === 0) {
      router.back();
    } else {
      setCurrentSlide(0);
    }
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

  const handleSave = async () => {
    if (!result || !healthRecord) return;

    try {
      // 목표 날짜 계산
      const targetDate = new Date(
        Date.now() + (formData.targetDuration || 0) * 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];

      // target_weight 계산 및 타입 체크
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

      // upsert 사용 - user_id가 같은 레코드가 있으면 업데이트, 없으면 새로 생성
      const { error } = await supabase.from('fitness_goals').upsert(goalData, {
        onConflict: 'user_id', // user_id 컬럼이 충돌할 경우
        ignoreDuplicates: false, // 중복을 무시하지 않고 업데이트
      });

      if (error) throw error;

      router.push('/main');
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const slides = [
    {
      id: 'input',
      title: '목표 설정',
      subtitle: '목표 체중과 기간을 입력해주세요',
    },
    {
      id: 'result',
      title: '분석 결과',
      subtitle: '입력하신 정보를 바탕으로 분석한 결과입니다.',
    },
  ];

  const renderIcon = (iconType: 'check' | 'up' | 'down') => {
    switch (iconType) {
      case 'check':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'up':
        return <Plus className="w-16 h-16 text-blue-500" />;
      case 'down':
        return <ArrowDownRight className="w-8 h-8 text-rose-500" />;
    }
  };

  if (!healthRecord) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Back button and Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Title Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="p-4"
        >
          <h1 className="text-2xl font-semibold">{slides[currentSlide].title}</h1>
          <p className="text-gray-500 text-sm mt-2">{slides[currentSlide].subtitle}</p>
        </motion.div>
      </AnimatePresence>
      {/* <hr className="mx-4 border-2 border-gray-200" /> */}
      {/* Content Section */}
      <div className="flex-1 px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            {stage === 'initial' && (
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
                      <div className="flex flex-col">
                        <p className="font-medium  text-gray-600">
                          {recommendedGoal.messageGrid.title}
                        </p>

                        <div className="text-8xl gap-2 flex items-end">
                          <p className="tracking-tighter">{recommendedGoal.messageGrid.content1}</p>
                          {recommendedGoal.messageGrid.content2 && (
                            <p className="text-4xl">{recommendedGoal.messageGrid.content2}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={handleRecommendedGoal}
                        className="w-full py-4 rounded-xl bg-black text-white text-lg font-medium"
                      >
                        추천 목표로 시작하기
                      </button>
                      <button
                        onClick={handleCustomGoal}
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
                      {{
                        sedentary: '좌식 생활',
                        light: '가벼운 활동',
                        moderate: '보통 활동',
                        active: '활발한 활동',
                        very_active: '매우 활발한 활동',
                      }[healthRecord.activity_level] || healthRecord.activity_level}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stage === 'custom' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 목표 입력 폼 */}
                <div className="space-y-4">
                  <h2 className="-mb-4 pl-4">*목표 선택*</h2>
                  <select
                    name="goal"
                    className="w-full p-4 rounded-xl bg-gray-50"
                    value={formData.goal}
                    onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          placeholder="목표 체중을 입력하세요"
                          step="0.1"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          kg
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          name="targetDuration"
                          className="w-full p-4 rounded-xl bg-gray-50"
                          value={formData.targetDuration || ''}
                          onChange={handleInputChange}
                          placeholder="목표 기간을 입력하세요"
                          min="1"
                          max="52"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          주
                        </span>
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
                    onClick={() => setStage('initial')}
                    className="w-full py-4 rounded-xl bg-gray-100 text-gray-900 text-lg font-medium"
                  >
                    추천 목표로 돌아가기
                  </button>
                </div>
                {/* 현재 상태 표시 (직접 설정 시에도 표시) */}
                {/* <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-medium text-lg mb-2">현재 신체 정보</div>
                    <div className="space-y-2">
                      <div>키: {healthRecord.height}cm</div>
                      <div>체중: {healthRecord.weight}kg</div>
                      <div>
                        BMI: {healthRecord.bmi.toFixed(1)} ({healthRecord.bmi_status})
                      </div>
                      <div>권장체중: {healthRecord.recommended_weight?.toLocaleString()} kg</div>
                    </div>
                  </div>
                </div> */}
              </form>
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
      </div>

      {/* Alert Dialog - 직접 설정 시에만 표시 */}
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
