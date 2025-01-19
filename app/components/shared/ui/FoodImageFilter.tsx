import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import './css-filter/instagramFiltersFood.css';

interface FoodImageFilterProps {
  imageUrl: string;
  onPreviewChange: (filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  }) => void;
  filterType: string;
  onFilterChange: (filterType: string) => void;
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
  // Basic Food Filters
  { value: 'none', label: '원본', description: '사진 그대로', category: 'basic' },
  { value: 'default', label: '기본', description: '음식 맛있게', category: 'basic' },
  { value: 'grilled', label: '육즙 팡팡', description: '구이,바베큐', category: 'basic' },
  { value: 'fresh', label: '신선한 채소', description: '채소,과일,샐러드', category: 'basic' },
  { value: 'dessert', label: '달콤 디저트', description: '디저트류', category: 'basic' },
  { value: 'soup', label: '깊은 국물', description: '탕/국', category: 'basic' },
  { value: 'fried', label: '바삭바삭', description: '튀김 요리', category: 'basic' },
  { value: 'seafood', label: '신선한 해산물', description: '회/생선', category: 'basic' },
  { value: 'tteok', label: '쫄깃쫄깃', description: '떡볶이/분식', category: 'basic' },
  { value: 'hotpot', label: '얼큰한맛', description: '매콤 요리', category: 'basic' },
  { value: 'noodle', label: '탱글면발', description: '면 요리', category: 'basic' },

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

const FoodImageFilter: React.FC<FoodImageFilterProps> = ({
  imageUrl,
  onPreviewChange,
  filterType,
  onFilterChange,
}) => {
  const handlePresetChange = (value: string) => {
    onFilterChange(value);
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
          alt="Food preview"
          className="w-full aspect-square object-cover rounded-lg"
        />
      </div>
      <div className="w-full absolute bottom-6 p-4">
        <Select value={filterType} onValueChange={handlePresetChange}>
          <SelectTrigger className="z-50 bg-gray-100/60 backdrop-blur-sm text-gray-900 font-semibold border-2 border-black py-6">
            <SelectValue placeholder="필터 선택" />
          </SelectTrigger>
          <SelectContent>
            {/* Basic Food Filters Section */}
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

export default FoodImageFilter;
