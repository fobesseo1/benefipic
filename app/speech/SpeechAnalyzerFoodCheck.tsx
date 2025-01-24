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
  calculateHealthScore,
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
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';
import FoodCheckAlert from '../food-check/FoodCheckAlert';

interface SpeechAnalyzerFoodCheckProps {
  currentUser_id: string;
  newUserCheck: boolean;
  onDataUpdate?: () => void;
}

const SpeechAnalyzerFoodCheck = ({
  currentUser_id,
  newUserCheck,
  onDataUpdate,
}: SpeechAnalyzerFoodCheckProps) => {
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
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showHealthAlert, setShowHealthAlert] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<{
    score: number;
    message: string;
    currentFood: {
      foodName: string;
      nutrition: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
      };
    };
    alternatives?: {
      name: string;
      reason: string;
      benefits: string;
    }[];
  } | null>(null);

  const router = useRouter();

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition({
      commands: [],
    });

  const getHealthMessage = (score: number) => {
    if (score >= 9) return '아주 훌륭한 선택이에요!';
    if (score >= 8) return '괜찮은 선택이에요!';
    if (score >= 7) return '나쁘지 않지만, 다른 선택도...';
    return '다시 한번 생각해보시겠어요?';
  };

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

  const { checkEligibility } = useAnalysisEligibility(currentUser_id, newUserCheck);

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
  };

  const closeNotFoodAlert = () => {
    setNotFoodAlert({
      isOpen: false,
      detectedContent: '',
    });
  };

  useEffect(() => {
    if (listening) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        handleStopListening();
      }, 3000);
    }

    return () => clearTimeout(silenceTimer.current);
  }, [transcript, listening]);

  useEffect(() => {
    if (listening) {
      setInputText(transcript);
    }
  }, [transcript, listening]);

  useEffect(() => {
    if (originalAnalysis) {
      setAnalysis(calculateNutritionByQuantity(originalAnalysis, quantity));
    }
  }, [quantity, originalAnalysis]);

  const analyzeFood = async (text: string) => {
    if (!text.trim()) return;

    const supabase = createSupabaseBrowserClient();
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
        .update({
          last_free_use: new Date().toISOString(),
        })
        .eq('id', currentUser_id);

      if (updateError) {
        console.error('무료 사용 기록 실패:', updateError);
        return;
      }
    }

    setIsAnalyzing(true);
    try {
      // 첫 번째 API 호출: 음식 분석
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
              
              1. 분석 대상 및 기본 규칙:
                - 모든 섭취 가능한 음식/음료/포장식품은 isFood: true
                - 섭취 불가능한 물체는 isFood: false
                - 물도 분석 대상 (영양소 0으로 기록)
              
              2. 영양성분표 처리 규칙:
                - 글자가 명확한 경우: letter에 정보 포함
                - 글자가 불명확하거나 없는 경우: letter는 null, ingredients는 추정값 필수
                - letter.values가 있으면 serving_info 필수이며 다음을 포함:
                  * serving_type: total/per_unit/per_serving 중 하나
                  * total_size/total_unit: 모든 경우 필수
                  * base_size/base_unit: per_unit/per_serving인 경우 필수
              
              3. 음식명 규칙:
                - 여러 음식이 있는 경우: "A와 B 그리고 C" 형식으로 작성
              
              4. ingredients 작성 규칙:
                - 모든 경우에 반드시 추정값 제공 (null 사용 금지)
                - 제품/음식 종류, 크기, 일반적인 레시피 기준으로 추정
                - 재료별 양과 영양가 반드시 포함`, // 기존 시스템 프롬프트
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `다음 음식을 분석해 JSON으로 응답해주세요: ${text}
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
            "letter": [{
              "type": "nutrition_label",
              "content": "영양성분표 전체 텍스트",
              "serving_info": {
                "serving_type": "total/per_unit/per_serving",
                "total_size": number,
                "total_unit": "ml/g",
                "base_size": number,
                "base_unit": "ml/g"
              },
              "values": {
                "calories": number,
                "protein": number,
                "fat": number,
                "carbs": number
              },
              "units": {
                "calories": "표시된 단위",
                "protein": "표시된 단위",
                "fat": "표시된 단위",
                "carbs": "표시된 단위"
              }
            }],
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
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const apiResponse = JSON.parse(data.choices[0].message.content) as ApiResponse;

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

      const correctedResult = validateAndCorrectAnalysis(apiResponse, completedFoodDatabase);
      const processedData = processApiResponse(correctedResult);
      setOriginalAnalysis(processedData);
      setAnalysis(processedData);

      // 건강 점수 계산
      const healthScore = calculateHealthScore({
        foodName: processedData.foodName,
        nutrition: processedData.nutrition,
      });

      if (healthScore <= 7) {
        // 대체 음식 추천을 위한 두 번째 API 호출
        const recommendationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: '영양 전문가로서 더 건강한 대체 음식을 추천해주세요.',
              },
              {
                role: 'user',
                content: `현재 음식: ${processedData.foodName}의 더 건강한 대체 음식을 추천해주세요 대체 음식은 한국에서 쉽게 구할수 있는 음식이었으면 좋겠어 그러나 이게 반드시 한식을 추천해달라는건 아님을 명심해.
                  영양정보:
                  - 칼로리: ${processedData.nutrition.calories}kcal
                  - 단백질: ${processedData.nutrition.protein}g
                  - 지방: ${processedData.nutrition.fat}g
                  - 탄수화물: ${processedData.nutrition.carbs}g
                  
                  다음 JSON 형식으로 응답해주세요 음식은 최대2개만 추천해줘:
                  {
                    "recommendations": [
                      {
                        "name": "음식명",
                        "reason": "추천 이유(한글 20자 내외)",
                        "benefits": "건강상 이점(한글 20자 내외)"
                      }
                    ]
                  }`,
              },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
        });

        const alternativesData = await recommendationResponse.json();
        const alternatives = JSON.parse(alternativesData.choices[0].message.content);

        setHealthCheckResult({
          score: healthScore,
          message: getHealthMessage(healthScore),
          currentFood: {
            foodName: processedData.foodName,
            nutrition: processedData.nutrition,
          },
          alternatives: alternatives.recommendations,
        });
      } else {
        setHealthCheckResult({
          score: healthScore,
          message: getHealthMessage(healthScore),
          currentFood: {
            foodName: processedData.foodName,
            nutrition: processedData.nutrition,
          },
        });
      }

      setShowHealthAlert(true);
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
    setShowHealthAlert(false);
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
      onDataUpdate();
    }
    router.replace('/main');
  };

  const saveFoodLog = async () => {
    if (!analysis) return;
    setShowAnalysisAlert(false);

    try {
      const supabase = createSupabaseBrowserClient();

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

  const saveCheckLog = async () => {
    if (!analysis) return;
    setShowHealthAlert(false);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: insertError } = await supabase.from('food_check_logs').insert({
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
      console.error('Error saving to food_check_logs:', error);
      setError('저장 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    }
  };

  // 애니메이션 컴포넌트들
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
    <div className="space-y-6">
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
            placeholder="고민되는 음식을 알려주세요..."
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

      {listening && <BreathingCircle />}
      {isAnalyzing && <AnalyzingWave />}

      {/* 건강 체크 Alert */}
      {healthCheckResult && (
        <FoodCheckAlert
          isOpen={showHealthAlert}
          onClose={() => setShowHealthAlert(false)}
          healthCheck={healthCheckResult}
          onSaveToFoodLogs={saveFoodLog}
          onSaveToCheckLogs={saveCheckLog}
        />
      )}

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

      {/* 음식 아닌 경고 알림 */}
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

export default SpeechAnalyzerFoodCheck;
