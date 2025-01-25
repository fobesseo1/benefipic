import { CornerDownLeft, Mic } from 'lucide-react';
import React from 'react';

export default function SpeechAnalyzerIcon() {
  return (
    <div className="relative flex items-center  rounded-2xl shadow-sm border px-4 py-4 bg-black">
      <button
        type="button"
        className="rounded-full w-12 h-12 bg-gray-50 shadow-md flex items-center justify-center"
      >
        <Mic className="h-6 w-6 text-gray-600" />
      </button>

      <input
        placeholder="음성이나 텍스트 입력하세요..."
        className="flex-1 border-0 focus-visible:ring-0 bg-transparent p-2 text-sm tracking-tighter text-white"
      />
      <button type="submit" className="rounded-full">
        <CornerDownLeft className="h-5 w-5 text-gray-400" size={12} />
      </button>
    </div>
  );
}
