// app/speech/SpeechAnalyzerFood.tsx
'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CornerDownLeft, Pen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface FoodAnalysis {
  isFood: boolean;
  foodName: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit?: string;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const SpeechAnalyzerFood = () => {
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [lastTranscriptTime, setLastTranscriptTime] = useState<number>(Date.now());

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

  // 3초 무음 감지
  React.useEffect(() => {
    if (listening) {
      setLastTranscriptTime(Date.now());
      const timer = setInterval(() => {
        if (Date.now() - lastTranscriptTime > 3000) {
          handleStopListening();
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [listening, transcript, lastTranscriptTime]);

  // 음성 입력 중 실시간으로 inputText 업데이트
  useEffect(() => {
    if (listening) {
      setInputText(transcript);
    }
  }, [transcript, listening]);

  React.useEffect(() => {
    if (listening) {
      setLastTranscriptTime(Date.now());
    }
  }, [transcript]);

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
              2.음성을 텍스트로 변환한거라 완전히 맞춤법이 맞지 않을수 있으니 발음상 제일 비슷한 음식으로 판단해주세요.
              3.반드시!! 음식은 구분이 되지 않고 연속으로 입력 되면 각각의 요소들사이에 '과'를 붙인 것으로 생각해서 분석한다(예:'짜장면 짬뽕" 으로 입력 되면 "짜장면과 짬뽕'으로 text입력으로 생각한다.) //반드시 연속으로 입력되도 각각을 잘 따로 계산해서 합쳐야 한다.
              3.각 영양소를 계산할때 반드시 사람들이 말하는 그릇,개,접시,인분 등의 단위를 g이나 ml 등의 정확한 단위로 환산하여 계산하고 답변해줘
              4.단위 무게나 단위당 칼로리나 영양소에 실제 무게나 단위수를 곱하는 논리로 계산해//매우 중요. 반드시 차근차근 생각해
              5.음식이 아닌걸 설명하면 isFood를 false로 대답해줘
              
              응답 형식:
              {
                "isFood": true,
                "foodName": "음식 이름",
                "description": "영양소 계산 과정 설명//최대한 간단히 각 재료의 칼로리랑 영양소 정보정도랑 양정도",
                "ingredients": [{"name": "재료명", "amount": "양"//반드시 정수로 작성 소수점도 안됨, "unit": "단위"//g아니 ml, 개 등}],
                "nutrition": {
                  "calories": 0,//반드시 정수로 작성 소수점도 안됨
                  "protein": 0,//반드시 정수로 작성 소수점도 안됨
                  "fat": 0,//반드시 정수로 작성 소수점도 안됨
                  "carbs": 0//반드시 정수로 작성 소수점도 안됨
                }
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
      const content = data.choices[0].message.content;
      const result = JSON.parse(content) as FoodAnalysis;

      setAnalysis(result);
      setInputText('');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      resetTranscript();
      SpeechRecognition.stopListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      analyzeFood(inputText);
    }
  };

  return (
    <Card>
      <div className="space-y-6 p-4">
        <div className="grid grid-rows-2 gap-2  min-h-24">
          <div className="grid grid-cols-2 w-3/5 gap-2 ">
            {listening ? (
              <Button
                className="flex items-center justify-center gap-2 h-full !bg-red-400"
                onClick={handleStopListening}
              >
                <MicOff className="h-4 w-4 text-white mr-1" />
                <span className="text-white">중지</span>
              </Button>
            ) : (
              <Button
                type="button"
                className="flex items-center justify-center gap-2 h-full"
                onClick={handleStartListening}
              >
                <Mic className="h-4 w-4 text-white" />
                <span>음성입력</span>
              </Button>
            )}
            <Button
              type="button"
              variant={'outline'}
              className="flex items-center justify-center gap-2 h-full"
              onClick={() => setIsTypingMode(true)}
            >
              <Pen className="h-4 w-4 text-gray-400" />
              <span>직접입력</span>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="먹은 음식을 입력하세요..."
              className="flex-1"
              readOnly={listening}
              onFocus={() => setIsTypingMode(true)}
            />
            <Button type="submit" disabled={!inputText.trim()}>
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {isAnalyzing && <div>분석 중...</div>}

        {analysis && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-bold text-xl">{analysis.foodName}</h2>
              {analysis.description && (
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                  {analysis.description}
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold">영양 정보</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>칼로리: {analysis.nutrition.calories}kcal</div>
                <div>단백질: {analysis.nutrition.protein}g</div>
                <div>지방: {analysis.nutrition.fat}g</div>
                <div>탄수화물: {analysis.nutrition.carbs}g</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold">재료 구성</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {analysis.ingredients.map((ingredient, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    <div>{ingredient.name}</div>
                    <div className="text-sm text-gray-600">
                      {ingredient.amount} {ingredient.unit}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpeechAnalyzerFood;

/* 'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, CornerDownLeft, Pen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface FoodAnalysis {
  isFood: boolean;
  foodName: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit?: string;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const SpeechAnalyzerFood = () => {
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout>();

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
              2.음성을 텍스트로 변환한거라 완전히 맞춤법이 맞지 않을수 있으니 발음상 제일 비슷한 음식으로 판단해주세요.
              3.반드시!! 음식은 구분이 되지 않고 연속으로 입력 되면 각각의 요소들사이에 '과'를 붙인 것으로 생각해서 분석한다(예:'짜장면 짬뽕" 으로 입력 되면 "짜장면과 짬뽕'으로 text입력으로 생각한다.) //반드시 연속으로 입력되도 각각을 잘 따로 계산해서 합쳐야 한다.
              3.각 영양소를 계산할때 반드시 사람들이 말하는 그릇,개,접시,인분 등의 단위를 g이나 ml 등의 정확한 단위로 환산하여 계산하고 답변해줘
              4.단위 무게나 단위당 칼로리나 영양소에 실제 무게나 단위수를 곱하는 논리로 계산해//매우 중요. 반드시 차근차근 생각해
              5.음식이 아닌걸 설명하면 isFood를 false로 대답해줘
              
              응답 형식:
              {
                "isFood": true,
                "foodName": "음식 이름",
                "description": "영양소 계산 과정 설명//최대한 간단히 각 재료의 칼로리랑 영양소 정보정도랑 양정도",
                "ingredients": [{"name": "재료명", "amount": "양"//반드시 정수로 작성 소수점도 안됨, "unit": "단위"//g아니 ml, 개 등}],
                "nutrition": {
                  "calories": 0,//반드시 정수로 작성 소수점도 안됨
                  "protein": 0,//반드시 정수로 작성 소수점도 안됨
                  "fat": 0,//반드시 정수로 작성 소수점도 안됨
                  "carbs": 0//반드시 정수로 작성 소수점도 안됨
                }
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
      const content = data.choices[0].message.content;
      const result = JSON.parse(content) as FoodAnalysis;

      setAnalysis(result);
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

  return (
    <div className="space-y-6 p-4">
      <div className="relative">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-white rounded-full shadow-sm border"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={listening ? handleStopListening : handleStartListening}
            disabled={isAnalyzing}
          >
            {listening ? (
              <MicOff className="h-6 w-6 text-red-500" />
            ) : (
              <Mic className="h-6 w-6 text-gray-500" />
            )}
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="마이크 아이콘 누르고 말하세요..."
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent"
            readOnly={listening}
            onFocus={() => setIsTypingMode(true)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-full"
            disabled={!inputText.trim() || isAnalyzing}
          >
            <CornerDownLeft className="h-6 w-6 text-gray-500" />
          </Button>
        </form>
      </div>

      {isAnalyzing && <div>분석 중...</div>}

      {analysis && (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-bold text-xl">{analysis.foodName}</h2>
            {analysis.description && (
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                {analysis.description}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold">영양 정보</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>칼로리: {analysis.nutrition.calories}kcal</div>
              <div>단백질: {analysis.nutrition.protein}g</div>
              <div>지방: {analysis.nutrition.fat}g</div>
              <div>탄수화물: {analysis.nutrition.carbs}g</div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold">재료 구성</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {analysis.ingredients.map((ingredient, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded">
                  <div>{ingredient.name}</div>
                  <div className="text-sm text-gray-600">
                    {ingredient.amount} {ingredient.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SpeechAnalyzerFood;
 */
