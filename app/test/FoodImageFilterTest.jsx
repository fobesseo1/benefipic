'use client';

import React, { useState } from 'react';

const FoodImageFilterTest = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [filterType, setFilterType] = useState('none');
  const [customFilters, setCustomFilters] = useState({
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    setFilterType(preset);
    setCustomFilters(presets[preset]);
  };

  const getFilterStyle = () => ({
    filter: `
     brightness(${customFilters.brightness}%)
     contrast(${customFilters.contrast}%)
     saturate(${customFilters.saturation}%)
   `,
    transition: 'filter 0.3s ease',
  });

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="my-5 p-5 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
      </div>

      {selectedImage && (
        <>
          <div className="space-y-3 my-5">
            <select
              value={filterType}
              onChange={handlePresetChange}
              className="w-full p-2 rounded-md border border-gray-300 mb-3"
            >
              <option value="none">원본</option>
              <option value="default">기본 필터</option>
              <option value="grilled">구운 음식</option>
              <option value="fresh">신선한 음식</option>
              <option value="dessert">디저트</option>
              <option value="soup">국물요리</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <div className="flex-1 min-w-[300px] max-w-[500px] text-center">
              <h3 className="mb-2">원본 이미지</h3>
              <img
                src={selectedImage}
                alt="Original"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div className="flex-1 min-w-[300px] max-w-[500px] text-center">
              <h3 className="mb-2">필터링된 이미지</h3>
              <img
                src={selectedImage}
                alt="Filtered"
                className="w-full h-auto rounded-lg shadow-md transition-all duration-300"
                style={getFilterStyle()}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FoodImageFilterTest;
