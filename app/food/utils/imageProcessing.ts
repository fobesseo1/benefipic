// /app/food/utils/imageProcessing.ts

import { ImageFilters } from './types';

export interface FilteredImageResult {
  filteredFile: File;
  filteredUrl: string;
}

export const applyFilters = async (
  selectedImage: File,
  imageUrl: string,
  filterType: string,
  currentFilters: ImageFilters
): Promise<FilteredImageResult | null> => {
  if (!selectedImage) return null;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      // Instagram 스타일 필터나 기본 필터의 computed style 가져오기
      const filterDiv = document.createElement('div');
      filterDiv.className = filterType === 'none' ? '' : `filter-${filterType}`;
      document.body.appendChild(filterDiv);
      const computedStyle = window.getComputedStyle(filterDiv);
      const filterValue = computedStyle.filter;
      document.body.removeChild(filterDiv);

      // 필터 적용
      ctx.filter =
        filterValue ||
        `
        brightness(${currentFilters.brightness}%)
        contrast(${currentFilters.contrast}%)
        saturate(${currentFilters.saturation}%)
        sepia(${(currentFilters.warmth - 100) / 2}%)
      `;

      // 이미지 그리기
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          const filteredFile = new File([blob], 'filtered-food-image.jpg', {
            type: 'image/jpeg',
          });
          resolve({
            filteredFile,
            filteredUrl: URL.createObjectURL(filteredFile),
          });
        } else {
          resolve(null);
        }
      }, 'image/jpeg');
    };

    img.onerror = () => {
      resolve(null);
    };
  });
};

// 이미지 최적화 함수
export const optimizeImage = async (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
              );
            }
          },
          'image/jpeg',
          quality
        );
      };
    };

    reader.readAsDataURL(file);
  });
};
