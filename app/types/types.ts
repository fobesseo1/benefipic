//types>types.ts
import { create } from 'zustand';

export type CurrentUserType = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  user_type: string | null;
  // current_points: number;
  // donation_id: string | null;
  // partner_name: string | null;
  // unread_messages_count: number;
  // updateCurrentPoints?: () => Promise<void>;
};

export type CardType = {
  id: number;
  card_id: string;
  card_category: string;
  card_title: string;
  card_content: string;
  user_id: string;
  created_at: string;
};

export interface FoodLog {
  id: string;
  user_id: string;
  logged_at: string;
  food_name: string;
  image_url: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  logged_at: string;
  exercise_name: string;
  image_url?: string; // Optional field
  duration_minutes: number;
  calories_per_hour: number;
  calories_burned: number;
  created_at?: string;
}

export type DailyStatusResponse = {
  status: {
    totalCalories: number;
    remainingCalories: number;
    totalExerciseMinutes: number;
    remainingExerciseMinutes: number;
    remainingProtein: number;
    remainingFat: number;
    remainingCarbs: number;
  };
  foodLogs: FoodLog[];
  exerciseLogs: ExerciseLog[];
};
