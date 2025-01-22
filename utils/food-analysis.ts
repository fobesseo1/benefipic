// utils/food-analysis.ts

import { completedFoodDatabase, ingredientDatabase } from '@/app/food-description/foodDatabase';

// Type Definitions
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
  letter?: Array<{
    type: 'nutrition_label';
    content: string;
    serving_info: {
      serving_type: 'total' | 'per_unit' | 'per_serving';
      total_size: number;
      total_unit: 'ml' | 'g';
      base_size?: number;
      base_unit?: 'ml' | 'g';
    };
    values: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
    units: {
      calories: string;
      protein: string;
      fat: string;
      carbs: string;
    };
  }>;
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

// Utility Functions
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

  // 정확한 매칭 먼저 시도
  const exactCompletedMatch = completedFoodDatabase.find((food) => food.name === name);
  if (exactCompletedMatch) {
    return { type: 'completed', data: exactCompletedMatch };
  }

  const exactIngredientMatch = ingredientDatabase.find((ing) => ing.name === name);
  if (exactIngredientMatch) {
    return { type: 'ingredient', data: exactIngredientMatch };
  }

  // 유사도 기반 매칭 시도
  const similarCompleted = completedFoodDatabase.find((food) => isSimilarName(food.name, name));
  if (similarCompleted) {
    return { type: 'completed', data: similarCompleted };
  }

  const similarIngredient = ingredientDatabase.find((ing) => isSimilarName(ing.name, name));
  if (similarIngredient) {
    return { type: 'ingredient', data: similarIngredient };
  }

  return null;
};

// Core Functions
export const calculateNutritionByQuantity = (
  originalData: NutritionData,
  qty: number
): NutritionData => {
  return {
    ...originalData,
    nutrition: {
      calories: Math.round(originalData.nutrition.calories * qty),
      protein: parseFloat((originalData.nutrition.protein * qty).toFixed(1)),
      fat: parseFloat((originalData.nutrition.fat * qty).toFixed(1)),
      carbs: parseFloat((originalData.nutrition.carbs * qty).toFixed(1)),
    },
    ingredients: originalData.ingredients.map((ingredient) => {
      if (ingredient.originalAmount) {
        return {
          ...ingredient,
          amount: `${(ingredient.originalAmount.value * qty).toFixed(1)}${
            ingredient.originalAmount.unit
          }`,
        };
      }
      return ingredient;
    }),
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
  analysis: ApiResponse,
  completedFoodDatabase: any[]
): ApiResponse => {
  const isValidLetterNutrition = (letter: ApiResponse['letter']) => {
    if (!letter || !letter.length || !letter[0].values) return false;
    const values = letter[0].values;
    return values.calories > 0 || values.protein > 0 || values.fat > 0 || values.carbs > 0;
  };

  if (isValidLetterNutrition(analysis.letter)) {
    return analysis;
  }

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

  const correctedIngredients = analysis.ingredients.map((ing) => {
    const matchedItem = findMatchingIngredient(ing.name, completedFoodDatabase, ingredientDatabase);
    if (!matchedItem) return ing;

    return {
      ...ing,
      nutritionPer100g: {
        calories: (matchedItem.data.nutrition.calories * 100) / matchedItem.data.unitWeight,
        protein: (matchedItem.data.nutrition.protein * 100) / matchedItem.data.unitWeight,
        fat: (matchedItem.data.nutrition.fat * 100) / matchedItem.data.unitWeight,
        carbs: (matchedItem.data.nutrition.carbs * 100) / matchedItem.data.unitWeight,
      },
    };
  });

  return { ...analysis, ingredients: correctedIngredients };
};

export const processApiResponse = (apiData: ApiResponse): NutritionData => {
  console.log('API 응답 데이터:', apiData);

  const isValidLetterNutrition = (
    letter: ApiResponse['letter']
  ): letter is NonNullable<typeof letter> & {
    0: {
      values: NonNullable<typeof letter>[0]['values'];
      serving_info: NonNullable<typeof letter>[0]['serving_info'];
    };
  } => {
    if (!letter || !letter.length || !letter[0].values) return false;
    const values = letter[0].values;
    return values.calories > 0 || values.protein > 0 || values.fat > 0 || values.carbs > 0;
  };

  if (apiData.letter && isValidLetterNutrition(apiData.letter)) {
    const letter = apiData.letter[0];
    let adjustedNutrition = { ...letter.values };

    if (
      letter.serving_info.base_size &&
      (letter.serving_info.serving_type === 'per_serving' ||
        letter.serving_info.serving_type === 'per_unit')
    ) {
      const ratio = letter.serving_info.total_size / letter.serving_info.base_size;
      adjustedNutrition = {
        calories: letter.values.calories * ratio,
        protein: letter.values.protein * ratio,
        fat: letter.values.fat * ratio,
        carbs: letter.values.carbs * ratio,
      };
    }

    return {
      foodName: apiData.foodName,
      ingredients: apiData.ingredients.map((ingredient) => ({
        name: ingredient.name,
        amount: `${ingredient.amount}${ingredient.unit}`,
        originalAmount: {
          value: ingredient.amount,
          unit: ingredient.unit,
        },
      })),
      nutrition: adjustedNutrition,
    };
  }

  const processedIngredients = apiData.ingredients.map((ingredient) => ({
    name: ingredient.name,
    amount: `${ingredient.amount.toString()}${ingredient.unit}`,
    originalAmount: {
      value: ingredient.amount,
      unit: ingredient.unit,
    },
  }));

  const exactMatch = findExactMatchFood(apiData.foodName, completedFoodDatabase);
  if (exactMatch) {
    return {
      foodName: apiData.foodName,
      ingredients: processedIngredients,
      nutrition: exactMatch.nutrition,
    };
  }

  const totalNutrition = calculateTotalNutrition(apiData.ingredients);
  const roundedNutrition = roundNutritionValues(totalNutrition);

  return {
    foodName: apiData.foodName,
    ingredients: processedIngredients,
    nutrition: roundedNutrition,
  };
};

export const calculateHealthScore = (food: {
  foodName: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}) => {
  let score = 5; // 기본 점수
  const foodName = food.foodName.toLowerCase();

  // 칼로리 점수 (최대 2점 / 최소 -2점)
  const caloriesPerServing = food.nutrition.calories;
  if (caloriesPerServing < 300) score += 2;
  else if (caloriesPerServing < 500) score += 1;
  else if (caloriesPerServing > 1200) score -= 2;
  else if (caloriesPerServing > 800) score -= 1;

  // 영양소 비율 점수
  const proteinRatio = (food.nutrition.protein * 4) / food.nutrition.calories;
  const fatRatio = (food.nutrition.fat * 9) / food.nutrition.calories;
  const carbRatio = (food.nutrition.carbs * 4) / food.nutrition.calories;

  // 단백질 점수 (최대 2점)
  if (proteinRatio > 0.25) score += 2;
  else if (proteinRatio > 0.15) score += 1;

  // 탄수화물 점수 (최대 1점)
  if (carbRatio >= 0.45 && carbRatio <= 0.65) score += 1;
  else if (carbRatio > 0.75) score -= 1;

  // 지방 점수 (최대 1점)
  if (fatRatio < 0.35) score += 1;
  else if (fatRatio > 0.5) score -= 1;

  // 음식 종류별 점수 조정
  const scoreAdjustments = [
    // 최상급 건강식품 (+3점)
    {
      score: 3,
      items: ['닭가슴살', '연어', '계란흰자', '단백질쉐이크', '프로틴'],
      condition: (name: string) =>
        name.includes('샐러드') && (name.includes('닭고기') || name.includes('연어')),
    },
    // 건강한 식품 (+2점)
    {
      score: 2,
      items: [
        '두부',
        '계란',
        '현미',
        '잡곡',
        '오트밀',
        '고구마',
        '브로콜리',
        '콩',
        '견과류',
        '그릭요거트',
      ],
      condition: (name: string) => name.includes('샐러드') && !name.includes('드레싱'),
    },
    // 괜찮은 식품 (+1점)
    {
      score: 1,
      items: ['김치', '된장국', '미역국', '바나나', '사과', '배', '귤', '요거트', '닭안심'],
    },
    // 일반 식사류 (-1점)
    {
      score: -1,
      items: [
        '김치찌개',
        '된장찌개',
        '제육볶음',
        '찜닭',
        '비빔밥',
        '불고기',
        '순두부찌개',
        '짜장면',
        '짬뽕',
        '볶음밥',
        '김밥',
        '덮밥',
      ],
    },
    // 국수,면류 (-2점)
    {
      score: -2,
      items: ['파스타', '국수', '면', '스파게티'],
    },
    // 고칼로리/기름진 식사 (-2점)
    {
      score: -2,
      items: [
        '돈까스',
        '탕수육',
        '동까스',
        '돈가스',
        '깐풍기',
        '튀김',
        '마라탕',
        '마라샹궈',
        '부대찌개',
        '라면',
        '우동',
      ],
    },
    // 패스트푸드 (-3점)
    {
      score: -3,
      items: [
        '피자',
        '버거',
        '후라이드치킨',
        '양념치킨',
        '치킨',
        '맥도날드',
        '롯데리아',
        '버거킹',
        'KFC',
        '떡볶이',
      ],
    },
    // 디저트/간식류 (-2점)
    {
      score: -2,
      items: [
        '케이크',
        '아이스크림',
        '과자',
        '쿠키',
        '초콜릿',
        '사탕',
        '젤리',
        '빵',
        '도넛',
        '타르트',
        '마카롱',
        '와플',
      ],
    },
  ];

  // 음식 종류별 점수 적용
  scoreAdjustments.forEach(({ score: adjScore, items, condition }) => {
    const hasMatchingItem = items?.some((item) => foodName.includes(item));
    if (hasMatchingItem || (condition && condition(foodName))) {
      score += adjScore;
    }
  });

  // 음료 점수 조정
  const isDrink = [
    '콜라',
    '사이다',
    '환타',
    '밀크쉐이크',
    '슬러시',
    '펩시',
    '쥬스',
    '주스',
    '스무디',
    '에이드',
    '카페라떼',
    '카푸치노',
    '커피',
    '아메리카노',
    '물',
    '녹차',
    '보리차',
    '수박주스',
    '토마토주스',
    '식혜',
  ].some((drink) => foodName.includes(drink));

  if (isDrink) {
    // 매우 나쁜 음료 처리
    if (
      ['콜라', '사이다', '환타', '밀크쉐이크', '슬러시', '펩시'].some((drink) =>
        foodName.includes(drink)
      )
    ) {
      // 제로 칼로리 음료 구분
      if (['제로', 'zero', '라이트', '다이어트'].some((zero) => foodName.includes(zero))) {
        score -= 2;
        if (caloriesPerServing <= 5) score += 1;
      } else {
        score -= 3;
        if (caloriesPerServing > 150) score -= 1;
      }
    }
    // 나쁜 음료
    else if (
      ['쥬스', '주스', '스무디', '에이드', '카페라떼', '카푸치노'].some(
        (drink) =>
          foodName.includes(drink) && (!foodName.includes('프로틴') || !foodName.includes('단백질'))
      )
    ) {
      score -= 2;
    }
    // 적당한 음료
    else if (['커피', '아메리카노'].some((drink) => foodName.includes(drink))) {
      score -= 1;
    }
    // 좋은 음료
    else if (
      ['물', '녹차', '보리차', '수박주스', '토마토주스', '식혜'].some((drink) =>
        foodName.includes(drink)
      )
    ) {
      score += 1;
    }
  }

  return Math.min(Math.max(1, score), 10);
};
