'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Pencil, Plus, Minus, Flame, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { compressImage, fileToBase64 } from '@/utils/image';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exerciseDatabase } from '../exercise-description/exerciseDatabase';
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';
import { Button } from '@/components/ui/button';
import FoodImageFilter from '../components/shared/ui/FoodImageFilter';
import AnalysisProgressExercise from './AnalysisProgrseeExercise';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NavigationButtonSectionExercise from '../components/shared/ui/NavigationButtonSectionExercise';
import ExerciseImageFilter from '../components/shared/ui/ExerciseImageFilter';

// 타입 정의
type AnalysisStep =
  | 'initial'
  | 'camera'
  | 'image-selected'
  | 'filter-selection'
  | 'compress'
  | 'analyzing'
  | 'calculate'
  | 'complete';

interface ExerciseData {
  exerciseName: string;
  caloriesPerMinute: number;
  duration: number;
  totalCalories: number;
  exerciseType?: string;
  equipmentUsed?: string;
}

interface ApiResponse {
  isExercise: boolean;
  exerciseName: string;
  description: string;
  caloriesPerHour: number; // 분당에서 시간당으로 변경
  exerciseType?: string;
  equipmentRequired?: string[];
}

// 메인 컴포넌트
const ExerciseAnalyzer = ({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) => {
  // 상태 관리
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [originalExerciseData, setOriginalExerciseData] = useState<ExerciseData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(30); // 기본값 30분
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [notExerciseAlert, setNotExerciseAlert] = useState({
    isOpen: false,
    detectedContent: '',
  });

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createSupabaseBrowserClient();
  const { checkEligibility } = useAnalysisEligibility(currentUser_id, newUserCheck);

  //수정관련 상태관리
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customCaloriesPerHour, setCustomCaloriesPerHour] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const [displayImage, setDisplayImage] = useState<File | null>(null); // 고품질
  const [analysisImage, setAnalysisImage] = useState<File | null>(null); // 저품질
  const [filteredDisplayImage, setFilteredDisplayImage] = useState<File | null>(null); // 필터적용이미지

  // 초기 필터 상태
  const initialFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  };
  const [currentFilters, setCurrentFilters] = useState(initialFilters);
  const [filterType, setFilterType] = useState('none');

  // 헬퍼 함수들
  const calculateTotalCalories = (caloriesPerMinute: number, duration: number): number => {
    return Math.round(caloriesPerMinute * duration);
  };

  const findMatchingExercise = (exerciseName: string) => {
    return exerciseDatabase.find((exercise) =>
      exerciseName.toLowerCase().includes(exercise.name.toLowerCase())
    );
  };

  const processApiResponse = (apiData: ApiResponse): ExerciseData => {
    // DB에서 운동 찾기 (포함 관계로 검색)
    const matchingExercise = findMatchingExercise(apiData.exerciseName);

    if (matchingExercise) {
      // DB에 있는 운동이면 무조건 DB 정보 사용
      return {
        exerciseName: matchingExercise.name, // DB의 이름 사용
        caloriesPerMinute: matchingExercise.caloriesPerHour / 60,
        duration: duration,
        totalCalories: calculateTotalCalories(matchingExercise.caloriesPerHour, duration),
        exerciseType: apiData.exerciseType,
        equipmentUsed: apiData.equipmentRequired?.join(', '),
      };
    }

    // DB에 없는 경우만 API 응답 사용
    return {
      exerciseName: apiData.exerciseName,
      caloriesPerMinute: apiData.caloriesPerHour / 60, // 시간당을 분당으로 변환
      duration: duration,
      totalCalories: calculateTotalCalories(apiData.caloriesPerHour, duration),
      exerciseType: apiData.exerciseType,
      equipmentUsed: apiData.equipmentRequired?.join(', '),
    };
  };
  // 필터 적용 함수
  // 필터 적용 함수
  const applyFilters = async () => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // 정사각형 크기로 설정
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 이미지 중앙 기준으로 크롭
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      // Instagram 스타일 필터나 기본 필터의 computed style 가져오기
      const filterDiv = document.createElement('div');
      filterDiv.className = filterType === 'none' ? '' : `filter-${filterType}`;
      document.body.appendChild(filterDiv);
      const computedStyle = window.getComputedStyle(filterDiv);
      const filterValue = computedStyle.filter;
      document.body.removeChild(filterDiv);

      // 필터 적용
      ctx.filter =
        filterValue ||
        `
      brightness(${currentFilters.brightness}%)
      contrast(${currentFilters.contrast}%)
      saturate(${currentFilters.saturation}%)
    `;

      // 이미지 그리기 (중앙 크롭)
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          const filteredFile = new File([blob], 'filtered-exercise-image.jpg', {
            type: 'image/jpeg',
          });
          setFilteredDisplayImage(filteredFile);
          setImageUrl(URL.createObjectURL(filteredFile));
          analyzeImage();
        }
      }, 'image/jpeg');
    };
  };

  // 광고 완료 처리
  const handleAdComplete = async () => {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from('userdata')
      .update({
        last_ad_view: new Date().toISOString(),
      })
      .eq('id', currentUser_id);

    if (error) {
      console.error('광고 시청 기록 실패:', error);
      return;
    }

    setShowAdDialog(false);
    //analyzeImage();
  };

  // Effect Hooks
  useEffect(() => {
    if (originalExerciseData && duration > 0) {
      const totalCalories = calculateTotalCalories(
        originalExerciseData.caloriesPerMinute,
        duration
      );
      setExerciseData({
        ...originalExerciseData,
        duration,
        totalCalories,
      });
    }
  }, [duration, originalExerciseData]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // 시간 입력 처리
  const handleDurationChange = (value: string) => {
    const newDuration = value === '' ? 0 : parseInt(value);
    if (!isNaN(newDuration) && newDuration >= 0 && newDuration <= 999) {
      setDuration(newDuration);
    }
  };

  const closeNotExerciseAlert = () => {
    setNotExerciseAlert({
      isOpen: false,
      detectedContent: '',
    });
  };

  // analyzeImage 함수 구현
  const analyzeImage = async () => {
    if (!analysisImage) return;

    // 권한 체크
    const eligibility = await checkEligibility();

    if (!eligibility.canAnalyze) {
      if (eligibility.reason === 'needs_ad') {
        setShowAdDialog(true);
        return;
      }
      return;
    }

    // 오늘의 무료 사용인 경우, last_free_use 업데이트
    if (eligibility.reason === 'daily_free') {
      const { error: updateError } = await supabase
        .from('userdata')
        .update({
          last_free_use: new Date().toISOString(),
        })
        .eq('id', currentUser_id);

      if (updateError) {
        console.error('무료 사용 기록 실패:', updateError);
        return;
      }
    }

    try {
      setStep('compress');
      const base64Image = await fileToBase64(analysisImage); // selectedImage 대신 analysisImage 사용
      const fileType = analysisImage.type === 'image/png' ? 'png' : 'jpeg';

      setStep('analyzing');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `당신은 운동 분석 전문가입니다.

- 분석 대상 (아래 항목 중 하나라도 있다면 반드시 운동으로 판단):
  * 운동하는 모습 (달리기, 요가, 웨이트트레이닝 등)
  * 운동 기구/장비 (운동화, 요가매트, 러닝머신, 자전거, 덤벨 등)
  * 운동 환경 (체육관, 공원, 운동장, 산책로 등)
  * 운동복이나 운동화를 착용한 사람
  * 운동 전/후 셀카나 준비 모습
  * 위의 항목들에 해당이 되지는 않지만 일단 사람의 모습이 인식되면 무조건 걷기로 판단해
  
- 분석 지침:
  * 기본 원칙: 운동과 관련된 요소가 하나라도 있다면, 가장 적합한 기본 운동으로 판단
    - 운동화/산책로 → 걷기 운동
    - 운동복/공원 → 조깅
    - 요가매트 → 요가
  * 시간당 평균 칼로리 소모량은 기본 운동 기준으로 계산
  * 운동 강도는 일반적인 수준으로 가정
  
- 구체적인 판단 예시:
  * 운동화 착용 사진 → 걷기 (250kcal/hour)
  * 요가매트 들고 셀카 → 요가 (200kcal/hour)
  * 공원에서 운동복 차림 → 조깅 (400kcal/hour)
  * 체육관 배경 → 웨이트 트레이닝 (350kcal/hour)

- isExercise 판단 기준:
  * true: 운동 장비, 운동복, 운동화, 운동 환경, 운동 준비 모습 중 하나라도 있는 경우
  * false: 위 요소가 전혀 없는 일상 사진`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 이미지를 분석하여 다음 형식의 JSON으로 응답해주세요. caloriesPerHour는 반드시 1시간당 소모칼로리를 숫자로!!:
                {
                  "isExercise": true/false,
                  "exerciseName": "운동 이름(한글로)",
                  "description": "운동이 아닐 경우 설명",
                  "caloriesPerHour": number,
                  "exerciseType": "cardio/strength/flexibility",
                  "equipmentRequired": ["필요한 운동 기구"]
                }`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/${fileType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content) as ApiResponse;
      console.log('분석 결과:', result);

      if (!result.isExercise) {
        setNotExerciseAlert({
          isOpen: true,
          detectedContent: result.description || '운동이나 운동 기구가 인식되지 않았습니다.',
        });
        setStep('image-selected');
        return;
      }

      const processedData = processApiResponse(result);
      setOriginalExerciseData(processedData);
      setExerciseData(processedData);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setExerciseData(null);
      setStep('image-selected');
      setError('이미지 분석 중 오류가 발생했습니다.');
    }
  };

  // 저장 함수 구현
  const saveExerciseLog = async () => {
    const imageToSave = filteredDisplayImage || displayImage; // 필터 적용된 이미지 우선 사용
    if (!imageToSave || !exerciseData) return;

    try {
      const fileExt = imageToSave.type.split('/')[1];
      const filePath = `${currentUser_id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(filePath, imageToSave);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('exercise-images').getPublicUrl(filePath);

      // exerciseData.caloriesPerMinute를 시간당 칼로리로 변환
      const caloriesPerHour = Math.round(exerciseData.caloriesPerMinute * 60);

      const { error: insertError } = await supabase.from('exercise_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        exercise_name: exerciseData.exerciseName,
        image_url: publicUrl,
        duration_minutes: exerciseData.duration,
        calories_per_hour: caloriesPerHour, // 시간당 칼로리로 변환하여 저장
        calories_burned: exerciseData.totalCalories,
        // exercise_type과 equipment_used는 테이블에 없으므로 제거
      });

      if (insertError) throw insertError;

      setError(null);
      setShowResultAlert(true);
    } catch (error) {
      console.error('Error saving exercise log:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    }
  };

  const filteredExercises = exerciseDatabase.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
  );

  // return 부분 구현
  return (
    <div className="relative min-h-screen min-w-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Image Section */}
      <div className="w-full aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={imageUrl}
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            className="w-full aspect-square"
          >
            {step === 'filter-selection' ? (
              <ExerciseImageFilter
                imageUrl={imageUrl}
                onPreviewChange={setCurrentFilters}
                filterType={filterType}
                onFilterChange={setFilterType}
              />
            ) : step === 'camera' ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Selected exercise" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                {/* 모서리 프레임 */}
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>

                <span className="text-gray-500">운동 사진을 선택해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div
        className={`absolute bottom-0 w-full ${
          step === 'complete'
            ? 'h-[calc(100vh-82vw+32px)] py-8 pb-32'
            : 'h-[calc(100vh-100vw+32px)] py-8'
        } flex flex-col px-6 rounded-t-3xl bg-white`}
      >
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {(step === 'compress' || step === 'analyzing' || step === 'calculate') && (
                <div className="flex flex-col items-center justify-center h-full tracking-tighter">
                  <AnalysisProgressExercise currentStep={step} />
                  <p className="mt-8 text-gray-500 whitespace-pre-line">
                    {step === 'compress' && '이미지를 최적화하고 있어요...'}
                    {step === 'analyzing' &&
                      `사진을 자세히 살펴보고 있어요\n조금만 기다려주시면 곧 분석이 완료돼요🔍`}
                    {step === 'calculate' && '운동 정보를 계산하고 있어요...'}
                  </p>
                </div>
              )}

              {(step === 'complete' || step === 'image-selected') && exerciseData && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* 운동명 & 시간 입력 Card */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      {/* 운동명 */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium">{exerciseData.exerciseName}</h3>
                        <button
                          onClick={() => setShowSearchModal(true)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      {/* 시간 입력 */}
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600">운동 시간 (분)</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            min={0}
                            max={999}
                            className="w-full text-lg"
                          />
                          <span className="text-gray-600">분</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 칼로리 정보 Card */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">분당 소모 칼로리</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {exerciseData.caloriesPerMinute.toFixed(1)} kcal/분
                        </p>
                      </div>

                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="w-6 h-6 text-red-400" />
                            <span className="text-gray-600">총 소모 칼로리</span>
                          </div>
                          <p className="text-xl font-bold">
                            {exerciseData.totalCalories}{' '}
                            <span className="text-sm text-gray-600">kcal</span>
                          </p>
                        </div>
                      </div>

                      {exerciseData.equipmentUsed && (
                        <div className="mt-4">
                          <h4 className="text-sm text-gray-600 mb-2">필요한 운동 기구</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            {exerciseData.equipmentUsed}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Section */}
      <NavigationButtonSectionExercise
        step={step}
        setStep={setStep}
        setSelectedImage={setSelectedImage}
        setAnalysisImage={setAnalysisImage}
        setImageUrl={setImageUrl}
        onAnalyze={applyFilters}
        stream={stream}
        setStream={setStream}
        videoRef={videoRef}
        onSave={saveExerciseLog}
        resetAnalyzer={() => {
          setStep('initial');
          setSelectedImage(null);
          setImageUrl('');
          setExerciseData(null);
          setOriginalExerciseData(null);
          setDuration(30);
        }}
      />

      {/* Alerts */}
      <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? error : '운동 정보가 성공적으로 저장되었습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => router.push('/main')} className="p-6">
              확인
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 운동 아님 경고 알림 */}
      <AlertDialog open={notExerciseAlert.isOpen} onOpenChange={closeNotExerciseAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>운동이 인식되지 않았습니다</AlertDialogTitle>
            <AlertDialogDescription>{notExerciseAlert.detectedContent}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={closeNotExerciseAlert}>확인</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 운동 검색 모달 */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>운동 종류 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="운동 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="w-full pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />

              {search && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          if (exerciseData) {
                            setExerciseData({
                              ...exerciseData,
                              exerciseName: exercise.name,
                              caloriesPerMinute: exercise.caloriesPerHour / 60,
                              totalCalories: calculateTotalCalories(
                                exercise.caloriesPerHour / 60,
                                exerciseData.duration
                              ),
                            });
                          }
                          setShowSearchModal(false);
                          setSearch('');
                        }}
                      >
                        {exercise.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다</div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  setShowCustomInput(true);
                  setShowSearchModal(false);
                }}
                variant="outline"
                className="w-full"
              >
                직접 입력하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 직접 입력 모달 */}
      <Dialog open={showCustomInput} onOpenChange={setShowCustomInput}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>운동 직접 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">운동명</label>
              <Input
                type="text"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                placeholder="운동 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">시간당 소모 칼로리</label>
              <Input
                type="number"
                value={customCaloriesPerHour || ''}
                onChange={(e) => setCustomCaloriesPerHour(parseInt(e.target.value) || 0)}
                placeholder="시간당 소모 칼로리를 입력하세요"
                min={0}
              />
            </div>
            <Button
              onClick={() => {
                if (exerciseData) {
                  setExerciseData({
                    ...exerciseData,
                    exerciseName: customExerciseName,
                    caloriesPerMinute: customCaloriesPerHour / 60,
                    totalCalories: calculateTotalCalories(
                      customCaloriesPerHour / 60,
                      exerciseData.duration
                    ),
                  });
                }
                setShowCustomInput(false);
              }}
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 광고 알림 */}
      <AdDialog
        isOpen={showAdDialog}
        onClose={() => setShowAdDialog(false)}
        onAdComplete={handleAdComplete}
      />
    </div>
  );
};

export default ExerciseAnalyzer;
