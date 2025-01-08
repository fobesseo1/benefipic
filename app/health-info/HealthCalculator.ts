import { ThumbsUp } from 'lucide-react';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'maintain' | 'gain' | 'lose';

export interface UserInput {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  goal: Goal;
  targetWeight?: number; // kg, optional
  targetDuration?: number; // weeks, optional
}

export interface NutritionResult {
  bmr: number;
  tdee: number;
  protein: number;
  fat: number;
  carbs: number;
  macroRatio: {
    protein: number;
    fat: number;
    carbs: number;
  };
  totalCalories: number;
  waterIntake: number;
  exerciseMinutes: number;
  weightChangePerWeek: number;
  bmi: number;
  healthWarnings: string[];
  recommendations: string[];
  strengthTraining: {
    frequency: string;
    sets: string;
    reps: string;
    guide: string;
  };
}

// 활동 계수 맵핑
const ACTIVITY_MULTIPLIERS = {
  male: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.7,
    very_active: 1.9,
  },
  female: {
    sedentary: 1.1,
    light: 1.325,
    moderate: 1.5,
    active: 1.65,
    very_active: 1.8,
  },
};

// 칼로리 안전 제한
const CALORIE_LIMITS = {
  female: { min: 1200, max: 2500 },
  male: { min: 1500, max: 3000 },
};

// 영양소 비율
const PROTEIN_MULTIPLIERS = {
  male: {
    maintain: 1.2, // 1.2-1.4g/kg
    gain: 1.8, // 1.8-2.2g/kg
    lose: 2.0, // 2.0-2.2g/kg
  },
  female: {
    maintain: 1.1, // 1.1-1.3g/kg
    gain: 1.6, // 1.6-1.8g/kg
    lose: 1.8, // 1.8-2.0g/kg
  },
};

const FAT_PERCENTAGES = {
  male: {
    maintain: 0.25, // 25%
    gain: 0.3, // 30%
    lose: 0.2, // 20%
  },
  female: {
    maintain: 0.3, // 30%
    gain: 0.3, // 30%
    lose: 0.25, // 25%
  },
};

const WEEKLY_CHANGE_LIMITS = {
  male: 0.75, // kg/week
  female: 0.5, // kg/week
};

const WATER_MULTIPLIERS = {
  male: 35, // ml/kg
  female: 31, // ml/kg
};

export interface RecommendedGoal {
  recommendedGoal: Goal;
  targetWeight: number;
  duration: number;
  stages?: {
    stage1: { weight: number; duration: number };
    stage2: { weight: number; duration: number };
  };
  iconType: 'check' | 'up' | 'down'; // icon 대신 iconType으로 변경
  message: string;
  messageGrid: {
    title: string;
    content1: string | React.ReactNode;
    content2?: string;
    content3?: string;
  };
  weightDiff: number;
}

export class HealthCalculator {
  static calculateRecommendedGoal(
    currentWeight: number,
    height: number,
    gender: Gender
  ): RecommendedGoal {
    const bmi = this.calculateBMI(currentWeight, height);
    const heightInMeters = height / 100;

    // 정상 체중 범위
    if (bmi >= 18.5 && bmi <= 23) {
      const weightDiff = 0;
      return {
        recommendedGoal: 'maintain',
        targetWeight: currentWeight,
        duration: 12,
        iconType: 'check',
        message: '추천 목표',
        messageGrid: {
          title: '체중 유지',
          content1: 'Good',
        },
        weightDiff,
      };
    }

    // 저체중
    if (bmi < 18.5) {
      const targetWeight = Number((18.5 * heightInMeters * heightInMeters).toFixed(1));
      const weightDiff = Number((targetWeight - currentWeight).toFixed(1));
      const recommendedDuration = Math.ceil(weightDiff / 0.5);

      return {
        recommendedGoal: 'gain',
        targetWeight,
        duration: recommendedDuration,
        iconType: 'up',
        message: '추천 목표',
        messageGrid: {
          title: `${recommendedDuration}주간`,
          content1: `+${weightDiff}`,
          content2: `kg`,
        },
        weightDiff,
      };
    }

    // 과체중/비만 (bmi > 23)
    const weeklyLoss = gender === 'male' ? 0.75 : 0.5;
    const maxWeightLoss = weeklyLoss * 12;

    const bmi23Weight = Number((23 * heightInMeters * heightInMeters).toFixed(1));

    // BMR 기반 안전 감량 계산 추가
    const bmr = this.calculateBMR(gender, currentWeight, height, 30); // 나이는 임시로 30 사용
    const tdee = this.calculateTDEE(bmr, 'moderate', gender); // 활동량은 보통으로 가정
    const safeCalorieDeficit = tdee - bmr;
    const maxWeightLossFromCalories = Number(((safeCalorieDeficit * 7 * 12) / 7700).toFixed(1));

    // 더 안전한 감량 목표 설정
    const maxLossWeight = Number(
      (currentWeight - Math.min(maxWeightLoss, maxWeightLossFromCalories)).toFixed(1)
    );
    const targetWeight = Math.max(bmi23Weight, maxLossWeight);
    console.log('targetWeight:', targetWeight);
    console.log('maxLossWeight:', maxLossWeight);
    console.log('bmi23Weight:', bmi23Weight);

    const weightDiff = Number((currentWeight - targetWeight).toFixed(1));
    console.log('weightDiff:', weightDiff);

    return {
      recommendedGoal: 'lose',
      targetWeight,
      duration: 12,
      iconType: 'down',
      message: '추천 목표',
      messageGrid: {
        title: '12주간',
        content1: `-${weightDiff}`,
        content2: 'kg',
      },
      weightDiff,
    };
  }

  // BMR (기초대사량) 계산 - Mifflin-St Jeor 공식
  static calculateBMR(gender: Gender, weight: number, height: number, age: number): number {
    const baseBMR = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  }

  // TDEE (일일 총 에너지 소비량) 계산
  static calculateTDEE(bmr: number, activityLevel: ActivityLevel, gender: Gender): number {
    return bmr * ACTIVITY_MULTIPLIERS[gender][activityLevel];
  }

  // BMI 계산
  static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  // BMI 기반 건강 경고
  static addHealthWarnings(bmi: number, age: number, gender: Gender): string[] {
    const warnings: string[] = [];

    if (age < 18 || age > 65) {
      warnings.push('이 계산기는 18-65세 성인 기준입니다. 전문의 상담을 권장합니다.');
    }

    if (bmi < 18.5) {
      warnings.push(
        `저체중 상태입니다. ${
          gender === 'female' ? '여성의 경우 생리불순 등 호르몬 교란이 발생할 수 있으니 ' : ''
        }전문의 상담을 권장합니다.`
      );
    } else if (bmi > 23 && bmi < 25) {
      warnings.push('비만 전 단계(과체중)입니다. 생활습관 개선을 권장합니다.');
    } else if (bmi >= 25 && bmi < 30) {
      warnings.push(
        `1단계 비만 상태입니다. ${
          gender === 'male' ? '남성의 경우 복부비만 위험이 높으니 ' : ''
        }전문의 상담을 권장합니다.`
      );
    } else if (bmi >= 30 && bmi < 35) {
      warnings.push('2단계 비만 상태입니다. 전문의 상담을 권장합니다.');
    } else if (bmi >= 35) {
      warnings.push('3단계 비만(고도비만) 상태입니다. 전문의 상담을 권장합니다.');
    }

    return warnings;
  }

  static calculateRecommendedWeight(height: number, currentWeight: number): number {
    const currentBMI = this.calculateBMI(currentWeight, height);
    const heightInMeters = height / 100;

    if (currentBMI >= 18.5 && currentBMI <= 23) {
      return currentWeight;
    }

    if (currentBMI < 18.5) {
      return Number((18.5 * heightInMeters * heightInMeters).toFixed(1));
    }

    return Number((23 * heightInMeters * heightInMeters).toFixed(1));
  }

  // 물 섭취량 계산
  static calculateWaterIntake(
    weight: number,
    activityLevel: ActivityLevel,
    gender: Gender
  ): number {
    const baseWater = weight * WATER_MULTIPLIERS[gender];
    const activityAddition =
      activityLevel === 'active' || activityLevel === 'very_active' ? 500 : 0;
    return baseWater + activityAddition;
  }

  // 운동 권장사항 계산
  static calculateExerciseRecommendation(
    goal: Goal,
    bmi: number,
    activityLevel: ActivityLevel,
    gender: Gender
  ): {
    cardioMinutes: number;
    strengthTraining: {
      frequency: string;
      sets: string;
      reps: string;
      guide: string;
    };
    recommendations: string[];
  } {
    let cardioMinutes: number;
    const recommendations: string[] = [];

    switch (goal) {
      case 'lose':
        cardioMinutes = bmi >= 25 ? 45 : 40;
        recommendations.push(
          `중강도 유산소 운동을 주 ${bmi >= 25 ? 5 : 4}회, 회당 ${cardioMinutes}분 실시하세요.`,
          gender === 'female'
            ? '걷기, 수영, 댄스 등 전신 운동을 선택하세요.'
            : '걷기, 조깅, 자전거 등 전신 운동을 선택하세요.'
        );
        break;
      case 'gain':
        cardioMinutes = 30;
        recommendations.push(
          '과도한 유산소 운동은 피하고, 웨이트 트레이닝에 집중하세요.',
          '중강도 유산소 운동을 주 3회, 회당 30분으로 제한하세요.'
        );
        break;
      default:
        cardioMinutes = 35;
        recommendations.push(
          '중강도 유산소 운동을 주 4회, 회당 35분 실시하세요.',
          '유산소 운동과 근력 운동을 균형있게 병행하세요.'
        );
    }

    const strengthTraining = {
      gain: {
        frequency: gender === 'male' ? '주 4회' : '주 3회',
        sets: gender === 'male' ? '3-4세트' : '2-3세트',
        reps: '8-12회',
        guide:
          gender === 'male'
            ? '큰 근육군 운동을 먼저하고, 운동 간 1일 휴식'
            : '전신 근력운동과 코어 강화 운동 병행',
      },
      lose: {
        frequency: '주 2-3회',
        sets: '2-3세트',
        reps: '12-15회',
        guide:
          gender === 'male'
            ? '유산소 운동 후 근력 운동 실시'
            : '하체 위주의 근력 운동과 코어 운동 병행',
      },
      maintain: {
        frequency: '주 2-3회',
        sets: '2-3세트',
        reps: '10-12회',
        guide:
          gender === 'male' ? '모든 주요 근육군을 골고루 운동' : '전신 근력운동과 스트레칭 병행',
      },
    }[goal];

    return { cardioMinutes, strengthTraining, recommendations };
  }

  // 건강 모니터링
  static monitorHealthMetrics(
    currentWeight: number,
    targetWeight: number,
    duration: number,
    gender: Gender
  ): { weeklyChange: number; recommendations: string[]; warnings: string[] } {
    const weeklyChange = (targetWeight - currentWeight) / duration;
    const isHealthyRange = Math.abs(weeklyChange) <= WEEKLY_CHANGE_LIMITS[gender];

    const recommendations = [];
    const warnings = [];

    if (isHealthyRange) {
      recommendations.push('현재 체중 변화 속도는 적절합니다.');
    } else {
      warnings.push('체중 변화가 너무 급격합니다.');
      recommendations.push(
        `체중 변화 속도를 주당 ${WEEKLY_CHANGE_LIMITS[gender]}kg 이내로 조정하세요.`
      );
    }

    return {
      weeklyChange,
      recommendations,
      warnings,
    };
  }

  // 영양소 계산
  static calculateNutrients(weight: number, totalCalories: number, goal: Goal, gender: Gender) {
    let proteinPerKg = PROTEIN_MULTIPLIERS[gender][goal];
    let protein = weight * proteinPerKg;
    let proteinCalories = protein * 4;

    if (proteinCalories > totalCalories * 0.4) {
      proteinCalories = totalCalories * 0.4;
      protein = proteinCalories / 4;
    }

    let fatRatio = FAT_PERCENTAGES[gender][goal];
    let fatCalories = totalCalories * fatRatio;

    const minFatGrams = weight * 0.5;
    const minFatCalories = minFatGrams * 9;

    if (fatCalories < minFatCalories) {
      fatCalories = minFatCalories;
    }

    let fat = fatCalories / 9;

    const remainingCalories = totalCalories - proteinCalories - fatCalories;
    let carbs = remainingCalories / 4;

    if (carbs < 100) {
      carbs = 100;
      const carbsCalories = carbs * 4;
      const availableForFat = totalCalories - proteinCalories - carbsCalories;
      fat = availableForFat / 9;
    }

    return {
      nutrients: {
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
      },
      ratio: {
        protein: Math.round(((protein * 4) / totalCalories) * 100),
        fat: Math.round(((fat * 9) / totalCalories) * 100),
        carbs: Math.round(((carbs * 4) / totalCalories) * 100),
      },
    };
  }

  // 영양소 계산
  static calculateNutrition(userInput: UserInput): NutritionResult {
    const { gender, weight, height, age, activityLevel, goal, targetWeight, targetDuration } =
      userInput;

    const bmi = this.calculateBMI(weight, height);
    const healthWarnings = this.addHealthWarnings(bmi, age, gender);
    let recommendations: string[] = [];

    const bmr = this.calculateBMR(gender, weight, height, age);
    const tdee = this.calculateTDEE(bmr, activityLevel, gender);

    let totalCalories = tdee;
    let weightChangePerWeek = 0;

    if (targetWeight && targetDuration) {
      const healthMetrics = this.monitorHealthMetrics(weight, targetWeight, targetDuration, gender);
      weightChangePerWeek = healthMetrics.weeklyChange;
      recommendations = [...recommendations, ...healthMetrics.recommendations];
      healthWarnings.push(...healthMetrics.warnings);

      const dailyCalorieChange = (weightChangePerWeek * 7700) / 7;
      totalCalories += dailyCalorieChange;
    }

    const limits = CALORIE_LIMITS[gender];
    const originalCalories = totalCalories;
    totalCalories = Math.min(Math.max(totalCalories, limits.min), limits.max);

    if (totalCalories !== originalCalories && targetWeight && targetDuration) {
      const calorieDeficit = Math.abs(tdee - totalCalories);
      const totalDeficit = calorieDeficit * targetDuration * 7;
      const possibleWeightLoss = totalDeficit / 7700;

      if (goal === 'lose') {
        const achievableWeight = weight - possibleWeightLoss;
        recommendations.push(
          `현재 설정하신 목표 기간 동안 안전한 최소 칼로리(${
            limits.min
          }kcal)를 유지하며 도달할 수 있는 체중은 ${achievableWeight.toFixed(1)}kg입니다. ` +
            `목표 달성을 위해서는 기간을 ${Math.ceil(
              (weight - targetWeight) / (possibleWeightLoss / targetDuration)
            )}주로 조정하시거나, ` +
            `운동량을 늘려 소비 칼로리를 증가시키는 것을 권장드립니다.`
        );
      } else if (goal === 'gain') {
        const achievableWeight = weight + possibleWeightLoss;
        recommendations.push(
          `현재 설정하신 목표 기간 동안 안전한 최대 칼로리(${
            limits.max
          }kcal)를 유지하며 도달할 수 있는 체중은 ${achievableWeight.toFixed(1)}kg입니다. ` +
            `목표 달성을 위해서는 기간을 ${Math.ceil(
              (targetWeight - weight) / (possibleWeightLoss / targetDuration)
            )}주로 조정하시는 것을 권장드립니다.`
        );
      }
    }

    const nutritionInfo = this.calculateNutrients(weight, totalCalories, goal, gender);
    const { nutrients, ratio: macroRatio } = nutritionInfo;

    const exercise = this.calculateExerciseRecommendation(goal, bmi, activityLevel, gender);
    const waterIntake = this.calculateWaterIntake(weight, activityLevel, gender);

    const genderSpecificAdvice =
      gender === 'female'
        ? [
            '호르몬 균형을 위해 규칙적인 식사가 중요합니다.',
            '철분이 풍부한 식품 섭취를 고려하세요.',
          ]
        : ['단백질 섭취와 근력 운동을 병행하세요.', '충분한 수분 섭취가 중요합니다.'];

    recommendations.push(
      ...genderSpecificAdvice,
      `일일 권장 영양소 섭취량:`,
      `- 단백질: ${nutrients.protein}g (${macroRatio.protein}%)`,
      `- 지방: ${nutrients.fat}g (${macroRatio.fat}%)`,
      `- 탄수화물: ${nutrients.carbs}g (${macroRatio.carbs}%)`
    );

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: nutrients.protein,
      fat: nutrients.fat,
      carbs: nutrients.carbs,
      macroRatio,
      totalCalories: Math.round(totalCalories),
      waterIntake: Math.round(waterIntake),
      exerciseMinutes: exercise.cardioMinutes,
      weightChangePerWeek,
      bmi,
      strengthTraining: exercise.strengthTraining,
      healthWarnings,
      recommendations: [
        ...exercise.recommendations,
        `일일 물 섭취량: ${Math.round(waterIntake)}ml`,
        `일일 칼로리 목표: ${Math.round(totalCalories)}kcal`,
        ...recommendations,
      ],
    };
  }
}
