'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CornerDownLeft, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  ApiResponse,
  calculateTotalNutrition,
  findExactMatchFood,
  NutritionData,
  roundNutritionValues,
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
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';

interface SpeechAnalyzerMenuProps {
  currentUser_id: string;
  newUserCheck: boolean;
  onDataUpdate?: () => void;
}

const getUserHealthProfile = async (userId: string) => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Health records 조회 실패:', error);
    return null;
  }

  if (!data) return null;

  const birthDate = new Date(data.birth_date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  return {
    age,
    gender: data.gender,
    bmiStatus: data.bmi_status,
    activityLevel: data.activity_level,
    currentWeight: data.weight,
    recommendedWeight: data.recommended_weight,
    tdee: data.tdee,
  };
};

const SpeechAnalyzerMenu = ({
  currentUser_id,
  newUserCheck,
  onDataUpdate,
}: SpeechAnalyzerMenuProps) => {
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout>();
  const [error, setError] = useState<string | null>(null);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [showAnalysisAlert, setShowAnalysisAlert] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);

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

  const processApiResponse = (apiData: ApiResponse): NutritionData => {
    console.log('API 응답 데이터:', apiData);

    const exactMatch = findExactMatchFood(apiData.foodName, completedFoodDatabase);

    const processedIngredients = apiData.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: `${ingredient.amount.toString()}${ingredient.unit}`,
      originalAmount: {
        value: ingredient.amount,
        unit: ingredient.unit,
      },
    }));

    if (exactMatch) {
      return {
        foodName: apiData.foodName,
        healthTip: apiData.healthTip,
        ingredients: processedIngredients,
        nutrition: exactMatch.nutrition,
      };
    }

    const correctedResult = validateAndCorrectAnalysis(apiData, completedFoodDatabase);
    const totalNutrition = calculateTotalNutrition(correctedResult.ingredients);
    const roundedNutrition = roundNutritionValues(totalNutrition);

    return {
      foodName: apiData.foodName,
      healthTip: apiData.healthTip,
      ingredients: processedIngredients,
      nutrition: roundedNutrition,
    };
  };

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
      // 사용자 건강 정보 가져오기
      const healthProfile = await getUserHealthProfile(currentUser_id);
      const userDescription = healthProfile
        ? `
대상자 정보:
- ${healthProfile.age}세 ${healthProfile.gender === 'female' ? '여성' : '남성'}
- ${
            healthProfile.bmiStatus === 'overweight' || healthProfile.bmiStatus === 'obese'
              ? '체중 관리가 필요한'
              : '건강한'
          } 체형
- 하루 필요 열량: ${healthProfile.tdee}kcal
- 권장 체중: ${healthProfile.recommendedWeight}kg (현재 ${healthProfile.currentWeight}kg)
- 활동량: ${healthProfile.activityLevel}`
        : `
대상자 정보:
- 일반적인 성인
- 건강한 식단 관리 필요`;

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
              - 분석 대상:
                * 모든 섭취 가능한 음식과 음료
                * 포장된 식품/음료 제품
                * 물을 포함한 모든 음료
                * 영양소가 있거나 없더라도 인간이 섭취할 수 있는 모든 것
              
              - 영양소 분석 지침:
                * 물의 경우도 영양소 0으로 기록하되 분석 대상에 포함
                * 포장 제품의 경우 영양성분표 기준으로 분석
                * 액체류도 100ml 기준으로 영양소 분석 진행
              
              - isFood 판단 기준:
                * true: 모든 음식, 음료, 포장식품을 포함
                * false: 섭취 불가능한 물체나 비식품만 해당`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 음식들 중에서 한가지 음식만 골라주세요 사용자의 건강상태에 맞춰서 그나마 건강에 좋은 메뉴를 고르는거에요 입력되지 않은 음식을 답변할수 없어요 반드시 입력된 음식중에 고르세요:
                  입력된 음식들: ${text}
                  사용자의 건강상태:${userDescription}
필수 요구사항:
1. 반드시 사진에 있는 메뉴 또는 제품들 중에서 1개의 메뉴 또는 1개의 제품만 선택할 것
2. 각 음식의 실제 양(g/ml)을 추정할 것
3. 재료별 영양정보를 상세히 분석할 것
4. 선택한 메뉴에 대해 다음 정보를 포함할 것:
   - 대상자의 건강 상태와 필요 영양소를 고려한 추천 이유
   - 재료별 정확한 양과 영양성분

다음 형식의 JSON으로 응답해주세요:
{
  "isFood": true,
  "foodName": "선택한 메뉴 이름 반드시 한국어로",
  "healthTip": "개인별 맞춤 영양 조언",
  "ingredients": [
    {
      "name": "재료명",
      "amount": number,
      "unit": "g 또는 ml",
      "nutritionPer100g": {
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
      }
    }
  ]
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

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      const apiResponse = JSON.parse(data.choices[0].message.content) as ApiResponse;
      const processedData = processApiResponse(apiResponse);
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

  // 애니메이션 컴포넌트들
  const BreathingCircle = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="relative flex items-center justify-center">
        <div className="relative w-32 h-32 bg-blue-400/20 rounded-full flex flex-col items-center justify-center space-y-4">
          <Mic className="h-12 w-12 text-blue-400 animate-ping" />
          <p className="text-blue-400 text-base tracking-tighter">입력중</p>
        </div>

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

  const AnalyzingWave = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative flex flex-col items-center justify-center w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full space-y-4">
          <Brain className="h-12 w-12 text-white animate-ping" />
          <p className="text-white tracking-tighter text-base">분석중</p>
        </div>

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
          className="flex items-center rounded-2xl shadow-sm border px-4 py-4 bg-black"
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

      {listening && <BreathingCircle />}
      {isAnalyzing && <AnalyzingWave />}

      {/* 분석 결과 Alert */}
      <AlertDialog open={showAnalysisAlert} onOpenChange={setShowAnalysisAlert}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              <span className="text-sm text-gray-400">👍추천: </span>
              {analysis?.foodName}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* Nutrition Card */}
          {analysis && <NutritionCard nutrition={analysis.nutrition} />}

          {/* Health Tip Card */}
          {analysis?.healthTip && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">건강 꿀팁</h3>
              <div className="grid grid-cols-1 gap-3">
                <p className="text-gray-700">{analysis.healthTip}</p>
              </div>
            </Card>
          )}

          <AlertDialogFooter className="grid grid-cols-2 gap-4">
            <Button onClick={resetAnalyzer} variant="outline" className="w-full py-6">
              다시하기
            </Button>
            <Button onClick={() => router.push('/main')} className="w-full py-6">
              홈으로
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* 광고 알림 */}
      <AdDialog
        isOpen={showAdDialog}
        onClose={() => setShowAdDialog(false)}
        onAdComplete={handleAdComplete}
      />
    </div>
  );
};

export default SpeechAnalyzerMenu;
