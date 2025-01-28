'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyFiltersAndSave, compressImage, fileToBase64 } from '@/utils/image';
import NutritionCard from '../components/shared/ui/NutritionCard';
import NavigationButtonSection from '../components/shared/ui/NavigationButtonSection';
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
import AnalysisProgress from './AnalysisProgress';
import FoodDetectionAlert from './FoodDetectionAlert';
import { completedFoodDatabase, ingredientDatabase } from '../food-description/foodDatabase';
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';
import { Button } from '@/components/ui/button';
import {
  ApiResponse,
  NutritionData,
  validateAndCorrectAnalysis,
  calculateNutritionByQuantity,
  processApiResponse,
} from '@/utils/food-analysis';
import FoodImageFilter from '../components/shared/ui/FoodImageFilter';
import { AnalysisStep } from './utils/types';
// import { calculateNutritionByQuantity, processApiResponse } from './utils/calculations';
import { handleDecrease, handleIncrease, handleInputChange } from './utils/handlers';

// 메인 컴포넌트
const FoodAnalyzer = ({
  currentUser_id,
  newUserCheck,
}: {
  currentUser_id: string;
  newUserCheck: boolean;
}) => {
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<NutritionData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState({
    foodName: false,
  });
  const [notFoodAlert, setNotFoodAlert] = useState({
    isOpen: false,
    detectedContent: '',
  });
  const [showAdDialog, setShowAdDialog] = useState(false);
  const { checkEligibility } = useAnalysisEligibility(currentUser_id, newUserCheck);
  const initialFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  };
  const [displayImage, setDisplayImage] = useState<File | null>(null); // 고품질
  const [analysisImage, setAnalysisImage] = useState<File | null>(null); // 저품질
  const [filteredDisplayImage, setFilteredDisplayImage] = useState<File | null>(null);
  const [filterType, setFilterType] = useState('none');
  const [currentFilters, setCurrentFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  });
  const [dailyCaloriesTarget, setDailyCaloriesTarget] = useState(0);

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createSupabaseBrowserClient();

  const applyFilters = async () => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          const filteredFile = new File([blob], 'filtered-food-image.jpg', {
            type: 'image/jpeg',
          });
          setFilteredDisplayImage(filteredFile);
          setImageUrl(URL.createObjectURL(filteredFile));
          analyzeImage();
        }
      }, 'image/jpeg');
    };
  };

  const handleAdComplete = async () => {
    const supabase = createSupabaseBrowserClient();

    // 광고 시청 시간 업데이트
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
    //analyzeImage(); // 분석 재시작
  };

  // Effect Hooks
  useEffect(() => {
    if (originalAnalysis) {
      setAnalysis(calculateNutritionByQuantity(originalAnalysis, quantity));
    }
  }, [quantity, originalAnalysis]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  //오늘목표칼로리 가져오기
  useEffect(() => {
    const fetchDailyCaloriesTarget = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('fitness_goals')
        .select('daily_calories_target')
        .eq('user_id', currentUser_id)
        .single();

      if (data) {
        setDailyCaloriesTarget(data.daily_calories_target);
      }
    };

    fetchDailyCaloriesTarget();
  }, [currentUser_id]);

  const closeNotFoodAlert = () => {
    setNotFoodAlert({
      isOpen: false,
      detectedContent: '',
    });
  };

  const analyzeImage = async () => {
    if (!analysisImage) return;

    // 권한 체크
    const supabase = createSupabaseBrowserClient();
    const { checkEligibility } = useAnalysisEligibility(currentUser_id, newUserCheck);

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
      const base64Image = await fileToBase64(analysisImage);
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
              content: `당신은 음식 영양 분석 전문가입니다. 
              이미지에 보이는 음식을 분석하되, 음식이 얼마나 보이는지(예: 짬뽕 1그릇, 군만두 3개) 형태로 파악하고,
              영양성분표가 보인다면 그 정보도 참고하여 분석해주세요.
              그리고 저울에 무게가 표시되어 있거나 중량이 적혀있으면 반드시 참고해서 분석해주세요
              이미지에 음식이 아닌 것이 있다면 isFood를 false로 응답해주세요.
              
              응답 형식:
              {
                "isFood": true,
                "foodName": "음식 이름",
                "description": "영양소 계산 과정 설명",
                "ingredients": [{"name": "재료명", "amount": 정수값, "unit": "단위"}],
                "nutrition": {
                  "calories": 정수값,
                  "protein": 정수값,
                  "fat": 정수값,
                  "carbs": 정수값
                }
              }`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 음식 사진을 분석해 JSON으로 응답해주세요:
                  
                  필수 고려사항:
                  - 모든 음식/음료를 분석 대상에 포함
                  - 포장 제품은 영양성분표 기준으로 분석
                  - 양 추정시 주변 사물 크기 참고
                  - 모든 음식의 중량/부피 추정 필수
                  - 음식이 아닐 경우 description만 간단히 작성
                  
                  응답 형식:
                  {
                    "isFood": true/false,
                    "foodName": "음식 이름(한글)",
                    "description": "음식 아닐 경우만 작성",
                    
                    "ingredients": [{
                      "name": "재료명",
                      "amount": number,
                      "unit": "g/ml",
                      "nutritionPer100g": {
                        "calories": number,
                        "protein": number,
                        "fat": number,
                        "carbs": number
                      }
                    }]
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

      if (!result.isFood) {
        setNotFoodAlert({
          isOpen: true,
          detectedContent: result.description || '음식이 아닌 것으로 판단됩니다.',
        });
        setStep('image-selected');
        return;
      }

      // 분석 결과 보정
      const correctedResult = validateAndCorrectAnalysis(result, completedFoodDatabase);

      const processedData = processApiResponse(correctedResult);
      setOriginalAnalysis(processedData);
      setAnalysis(processedData);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis(null);
      setStep('image-selected');
    }
  };

  const resetAnalyzer = () => {
    setStep('initial');
    setSelectedImage(null);
    setImageUrl('');
    setAnalysis(null);
    setOriginalAnalysis(null);
    setQuantity(1);
  };

  const successSave = () => {
    router.push('/main');
    return null;
  };

  const saveFoodLog = async () => {
    const imageToSave = filteredDisplayImage || displayImage;
    if (!imageToSave || !analysis) return;

    try {
      const fileExt = imageToSave.type.split('/')[1];
      const filePath = `${currentUser_id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, imageToSave);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('food-images').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        food_name: analysis.foodName,
        image_url: publicUrl,
        calories: analysis.nutrition.calories,
        protein: analysis.nutrition.protein,
        fat: analysis.nutrition.fat,
        carbs: analysis.nutrition.carbs,
      });

      if (insertError) throw insertError;

      setError(null);
      setShowResultAlert(true);
    } catch (error) {
      console.error('Error saving food log:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    }
  };

  // 렌더링
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
              <FoodImageFilter
                imageUrl={imageUrl}
                onPreviewChange={setCurrentFilters}
                filterType={filterType}
                onFilterChange={setFilterType}
              />
            ) : step === 'camera' ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Selected food" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                {/* 모서리 프레임 */}
                <div className="absolute top-16 left-16 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl border-gray-300"></div>
                <div className="absolute top-16 right-16 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl border-gray-300"></div>
                <div className="absolute bottom-16 left-16 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl border-gray-300"></div>
                <div className="absolute bottom-16 right-16 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl border-gray-300"></div>

                <span className="text-gray-500">음식 사진을 선택해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div
        className={`absolute bottom-0 w-full ${
          step === 'complete'
            ? 'h-[calc(100vh-20vw+32px)] py-8 pb-32'
            : 'h-[calc(100vh-100vw+32px)] py-8'
        } flex flex-col px-4  rounded-t-3xl bg-white`}
      >
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                  <AnalysisProgress currentStep={step} />
                  <p className="mt-8 text-gray-500 whitespace-pre-line">
                    {step === 'compress' && '이미지를 최적화하고 있어요...'}
                    {step === 'analyzing' &&
                      `사진을 자세히 살펴보고 있어요\n조금만 기다려주시면 곧 분석이 완료돼요🔍
                      \n다양한 음식 또는 다른 물건들이 있다면\n조금더 시간이 필요해요^^`}
                    {step === 'calculate' && '영양소를 계산하고 있어요...'}
                  </p>
                </div>
              )}

              {(step === 'complete' || step === 'image-selected') && analysis && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* Name & Number Card */}
                  <Card className="p-4">
                    <div className="grid grid-cols-10 gap-2 h-16">
                      <div className="col-span-6 py-2 flex items-center">
                        {editMode.foodName ? (
                          <Input
                            type="text"
                            value={analysis.foodName}
                            onChange={(e) => {
                              setAnalysis((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      foodName: e.target.value,
                                    }
                                  : null
                              );
                            }}
                            onBlur={() => setEditMode((prev) => ({ ...prev, foodName: false }))}
                            className="text-xl font-medium"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-xl line-clamp-2">{analysis.foodName}</p>
                            <button
                              onClick={() => setEditMode((prev) => ({ ...prev, foodName: true }))}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="col-span-4 py-2">
                        <div className="flex items-center justify-between h-full">
                          <button
                            onClick={() => handleDecrease(quantity, setQuantity)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                            disabled={quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleInputChange(e, setQuantity)}
                            min="1"
                            max="99"
                            className="w-12 h-12 text-center bg-white rounded-lg text-xl font-semibold"
                          />

                          <button
                            onClick={() => handleIncrease(quantity, setQuantity)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                            disabled={quantity >= 99}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Nutrition Card */}
                  <NutritionCard
                    nutrition={analysis.nutrition}
                    onNutritionChange={(newNutrition) => {
                      setAnalysis((prev) =>
                        prev
                          ? {
                              ...prev,
                              nutrition: newNutrition,
                            }
                          : null
                      );
                    }}
                    editable={true}
                    totalDailyCalories={dailyCaloriesTarget}
                  />

                  {/* Ingredients Card */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">재료 구성</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {analysis.ingredients.map((ingredient, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-md">
                          <p className="font-medium">{ingredient.name}</p>
                          <p className="text-sm text-gray-600">{ingredient.amount}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Section */}
      <NavigationButtonSection
        step={step}
        setStep={setStep}
        setSelectedImage={setSelectedImage}
        setAnalysisImage={setAnalysisImage}
        setImageUrl={setImageUrl}
        onAnalyze={applyFilters}
        stream={stream}
        setStream={setStream}
        videoRef={videoRef}
        onSave={saveFoodLog}
        resetAnalyzer={resetAnalyzer}
      />

      {/* 저장 결과 Alert */}
      <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? error : '음식 정보가 성공적으로 저장되었습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={successSave} className="p-6">
              확인
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 음식 아닌 이미지 경고 알림 */}
      <FoodDetectionAlert
        isOpen={notFoodAlert.isOpen}
        onClose={closeNotFoodAlert}
        detectedContent={notFoodAlert.detectedContent}
      />
      {/* 광고 알림 */}
      <AdDialog
        isOpen={showAdDialog}
        onClose={() => setShowAdDialog(false)}
        onAdComplete={handleAdComplete}
      />
    </div>
  );
};

export default FoodAnalyzer;
