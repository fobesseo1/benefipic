'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExerciseImageFilterProps {
  imageUrl: string;
  onPreviewChange: (filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  }) => void;
}

const ExerciseImageFilter: React.FC<ExerciseImageFilterProps> = ({ imageUrl, onPreviewChange }) => {
  const [filterType, setFilterType] = React.useState('none');
  const [customFilters, setCustomFilters] = React.useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 100,
  });

  const presets = {
    none: { brightness: 100, contrast: 100, saturation: 100, warmth: 100 },
    basic: { brightness: 105, contrast: 110, saturation: 105, warmth: 102 },
    glam: { brightness: 115, contrast: 120, saturation: 110, warmth: 105 },
    soft: { brightness: 108, contrast: 95, saturation: 95, warmth: 105 },
    cool: { brightness: 110, contrast: 115, saturation: 95, warmth: 90 },
    warm: { brightness: 105, contrast: 110, saturation: 105, warmth: 115 },
    gymPro: { brightness: 115, contrast: 125, saturation: 105, warmth: 98 },
    outdoor: { brightness: 105, contrast: 120, saturation: 110, warmth: 95 },
    golden: { brightness: 105, contrast: 115, saturation: 115, warmth: 120 },
    night: { brightness: 130, contrast: 130, saturation: 95, warmth: 90 },
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
    <div className="relative">
      <img
        src={imageUrl}
        alt="Exercise preview"
        className="w-full aspect-square object-cover rounded-lg"
        style={getFilterStyle()}
      />
      <div className="w-full absolute bottom-6 p-4">
        <Select value={filterType} onValueChange={handlePresetChange}>
          <SelectTrigger className="z-50 bg-gray-100/60 backdrop-blur-sm text-gray-900 font-semibold border-2 border-black py-6">
            <SelectValue placeholder="필터 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="py-4">
              Original<span className="text-xs tracking-tighter"> (원본)</span>
            </SelectItem>
            <SelectItem value="basic" className="py-4">
              Basic<span className="text-xs tracking-tighter"> (자연스러운 보정)</span>
            </SelectItem>
            <SelectItem value="glam" className="py-4">
              Glam<span className="text-xs tracking-tighter"> (화사하고 선명한 피부톤)</span>
            </SelectItem>
            <SelectItem value="soft" className="py-4">
              Soft<span className="text-xs tracking-tighter"> (부드러운 피부결)</span>
            </SelectItem>
            <SelectItem value="cool" className="py-4">
              Cool<span className="text-xs tracking-tighter"> (시원한 톤)</span>
            </SelectItem>
            <SelectItem value="warm" className="py-4">
              Warm<span className="text-xs tracking-tighter"> (따뜻한 톤)</span>
            </SelectItem>
            <SelectItem value="gymPro" className="py-4">
              Gym Pro<span className="text-xs tracking-tighter"> (실내 체육관 최적화)</span>
            </SelectItem>
            <SelectItem value="outdoor" className="py-4">
              Outdoor<span className="text-xs tracking-tighter"> (야외 운동 최적화)</span>
            </SelectItem>
            <SelectItem value="golden" className="py-4">
              Golden Hour<span className="text-xs tracking-tighter"> (일출/일몰 시간대)</span>
            </SelectItem>
            <SelectItem value="night" className="py-4">
              Night Mode<span className="text-xs tracking-tighter"> (새벽/야간 운동)</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ExerciseImageFilter;
