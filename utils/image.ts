// utils/image.ts

interface DualQualityResult {
  displayImage: File; // 고품질 (UI, 필터, Storage용)
  analysisImage: File; // 저품질 (API 분석용)
}

export const createDualQualityImages = async (file: File): Promise<DualQualityResult> => {
  try {
    // 고품질 버전 생성 (UI, 필터, Storage용)
    const displayImage = await compressImage(file, 1.0);

    // 저품질 버전 생성 (API 분석용)
    const analysisImage = await compressImage(file, 0.7);

    return { displayImage, analysisImage };
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    // 실패시 원본 파일로 둘 다 설정
    return {
      displayImage: file,
      analysisImage: file,
    };
  }
};

/**
 * 이미지 파일을 압축하는 함수
 * @param file 압축할 이미지 파일
 * @returns 압축된 이미지 파일을 포함한 Promise
 */
export const compressImage = (file: File, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        console.log('원본 이미지 정보:', {
          width: img.width,
          height: img.height,
          size: (file.size / 1024).toFixed(2) + 'KB',
        });

        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 최대 크기 제한
        const maxDimension = 1024;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              console.log('압축된 이미지 정보:', {
                width: width,
                height: height,
                size: (compressedFile.size / 1024).toFixed(2) + 'KB',
                quality: quality,
              });

              resolve(compressedFile);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality // 파라미터로 받은 quality 사용
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
