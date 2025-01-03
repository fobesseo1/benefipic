// /app/api/daily-status/route.ts
import { createSupabaseServerClient, getUser } from '@/lib/supabse/server';
import { getKoreanDateRange } from '@/lib/utils/dateAudit';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const currentUser = await getUser();
  const userId = currentUser?.id;

  // URL에서 date 파라미터 가져오기
  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date');
  const selectedDate = dateStr ? new Date(dateStr) : new Date();

  console.log('Selected Date:', selectedDate);
  console.log('userId', userId);

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 선택된 날짜의 범위 가져오기
  const { utcStart, utcEnd } = getKoreanDateRange(selectedDate);

  console.log('Date Range:', { utcStart, utcEnd });

  try {
    const { data: goals } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!goals) {
      return Response.json({ error: 'No active goals found' }, { status: 404 });
    }

    const { data: foodLogs } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', utcStart.toISOString())
      .lte('logged_at', utcEnd.toISOString());

    // 전체 데이터 로그 출력
    console.log('Food Logs Data:', JSON.stringify(foodLogs, null, 2));

    // 각 로그 항목별로 자세히 출력
    foodLogs?.forEach((log, index) => {
      console.log(`Food Log #${index + 1}:`, {
        id: log.id,
        user_id: log.user_id,
        food_name: log.food_name,
        calories: log.calories,
        protein: log.protein,
        fat: log.fat,
        carbs: log.carbs,
        logged_at: log.logged_at,
      });
    });

    const { data: exerciseLogs } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', utcStart.toISOString())
      .lte('logged_at', utcEnd.toISOString());

    const totalCalories = foodLogs?.reduce((sum, item) => sum + item.calories, 0) || 0;
    const totalExerciseMinutes =
      exerciseLogs?.reduce((sum, item) => sum + item.duration_minutes, 0) || 0;
    const totalProtein = foodLogs?.reduce((sum, item) => sum + item.protein, 0) || 0;
    const totalFat = foodLogs?.reduce((sum, item) => sum + item.fat, 0) || 0;
    const totalCarbs = foodLogs?.reduce((sum, item) => sum + item.carbs, 0) || 0;

    return Response.json({
      totalCalories,
      remainingCalories: goals.daily_calories_target - totalCalories,
      totalExerciseMinutes,
      remainingExerciseMinutes: goals.daily_exercise_minutes_target - totalExerciseMinutes,
      remainingProtein: goals.daily_protein_target - totalProtein,
      remainingFat: goals.daily_fat_target - totalFat,
      remainingCarbs: goals.daily_carbs_target - totalCarbs,
    });
  } catch (error) {
    console.error('Error fetching daily status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
