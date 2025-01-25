'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CornerDownLeft, Pencil, Timer, Flame, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useRouter } from 'next/navigation';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exerciseDatabase } from '../exercise-description/exerciseDatabase';
import { useAnalysisEligibility } from '../hooks/useAnalysisEligibility';
import AdDialog from '../components/shared/ui/AdDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  duration: number; // 추가: API가 계산한 시간
  caloriesPerHour: number;
  exerciseType?: string;
  equipmentRequired?: string[];
}

interface SpeechAnalyzerExerciseProps {
  currentUser_id: string;
  newUserCheck: boolean;
  onDataUpdate?: () => void;
}

const SpeechAnalyzerExercise = ({
  currentUser_id,
  newUserCheck,
  onDataUpdate,
}: SpeechAnalyzerExerciseProps) => {
  // 상태 관리
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout>();
  const [error, setError] = useState<string | null>(null);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [showAnalysisAlert, setShowAnalysisAlert] = useState(false);
  const [duration, setDuration] = useState(30); // 기본 30분
  const [showAdDialog, setShowAdDialog] = useState(false);
  const router = useRouter();

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition({
      commands: [],
    });

  const { checkEligibility } = useAnalysisEligibility(currentUser_id, newUserCheck);

  // 헬퍼 함수들
  const calculateTotalCalories = (caloriesPerMinute: number, duration: number): number => {
    return Math.round(caloriesPerMinute * duration);
  };

  const findMatchingExercise = (exerciseName: string) => {
    return exerciseDatabase.find((exercise) =>
      exercise.name.toLowerCase().includes(exerciseName.toLowerCase())
    );
  };

  const extractDuration = (text: string): number => {
    let minutes = 0;

    const hourMatch = text.match(/(\d+)\s*시간/);
    const minuteMatch = text.match(/(\d+)\s*분/);

    if (hourMatch) {
      minutes += parseInt(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
      minutes += parseInt(minuteMatch[1]);
    }

    return minutes || 30; // 기본값 30분
  };

  // 이벤트 핸들러
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
      analyzeExercise(transcript);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      analyzeExercise(inputText);
    }
  };

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
    if (inputText.trim()) {
      analyzeExercise(inputText);
    }
  };

  // API 분석 함수
  const analyzeExercise = async (text: string) => {
    if (!text.trim()) return;

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
      const supabase = createSupabaseBrowserClient();
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
              content: `당신은 운동 분석 전문가입니다. 사용자의 음성이나 텍스트 설명을 듣고 다음을 분석하세요:
             1. 운동 종류 파악
  
  2. 운동량을 시간으로 변환:
     - 거리 기반: 
       * 걷기: 1km = 12분
       * 달리기: 1km = 6분
       * 자전거: 1km = 4분
     - 횟수 기반:
       * 팔굽혀펴기: 20회 = 1분
       * 윗몸일으키기: 20회 = 1분
       * 스쿼트: 20회 = 1분
       * 버피: 10회 = 1분
     - 세트 기반:
       * 1세트 = 3분 (준비와 휴식 시간 포함)
     - 시간 언급이 없고 위의 변환 기준과 완벽히 같지 않아도 니 판단으로 변환할수 있는 모든 것은 최대한 변환하려고 노력해야함 그러나 운동이름만 입력했다면 오직 그때만 30분으로 가정
  
  3. 운동 강도는 보통 수준으로 가정
              
              입력이 운동과 관련 없으면 isExercise: false로 응답`,
            },
            {
              role: 'user',
              content: `다음 운동을 분석해 JSON으로 응답해주세요. caloriesPerHour는 반드시 1시간당 소모칼로리를 숫자로!!:
      
      운동 설명: ${text}
      
      응답 형식:
      {
        "isExercise": true,
        "exerciseName": "운동 이름(한글로)",
        "description": "운동이 아닐 경우 설명",
        duration: number, // 반드시 작성해야함, 거리 횟수 등을 시간으로 환산하여 작성(분)
        "caloriesPerHour": number,
        "exerciseType": "cardio/strength/flexibility",
        "equipmentRequired": ["필요한 운동 기구"]
      }`,
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
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid API response');
      }

      const result = JSON.parse(data.choices[0].message.content) as ApiResponse;
      console.log('API 응답 데이터 dnsehd:', result);

      if (!result.isExercise) {
        setError('운동 관련 내용을 인식하지 못했습니다.');
        setShowResultAlert(true);
        setIsAnalyzing(false);
        setInputText('');
        resetTranscript();
        return;
      }

      // 시간 추출
      const detectedDuration = extractDuration(text);

      // DB에서 운동 찾기
      const matchingExercise = findMatchingExercise(result.exerciseName);

      const processedData: ExerciseData = matchingExercise
        ? {
            exerciseName: matchingExercise.name,
            caloriesPerMinute: matchingExercise.caloriesPerHour / 60,
            duration: result.duration || detectedDuration,
            totalCalories: calculateTotalCalories(
              matchingExercise.caloriesPerHour / 60,
              result.duration || detectedDuration
            ),
            exerciseType: result.exerciseType,
            equipmentUsed: result.equipmentRequired?.join(', '),
          }
        : {
            exerciseName: result.exerciseName,
            caloriesPerMinute: result.caloriesPerHour / 60,
            duration: result.duration || detectedDuration,
            totalCalories: calculateTotalCalories(
              result.caloriesPerHour / 60,
              result.duration || detectedDuration // 변경
            ),
            exerciseType: result.exerciseType,
            equipmentUsed: result.equipmentRequired?.join(', '),
          };

      setExerciseData(processedData);
      setShowAnalysisAlert(true);
      setInputText('');
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('분석 중 오류가 발생했습니다.');
      setShowResultAlert(true);
    } finally {
      setIsAnalyzing(false);
      resetTranscript();
    }
  };

  // 저장 관련 함수
  const saveExerciseLog = async () => {
    if (!exerciseData) return;
    setShowAnalysisAlert(false);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: insertError } = await supabase.from('exercise_logs').insert({
        user_id: currentUser_id,
        logged_at: new Date().toISOString(),
        exercise_name: exerciseData.exerciseName,
        duration_minutes: exerciseData.duration,
        calories_per_hour: Math.round(exerciseData.caloriesPerMinute * 60),
        calories_burned: exerciseData.totalCalories,
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

  const resetAnalyzer = () => {
    setShowAnalysisAlert(false);
    setExerciseData(null);
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

  // Effects
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

  // 렌더링
  return (
    <div className="space-y-6">
      {/* 음성 입력 폼 */}
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
            placeholder="운동 내용 음성 또는 텍스트 입력"
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
      {/* 분석,입력 에니메이션 */}
      {listening && <BreathingCircle />}
      {isAnalyzing && <AnalyzingWave />}

      {/* 분석 결과 알림 */}
      <AlertDialog open={showAnalysisAlert} onOpenChange={setShowAnalysisAlert}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {exerciseData?.exerciseName}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* 운동 정보 Card */}
          <Card className="p-4">
            <div className="space-y-6">
              {/* 운동 시간 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-600">운동 시간</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {exerciseData?.duration} <span className="text-base">분</span>
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-red-400" />
                    <span className="text-gray-600">소모 칼로리</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {exerciseData?.totalCalories} <span className="text-base">kcal</span>
                  </p>
                </div>
              </div>

              {/* 칼로리 정보 */}

              {/* 운동 기구 정보 */}
              {exerciseData?.equipmentUsed && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm text-gray-600 mb-2">필요한 운동 기구</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">{exerciseData.equipmentUsed}</div>
                </div>
              )}
            </div>
          </Card>

          <AlertDialogFooter className="grid grid-cols-2 gap-4">
            <Button onClick={resetAnalyzer} variant="outline" className="w-full py-6">
              다시하기
            </Button>
            <Button onClick={saveExerciseLog} className="w-full py-6">
              저장하기
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 저장 결과 알림 */}
      <AlertDialog open={showResultAlert} onOpenChange={setShowResultAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error ? '저장 실패' : '저장 완료'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ? error : '운동 정보가 성공적으로 저장되었습니다.'}
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

export default SpeechAnalyzerExercise;
