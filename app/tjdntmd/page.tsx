'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

// Utility Functions
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File): Promise<File> => {
  try {
    // API 분석용 압축 옵션 설정
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 512,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.7,
      alwaysKeepResolution: false,
      preserveExif: false,
    };

    // 이미지 압축 실행
    const compressedFile = await imageCompression(file, options);

    // 결과 파일 반환
    return new File([compressedFile], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const ImageAnalysisExperiment = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');
  const [originalMetadata, setOriginalMetadata] = useState<{
    size: string;
    dimensions: { width: number; height: number };
  } | null>(null);
  const [optimizedMetadata, setOptimizedMetadata] = useState<{
    size: string;
    dimensions: { width: number; height: number };
  } | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Set original image and metadata
      setOriginalImage(file);
      setOriginalUrl(URL.createObjectURL(file));
      const originalDimensions = await getImageDimensions(file);
      setOriginalMetadata({
        size: formatFileSize(file.size),
        dimensions: originalDimensions,
      });

      // API 분석용으로 이미지 최적화
      const optimized = await compressImage(file);
      const optimizedDimensions = await getImageDimensions(optimized);
      setOptimizedImage(optimized);
      setOptimizedUrl(URL.createObjectURL(optimized));
      setOptimizedMetadata({
        size: formatFileSize(optimized.size),
        dimensions: optimizedDimensions,
      });

      setError(null);
    } catch (err) {
      setError('이미지 처리 중 오류가 발생했습니다.');
      console.error('Image processing error:', err);
    }
  };

  const analyzeImage = async () => {
    if (!optimizedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(optimizedImage);
      const fileType = optimizedImage.type === 'image/png' ? 'png' : 'jpeg';

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
                * 영양성분표의 글자가 명확히 보이는 경우에만 letter 항목에 값을 포함
                * 영양성분표 글자가 불명확한 경우 letter는 null로 처리
                * 영양성분표가 없거나 불명확한 경우에도 ingredients는 제품 유형과 일반적인 영양가 기준으로 반드시 추정하여 입력
                          
              - isFood 판단 기준:
                * true: 모든 음식, 음료, 포장식품을 포함
                * false: 섭취 불가능한 물체나 비식품만 해당
                          
              - foodName 음식이름 기준:
                * 완성된 음식이 두 개이상 보일경우 (예시: 햄버거, 감자튀김, 콜라) 이경우에는 반드시 음식이름을 햄버거와 감자튀김 그리고 콜라와 같은 식으로 만들어
                          
              - 영양성분표 분석 기준:
                * 영양성분표의 기준 단위(1회 제공량, 100ml당, 총 내용량 등)를 반드시 확인
                * 전체 용량과 기준 단위가 다른 경우 이를 명확히 구분하여 표시
                * 영양성분표의 글자가 명확하지 않은 경우 letter 항목은 null 처리
                * ingredients 항목은 제품의 종류, 크기, 일반적인 레시피를 기준으로 항상 최선의 추정값을 제공해야 함
             
              - ingredients 추정 기준:
                * 제품/음식의 종류와 양에 따라 일반적인 영양가 기준으로 추정
                * 재료의 비율과 양은 제품명, 이미지, 일반적인 레시피를 기준으로 추정
                * ingredients는 항상 값을 제공해야 하며 null을 사용하지 않음
                            
              주의: 
              - 음료도 식품으로 간주하여 isFood를 true로 설정
              - 영양성분표의 글자가 불명확한 경우에만 letter를 null로 처리하고, ingredients는 항상 추정값을 제공할 것`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 음식 사진을 자세히 분석해주세요. 다음 사항들을 고려해주세요:
                  - 음식뿐만 아니라 음료도 분석 대상입니다
                  - 포장된 제품의 경우 영양성분표를 기준으로 분석해주세요
                  - 음식의 양을 추정할 때는 식기나 주변 사물의 크기를 기준으로 삼아주세요
                  - 반드시 사진에 있는 모든 음식을 고려해주세요
                  - 인분 수뿐만 아니라 실제 중량이나 부피도 반드시 추정해주세요
                  - 다만 예외적으로, 음식이 아닐 경우 어떤 이미지인지 아주 간단히 description 항목에 남겨주세요
                  - 영양성분표가 보이는 경우 반드시 letter 항목에 해당 내용을 추가해주세요
        
                  다음 형식의 JSON으로 응답해주세요:
                  {
                    "isFood": true/false,
                    "foodName": "음식 이름(반드시 한글로 작성)",
                    "description": "음식이 아닐 경우 설명",
                    "letter": [
                      {
                        "type": "nutrition_label",
                        "content": "영양성분표에서 읽은 모든 텍스트",
                        "serving_info": {
                          "serving_type": "total/per_unit/per_serving",
                          "total_size": number,
                          "total_unit": "ml/g",
                          "base_size": number,  // per_unit, per_serving인 경우
                          "base_unit": "ml/g"   // per_unit, per_serving인 경우
                        },
                        "values": {
                          "calories": number,  // 숫자값만
                          "protein": number,   // 숫자값만
                          "fat": number,       // 숫자값만
                          "carbs": number      // 숫자값만
                        },
                        "units": {
                          "calories": "실제 영양성분표에 표시된 단위",
                          "protein": "실제 영양성분표에 표시된 단위",
                          "fat": "실제 영양성분표에 표시된 단위",
                          "carbs": "실제 영양성분표에 표시된 단위"
                        }
                      }
                    ],
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

      const data = await response.json();
      const analysisResult = JSON.parse(data.choices[0].message.content);
      setApiResponse(analysisResult);
    } catch (err) {
      setError('API 호출 중 오류가 발생했습니다.');
      console.error('API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* File Input */}
      <Card className="p-4">
        <input type="file" accept="image/*" onChange={handleImageSelect} className="w-full" />
      </Card>

      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original Image */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Original Image</h3>
          {originalUrl && (
            <>
              <img src={originalUrl} alt="Original" className="w-full h-auto" />
              {originalMetadata && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Size: {originalMetadata.size}</p>
                  <p>
                    Dimensions: {originalMetadata.dimensions.width} x{' '}
                    {originalMetadata.dimensions.height}px
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Optimized Image */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Optimized Image</h3>
          {optimizedUrl && (
            <>
              <img src={optimizedUrl} alt="Optimized" className="w-full h-auto" />
              {optimizedMetadata && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Size: {optimizedMetadata.size}</p>
                  <p>
                    Dimensions: {optimizedMetadata.dimensions.width} x{' '}
                    {optimizedMetadata.dimensions.height}px
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Analysis Button */}
      <div className="flex justify-center">
        <button
          onClick={analyzeImage}
          disabled={!optimizedImage || isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="text-red-500 text-center">{error}</div>}

      {/* API Response */}
      {apiResponse && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">API Response</h3>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default ImageAnalysisExperiment;
