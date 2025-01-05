'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { compressImage, fileToBase64 } from '@/utils/image';
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
import { Input } from '@/components/ui/input';
import AnalysisProgress from './Analysis Progress';
import FoodDetectionAlert from './FoodDetectionAlert';

type AnalysisStep =
  | 'initial'
  | 'camera'
  | 'image-selected'
  | 'compress'
  | 'analyzing'
  | 'calculate'
  | 'complete';

export interface NutritionData {
  foodName: string;
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

const FoodAnalyzer = ({ currentUser_id }: { currentUser_id: string }) => {
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<NutritionData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createSupabaseBrowserClient();

  const closeNotFoodAlert = () => {
    setNotFoodAlert({
      isOpen: false,
      detectedContent: '',
    });
  };

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

  const handleIncrease = () => {
    if (quantity < 99) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value > 99) {
        setQuantity(99);
      } else if (value < 1) {
        setQuantity(1);
      } else {
        setQuantity(value);
      }
    }
  };

  const processApiResponse = (apiData: NutritionData) => {
    const processedData = {
      ...apiData,
      ingredients: apiData.ingredients.map((ingredient) => {
        const match = ingredient.amount.match(/^(\d+\.?\d*)\s*(.+)$/);
        if (match) {
          return {
            ...ingredient,
            originalAmount: {
              value: parseFloat(match[1]),
              unit: match[2],
            },
          };
        }
        return ingredient;
      }),
    };

    setOriginalAnalysis(processedData);
    setAnalysis(processedData);
  };

  const analyzeImage1 = async () => {
    if (!selectedImage) return;

    try {
      setStep('compress');
      const base64Image = await fileToBase64(selectedImage);
      const fileType = selectedImage.type === 'image/png' ? 'png' : 'jpeg';

      setStep('analyzing');
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `당신은 음식 영양 분석 전문가입니다. 다음 단계로 분석을 진행하세요:
  
  1단계: 시각적 분석
  - 음식의 종류와 구성 요소를 정확히 파악
  - 식기나 주변 사물을 기준으로 전체 양이나 중량 등 추정
  - 각 구성 요소의 비율 파악해주세요
  
  2단계: 영양소 계산
  - 복합 메뉴(예: 세트메뉴)는 반드시 각 구성 요소를 개별 계산 후 합산
  - 각 음식의 표준 1인분 기준 영양성분을 바탕으로 계산
  - 계산된 값이 일반적인 범위를 크게 벗어나면 재검토
  
  주의사항:
  1. 여러 음식이 있거나 여러 재료가 있는 경우:
  - 각 음식과 재료를 개별적으로 계산한 후 합산
  - 예: "냉면과 초밥 세트"면 냉면의 영양성분과 초밥의 영양성분을 따로 계산
  
  2. 각 메뉴의 계산:
  - 주요 재료들의 영양성분 합산
  - serving.amount와 ingredients 정보를 모두 고려
  - 메뉴의 특성에 맞는 조리 방법 반영
  
  3. 계산 과정 검증:
  - 각 구성 요소별 계산 값이 합리적인지 확인
  - 전체 합산 값이 일반적인 범위 내인지 확인
  - 이상값 발견 시 재계산`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 음식 사진을 분석하고 정확한 영양성분을 계산해주세요.
  
  각 음식이 구분되는 세트메뉴의 경우 반드시 개별 계산 후 합산하세요.
  각 계산 과정과 근거를 상세히 기록하세요.
  
  다음 형식의 JSON으로 응답해주세요:
  {
    "foodName": "string",
    "description": "string",
    "components": [
      {
        "name": "string",
        "amount": "string",
        "calories": "number",
        "protein": "number",
        "fat": "number",
        "carbs": "number"
      }
    ],
    "ingredients": [
      {
        "name": "string",
        "amount": "string",
        "confidence": "string"
      }
    ],
    "nutrition": {
      "calories": "number",
      "protein": "number",
      "fat": "number",
      "carbs": "number"
    },
    "analysis": {
      "calculationMethod": "string",
      "breakdown": "string",
      "verification": "string"
    }
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

      const analysisData = await analysisResponse.json();
      const result = JSON.parse(analysisData.choices[0].message.content);

      console.log('분석 결과:', result);
      processApiResponse(result);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis(null);
      setStep('image-selected');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    try {
      // 이미지 압축 단계
      setStep('compress');
      const base64Image = await fileToBase64(selectedImage);
      const fileType = selectedImage.type === 'image/png' ? 'png' : 'jpeg';

      // 음식 분석 단계
      setStep('analyzing');
      const initialAnalysis = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content:
                '당신은 음식 영양 분석 전문가입니다. 음식 사진을 보고 최대한 정확하게 분석하고 음식이 아닌경우 음식이 아닐경우 isFood의 항목 false로 음식이라면 true',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 음식 사진을 자세히 분석해주세요. 다음 사항들을 고려해주세요:
                  - 음식의 양을 추정할 때는 식기나 주변 사물의 크기를 기준으로 삼아주세요
                  - 반드시 사진에 있는 모든 음식을 고려해주세요
                  - 인분 수뿐만 아니라 실제 중량이나 부피도 반드시 추정해주세요
                  - 다만 예외적으로, 음식이 아닐 경우 어떤 이미지인지 아주 간단히 description 항목에 남겨주세요
  
                  다음 형식의 JSON으로 응답해주세요:
                  {
                    "isFood": true/false, 
                    "foodName": "음식 이름",
                    "description": "음식의 상세 설명 (조리 방법, 식재료 특징 등)",
                    "serving": {
                      "amount": "정확한 중량 또는 부피 (범위로 표현)",
                      "reference": "크기 추정에 사용된 기준 (식기 또는 사물)",
                    },
                    "ingredients": [
                      {
                        "name": "재료명",
                        "amount": "추정 수량/중량",
                      }
                    ]
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
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });

      const initialData = await initialAnalysis.json();
      const initialResult = JSON.parse(initialData.choices[0].message.content);
      console.log('초기 분석 결과:', initialResult);

      if (!initialResult.isFood) {
        setNotFoodAlert({
          isOpen: true,
          detectedContent: initialResult.description,
        });
        setStep('image-selected');
        return; // 두 번째 API 호출 중단
      }

      // 영양소 계산 단계
      setStep('calculate');
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `분석된 음식 정보:
      ${JSON.stringify(initialResult, null, 2)}
      
      위 정보를 바탕으로 각 재료의 영양분석을 다음 순서로 정확히 계산해주세요:
0. 음식이 명확히 결정된 경우에는 그 음식의 일반적인 영양성분 정보 이용 아니면 아래의1,2,3에 따라 계산
1. 각 재료/음식의 단위(1g 또는 1개)당 기본 영양성분을 먼저 결정
2. 반드시 위 정보중 ingredients의 각 object의 amount를 이용하여 전체 중량이나 개수를 곱하여 최종 영양성분 계산
3. 모든 재료의 영양성분을 합산하여 Nutrition에 저장 정확한 계산을 위해 계산된 값을 꼭 확인하고 검산해야함

예) 음식 300g인 경우
- 1g당 영양성분 먼저 결정
- 결정된 값에 300을 곱하여 계산

예) 햄버거1개 + 콜라500ml
- 햄버거 1개 = 개당 400 kcal * 1개 =400kcal
- 콜라 500ml = ml당 0.38 kcal * 500 ml  = 190kcal
- 총 영양성분 = 400kcal + 190kcal = 590kcal
      
      다음 JSON 형식으로 응답해주세요:
      {
        "foodName": "음식 이름",
        "servingSize": "사용한 중간값",
        "ingredients": [
          {
            "name": "재료명",
            "amount": "정확한 중량",
          }
        ],
        "calculation": {
          "method": "계산 방법 설명",
          "details": "세부 계산 과정"
        },
        "nutrition": {
          "calories": 계산된 ingredients의 각각 요소들의 칼로리의 합,
          "protein": 계산된 ingredients의 각각 요소들의 단백질의 합,
          "fat": 계산된 ingredients의 각각 요소들의 지방의 합,
          "carbs": 계산된 ingredients의 각각 요소들의 탄수화물의 합
        },
      }`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      const finalData = await finalResponse.json();
      const finalResult = JSON.parse(finalData.choices[0].message.content);
      console.log('최종 계산 결과:', finalResult);

      processApiResponse(finalResult);
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
    if (!selectedImage || !analysis) return;

    try {
      // 1. Storage에 이미지 업로드
      const fileExt = selectedImage.type.split('/')[1];
      const filePath = `${currentUser_id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      // 2. 이미지 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('food-images').getPublicUrl(filePath);

      // 3. food_logs 테이블에 데이터 저장
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

      // 성공 Alert 표시
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
            {step === 'camera' ? (
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

                {/* 안내 텍스트 */}
                <span className="text-gray-500">음식 사진을 선택해주세요</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div
        className={`absolute bottom-[92px] w-full ${
          step === 'complete' ? 'h-[calc(100vh-50vw-60px)]' : 'h-[calc(100vh-100vw-60px)]'
        } flex flex-col px-6 py-8 rounded-t-3xl bg-white`}
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
                <div className="flex flex-col items-center justify-center h-full">
                  <AnalysisProgress currentStep={step} />
                  <p className="mt-8 text-gray-500">
                    {step === 'compress' && '이미지를 최적화하고 있어요...'}
                    {step === 'analyzing' && '음식을 분석하고 있어요...'}
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
                            onClick={handleDecrease}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                            disabled={quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            value={quantity}
                            onChange={handleInputChange}
                            min="1"
                            max="99"
                            className="w-12 h-12 text-center bg-white rounded-lg text-xl font-semibold"
                          />

                          <button
                            onClick={handleIncrease}
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
        setImageUrl={setImageUrl}
        onAnalyze={analyzeImage}
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
            <AlertDialogAction onClick={successSave}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 음식 아닌 이미지 경고 알림 */}
      <FoodDetectionAlert
        isOpen={notFoodAlert.isOpen}
        onClose={closeNotFoodAlert}
        detectedContent={notFoodAlert.detectedContent}
      />
    </div>
  );
};

export default FoodAnalyzer;
