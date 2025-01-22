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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AnalysisProgress from './AnalysisProgress';
import FoodDetectionAlert from './FoodDetectionAlert';
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';
import { Button } from '@/components/ui/button';
//import { NutritionData } from '@/utils/food-analysis';
import FoodImageFilter from '../components/shared/ui/FoodImageFilter';
import { AnalysisStep } from './utils/types';
import { handleDecrease, handleIncrease, handleInputChange } from './utils/handlers';
import { ApiResponse } from '@/utils/food-analysis';

interface NutritionData {
  foodName: string;
  healthTip?: string;
  ingredients: Array<{
    name: string;
    amount: string;
    originalAmount?: {
      value: number;
      unit: string;
    };
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const FoodAnalyzerGpt = ({
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
  const [displayImage, setDisplayImage] = useState<File | null>(null);
  const [analysisImage, setAnalysisImage] = useState<File | null>(null);
  const [filteredDisplayImage, setFilteredDisplayImage] = useState<File | null>(null);
  const [filterType, setFilterType] = useState('none');
  const [currentFilters, setCurrentFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  });

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createSupabaseBrowserClient();

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

  const closeNotFoodAlert = () => {
    setNotFoodAlert({ isOpen: false, detectedContent: '' });
  };

  const calculateNutritionByQuantity = (
    originalData: NutritionData,
    qty: number
  ): NutritionData => {
    return {
      ...originalData,
      nutrition: {
        calories: Math.round(originalData.nutrition.calories * qty),
        protein: parseFloat((originalData.nutrition.protein * qty).toFixed(1)),
        fat: parseFloat((originalData.nutrition.fat * qty).toFixed(1)),
        carbs: parseFloat((originalData.nutrition.carbs * qty).toFixed(1)),
      },
      ingredients: originalData.ingredients.map((ingredient) => {
        if (ingredient.originalAmount) {
          return {
            ...ingredient,
            amount: `${(ingredient.originalAmount.value * qty).toFixed(1)}${
              ingredient.originalAmount.unit
            }`,
          };
        }
        return ingredient;
      }),
    };
  };

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

      const filterDiv = document.createElement('div');
      filterDiv.className = filterType === 'none' ? '' : `filter-${filterType}`;
      document.body.appendChild(filterDiv);
      const computedStyle = window.getComputedStyle(filterDiv);
      const filterValue = computedStyle.filter;
      document.body.removeChild(filterDiv);

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

  const analyzeImage = async () => {
    if (!analysisImage) return;

    const eligibility = await checkEligibility();
    if (!eligibility.canAnalyze) {
      if (eligibility.reason === 'needs_ad') {
        setShowAdDialog(true);
        return;
      }
      return;
    }

    if (eligibility.reason === 'daily_free') {
      const { error: updateError } = await supabase
        .from('userdata')
        .update({ last_free_use: new Date().toISOString() })
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

      // 1차 API 요청: 이미지 분석 및 설명 생성
      const firstResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `이 이미지를 최대한 객관적이고 상세하게 분석해주세요. 

1. 먼저 이미지가 음식인지 아닌지 판단해주세요. 음식의 라벨이나 음식 포장, 패키지 등도 음식으로 생각합니다.

2. 만약 음식이 아니라면:
   - 간단히 이미지의 내용물이 무엇인지만 설명해주세요.

3. 만약 음식이라면 다음 사항들을 자세히 설명해주세요:
   - 어떤 음식인지 (크기, 모양, 색상 포함)
   - 식별 가능한 모든 재료들
   - 각 재료의 대략적인 양을 추정할 수 있는 단서들:
     * 주변 사물과의 비교
     * 재료들 간의 상대적 비율
     * 일반적인 조리법 기준
     * 그릇이나 용기의 크기
   - 중량이나 부피를 추정할 수 있는 모든 시각적 단서들
   
최대한 객관적이고 정량적으로 설명해주세요. 이는 다음 단계에서 정확한 영양정보를 계산하는데 사용됩니다.
`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `앞서 분석된 이미지 설명을 바탕으로, 다음 JSON 형식에 맞춰 영양정보를 추론해주세요:

{
  "isFood": boolean,
  "foodName": "음식 이름(한글)",
  "description": "음식이 아닌 경우만 설명",
  "ingredients": [
    {
      "name": "재료명",
      "amount": number,
      "unit": "g" 또는 "ml",
      "nutritionPer100g": {
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
      }
    }
  ]
}

주의사항:
1. 앞서 제공된 이미지 분석 내용을 기반으로 논리적으로 추론해주세요.
2. amount는 반드시 정확한 숫자로 제시해야 합니다.
3. unit은 반드시 "g" 또는 "ml"로만 표시해야 합니다.
4. nutritionPer100g의 모든 값은 100g 당 기준으로 계산해야 합니다.
5. 각 수치는 일반적인 식품 영양정보 데이터베이스를 기준으로 합리적인 범위 내에서 추정해주세요.
6. 1번에서 음식이 아니라고 판단된 경우, isFood는 false로 하고 description만 간단히 작성하면 됩니다.`,
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
          max_tokens: 500,
        }),
      });

      const firstData = await firstResponse.json();
      const foodDescription = firstData.choices[0].message.content;
      console.log('firstData:', foodDescription);

      // 2차 API 요청: 설명을 구조화된 JSON으로 변환
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `당신은 음식 설명을 정확한 JSON으로 변환하는 전문가입니다.
              설명을 최대한 정확히 분석해서 음식의 칼로리와 단백질, 지방, 영양소를 최대한 논리적이고 실제와 가깝게 추정하는 것이 목표임을 명심해 
              다음 형식에 맞춰 변환해주세요:
              {
                "isFood": boolean,
                "foodName": "음식 이름(한글)",
                "description": "음식이 아닌 경우만 설명",
                "ingredients": [
                  {
                    "name": "재료명",
                    "amount": number,
                    "unit": "g" 또는 "ml",
                    "nutritionPer100g": {
                      "calories": number,
                      "protein": number,
                      "fat": number,
                      "carbs": number
                    }
                  }
                ]
              }
              주의사항:
              - amount는 정확한 숫자여야 합니다
              - unit은 반드시 g 또는 ml이어야 합니다
              - nutritionPer100g의 값들은 100g 당 기준이어야 합니다`,
            },
            {
              role: 'user',
              content: foodDescription,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      const secondData = await secondResponse.json();
      const result = JSON.parse(secondData.choices[0].message.content);
      console.log('result:', result);

      if (!result.isFood) {
        setNotFoodAlert({
          isOpen: true,
          detectedContent: result.description || '음식이 아닌 것으로 판단됩니다.',
        });
        setStep('image-selected');
        return;
      }

      // 분석 결과를 UI 표시용 형식으로 변환
      // 분석 결과를 UI 표시용 형식으로 변환
      const processedData: NutritionData = {
        foodName: result.foodName,
        ingredients: result.ingredients.map((ing: Ingredient) => ({
          name: ing.name,
          amount: `${ing.amount}${ing.unit}`,
          originalAmount: {
            value: ing.amount,
            unit: ing.unit,
          },
        })),
        nutrition: {
          calories: Math.round(
            result.ingredients.reduce(
              (sum: number, ing: Ingredient) =>
                sum + (ing.nutritionPer100g.calories * ing.amount) / 100,
              0
            )
          ),
          protein: parseFloat(
            result.ingredients
              .reduce(
                (sum: number, ing: Ingredient) =>
                  sum + (ing.nutritionPer100g.protein * ing.amount) / 100,
                0
              )
              .toFixed(1)
          ),
          fat: parseFloat(
            result.ingredients
              .reduce(
                (sum: number, ing: Ingredient) =>
                  sum + (ing.nutritionPer100g.fat * ing.amount) / 100,
                0
              )
              .toFixed(1)
          ),
          carbs: parseFloat(
            result.ingredients
              .reduce(
                (sum: number, ing: Ingredient) =>
                  sum + (ing.nutritionPer100g.carbs * ing.amount) / 100,
                0
              )
              .toFixed(1)
          ),
        },
      };

      setOriginalAnalysis(processedData);
      setAnalysis(processedData);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis(null);
      setStep('image-selected');
      setError('분석 중 오류가 발생했습니다.');
    }
  };

  const handleAdComplete = async () => {
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
            ? 'h-[calc(100vh-50vw+32px)] py-8 pb-32'
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

      {/* Alert Dialogs */}
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

      <FoodDetectionAlert
        isOpen={notFoodAlert.isOpen}
        onClose={closeNotFoodAlert}
        detectedContent={notFoodAlert.detectedContent}
      />

      <AdDialog
        isOpen={showAdDialog}
        onClose={() => setShowAdDialog(false)}
        onAdComplete={handleAdComplete}
      />
    </div>
  );
};

export default FoodAnalyzerGpt;
