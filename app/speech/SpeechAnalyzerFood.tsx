// components/SpeechAnalyzerFood.tsx
'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CornerDownLeft, Pen, Minus, Plus, Pencil, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import FoodDetectionAlert from '../food/FoodDetectionAlert';
import {
  ApiResponse,
  calculateNutritionByQuantity,
  NutritionData,
  processApiResponse,
  validateAndCorrectAnalysis,
} from '@/utils/food-analysis';
import { completedFoodDatabase } from '../food-description/foodDatabase';
import { useRouter } from 'next/navigation';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import NutritionCard from '../components/shared/ui/NutritionCard';
import { handleDecrease, handleIncrease, handleInputChange } from '../food/utils/handlers';

interface SpeechAnalyzerFoodProps {
  currentUser_id: string;
  newUserCheck: boolean;
  onDataUpdate?: () => void; // 추가
}

const SpeechAnalyzerFood = ({
  currentUser_id,
  newUserCheck,
  onDataUpdate,
}: SpeechAnalyzerFoodProps) => {
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout>();
  const [notFoodAlert, setNotFoodAlert] = useState({
    isOpen: false,
    detectedContent: '',
  });
  const [originalAnalysis, setOriginalAnalysis] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [showAnalysisAlert, setShowAnalysisAlert] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [editMode, setEditMode] = useState({
    foodName: false,
  });
  const router = useRouter();

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition({
      commands: [],
    });

  const handleStartListening = () => {
    setIsTypingMode(false);
    setInputText('');
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: 'ko-KR',
    });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) {
      analyzeFood(transcript);
    }
  };

  /* 음식이 아니면 알려주는 알랏 닫기 */
  const closeNotFoodAlert = () => {
    setNotFoodAlert({
      isOpen: false,
      detectedContent: '',
    });
  };

  // 3초 무음 감지
  useEffect(() => {
    if (listening) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        handleStopListening();
      }, 3000);
    }

    return () => clearTimeout(silenceTimer.current);
  }, [transcript, listening]);

  // 음성 입력 중 실시간으로 inputText 업데이트
  useEffect(() => {
    if (listening) {
      setInputText(transcript);
    }
  }, [transcript, listening]);

  //수정시필요
  useEffect(() => {
    if (originalAnalysis) {
      setAnalysis(calculateNutritionByQuantity(originalAnalysis, quantity));
    }
  }, [quantity, originalAnalysis]);

  const analyzeFood = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    try {
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
              -유의사항
              1.사용자의 음성 설명을 듣고 음식의 영양소를 분석해주세요.
2.음성을 텍스트로 변환한거라 완전히 맞춤법이 맞지 않더라도:
   - 발음이 비슷한 실제 존재하는 음식 이름을 찾아주세요 (예: "라조기 나둬요" → "라조기", "부대찍게" → "부대찌개")
   - 음식 이름이 불완전하게 인식되어도 유사한 발음의 음식을 추측해주세요
   - 명확하지 않은 경우 가장 일반적인 음식을 선택해주세요
3.반드시!! 입력내용에 음식 관련 단어가 하나라도 포함되어 있다면:
   - isFood는 무조건 true로 설정
   - 음식과 관련된 부분만 추출하여 분석
   - 불필요한 단어나 문장은 무시
   - 여러 음식이 언급된 경우 '과'로 연결하여 분석
4.각 영양소를 계산할때 반드시 사람들이 말하는 그릇,개,접시,인분 등의 단위를 g이나 ml 등의 정확한 단위로 환산하여 계산하고 답변해줘
   - 1그릇 → 구체적인 g이나 ml로 환산
   - 1인분 → 실제 그램수로 환산
   - 1접시 → 실제 그램수로 환산
   - 개수 → 1개당 실제 그램수로 환산
5.단위 무게나 단위당 칼로리나 영양소에 실제 무게나 단위수를 곱하는 논리로 계산해
   - 예: 1그릇(600g)이면 100g당 영양소 × 6
   - 예: 2인분이면 1인분(250g)당 영양소 × 2
   - 매우 중요. 반드시 차근차근 생각해서 계산
6.오직 모든 단어가 음식과 완전히 무관할 때만 isFood: false
              
              응답 형식:
              {
              "isFood": true,
  "foodName": "음식 이름",
  "description": "영양소 계산 과정 설명",
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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `다음 음식을 분석해 JSON으로 응답해주세요:
                  설명 내용: ${text}`,
                },
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      const apiResponse = JSON.parse(data.choices[0].message.content) as ApiResponse;
      console.log('(1차)API 응답:', apiResponse);

      if (!apiResponse.isFood) {
        setNotFoodAlert({
          isOpen: true,
          detectedContent: apiResponse.description || '음식이 아닌 것으로 판단됩니다.',
        });
        setIsAnalyzing(false);
        setInputText('');
        resetTranscript();
        return;
      }

      // 분석 결과 보정
      const correctedResult = validateAndCorrectAnalysis(apiResponse, completedFoodDatabase);

      // 보정된 결과 처리
      const processedData = processApiResponse(correctedResult);
      console.log('(2차)보정 결과:', processedData);
      setOriginalAnalysis(processedData);
      setAnalysis(processedData);
      setShowAnalysisAlert(true);
      setInputText('');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      resetTranscript();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      analyzeFood(inputText);
    }
  };

  const resetAnalyzer = () => {
    setShowAnalysisAlert(false);
    setAnalysis(null);
    setOriginalAnalysis(null);
    setInputText('');
    resetTranscript();
    setIsAnalyzing(false);
  };

  const successSave = () => {
    setShowResultAlert(false);
    if (onDataUpdate) {
      onDataUpdate(); // 부모 컴포넌트의 데이터 갱신
    }
    router.replace('/main');
  };

  const saveFoodLog = async () => {
    if (!analysis) return;
    setShowAnalysisAlert(false);

    try {
      const supabase = createSupabaseBrowserClient();

      // 데이터베이스에 저장
      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        food_name: analysis.foodName,
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

  // const BreathingCircle = () => (
  //   <div className="flex items-center justify-center gap-4">
  //     <div className="relative flex items-center justify-center">
  //       <div className="absolute w-8 h-8 bg-blue-100/50 rounded-full animate-ping" />
  //       <div className="relative w-6 h-6 bg-blue-200/80 rounded-full" />
  //       {/* <div className="absolute text-gray-500 text-sm ml-10">분석 중</div> */}
  //     </div>
  //     {/* <div className=" text-gray-500 text-sm ">분석 중</div> */}
  //   </div>
  // );

  const LoadingDots = () => (
    <div className="flex items-center justify-center gap-1">
      <div className="text-gray-500 text-sm">분석 중</div>
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 bg-linear-to-bl from-violet-500 to-fuchsia-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    </div>
  );

  // 음성 입력 시 작은 파동
  const BreathingCircle = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="relative flex items-center justify-center">
        {/* 기본 원 */}
        <div className="relative w-32 h-32 bg-blue-400/20 rounded-full flex flex-col items-center justify-center space-y-4">
          <Mic className="h-12 w-12 text-blue-400 animate-ping" />
          <p className="text-blue-400 text-base tracking-tighter">입력중</p>
        </div>

        {/* 파동 효과 (3개의 파동) */}
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="absolute w-32 h-32 bg-blue-400/30 rounded-full animate-ripple"
            style={{
              animation: 'ripple 1.5s linear infinite',
              animationDelay: `${index * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  // 분석 중 큰 파동
  const AnalyzingWave = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="relative flex flex-col items-center justify-center">
        {/* 중앙 원 */}
        <div className="relative flex flex-col items-center justify-center w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full space-y-4">
          <Brain className="h-12 w-12 text-white animate-ping" />
          <p className="text-white tracking-tighter text-base">분석중</p>
        </div>

        {/* 큰 파동 효과 (4개의 파동) */}
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="absolute w-32 h-32 rounded-full"
            style={{
              background:
                'linear-gradient(to right, rgba(96, 165, 250, 0.3), rgba(167, 139, 250, 0.3))',
              animation: 'largeRipple 2s linear infinite',
              animationDelay: `${index * 0.5}s`,
              scale: `${1 + index * 0.5}`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 ">
      <div className="relative">
        <form
          onSubmit={handleSubmit}
          className="flex items-center  rounded-2xl shadow-sm border px-4 py-4 bg-black"
        >
          {listening ? (
            <button
              type="button"
              className="rounded-full w-12 h-12 bg-red-600 shadow-md flex items-center justify-center"
              onClick={handleStopListening}
              disabled={isAnalyzing}
            >
              <MicOff className="h-6 w-6 text-white" />
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full w-12 h-12 bg-gray-50 shadow-md flex items-center justify-center"
              onClick={handleStartListening}
              disabled={isAnalyzing}
            >
              <Mic className="h-6 w-6 text-gray-600" />
            </button>
          )}

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="음식을 말하거나 직접 입력하세요..."
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent p-2 text-sm tracking-tighter text-white"
            readOnly={listening || isAnalyzing}
            onFocus={() => setIsTypingMode(true)}
          />
          <button
            type="submit"
            className="rounded-full"
            disabled={!inputText.trim() || isAnalyzing}
          >
            <CornerDownLeft className="h-5 w-5 text-gray-400" size={12} />
          </button>
        </form>
      </div>
      {/* 에니메이션 */}
      {listening && <BreathingCircle />}
      {isAnalyzing && <AnalyzingWave />}
      {/* 분석 결과 알림 */}
      <AlertDialog open={showAnalysisAlert} onOpenChange={setShowAnalysisAlert}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{analysis?.foodName}</AlertDialogTitle>
          </AlertDialogHeader>

          {/* Name & Number Card */}
          <Card className="p-4">
            <div className="grid grid-cols-10 gap-2 h-16">
              <div className="col-span-6 py-2 flex items-center">
                {editMode.foodName ? (
                  <Input
                    type="text"
                    value={analysis?.foodName}
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
                    <p className="font-medium text-xl line-clamp-2">{analysis?.foodName}</p>
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
          {analysis && (
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
          )}

          {/* Ingredients Card */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">재료 구성</h3>
            <div className="grid grid-cols-2 gap-3">
              {analysis?.ingredients.map((ingredient, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-md">
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="text-sm text-gray-600">{ingredient.amount}</p>
                </div>
              ))}
            </div>
          </Card>

          <AlertDialogFooter className="grid grid-cols-2 gap-4">
            <Button onClick={resetAnalyzer} variant="outline" className="w-full py-6">
              다시하기
            </Button>
            <Button onClick={saveFoodLog} className="w-full py-6">
              저장하기
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* 음식 아닌 이미지 경고 알림 추가 */}
      <FoodDetectionAlert
        isOpen={notFoodAlert.isOpen}
        onClose={closeNotFoodAlert}
        detectedContent={notFoodAlert.detectedContent}
      />
      {/* 저장 결과 알림 */}
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
    </div>
  );
};

export default SpeechAnalyzerFood;
