import {
  calculateTotalNutrition,
  findExactMatchFood,
  roundNutritionValues,
} from '@/utils/food-analysis';
import { ApiResponse, NutritionData } from './types';
import { completedFoodDatabase } from '@/app/food-description/foodDatabase';

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

export const processApiResponse = (apiData: ApiResponse): NutritionData => {
  console.log('API 응답 데이터:', apiData);

  // 정확한 매칭 확인
  const exactMatch = findExactMatchFood(apiData.foodName, completedFoodDatabase);

  // ingredients 형식 변환 (항상 OpenAI 결과 사용)
  const processedIngredients = apiData.ingredients.map((ingredient) => ({
    name: ingredient.name,
    amount: `${ingredient.amount.toString()}${ingredient.unit}`,
    originalAmount: {
      value: ingredient.amount,
      unit: ingredient.unit,
    },
  }));

  if (exactMatch) {
    // 정확히 일치하는 경우 DB의 영양정보 직접 사용
    return {
      foodName: apiData.foodName,
      ingredients: processedIngredients,
      nutrition: exactMatch.nutrition, // DB 값 그대로 사용
    };
  }

  // 일치하지 않는 경우 기존 로직대로 계산
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

  // 1. 칼로리 점수 (최대 2점 / 최소 -2점)
  const caloriesPerServing = food.nutrition.calories;
  if (caloriesPerServing < 300) score += 2;
  else if (caloriesPerServing < 500) score += 1;
  else if (caloriesPerServing > 1200) score -= 2;
  else if (caloriesPerServing > 800) score -= 1;

  // 2. 영양소 비율 점수
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

  const foodName = food.foodName.toLowerCase();

  // 3. 최상급 건강식품 (단백질 위주의 고영양 식품) (+3점)
  if (
    foodName.includes('닭가슴살') ||
    foodName.includes('연어') ||
    foodName.includes('계란흰자') ||
    (foodName.includes('샐러드') && (foodName.includes('닭고기') || foodName.includes('연어'))) ||
    foodName.includes('단백질쉐이크') ||
    foodName.includes('프로틴')
  ) {
    score += 3;
  }

  // 4. 건강한 식품 (+2점)
  if (
    foodName.includes('두부') ||
    foodName.includes('계란') ||
    (foodName.includes('샐러드') && !foodName.includes('드레싱')) ||
    foodName.includes('현미') ||
    foodName.includes('잡곡') ||
    foodName.includes('오트밀') ||
    foodName.includes('고구마') ||
    foodName.includes('브로콜리') ||
    foodName.includes('콩') ||
    foodName.includes('견과류') ||
    foodName.includes('그릭요거트')
  ) {
    score += 2;
  }

  // 5. 괜찮은 식품 (+1점)
  if (
    foodName.includes('김치') ||
    foodName.includes('된장국') ||
    foodName.includes('미역국') ||
    foodName.includes('바나나') ||
    foodName.includes('사과') ||
    foodName.includes('배') ||
    foodName.includes('귤') ||
    foodName.includes('요거트') ||
    foodName.includes('닭안심')
  ) {
    score += 1;
  }

  // 6. 일반 식사류 (-1점)
  if (
    foodName.includes('김치찌개') ||
    foodName.includes('된장찌개') ||
    foodName.includes('제육볶음') ||
    foodName.includes('찜닭') ||
    foodName.includes('비빔밥') ||
    foodName.includes('불고기') ||
    foodName.includes('순두부찌개') ||
    foodName.includes('짜장면') ||
    foodName.includes('짬뽕') ||
    foodName.includes('볶음밥') ||
    foodName.includes('김밥') ||
    foodName.includes('덮밥')
  ) {
    score -= 1;
  }

  // 6. 국수,면 (-2점)
  if (
    foodName.includes('파스타') ||
    foodName.includes('국수') ||
    foodName.includes('면') ||
    foodName.includes('스파게티')
  ) {
    score -= 2;
  }

  // 7. 고칼로리/기름진 식사 (-2점)
  if (
    foodName.includes('돈까스') ||
    foodName.includes('탕수육') ||
    foodName.includes('동까스') ||
    foodName.includes('돈가스') ||
    foodName.includes('깐풍기') ||
    foodName.includes('튀김') ||
    foodName.includes('마라탕') ||
    foodName.includes('마라샹궈') ||
    foodName.includes('부대찌개') ||
    foodName.includes('라면') ||
    foodName.includes('우동')
  ) {
    score -= 2;
  }

  // 8. 패스트푸드 (-3점)
  if (
    foodName.includes('피자') ||
    foodName.includes('버거') ||
    foodName.includes('후라이드치킨') ||
    foodName.includes('양념치킨') ||
    foodName.includes('치킨') ||
    foodName.includes('맥도날드') ||
    foodName.includes('롯데리아') ||
    foodName.includes('버거킹') ||
    foodName.includes('KFC') ||
    foodName.includes('떡볶이')
  ) {
    score -= 3;
  }

  // 9. 디저트/간식류 (-2점)
  if (
    foodName.includes('케이크') ||
    foodName.includes('아이스크림') ||
    foodName.includes('과자') ||
    foodName.includes('쿠키') ||
    foodName.includes('초콜릿') ||
    foodName.includes('사탕') ||
    foodName.includes('젤리') ||
    foodName.includes('빵') ||
    foodName.includes('도넛') ||
    foodName.includes('타르트') ||
    foodName.includes('마카롱') ||
    foodName.includes('와플')
  ) {
    score -= 2;
  }

  // 10. 음료류
  // 매우 나쁜 음료 (-5점)
  if (
    foodName.includes('콜라') ||
    foodName.includes('사이다') ||
    foodName.includes('환타') ||
    foodName.includes('밀크쉐이크') ||
    foodName.includes('슬러시') ||
    foodName.includes('펩시')
  ) {
    // 제로 칼로리 음료 구분
    if (
      foodName.includes('제로') ||
      foodName.includes('zero') ||
      foodName.includes('라이트') ||
      foodName.includes('다이어트')
    ) {
      score -= 2; // 제로 칼로리 음료는 -2점
      if (caloriesPerServing <= 5) score += 1; // 실제 칼로리가 매우 낮으면 약간의 보너스
    } else {
      score -= 3; // 일반 탄산음료는 -3점
      // 고칼로리 페널티
      if (caloriesPerServing > 150) score -= 1;
    }
  }
  // 나쁜 음료 (-2점)
  else if (
    foodName.includes('쥬스') ||
    foodName.includes('주스') ||
    (foodName.includes('스무디') && !foodName.includes('프로틴')) ||
    foodName.includes('에이드') ||
    foodName.includes('카페라떼') ||
    foodName.includes('카푸치노')
  ) {
    score -= 2;
  }
  // 적당한 음료 (-1점)
  else if (foodName.includes('커피') || foodName.includes('아메리카노')) {
    score -= 1;
  }
  // 좋은 음료 (+1점)
  else if (
    foodName.includes('물') ||
    foodName.includes('녹차') ||
    foodName.includes('보리차') ||
    foodName.includes('수박주스') ||
    foodName.includes('토마토주스') ||
    foodName.includes('식혜')
  ) {
    score += 1;
  }

  return Math.min(Math.max(1, score), 10);
};
