//app/question/QuestionForm.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Answers, Question } from './tpye';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import {
  HealthCalculator,
  Gender,
  ActivityLevel,
  RecommendedGoal,
} from '@/app/health-info/HealthCalculator';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const getBMIStatus = (bmi: number): string => {
  if (bmi < 18.5) return '저체중';
  if (bmi <= 23) return '정상체중'; // < 에서 <= 로 수정
  if (bmi < 25) return '비만 전 단계(과체중)';
  if (bmi < 30) return '1단계 비만';
  if (bmi < 35) return '2단계 비만';
  return '3단계 비만(고도비만)';
};

const QuestionSlidePage = ({
  defaultSlide,
  currentUser_id,
}: {
  defaultSlide: number;
  currentUser_id: string;
}) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(defaultSlide);
  const [answers, setAnswers] = useState<Answers>({});
  const [yearError, setYearError] = useState<string>('');
  const [monthError, setMonthError] = useState<string>('');
  const [dayError, setDayError] = useState<string>('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [recommendedGoal, setRecommendedGoal] = useState<RecommendedGoal | null>(null);

  const validateDate = (part: 'year' | 'month' | 'day', value: string): boolean => {
    if (value === '') return true;
    const num = parseInt(value);
    const currentYear = new Date().getFullYear();

    switch (part) {
      case 'year':
        if (num < 1900 || num > currentYear) {
          setYearError(`연도는 1900년에서 ${currentYear}년 사이의 값을 입력해주세요`);
          return false;
        }
        setYearError('');
        break;
      case 'month':
        if (num < 1 || num > 12) {
          setMonthError('월(mm)은 1에서 12 사이의 값을 입력해주세요');
          return false;
        }
        setMonthError('');
        break;
      case 'day':
        if (num < 1 || num > 31) {
          setDayError('일(dd)은 1에서 31 사이의 값을 입력해주세요');
          return false;
        }
        setDayError('');
        break;
    }
    return true;
  };

  useEffect(() => {
    if (defaultSlide >= 0 && defaultSlide < questions.length) {
      setCurrentSlide(defaultSlide);
    }
  }, [defaultSlide]);

  const questions: Question[] = [
    {
      id: 'gender',
      title: '성별을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요',
      type: 'select',
      options: [
        { value: 'male', label: '남성' },
        { value: 'female', label: '여성' },
      ],
    },
    {
      id: 'activity_level',
      title: '평소 활동량은 어느 정도인가요?',
      subtitle: '정확한 제안을 위해 필요해요',
      type: 'select',
      options: [
        { value: 'sedentary', label: '좌식 생활', description: '운동을 거의 하지 않음' },
        { value: 'light', label: '가벼운 활동', description: '가벼운 운동 (주 1-3회)' },
        { value: 'moderate', label: '보통 활동', description: '중간 운동 (주 3-5회)' },
        { value: 'active', label: '활발한 활동', description: '활발한 운동 (주 6-7회)' },
        {
          value: 'very_active',
          label: '매우 활발한 활동',
          description: '매우 활발한 운동 또는 운동선수',
        },
      ],
    },
    {
      id: 'height',
      title: '현재 신장을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요(BMI 등)',
      type: 'number',
      unit: 'cm',
      placeholder: '신장을 입력해주세요',
      min: 100,
      max: 250,
    },
    {
      id: 'weight',
      title: '현재 체중을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요(BMI 등)',
      type: 'number',
      unit: 'kg',
      placeholder: '체중을 입력해주세요',
      min: 30,
      max: 200,
    },
    {
      id: 'birthdate',
      title: '생일을 알려주세요',
      subtitle: '정확한 제안을 위해 필요해요.',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
    },
    {
      id: 'result',
      title: '분석 결과',
      subtitle: '입력하신 정보를 바탕으로 분석한 결과입니다.',
      type: 'result',
    },
  ];

  const saveHealthRecord = async () => {
    const results = calculateResults();

    // RecommendedGoal 계산
    const recommended = HealthCalculator.calculateRecommendedGoal(
      Number(answers['weight']),
      Number(answers['height']),
      answers['gender'] as Gender
    );
    setRecommendedGoal(recommended);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + recommended.duration * 7);

    const healthRecord = {
      user_id: currentUser_id,
      gender: answers['gender'],
      activity_level: answers['activity_level'],
      height: Number(answers['height']),
      weight: Number(answers['weight']),
      birth_date: answers['birthdate'],
      bmr: results.bmr,
      tdee: results.tdee,
      bmi: Number(results.bmi),
      bmi_status: results.bmiStatus,
      recommended_weight: results.recommendedWeight,
    };

    // 영양소 계산을 위한 UserInput 구성
    const birthDate = new Date(answers['birthdate'] as string);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const nutrition = HealthCalculator.calculateNutrition({
      age,
      gender: answers['gender'] as Gender,
      height: Number(answers['height']),
      weight: Number(answers['weight']),
      activityLevel: answers['activity_level'] as ActivityLevel,
      goal: recommended.recommendedGoal,
      targetWeight: recommended.targetWeight,
      targetDuration: recommended.duration,
    });

    const goalData = {
      user_id: currentUser_id,
      target_weight: Number(recommended.targetWeight.toFixed(1)),
      target_date: targetDate.toISOString().split('T')[0],
      daily_calories_target: Math.round(nutrition.totalCalories),
      daily_protein_target: Number(nutrition.protein.toFixed(1)),
      daily_fat_target: Number(nutrition.fat.toFixed(1)),
      daily_carbs_target: Number(nutrition.carbs.toFixed(1)),
      daily_exercise_minutes_target: nutrition.exerciseMinutes,
      status: 'active',
    };

    try {
      await Promise.all([
        // health_records 저장
        (async () => {
          const { data: existingRecords, error: selectError } = await supabase
            .from('health_records')
            .select('*')
            .eq('user_id', currentUser_id);

          if (selectError) throw selectError;

          if (existingRecords && existingRecords.length > 0) {
            const { error: updateError } = await supabase
              .from('health_records')
              .update(healthRecord)
              .eq('user_id', currentUser_id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('health_records')
              .insert([healthRecord]);

            if (insertError) throw insertError;
          }
        })(),

        // weight_tracking 저장
        (async () => {
          const { error: weightError } = await supabase.from('weight_tracking').upsert({
            user_id: currentUser_id,
            weight: Number(answers['weight']),
          });

          if (weightError) throw weightError;
        })(),

        // fitness_goals 저장
        (async () => {
          const { error: goalError } = await supabase.from('fitness_goals').upsert(goalData, {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          });

          if (goalError) throw goalError;
        })(),
      ]);
    } catch (error) {
      console.error('Error saving records:', error);
    }
  };

  const handleNext = async () => {
    if (currentSlide < questions.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (currentSlide === questions.length - 1) {
      try {
        await saveHealthRecord(); // 저장이 완료될 때까지 대기
        setShowCompletionDialog(true); // 저장 완료 후 다이얼로그 표시
      } catch (error) {
        console.error('Error in handleNext:', error);
        // 에러 처리 (예: 토스트 메시지 표시)
      }
    }
  };

  // 새로운 함수 추가
  const handleStartClick = () => {
    router.push('/main');
  };

  const handleGoalClick = () => {
    router.push('/health-info'); // 목표 설정 페이지로 이동
  };

  const handleBack = () => {
    if (currentSlide === 0) {
      router.push('/start/?slide=2');
    } else {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentSlide].id]: value });
  };

  const handleInputChange = (value: string) => {
    setAnswers({ ...answers, [questions[currentSlide].id]: value });
  };

  const isSelected = (value: string) => answers[questions[currentSlide].id] === value;

  const calculateResults = () => {
    const birthDate = new Date(answers['birthdate'] as string);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const weight = Number(answers['weight']);
    const height = Number(answers['height']);
    const gender = answers['gender'] as Gender;
    const activityLevel = answers['activity_level'] as ActivityLevel;

    const bmr = HealthCalculator.calculateBMR(gender, weight, height, age);
    const tdee = HealthCalculator.calculateTDEE(bmr, activityLevel, gender);
    const bmi = HealthCalculator.calculateBMI(weight, height);
    const bmiStatus = getBMIStatus(bmi);
    const recommendedWeight = HealthCalculator.calculateRecommendedWeight(height, weight);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      bmi: bmi.toFixed(1),
      bmiStatus,
      age,
      recommendedWeight,
    };
  };

  const renderBirthDateInput = () => {
    const birthdate = (answers['birthdate'] as string) || '';
    let [year, month, day] = birthdate.split('-').map((val) => val || '');

    const displayMonth = month ? parseInt(month).toString() : '';
    const displayDay = day ? parseInt(day).toString() : '';

    const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
      if (value !== '' && !/^\d+$/.test(value)) return;

      let dateComponents = birthdate ? birthdate.split('-') : ['', '', ''];

      const maxLengths = { year: 4, month: 2, day: 2 };
      value = value.slice(0, maxLengths[part]);

      if (!validateDate(part, value)) {
        if (part === 'year') dateComponents[0] = value;
        if (part === 'month') dateComponents[1] = value;
        if (part === 'day') dateComponents[2] = value;
      } else {
        if (part === 'year') {
          dateComponents[0] = value;
        } else if (part === 'month') {
          dateComponents[1] = value ? value.padStart(2, '0') : '';
        } else if (part === 'day') {
          dateComponents[2] = value ? value.padStart(2, '0') : '';
        }
      }

      const newDate = dateComponents.every((comp) => comp === '') ? '' : dateComponents.join('-');
      handleInputChange(newDate);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">연도</p>
            <input
              type="text"
              placeholder="YYYY"
              value={year}
              onChange={(e) => handleDateChange('year', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400 
                ${yearError ? 'border-2 border-red-500' : ''}`}
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">월</p>
            <input
              type="text"
              placeholder="MM"
              value={displayMonth}
              onChange={(e) => handleDateChange('month', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400
                ${monthError ? 'border-2 border-red-500' : ''}`}
              maxLength={2}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mt-1 px-4">일</p>
            <input
              type="text"
              placeholder="DD"
              value={displayDay}
              onChange={(e) => handleDateChange('day', e.target.value)}
              className={`w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg placeholder:text-gray-400
                ${dayError ? 'border-2 border-red-500' : ''}`}
              maxLength={2}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {yearError && (
            <p className="text-xs text-red-500 break-keep leading-tight">{yearError}</p>
          )}
          {monthError && (
            <p className="text-xs text-red-500 break-keep leading-tight">{monthError}</p>
          )}
          {dayError && <p className="text-xs text-red-500 break-keep leading-tight">{dayError}</p>}
        </div>
      </div>
    );
  };

  // 결과 페이지 마운트시 실행될 useEffect
  useEffect(() => {
    if (currentSlide === questions.length - 1 && !answers['result']) {
      setAnswers((prev) => ({ ...prev, result: 'completed' }));
    }
  }, [currentSlide]);

  const renderResultContent = () => {
    const results = calculateResults();
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">기초대사량 (BMR)</div>
            <div className="text-2xl font-bold">{results.bmr.toLocaleString()} kcal</div>
            <div className="text-sm text-gray-500 mt-1">
              하루 동안 생명 유지에 필요한 최소한의 에너지량
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">일일 총 에너지 소비량 (TDEE)</div>
            <div className="text-2xl font-bold">{results.tdee.toLocaleString()} kcal</div>
            <div className="text-sm text-gray-500 mt-1">
              활동량을 고려한 하루 실제 소비 에너지량
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">체질량지수 (BMI)</div>
            <div className="text-2xl font-bold">{results.bmi}</div>
            <div className="text-sm text-gray-500 mt-1">현재 상태: {results.bmiStatus}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">권장 체중</div>
            <div className="text-2xl font-bold">{results.recommendedWeight} kg</div>
            <div className="text-sm text-gray-500 mt-1">
              {results.recommendedWeight === Number(answers['weight'])
                ? '현재 정상 체중 범위에 있습니다.'
                : `목표 감량/증량: ${Math.abs(
                    results.recommendedWeight - Number(answers['weight'])
                  ).toFixed(1)}kg ${
                    results.recommendedWeight > Number(answers['weight']) ? '증량' : '감량'
                  }`}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-medium text-lg mb-2">신체 정보</div>
            <div className="space-y-2">
              <div>나이: {results.age}세</div>
              <div>신장: {answers['height']}cm</div>
              <div>체중: {answers['weight']}kg</div>
              <div>
                활동량:{' '}
                {questions[1].type === 'select' &&
                  questions[1].options.find((opt) => opt.value === answers['activity_level'])
                    ?.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionContent = (question: Question) => {
    switch (question.type) {
      case 'select':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full p-4 rounded-xl text-left transition-all
                  ${isSelected(option.value) ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}
              >
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div
                    className={`text-sm ${
                      isSelected(option.value) ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {option.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={answers[question.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={question.placeholder}
              min={question.min}
              max={question.max}
              className="w-full p-4 rounded-xl bg-gray-50 text-gray-900 text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {question.unit}
            </span>
          </div>
        );

      case 'date':
        return renderBirthDateInput();

      case 'result':
        return renderResultContent();
    }
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
              style={{ width: `${((currentSlide + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Title Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="px-4 py-6"
        >
          <h1 className="text-2xl font-semibold whitespace-pre-line">
            {questions[currentSlide].title}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{questions[currentSlide].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answer Options Section */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            {renderQuestionContent(questions[currentSlide])}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next Button Section */}
      <div className="p-4">
        <button
          onClick={handleNext}
          disabled={!answers[questions[currentSlide].id]}
          className={`w-full py-4 rounded-xl text-lg font-medium transition-all
            ${
              answers[questions[currentSlide].id]
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
        >
          다음
        </button>
      </div>

      {/* Alert Dialog */}
      {showCompletionDialog && (
        <AlertDialog open={showCompletionDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold mb-2">
                입력하느라 고생했어요!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {recommendedGoal && (
                  <div className="p-4 bg-white rounded-xl shadow-xl border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold">{recommendedGoal.message}</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 px-2 py-12 bg-gray-50 rounded-xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex-flex-col">
                          <p className="font-medium text-gray-600 mb-2">
                            {recommendedGoal.messageGrid.title}
                          </p>
                          <div className="text-4xl gap-2 flex items-end font-bold">
                            <p className="tracking-tighter">
                              {recommendedGoal.messageGrid.content1}
                            </p>
                            {recommendedGoal.messageGrid.content2 && (
                              <p className="text-4xl">{recommendedGoal.messageGrid.content2}</p>
                            )}
                          </div>
                        </div>
                        <hr className="border-gray-400" />
                        <div className="flex flex-col">
                          <div className="flex items-baseline justify-between gap-x-4">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold tracking-tighter text-gray-900">
                                {getGoalParts(recommendedGoal).duration.value}
                              </span>
                              <span className="text-sm text-gray-600">
                                {getGoalParts(recommendedGoal).duration.unit}
                              </span>
                              <p className="text-xl text-gray-600">&gt;</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold tracking-tighter text-gray-900">
                                {getGoalParts(recommendedGoal).change.prefix}
                                {getGoalParts(recommendedGoal).change.value}
                              </span>
                              <span className="text-sm text-gray-600">
                                {getGoalParts(recommendedGoal).change.unit}
                              </span>
                              <p className="text-xl text-gray-600">
                                {getGoalParts(recommendedGoal).change.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleStartClick}
                className="w-full text-lg font-bold bg-black text-white hover:bg-gray-800 p-6"
              >
                시작하기
              </Button>
              <Button
                onClick={handleGoalClick}
                className="w-full bg-white text-black border-2 p-6 border-black hover:bg-gray-100"
              >
                목표수정
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default QuestionSlidePage;
