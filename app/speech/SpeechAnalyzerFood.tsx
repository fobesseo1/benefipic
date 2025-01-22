// components/SpeechAnalyzerFood.tsx
'use client';

import React, { useState } from 'react';
import SpeechToText from './SpeechToText';
import { Card } from '@/components/ui/card';

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

  const analyzeFood = async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-1106-preview',
          messages: [
            {
              role: 'system',
              content: `당신은 음식 영양 분석 전문가입니다. 사용자의 음성 설명을 듣고 음식의 영양소를 분석해주세요.
              각 영양소가 어떻게 계산되었는지 간단히 설명도 포함해주세요.
              
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
                  음성 설명 내용: ${transcript}`,
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
      console.log('API 응답:', data); // 디버깅용 로그

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('잘못된 API 응답 형식');
      }

      const content = data.choices[0].message.content;
      console.log('파싱할 content:', content); // 디버깅용 로그

      const result = JSON.parse(content) as FoodAnalysis;
      console.log('파싱된 결과:', result); // 디버깅용 로그

      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <SpeechToText onTranscriptComplete={analyzeFood} />

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
