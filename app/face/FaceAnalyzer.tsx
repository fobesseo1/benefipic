'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  applyFiltersAndSave,
  checkImageSize,
  compressImage,
  createDualQualityImages,
  cropSquare,
  fileToBase64,
  isValidImageType,
} from '@/utils/image';
import ExerciseImageFilter from '../components/shared/ui/ExerciseImageFilter';

// 타입 정의
type AnalysisStep =
  | 'initial'
  | 'camera'
  | 'image-selected'
  | 'filter-selection'
  | 'compress'
  | 'analyzing'
  | 'complete';

interface EmotionScores {
  [key: string]: number;
}

interface ApiResponse {
  hasFace: boolean;
  primaryEmotion: string;
  description: string;
  emotionScores: EmotionScores;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
}

const FaceAnalyzer = ({ currentUser_id }: { currentUser_id: string }) => {
  // 상태 관리
  const [step, setStep] = useState<AnalysisStep>('initial');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [displayImage, setDisplayImage] = useState<File | null>(null);
  const [analysisImage, setAnalysisImage] = useState<File | null>(null);
  const [filteredDisplayImage, setFilteredDisplayImage] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('none');

  // 초기 필터 상태
  const initialFilters: Filters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  };
  const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);

  // 필터 적용 함수
  const applyFilters = async () => {
    if (!selectedImage) return;

    try {
      // 필터 적용
      const filteredImage = await applyFiltersAndSave(selectedImage, currentFilters);
      setFilteredDisplayImage(filteredImage);
      setImageUrl(URL.createObjectURL(filteredImage));

      // 이미지 압축 및 분석용 이미지 생성
      setStep('compress');
      const { displayImage, analysisImage } = await createDualQualityImages(filteredImage);

      // displayImage는 고품질 버전으로 저장
      setDisplayImage(displayImage);
      // analysisImage는 저품질 버전으로 API 호출에 사용
      setAnalysisImage(analysisImage);

      // 분석 시작
      await analyzeImage(analysisImage);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('이미지 처리 중 오류가 발생했습니다.');
      setStep('image-selected');
    }
  };

  // 이미지 분석 함수
  const analyzeImage = async (imageToAnalyze: File) => {
    try {
      setStep('analyzing');
      const base64Image = await fileToBase64(imageToAnalyze);
      const fileType = imageToAnalyze.type === 'image/png' ? 'png' : 'jpeg';

      // const response = await fetch('https://api.openai.com/v1/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      //   },
      //   body: JSON.stringify({
      //     model: 'gpt-4o-mini',
      //     messages: [
      //       {
      //         role: 'system',
      //         content: `당신은 얼굴 표정 분석 전문가입니다.
      //         분석 대상:
      //         - 얼굴의 표정
      //         - 눈의 모양과 시선
      //         - 입술의 모양
      //         - 전반적인 감정 상태

      //         분석해야 할 감정:
      //         - 기쁨 (행복, 즐거움)
      //         - 슬픔 (우울, 낙담)
      //         - 분노 (짜증, 불만)
      //         - 놀람 (충격, 당황)
      //         - 불안 (걱정, 긴장)
      //         - 중립 (무표정, 평온)`,
      //       },
      //       {
      //         role: 'user',
      //         content: [
      //           {
      //             type: 'text',
      //             text: `이 이미지를 분석하여 다음 형식의 JSON으로 응답해주세요:
      //             {
      //               "hasFace": true/false,
      //               "primaryEmotion": "주요 감정",
      //               "description": "감정을 유추한 근거와 설명",
      //               "emotionScores": {
      //                 "기쁨": 0.0~1.0,
      //                 "슬픔": 0.0~1.0,
      //                 "분노": 0.0~1.0,
      //                 "놀람": 0.0~1.0,
      //                 "불안": 0.0~1.0,
      //                 "중립": 0.0~1.0
      //               }
      //             }`,
      //           },
      //           {
      //             type: 'image_url',
      //             image_url: {
      //               url: `data:image/${fileType};base64,${base64Image}`,
      //             },
      //           },
      //         ],
      //       },
      //     ],
      //     max_tokens: 800,
      //     temperature: 0.3,
      //     response_format: { type: 'json_object' },
      //   }),
      // });

      // const response = await fetch('https://api.openai.com/v1/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      //   },
      //   body: JSON.stringify({
      //     model: 'gpt-4o-mini',
      //     messages: [
      //       {
      //         role: 'system',
      //         content: `당신은 외모 특징을 분석하는 전문가입니다.

      //         분석 대상:
      //         1. 얼굴형 특징
      //           - 전반적인 얼굴형 (둥근형, 계란형, 각진형 등)
      //           - 이목구비의 조화

      //         2. 피부 특징
      //           - 피부 톤 (밝은, 어두운, 중간)
      //           - 피부 질감

      //         3. 개성적 특징
      //           - 특별한 이목구비
      //           - 독특한 표정이나 분위기

      //         4. 전반적인 인상
      //           - 첫인상
      //           - 전체적인 분위기`,
      //       },
      //       {
      //         role: 'user',
      //         content: [
      //           {
      //             type: 'text',
      //             text: `이 이미지를 분석하여 다음 형식의 JSON으로 응답해주세요:
      //             {
      //               "hasFace": true/false,
      //               "faceAnalysis": {
      //                 "faceShape": "얼굴형 설명",
      //                 "features": "이목구비 특징",
      //                 "uniquePoints": ["특별한 특징들"]
      //               },
      //               "skinAnalysis": {
      //                 "tone": "피부 톤",
      //                 "texture": "피부 질감"
      //               },
      //               "overallImpression": {
      //                 "firstImpression": "첫인상",
      //                 "atmosphere": "전체적 분위기"
      //               },
      //               "confidence": 0.0~1.0
      //             }`,
      //           },
      //           {
      //             type: 'image_url',
      //             image_url: {
      //               url: `data:image/${fileType};base64,${base64Image}`,
      //             },
      //           },
      //         ],
      //       },
      //     ],
      //     max_tokens: 800,
      //     temperature: 0.3,
      //     response_format: { type: 'json_object' },
      //   }),
      // });

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
              content: `당신은 40년 경력의 관상학 전문가입니다. 전통적인 동양 관상학을 기반으로 사주팔자와 결합하여 분석합니다.

              분석 대상:
              1. 이마(천정)
                - 이마의 넓이와 높이
                - 이마의 골격과 형태
                - 이마의 주름
              
              2. 눈썹과 눈(인당)
                - 눈썹의 모양과 농도
                - 눈의 크기와 형태
                - 눈매의 특징
              
              3. 코(인중)
                - 콧대의 높이와 형태
                - 콧방울의 모양
                - 코끝의 특징
              
              4. 입과 턱(지각)
                - 입술의 모양과 크기
                - 턱의 형태와 각도
                - 입주변 특징
              
              5. 얼굴 전체의 조화
                - 이목구비의 균형
                - 좌우 대칭성
                - 골격과 살의 조화
              
              6. 복덕과 재운
                - 관운(직장운)
                - 재운(금전운)
                - 인연운(대인관계)`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 이미지를 분석하여 다음 형식의 JSON으로 응답해주세요:
                  {
                    "faceReading": {
                      "forehead": {
                        "description": "이마 설명",
                        "meaning": "이마가 의미하는 운세"
                      },
                      "eyes": {
                        "description": "눈과 눈썹 설명",
                        "meaning": "눈이 의미하는 운세"
                      },
                      "nose": {
                        "description": "코 설명",
                        "meaning": "코가 의미하는 운세"
                      },
                      "mouthAndChin": {
                        "description": "입과 턱 설명",
                        "meaning": "입과 턱이 의미하는 운세"
                      }
                    },
                    "overallFortune": {
                      "career": {
                        "currentLuck": "현재 관운",
                        "futurePotential": "앞으로의 관운"
                      },
                      "wealth": {
                        "currentLuck": "현재 재운",
                        "futurePotential": "앞으로의 재운"
                      },
                      "relationships": {
                        "currentLuck": "현재 인연운",
                        "futurePotential": "앞으로의 인연운"
                      }
                    },
                    "lifeAdvice": [
                      "운세를 좋게 하기 위한 조언들"
                    ],
                    "disclaimer": "이 관상 분석은 재미로만 봐주시기 바랍니다."
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
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content) as ApiResponse;
      console.log('분석 결과:', result);

      setAnalysisResult(result);
      setStep('complete');
    } catch (error) {
      console.error('Error:', error);
      setError('이미지 분석 중 오류가 발생했습니다.');
      setStep('image-selected');
    }
  };

  // 이미지 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 유효성 검사
      if (!isValidImageType(file)) {
        setError('지원하지 않는 이미지 형식입니다.');
        return;
      }

      if (!checkImageSize(file)) {
        setError('이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.');
        return;
      }

      // 정사각형으로 크롭
      const croppedImage = await cropSquare(file);
      setSelectedImage(croppedImage);
      setImageUrl(URL.createObjectURL(croppedImage));
      setStep('filter-selection');
      setAnalysisResult(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* 이미지 표시 영역 */}
        <div className="w-full h-64 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {step === 'filter-selection' ? (
                <ExerciseImageFilter
                  imageUrl={imageUrl}
                  onPreviewChange={setCurrentFilters}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                />
              ) : imageUrl ? (
                <img src={imageUrl} alt="Selected face" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">얼굴 사진을 선택해주세요</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 컨트롤 영역 */}
        <div className="p-4 space-y-4">
          <input type="file" accept="image/*" onChange={handleImageSelect} className="w-full" />

          {step === 'filter-selection' && (
            <button
              onClick={applyFilters}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              필터 적용 및 분석하기
            </button>
          )}

          {/* 로딩 상태 */}
          {(step === 'analyzing' || step === 'compress') && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">
                {step === 'compress' ? '이미지 최적화 중...' : '감정 분석 중...'}
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && <div className="p-4 bg-red-50 text-red-500 rounded">{error}</div>}

          {/* 분석 결과 */}
          {/* {analysisResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">분석 결과</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-2">
                  <span className="font-semibold">주요 감정: </span>
                  <span>{analysisResult.primaryEmotion}</span>
                </div>
                <div className="mb-4">
                  <span className="font-semibold">설명: </span>
                  <p className="mt-1 text-gray-600">{analysisResult.description}</p>
                </div>
                <div>
                  <span className="font-semibold">감정 점수:</span>
                  <div className="mt-2 space-y-2">
                    {Object.entries(analysisResult.emotionScores).map(([emotion, score]) => (
                      <div key={emotion} className="flex items-center">
                        <span className="w-16 text-gray-600">{emotion}:</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${score * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">{(score * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )} */}
          {analysisResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">분석 결과</h3>
              <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {JSON.stringify(analysisResult, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceAnalyzer;
