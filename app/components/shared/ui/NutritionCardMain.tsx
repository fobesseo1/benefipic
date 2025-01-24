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
}

export const NutritionCardMain = ({
  nutrition,
  className,
  title = '영양 정보',
  editable = false,
  onNutritionChange,
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

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
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
