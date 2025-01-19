'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import './css-filter/instagramFiltersExercise.css';

interface ExerciseImageFilterProps {
  imageUrl: string;
  onPreviewChange: (filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  }) => void;
  filterType: string; // 추가
  onFilterChange: (filterType: string) => void; // 추가
}

// 필터 옵션 타입 정의
interface FilterOption {
  value: string;
  label: string;
  description: string;
  category: 'basic' | 'instagram';
}

// 필터 옵션 데이터
const filterOptions: FilterOption[] = [
  // Basic Filters
  { value: 'none', label: 'Original', description: '원본', category: 'basic' },
  { value: 'basic', label: 'Basic', description: '자연스러운 보정', category: 'basic' },
  { value: 'glam', label: 'Glam', description: '화사하고 선명한 피부톤', category: 'basic' },
  { value: 'soft', label: 'Soft', description: '부드러운 피부결', category: 'basic' },
  { value: 'cool', label: 'Cool', description: '시원한 톤', category: 'basic' },
  { value: 'warm', label: 'Warm', description: '따뜻한 톤', category: 'basic' },
  { value: 'gymPro', label: 'Gym Pro', description: '실내 체육관 최적화', category: 'basic' },
  { value: 'outdoor', label: 'Outdoor', description: '야외 운동 최적화', category: 'basic' },
  { value: 'golden', label: 'Golden Hour', description: '일출/일몰 시간대', category: 'basic' },
  { value: 'night', label: 'Night Mode', description: '새벽/야간 운동', category: 'basic' },

  // Instagram Style Filters
  { value: '1977', label: '1977', description: '클래식 필름', category: 'instagram' },
  { value: 'aden', label: 'Aden', description: '파스텔 웜톤', category: 'instagram' },
  { value: 'brannan', label: 'Brannan', description: '하이 콘트라스트', category: 'instagram' },
  { value: 'brooklyn', label: 'Brooklyn', description: '빈티지 웜톤', category: 'instagram' },
  {
    value: 'clarendon',
    label: 'Clarendon',
    description: '선명한 하이라이트',
    category: 'instagram',
  },
  { value: 'earlybird', label: 'Earlybird', description: '클래식 마감', category: 'instagram' },
  { value: 'gingham', label: 'Gingham', description: '빈티지 소프트', category: 'instagram' },
  { value: 'hudson', label: 'Hudson', description: '차가운 필름', category: 'instagram' },
  { value: 'inkwell', label: 'Inkwell', description: '클래식 흑백', category: 'instagram' },
  { value: 'lofi', label: 'Lofi', description: '선명한 채도', category: 'instagram' },
  { value: 'mayfair', label: 'Mayfair', description: '따뜻한 핑크', category: 'instagram' },
  { value: 'nashville', label: 'Nashville', description: '레트로 필름', category: 'instagram' },
  { value: 'reyes', label: 'Reyes', description: '빈티지 페이드', category: 'instagram' },
  { value: 'rise', label: 'Rise', description: '소프트 웜톤', category: 'instagram' },
  { value: 'toaster', label: 'Toaster', description: '골든 브라운', category: 'instagram' },
];

const ExerciseImageFilter: React.FC<ExerciseImageFilterProps> = ({
  imageUrl,
  onPreviewChange,
  filterType, // 추가
  onFilterChange, // 추가
}) => {
  const handlePresetChange = (value: string) => {
    onFilterChange(value); // filterType 상태 변경을 부모로 위임
    onPreviewChange({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      warmth: 100,
    });
  };

  return (
    <div className="relative">
      <div className={filterType === 'none' ? '' : `filter-${filterType}`}>
        <img
          src={imageUrl}
          alt="Exercise preview"
          className="w-full aspect-square object-cover rounded-lg"
        />
      </div>
      <div className="w-full absolute bottom-6 p-4">
        <Select value={filterType} onValueChange={handlePresetChange}>
          <SelectTrigger className="z-50 bg-gray-100/60 backdrop-blur-sm text-gray-900 font-semibold border-2 border-black py-6">
            <SelectValue placeholder="필터 선택" />
          </SelectTrigger>
          <SelectContent>
            {/* Basic Filters Section */}
            {filterOptions
              .filter((filter) => filter.category === 'basic')
              .map((filter) => (
                <SelectItem key={filter.value} value={filter.value} className="py-4">
                  {filter.label}
                  <span className="text-xs tracking-tighter"> ({filter.description})</span>
                </SelectItem>
              ))}

            {/* Visual Separator */}
            <div className="h-px bg-gray-200 my-2" />

            {/* Instagram Style Filters Section */}
            {filterOptions
              .filter((filter) => filter.category === 'instagram')
              .map((filter) => (
                <SelectItem key={filter.value} value={filter.value} className="py-4">
                  {filter.label}
                  <span className="text-xs tracking-tighter"> ({filter.description})</span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ExerciseImageFilter;
