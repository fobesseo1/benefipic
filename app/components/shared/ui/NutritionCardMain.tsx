'use client';

import React, { useState } from 'react';
import { Beef, Droplet, Flame, Wheat, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface NutritionCardProps {
  nutrition: NutritionData;
  className?: string;
  title?: string;
  editable?: boolean;
  onNutritionChange?: (newNutrition: NutritionData) => void;
  totalDailyCalories?: number;
}

export const NutritionCardMain = ({
  nutrition,
  className,
  title = '영양 정보',
  editable = false,
  onNutritionChange,
  totalDailyCalories = 0,
}: NutritionCardProps) => {
  const [editMode, setEditMode] = useState({
    calories: false,
    protein: false,
    fat: false,
    carbs: false,
  });

  const [editValues, setEditValues] = useState(nutrition);

  const roundNumber = (num: number): number => {
    return Math.round(num);
  };

  const handleEdit = (field: keyof NutritionData, value: string) => {
    if (value === '') {
      const newNutrition = { ...editValues, [field]: 0 };
      setEditValues(newNutrition);
      onNutritionChange?.(newNutrition);
      return;
    }

    if (value.startsWith('0') && value.length > 1) {
      value = value.replace(/^0+/, '');
    }

    const numValue = Math.max(0, parseInt(value) || 0);
    const newNutrition = { ...editValues, [field]: numValue };
    setEditValues(newNutrition);
    onNutritionChange?.(newNutrition);
  };

  const toggleEdit = (field: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const renderEditableValue = (field: keyof NutritionData, value: number, unit: string) => {
    return (
      <p className="text-base font-semibold">
        {value} <span className="text-xs text-gray-600">{unit}</span>
      </p>
    );
  };

  //바랜더링
  // 퍼센테이지 계산
  const calculateCaloriePercentage = (): number => {
    if (!totalDailyCalories) return 0;
    const percentage = (nutrition.calories / totalDailyCalories) * 100;
    return Math.round(percentage);
  };

  const percentage = calculateCaloriePercentage();

  // 색상 클래스 결정
  const colorClasses = {
    bar: percentage >= 15 ? 'bg-green-600' : percentage >= 0 ? 'bg-gray-400' : 'bg-red-600',
    text: percentage >= 15 ? 'text-green-600' : percentage >= 0 ? 'text-gray-400' : 'text-red-600',
  };

  const getProgressBarStyles = (percentage: number) => {
    const validPercentage = Math.max(0, percentage);
    return {
      width: `${validPercentage}%`,
    };
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gab-2 mb-3">
        <h3 className="text-lg font-semibold ">{title}</h3>
        <div className="h-full w-2"></div>
        {/* <div className="flex-1 grid grid-cols-12">
          <div className="col-span-10 flex items-center justify-start rounded-lg bg-gray-200">
            <div
              className={`h-full ${colorClasses.bar} rounded-lg`}
              style={{ width: `${Math.max(0, percentage)}%` }}
            ></div>
          </div>
          <p className={`col-span-2 text-center text-sm tracking-tighter ${colorClasses.text}`}>
            {percentage}%
          </p>
        </div> */}
      </div>
      <div className="mb-3 grid grid-cols-12">
        <div className="h-6 col-span-10 flex items-center justify-start rounded-full bg-gray-200">
          <div
            className={`h-6 ${colorClasses.bar} rounded-full`}
            style={{ width: `${Math.max(0, percentage)}%` }}
          ></div>
        </div>
        <p
          className={`col-span-2 text-center text-xl font-semibold tracking-tighter ${colorClasses.text}`}
        >
          {percentage}
          <span className="text-sm">%</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow">
          <div className="col-span-3 flex items-center justify-center">
            <Flame size={28} color="#4b5563" />
          </div>
          <div className="col-span-7 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">칼로리</p>
            </div>
            {renderEditableValue('calories', roundNumber(nutrition.calories), 'kcal')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Beef size={28} color="#4b5563" />
          </div>
          <div className="col-span-7 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">단백질</p>
              {editable && (
                <button
                  onClick={() => toggleEdit('protein')}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {renderEditableValue('protein', roundNumber(nutrition.protein), 'g')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center">
            <Droplet size={28} color="#4b5563" />
          </div>
          <div className="col-span-7 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">지방</p>
              {editable && (
                <button
                  onClick={() => toggleEdit('fat')}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {renderEditableValue('fat', roundNumber(nutrition.fat), 'g')}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-10 gap-1 shadow-md">
          <div className="col-span-3 flex items-center justify-center ">
            <Wheat size={28} color="#4b5563" />
          </div>
          <div className="col-span-7 flex flex-col  justify-center">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 tracking-tighter">탄수화물</p>
              {editable && (
                <button
                  onClick={() => toggleEdit('carbs')}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {renderEditableValue('carbs', roundNumber(nutrition.carbs), 'g')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NutritionCardMain;
