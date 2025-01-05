'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { compressImage, fileToBase64 } from '@/utils/image';
import NutritionCard from '../components/shared/ui/NutritionCard';
import NavigationButtonSection from '../components/shared/ui/NavigationButtonSection';
import Link from 'next/link';

type AnalysisStep =
  | 'initial'
  | 'camera'
  | 'image-selected'
  | 'compress'
  | 'analyzing'
  | 'calculate'
  | 'complete';

interface NutritionData {
  foodName: string;
  healthTip: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

const MenuAnalyzer = () => {
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<NutritionData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const processApiResponse = (apiData: any): NutritionData => {
    try {
      console.log('API Response:', apiData);

      const nutrition = {
        calories: Number(apiData.nutrition.calories) || 0,
        protein: Number(apiData.nutrition.protein) || 0,
        fat: Number(apiData.nutrition.fat) || 0,
        carbs: Number(apiData.nutrition.carbs) || 0,
      };

      const processedData: NutritionData = {
        foodName: String(apiData.foodName),
        healthTip: String(apiData.healthTip),
        nutrition: nutrition,
      };

      return processedData;
    } catch (error) {
      console.error('API 응답 처리 중 오류:', error);
      throw error;
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setStep('analyzing');
    try {
      const base64Image = await fileToBase64(selectedImage);
      const fileType = selectedImage.type === 'image/png' ? 'png' : 'jpeg';

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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `당신은 영양 전문가입니다. 사진에서 보이는 메뉴들을 분석하고 다음 조건에 맞는 메뉴를 하나만 추천해주세요:

대상자 정보:
- 26세 여성
- 다이어트 중
- 피부 미용에 관심 있음

필수 요구사항:
1. 반드시 사진에 있는 메뉴들 중에서만 선택할 것
2. 사진에 없는 메뉴는 절대 추천하지 말 것
3. 오직 한 개의 메뉴만 추천할 것
4. 선택한 메뉴에 대해 다음 정보를 반드시 포함할 것:
   - 다이어트와 피부미용에 좋은 이유 (필수)
   - 반드시 nutrition은 1인분 기준의 정확한 영양성분 (칼로리, 단백질, 지방, 탄수화물)

선택 사항:
- 선택한 메뉴를 건강하게 먹는 방법
- 영양학적으로 함께 섭취하면 좋은 음식 추천 (단, 현재 메뉴에 있는 것만 가능)

다음의 정확한 JSON 형식으로 응답해주세요:
{
  "foodName": "선택한 메뉴 이름",
  "healthTip": "다이어트와 피부미용에 좋은 이유(필수) + 건강하게 먹는 방법(선택) + 함께 먹으면 좋은 음식(선택)",
  "nutrition": {
    "calories": 1인분 기준 숫자로만(kcal),
    "protein": 1인분 기준 숫자로만(g),
    "fat": 1인분 기준 숫자로만(g),
    "carbs": 1인분 기준 숫자로만(g)
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
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      console.log('API Response:', data);
      const parsedData = JSON.parse(data.choices[0].message.content);
      const processedData = processApiResponse(parsedData);
      setAnalysis(processedData); // 여기에 setAnalysis 추가
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis(null);
      setStep('image-selected');
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
                <span className="text-gray-500">메뉴 사진을 선택해주세요</span>
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
              {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black" />
                  <p className="mt-4 text-gray-500">메뉴를 분석하고 있어요...</p>
                </div>
              )}

              {(step === 'complete' || step === 'image-selected') && analysis && (
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* Name Card */}
                  <Card className="p-4">
                    <div className="grid grid-cols-1 gap-2 h-16">
                      <div className="col-span-1 py-2 flex items-center">
                        <p className="font-medium text-xl">{analysis.foodName}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Nutrition Card */}
                  <NutritionCard nutrition={analysis.nutrition} />

                  {/* healthTip Card */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">건강 꿀팁</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {/* 건강 꿀팁 내용 */}
                      <p>{analysis.healthTip}</p>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Section */}
      {step === 'complete' ? (
        <div className="absolute bottom-0 w-full px-6 pb-8 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-900 rounded-xl py-4 text-lg font-medium text-center"
            >
              홈으로
            </Link>
            <button
              onClick={() => {
                setStep('initial');
                setSelectedImage(null);
                setImageUrl('');
                setAnalysis(null);
              }}
              className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium"
            >
              다시하기
            </button>
          </div>
        </div>
      ) : (
        <NavigationButtonSection
          step={step}
          setStep={setStep}
          setSelectedImage={setSelectedImage}
          setImageUrl={setImageUrl}
          onAnalyze={analyzeImage}
          stream={stream}
          setStream={setStream}
          videoRef={videoRef}
        />
      )}
    </div>
  );
};

export default MenuAnalyzer;
