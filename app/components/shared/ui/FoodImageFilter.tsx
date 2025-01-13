'use client';

import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FoodImageFilterProps {
  imageUrl: string;
  onPreviewChange: (filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  }) => void;
}

const FoodImageFilter: React.FC<FoodImageFilterProps> = ({ imageUrl, onPreviewChange }) => {
  const [filterType, setFilterType] = React.useState('none');
  const [customFilters, setCustomFilters] = React.useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  });

  const presets = {
    none: { brightness: 100, contrast: 100, saturation: 100, warmth: 100 },
    default: { brightness: 110, contrast: 115, saturation: 115, warmth: 110 },
    grilled: { brightness: 95, contrast: 135, saturation: 120, warmth: 120 },
    fresh: { brightness: 115, contrast: 120, saturation: 130, warmth: 95 },
    dessert: { brightness: 115, contrast: 110, saturation: 125, warmth: 110 },
    soup: { brightness: 100, contrast: 130, saturation: 115, warmth: 110 },
    fried: { brightness: 105, contrast: 135, saturation: 125, warmth: 115 },
    seafood: { brightness: 110, contrast: 125, saturation: 120, warmth: 95 },
    tteok: { brightness: 115, contrast: 115, saturation: 115, warmth: 115 },
    hotpot: { brightness: 105, contrast: 125, saturation: 120, warmth: 120 },
    noodle: { brightness: 110, contrast: 120, saturation: 115, warmth: 105 },
  };

  const getFilterStyle = () => ({
    filter: `
      brightness(${customFilters.brightness}%)
      contrast(${customFilters.contrast}%)
      saturate(${customFilters.saturation}%)
    `,
    transition: 'filter 0.3s ease',
  });

  const handlePresetChange = (value: string) => {
    setFilterType(value);
    const newFilters = presets[value as keyof typeof presets];
    setCustomFilters(newFilters);
    onPreviewChange(newFilters);
  };

  return (
    <div className=" relative">
      <img
        src={imageUrl}
        alt="Food preview"
        className="w-full aspect-square object-cover rounded-lg"
        style={getFilterStyle()}
      />
      <div className="w-full  absolute bottom-6 p-4">
        <Select value={filterType} onValueChange={handlePresetChange}>
          <SelectTrigger className="z-50 bg-gray-100/60 backdrop-blur-sm text-gray-900 font-semibold border-2 border-black py-6">
            <SelectValue placeholder="필터 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="py-4">
              원본<span className="text-xs tracking-tighter"> (사진 그대로)</span>
            </SelectItem>
            <SelectItem value="default" className="py-4">
              음식 맛있게<span className="text-xs tracking-tighter"> (기본필터)</span>
            </SelectItem>
            <SelectItem value="grilled" className="py-4">
              육즙 팡팡<span className="text-xs tracking-tighter"> (구이,바베큐)</span>
            </SelectItem>
            <SelectItem value="fresh" className="py-4">
              신선한 채소<span className="text-xs tracking-tighter"> (채소,과일,샐러드)</span>
            </SelectItem>
            <SelectItem value="dessert" className="py-4">
              달콤 디저트<span className="text-xs tracking-tighter"> (디저트류)</span>
            </SelectItem>
            <SelectItem value="soup" className="py-4">
              깊은 국물<span className="text-xs tracking-tighter"> (탕/국)</span>
            </SelectItem>
            <SelectItem value="fried" className="py-4">
              바삭바삭<span className="text-xs tracking-tighter"> (튀김 요리)</span>
            </SelectItem>
            <SelectItem value="seafood" className="py-4">
              신선한 해산물<span className="text-xs tracking-tighter"> (회/생선)</span>
            </SelectItem>
            <SelectItem value="tteok" className="py-4">
              쫄깃쫄깃<span className="text-xs tracking-tighter"> (떡볶이/분식)</span>
            </SelectItem>
            <SelectItem value="hotpot" className="py-4">
              얼큰한맛<span className="text-xs tracking-tighter"> (매콤 요리)</span>
            </SelectItem>
            <SelectItem value="noodle" className="py-4">
              탱글면발<span className="text-xs tracking-tighter"> (면 요리)</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FoodImageFilter;
