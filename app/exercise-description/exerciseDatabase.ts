// app/exercise-description/exerciseDatabase.ts

import {
  FaWalking,
  FaRunning,
  FaSwimmer,
  FaTableTennis,
  FaGolfBall,
  FaFutbol,
} from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import { Bike, Dumbbell, Plus, Mountain, Rocket } from 'lucide-react';
import {
  GiJumpingRope,
  GiPunchingBag,
  GiMountainClimbing,
  GiTennisRacket,
  GiTennisCourt,
  GiBasketballBasket,
} from 'react-icons/gi';
import { IoIosFitness } from 'react-icons/io';
import { MdSportsTennis } from 'react-icons/md';

export interface Exercise {
  id: string;
  name: string;
  caloriesPerHour: number;
  icon?: string;
}

// 자주 사용되는 운동 목록 (퀵 액세스용)
export const quickAccessExercises: Exercise[] = [
  {
    id: 'walking',
    name: '걷기',
    caloriesPerHour: 250,
    icon: 'Walk',
  },
  {
    id: 'running',
    name: '달리기',
    caloriesPerHour: 750,
    icon: 'Run',
  },
  {
    id: 'cycling',
    name: '자전거',
    caloriesPerHour: 475,
    icon: 'Bike',
  },
  {
    id: 'swimming',
    name: '수영',
    caloriesPerHour: 650,
    icon: 'Swim',
  },
  {
    id: 'weightlifting',
    name: '웨이트',
    caloriesPerHour: 425,
    icon: 'Dumbbell',
  },
  {
    id: 'yoga',
    name: '요가',
    caloriesPerHour: 200,
    icon: 'Yoga',
  },
  {
    id: 'custom',
    name: '직접입력',
    caloriesPerHour: 0,
    icon: 'Plus',
  },
];

// 전체 운동 데이터베이스
export const exerciseDatabase: Exercise[] = [
  ...quickAccessExercises,
  {
    id: 'hiking',
    name: '등산',
    caloriesPerHour: 450,
    icon: 'Mountain',
  },
  {
    id: 'basketball',
    name: '농구',
    caloriesPerHour: 600,
    icon: 'BasketballBasket',
  },
  {
    id: 'tennis',
    name: '테니스',
    caloriesPerHour: 500,
    icon: 'TennisRacket',
  },
  {
    id: 'dancing',
    name: '댄스',
    caloriesPerHour: 425,
    icon: 'Rocket',
  },
  {
    id: 'badminton',
    name: '배드민턴',
    caloriesPerHour: 450,
    icon: 'BadmintonCourt',
  },
  {
    id: 'jumprope',
    name: '줄넘기',
    caloriesPerHour: 700,
    icon: 'JumpRope',
  },
  {
    id: 'pilates',
    name: '필라테스',
    caloriesPerHour: 250,
    icon: 'Fitness',
  },
  {
    id: 'soccer',
    name: '축구',
    caloriesPerHour: 600,
    icon: 'Soccer',
  },
  {
    id: 'boxing',
    name: '복싱',
    caloriesPerHour: 800,
    icon: 'PunchingBag',
  },
  {
    id: 'tabletennis',
    name: '탁구',
    caloriesPerHour: 280,
    icon: 'TableTennis',
  },
  {
    id: 'aerobics',
    name: '에어로빅',
    caloriesPerHour: 450,
    icon: 'Fitness',
  },
  {
    id: 'golf',
    name: '골프',
    caloriesPerHour: 330,
    icon: 'Golf',
  },
  {
    id: 'squash',
    name: '스쿼시',
    caloriesPerHour: 750,
    icon: 'SportsTennis',
  },
  {
    id: 'climbing',
    name: '실내 클라이밍',
    caloriesPerHour: 600,
    icon: 'MountainClimbing',
  },
];

// 칼로리 계산 헬퍼 함수
export const calculateCalories = (caloriesPerHour: number, durationMinutes: number): number => {
  return Math.round((caloriesPerHour / 60) * durationMinutes);
};

// 아이콘 매핑 함수 추가
export const getExerciseIcon = (iconName: string | undefined) => {
  if (!iconName) return null;

  const iconMap = {
    Walk: FaWalking,
    Run: FaRunning,
    Bike: Bike,
    Swim: FaSwimmer,
    Yoga: GrYoga,
    Dumbbell: Dumbbell,
    Plus: Plus,
    Mountain: Mountain,
    PunchingBag: GiPunchingBag,
    BasketballBasket: GiBasketballBasket,
    MountainClimbing: GiMountainClimbing,
    Rocket: Rocket,
    JumpRope: GiJumpingRope,
    TennisRacket: GiTennisRacket,
    BadmintonCourt: GiTennisCourt,
    Soccer: FaFutbol,
    TableTennis: FaTableTennis,
    Golf: FaGolfBall,
    Fitness: IoIosFitness,
    SportsTennis: MdSportsTennis,
  };

  return iconMap[iconName as keyof typeof iconMap];
};

// 운동 ID로 운동 정보 찾기
export const findExerciseById = (id: string): Exercise | undefined => {
  return exerciseDatabase.find((exercise) => exercise.id === id);
};

// exercise_name으로 icon 찾기
export const findIconByExerciseName = (exerciseName: string): string | undefined => {
  const exercise = exerciseDatabase.find((ex) => ex.name === exerciseName);
  return exercise?.icon;
};
