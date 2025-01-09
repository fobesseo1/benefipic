// utils/food-analysis.ts

import { ingredientDatabase } from '@/app/food-description/foodDatabase';

// 타입 정의
export interface NutritionPer100g {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ApiResponse {
  isFood: boolean;
  foodName: string;
  description?: string;
  healthTip?: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    nutritionPer100g: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  }>;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface FoodAnalysis {
  isFood: boolean;
  foodName: string;
  description?: string;
  ingredients: Ingredient[];
}

export interface NutritionData {
  foodName: string;
  healthTip?: string;
  ingredients: Array<{
    name: string;
    amount: string;
    originalAmount?: {
      value: number;
      unit: string;
    };
  }>;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

// 유틸리티 함수들
export const getLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str1.length + 1)
    .fill(null)
    .map(() => Array(str2.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[str1.length][str2.length];
};

export const isSimilarName = (name1: string, name2: string, threshold = 0.7): boolean => {
  const distance = getLevenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  const similarity = 1 - distance / maxLength;
  return similarity >= threshold;
};

export const isExactMatch = (name1: string, name2: string): boolean => {
  return name1 === name2;
};

export const findExactMatchFood = (foodName: string, completedFoodDatabase: any[]) => {
  return completedFoodDatabase.find((food) => food.name === foodName);
};

export const findMatchingIngredient = (
  name: string,
  completedFoodDatabase: any[],
  ingredientDatabase: any[]
) => {
  console.log('--- 재료 매칭 시작 ---');
  console.log('찾을 재료명:', name);

  const exactCompletedMatch = completedFoodDatabase.find((food) => food.name === name);
  if (exactCompletedMatch) {
    return {
      type: 'completed',
      data: exactCompletedMatch,
    };
  }

  const exactIngredientMatch = ingredientDatabase.find((ing) => ing.name === name);
  if (exactIngredientMatch) {
    return {
      type: 'ingredient',
      data: exactIngredientMatch,
    };
  }

  const similarCompleted = completedFoodDatabase.find((food) => isSimilarName(food.name, name));
  if (similarCompleted) {
    return {
      type: 'completed',
      data: similarCompleted,
    };
  }

  const similarIngredient = ingredientDatabase.find((ing) => isSimilarName(ing.name, name));
  if (similarIngredient) {
    return {
      type: 'ingredient',
      data: similarIngredient,
    };
  }

  return null;
};

export const correctIngredient = (
  ingredient: Ingredient,
  completedFoodDatabase: any[],
  ingredientDatabase: any[]
): Ingredient => {
  const matchedItem = findMatchingIngredient(
    ingredient.name,
    completedFoodDatabase,
    ingredientDatabase
  );

  if (!matchedItem) {
    return ingredient;
  }

  const nutrition = {
    calories: (matchedItem.data.nutrition.calories * 100) / matchedItem.data.unitWeight,
    protein: (matchedItem.data.nutrition.protein * 100) / matchedItem.data.unitWeight,
    fat: (matchedItem.data.nutrition.fat * 100) / matchedItem.data.unitWeight,
    carbs: (matchedItem.data.nutrition.carbs * 100) / matchedItem.data.unitWeight,
  };

  return {
    ...ingredient,
    nutritionPer100g: nutrition,
  };
};

export const calculateTotalNutrition = (
  ingredients: ApiResponse['ingredients']
): NutritionPer100g => {
  return ingredients.reduce(
    (total, ingredient) => {
      const ratio = ingredient.amount / 100;
      return {
        calories: total.calories + ingredient.nutritionPer100g.calories * ratio,
        protein: total.protein + ingredient.nutritionPer100g.protein * ratio,
        fat: total.fat + ingredient.nutritionPer100g.fat * ratio,
        carbs: total.carbs + ingredient.nutritionPer100g.carbs * ratio,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
};

export const roundNutritionValues = (nutrition: NutritionPer100g): NutritionPer100g => {
  return {
    calories: Math.round(nutrition.calories),
    protein: parseFloat(nutrition.protein.toFixed(1)),
    fat: parseFloat(nutrition.fat.toFixed(1)),
    carbs: parseFloat(nutrition.carbs.toFixed(1)),
  };
};

export const validateAndCorrectAnalysis = (
  analysis: FoodAnalysis,
  completedFoodDatabase: any[]
): FoodAnalysis => {
  const exactMatch = findExactMatchFood(analysis.foodName, completedFoodDatabase);
  if (exactMatch) {
    return {
      ...analysis,
      ingredients: analysis.ingredients.map((ing) => ({
        ...ing,
        nutritionPer100g: {
          calories: (exactMatch.nutrition.calories / exactMatch.unitWeight) * 100,
          protein: (exactMatch.nutrition.protein / exactMatch.unitWeight) * 100,
          fat: (exactMatch.nutrition.fat / exactMatch.unitWeight) * 100,
          carbs: (exactMatch.nutrition.carbs / exactMatch.unitWeight) * 100,
        },
      })),
    };
  }

  const matchedFood = completedFoodDatabase.find((food) =>
    isSimilarName(food.name, analysis.foodName)
  );

  const correctedIngredients = analysis.ingredients.map((ing) =>
    correctIngredient(ing, completedFoodDatabase, ingredientDatabase)
  );

  if (matchedFood) {
    const totalWeight = correctedIngredients.reduce((sum, ing) => sum + ing.amount, 0);
    const ratio = totalWeight / matchedFood.unitWeight;
    const gptTotal = calculateTotalNutrition(correctedIngredients);
    const dbTotal = {
      calories: matchedFood.nutrition.calories * ratio,
      protein: matchedFood.nutrition.protein * ratio,
      fat: matchedFood.nutrition.fat * ratio,
      carbs: matchedFood.nutrition.carbs * ratio,
    };

    const threshold = 0.3;
    const difference = Math.abs(gptTotal.calories - dbTotal.calories) / dbTotal.calories;

    if (difference > threshold) {
      return {
        ...analysis,
        ingredients: correctedIngredients.map((ing) => ({
          ...ing,
          nutritionPer100g: {
            calories: (dbTotal.calories / totalWeight) * 100,
            protein: (dbTotal.protein / totalWeight) * 100,
            fat: (dbTotal.fat / totalWeight) * 100,
            carbs: (dbTotal.carbs / totalWeight) * 100,
          },
        })),
      };
    }
  }

  return {
    ...analysis,
    ingredients: correctedIngredients,
  };
};
