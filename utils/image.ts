// utils/image.ts

interface DualQualityResult {
  displayImage: File; // 고품질 (UI, 필터, Storage용)
  analysisImage: File; // 저품질 (API 분석용)
}

export const cropSquare = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      // 이미 정사각형이면 그대로 반환
      if (img.width === img.height) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }

      // 정사각형 크기 계산 (짧은 변 기준)
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      // 중앙 기준으로 크롭
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Blob creation failed'));
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type // 원본 파일 형식 유지
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const createDualQualityImages = async (file: File): Promise<DualQualityResult> => {
  try {
    // displayImage는 정사각형으로 크롭만 수행
    const displayImage = await cropSquare(file);

    // analysisImage는 원본 비율 유지
    const analysisImage = file;

    return { displayImage, analysisImage };
  } catch (error) {
    console.error('이미지 처리 실패:', error);
    return {
      displayImage: file,
      analysisImage: file,
    };
  }
};

export const applyFiltersAndSave = async (
  imageFile: File,
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }

      // 원본이 정사각형이 아닌 경우 중앙 기준으로 크롭
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      // 중앙 기준으로 크롭 위치 계산
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      // 필터 적용
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
      `;

      // 이미지 그리기
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

      // 원본 형식 그대로 유지
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Blob creation failed'));
            return;
          }
          resolve(new File([blob], imageFile.name, { type: imageFile.type }));
        },
        imageFile.type // 원본 파일 형식 유지
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * 이미지 파일을 압축하는 함수
 * @param file 압축할 이미지 파일
 * @returns 압축된 이미지 파일을 포함한 Promise
 */
export const compressImage = (
  file: File,
  quality: number,
  isForDisplay: boolean = false,
  shouldCropSquare: boolean = false
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        // 정사각형 크롭이 필요한 경우
        if (shouldCropSquare) {
          const size = Math.min(sourceWidth, sourceHeight);
          sourceX = (sourceWidth - size) / 2;
          sourceY = (sourceHeight - size) / 2;
          sourceWidth = size;
          sourceHeight = size;
        }

        // 최대 크기 계산 (정사각형인 경우 한 변의 길이를 기준으로)
        const maxDimension = isForDisplay ? 1024 : 512;
        let targetSize = sourceWidth;

        if (targetSize > maxDimension) {
          targetSize = maxDimension;
        }

        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d', {
          alpha: false, // 알파 채널 비활성화
          willReadFrequently: false, // 성능 최적화
        });

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 배경을 흰색으로 설정 (JPEG 최적화)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // 이미지 그리기 (안티앨리어싱 비활성화)
        ctx.imageSmoothingQuality = 'medium';

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetSize,
          targetSize
        );

        // JPEG 품질을 낮추고 모자이크 효과 최소화
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          Math.min(0.85, quality) // 최대 품질을 85%로 제한
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * 파일을 Base64 문자열로 변환하는 함수
 * @param file 변환할 파일
 * @returns Base64 문자열을 포함한 Promise
 */
export const fileToBase64 = (file: File): Promise<string> => {
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

/**
 * 이미지 크기를 체크하는 유틸리티 함수
 * @param file 체크할 이미지 파일
 * @param maxSizeInMB 최대 허용 크기 (MB)
 * @returns 크기 제한 내에 있으면 true, 아니면 false
 */
export const checkImageSize = (file: File, maxSizeInMB: number = 5): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * 이미지 타입을 체크하는 유틸리티 함수
 * @param file 체크할 이미지 파일
 * @returns 허용된 이미지 타입이면 true, 아니면 false
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};
