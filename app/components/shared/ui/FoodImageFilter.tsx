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
    default: { brightness: 105, contrast: 110, saturation: 110, warmth: 110 },
    grilled: { brightness: 95, contrast: 140, saturation: 110, warmth: 120 },
    fresh: { brightness: 110, contrast: 115, saturation: 120, warmth: 100 },
    dessert: { brightness: 110, contrast: 105, saturation: 115, warmth: 105 },
    soup: { brightness: 105, contrast: 120, saturation: 105, warmth: 100 },
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
      <div className="w-full  absolute top-0 p-4">
        <Select value={filterType} onValueChange={handlePresetChange}>
          <SelectTrigger className="bg-gray-100/80 text-gray-900 font-semibold border-2 border-black ">
            <SelectValue placeholder="필터 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">원본</SelectItem>
            <SelectItem value="default">기본 필터</SelectItem>
            <SelectItem value="grilled">구운 음식</SelectItem>
            <SelectItem value="fresh">신선한 음식</SelectItem>
            <SelectItem value="dessert">디저트</SelectItem>
            <SelectItem value="soup">국물요리</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FoodImageFilter;
