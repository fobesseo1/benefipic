export type AnalysisStep =
  | 'initial'
  | 'camera'
  | 'image-selected'
  | 'filter-selection'
  | 'compress'
  | 'analyzing'
  | 'calculate'
  | 'health-check'
  | 'complete';

export interface NutritionData {
  foodName: string;
  ingredients: {
    name: string;
    amount: string;
    originalAmount?: {
      value: number;
      unit: string;
    };
  }[];
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
}

export interface ApiResponse {
  isFood: boolean;
  foodName: string;
  description?: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    nutritionPer100g: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  }[];
}
