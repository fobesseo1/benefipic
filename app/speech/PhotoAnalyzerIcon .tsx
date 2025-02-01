import { Camera, CornerDownLeft, Mic } from 'lucide-react';
import React from 'react';

export default function PhotoAnalyzerIcon() {
  return (
    <div className="relative flex items-center  rounded-2xl shadow-sm border-2 px-4 py-4 border-gray-600">
      <button
        type="button"
        className="rounded-full w-12 h-12 border-2 border-gray-600 shadow-md flex items-center justify-center"
      >
        <Camera className="h-6 w-6 text-gray-600" />
      </button>

      <p className="flex-1 border-0 focus-visible:ring-0 bg-transparent p-2 text-sm tracking-tighter text-gray-600">
        사진으로 입력하세요...
      </p>
      <button type="submit" className="rounded-full">
        <CornerDownLeft className="h-5 w-5 text-gray-600" size={12} />
      </button>
    </div>
  );
}
