// utils/image.ts

import imageCompression from 'browser-image-compression';

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
    // displayImage: 고품질 (UI용, 600px)
    const displayImage = await compressImage(file, 0.95, true, true);

    // analysisImage: 저품질 (API용, 512px)
    const analysisImage = await compressImage(file, 0.7, false, false);

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
const cropCenter = async (file: File): Promise<File> => {
  const imageBitmap = await createImageBitmap(file);
  const size = Math.min(imageBitmap.width, imageBitmap.height);

  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get canvas context');

  // 중앙 크롭 계산
  const sx = (imageBitmap.width - size) / 2;
  const sy = (imageBitmap.height - size) / 2;

  ctx.drawImage(imageBitmap, sx, sy, size, size, 0, 0, size, size);

  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.95, // 크롭 단계에서는 높은 품질 유지
  });

  return new File([blob], file.name, { type: 'image/jpeg' });
};

export const compressImage = async (
  file: File,
  quality: number,
  isForDisplay: boolean = false,
  shouldCropSquare: boolean = false
): Promise<File> => {
  try {
    // 1. 먼저 중앙 크롭
    const croppedFile = shouldCropSquare ? await cropCenter(file) : file;

    // 2. 압축 옵션 설정
    const options = {
      maxSizeMB: isForDisplay ? 1.5 : 0.5, // 디스플레이용은 더 높은 품질
      maxWidthOrHeight: isForDisplay ? 600 : 512,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: Math.min(0.85, quality), // 최대 품질 제한
      alwaysKeepResolution: false,
      // EXIF 데이터 제거로 추가 용량 절감
      preserveExif: false,
    };

    // 3. 이미지 압축 실행
    const compressedFile = await imageCompression(croppedFile, options);

    // 4. 결과 파일 반환
    return new File([compressedFile], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw error;
  }
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
