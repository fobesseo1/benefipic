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
              content: `이 이미지를 최대한 객관적이고 상세하게 분석해주세요. 

1. 먼저 이미지가 음식인지 아닌지 판단해주세요. 음식의 라벨이나 음식 포장, 패키지 등도 음식으로 생각합니다.

2. 만약 음식이 아니라면:
   - 간단히 이미지의 내용물이 무엇인지만 설명해주세요.

3. 만약 음식이라면 다음 사항들을 자세히 설명해주세요:
   - 어떤 음식인지 (크기, 모양, 색상 포함)
   - 식별 가능한 모든 재료들
   - 각 재료의 대략적인 양을 추정할 수 있는 단서들:
     * 주변 사물과의 비교
     * 재료들 간의 상대적 비율
     * 일반적인 조리법 기준
     * 그릇이나 용기의 크기
   - 중량이나 부피를 추정할 수 있는 모든 시각적 단서들
   
최대한 객관적이고 정량적으로 설명해주세요. 이는 다음 단계에서 정확한 영양정보를 계산하는데 사용됩니다.

`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `

                  주의사항:
1. 앞서 제공된 이미지 분석 내용을 기반으로 논리적으로 추론해주세요.
2. amount는 반드시 정확한 숫자로 제시해야 합니다.
3. unit은 반드시 "g" 또는 "ml"로만 표시해야 합니다.
4. nutritionPer100g의 모든 값은 100g 당 기준으로 계산해야 합니다.
5. 각 수치는 일반적인 식품 영양정보 데이터베이스를 기준으로 합리적인 범위 내에서 추정해주세요.
6. 1번에서 음식이 아니라고 판단된 경우, isFood는 false로 하고 description만 간단히 작성하면 됩니다.

앞서 분석된 이미지 설명과 주의사항을 바탕으로, 다음 JSON 형식에 맞춰 영양정보를 추론해주세요:
{
  "isFood": boolean,
  "foodName": "음식 이름(한글)",
  "description": "음식이 아닌 경우만 설명",
  "ingredients": [
    {
      "name": "재료명",
      "amount": number,
      "unit": "g" 또는 "ml",
      "nutritionPer100g": {
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
      }
    }
  ]
}

`,
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
