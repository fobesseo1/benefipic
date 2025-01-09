// /app/api/food-status/route.ts
import { createSupabaseServerClient, getUser } from '@/lib/supabse/server';
import { getKoreanDateRange } from '@/lib/utils/dateAudit';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const currentUser = await getUser();
  const userId = currentUser?.id;

  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date');
  const selectedDate = dateStr ? new Date(dateStr) : new Date();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { utcStart, utcEnd } = getKoreanDateRange(selectedDate);

  try {
    // 1. Get active goals
    const { data: goals } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!goals) {
      return Response.json({ error: 'No active goals found' }, { status: 404 });
    }

    // 2. Get food logs
    const { data: foodLogs } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', utcStart.toISOString())
      .lte('logged_at', utcEnd.toISOString())
      .order('logged_at', { ascending: false });

    // 3. Calculate food-related totals
    const totalCalories = foodLogs?.reduce((sum, item) => sum + item.calories, 0) || 0;
    const totalProtein = foodLogs?.reduce((sum, item) => sum + item.protein, 0) || 0;
    const totalFat = foodLogs?.reduce((sum, item) => sum + item.fat, 0) || 0;
    const totalCarbs = foodLogs?.reduce((sum, item) => sum + item.carbs, 0) || 0;

    // 4. Return response
    return Response.json({
      status: {
        totalCalories: goals.daily_calories_target,
        dailyProteinTarget: goals.daily_protein_target,
        dailyFatTarget: goals.daily_fat_target,
        dailyCarbsTarget: goals.daily_carbs_target,
        consumedCalories: totalCalories,
        consumedProtein: totalProtein,
        consumedFat: totalFat,
        consumedCarbs: totalCarbs,
      },
      foodLogs: foodLogs || [],
    });
    
  } catch (error) {
    console.error('Error fetching food status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}