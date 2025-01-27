'use client';

import React from 'react';
import { Calendar, Camera, Home, Mic, Plus, Award } from 'lucide-react';

const EtcPage = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Progress Section */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">90일 다이어트 30일차</div>
          <Award className="text-green-500" size={24} />
        </div>

        {/* Main Progress Circle */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">725</div>
              <div className="text-sm text-gray-500">섭취 칼로리</div>
              <div className="text-lg font-semibold text-red-500">남은 칼로리 875</div>
            </div>
          </div>
          {/* This would be replaced with an actual progress circle */}
          <div className="w-full h-full rounded-full border-[16px] border-green-200 border-t-green-500"></div>
        </div>

        {/* Nutrition Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">탄수화물</div>
            <div className="font-semibold">166g</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">단백질</div>
            <div className="font-semibold">8g</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">지방</div>
            <div className="font-semibold">23g</div>
          </div>
        </div>
      </div>

      {/* Quick Input Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center">
            <Camera size={28} className="text-green-500" />
            <span className="text-xs mt-1">사진</span>
          </button>
          <button className="flex flex-col items-center">
            <Plus size={28} className="text-blue-500" />
            <span className="text-xs mt-1">직접입력</span>
          </button>
          <button className="flex flex-col items-center">
            <Mic size={28} className="text-gray-400" />
            <span className="text-xs mt-1">음성</span>
          </button>
          <button className="flex flex-col items-center">
            <Home size={28} className="text-gray-500" />
            <span className="text-xs mt-1">홈</span>
          </button>
        </div>
      </div>

      {/* Floating Achievement Button */}
      <button className="fixed right-4 top-20 bg-green-500 text-white p-2 rounded-full shadow-lg">
        <Award size={24} />
      </button>
    </div>
  );
};

export default EtcPage;
