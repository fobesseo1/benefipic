'use client';

import { useState, useEffect, useCallback } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { useUserStore } from '../store/userStore';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, LabelList, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MoveUpRight, MoveDownRight, LoaderCircle } from 'lucide-react';

interface WeightRecord {
  weight: number;
  created_at: string;
}

interface ChartData {
  date: string;
  weight: number;
}

interface ResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  target: Element;
}

function useResizeObserver(element: HTMLElement | null) {
  const [size, setSize] = useState<DOMRectReadOnly>();

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      setSize(entries[0].contentRect);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return size;
}

export default function WeightTracker() {
  const supabase = createSupabaseBrowserClient();
  const [weight, setWeight] = useState<string>('');
  const [lastRecord, setLastRecord] = useState<WeightRecord | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [weightTrend, setWeightTrend] = useState<{
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  }>({ direction: 'stable', percentage: 0 });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const containerWidth = useResizeObserver(containerRef)?.width ?? 500;
  const currentUser = useUserStore();

  const fetchWeightRecords = useCallback(async () => {
    if (!currentUser.currentUser?.id) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(startDate.getHours() + 9);
      startDate.setHours(0, 0, 0, 0);

      // 체중 기록과 목표 체중을 동시에 가져오기
      const [weightResponse, goalResponse] = await Promise.all([
        supabase
          .from('weight_tracking')
          .select('weight, created_at')
          .eq('user_id', currentUser.currentUser.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at'),
        supabase
          .from('fitness_goals')
          .select('target_weight')
          .eq('user_id', currentUser.currentUser.id)
          .eq('status', 'active')
          .single(),
      ]);

      if (weightResponse.error) throw weightResponse.error;
      const data = weightResponse.data;

      if (goalResponse.data) {
        setTargetWeight(goalResponse.data.target_weight);
        console.log('목표 체중:', goalResponse.data.target_weight);
      }

      if (data) {
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() + 9);
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          return date.toISOString().split('T')[0];
        });

        const processedData = dates.map((date) => {
          // 해당 날짜의 모든 기록 찾기
          const dayRecords = data.filter((r) => {
            const recordDate = new Date(r.created_at);
            recordDate.setHours(recordDate.getHours() + 9);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === date;
          });

          // 해당 날짜의 기록이 있으면, 가장 최근 시간의 기록 사용
          if (dayRecords.length > 0) {
            const latestRecord = dayRecords.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            return {
              date,
              weight: latestRecord.weight,
            };
          }

          // 해당 날짜의 기록이 없으면 이전 날짜들의 기록 중 가장 최근 값 사용
          const previousRecords = data.filter((r) => {
            const recordDate = new Date(r.created_at);
            recordDate.setHours(recordDate.getHours() + 9);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr < date;
          });

          if (previousRecords.length > 0) {
            previousRecords.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            return {
              date,
              weight: previousRecords[0].weight,
            };
          }

          // 이전 기록도 없으면 이후 날짜들의 기록 중 가장 빠른 값 사용
          const nextRecords = data.filter((r) => {
            const recordDate = new Date(r.created_at);
            recordDate.setHours(recordDate.getHours() + 9);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr > date;
          });

          if (nextRecords.length > 0) {
            nextRecords.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return {
              date,
              weight: nextRecords[0].weight,
            };
          }

          return {
            date,
            weight: data[0]?.weight || 0,
          };
        });

        setChartData(processedData);

        if (data.length >= 2) {
          const firstWeight = data[0].weight;
          const lastWeight = data[data.length - 1].weight;
          const weightChange = ((lastWeight - firstWeight) / firstWeight) * 100;

          setWeightTrend({
            direction: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable',
            percentage: Math.abs(weightChange),
          });
        }

        const latestRecord = data[data.length - 1];
        if (latestRecord) {
          setLastRecord(latestRecord);
        }
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }, [currentUser.currentUser?.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !currentUser.currentUser?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('weight_tracking').upsert({
        user_id: currentUser.currentUser.id,
        weight: parseFloat(weight),
      });

      if (error) throw error;
      await fetchWeightRecords();
      setWeight('');
    } catch (error) {
      console.error('Error saving weight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightRecords().finally(() => setIsInitialLoading(false));
  }, [fetchWeightRecords]);

  if (isInitialLoading) {
    return (
      <div className="max-w-md h-screen mx-auto p-4  flex items-center justify-center gap-2">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <p className="text-xl">Processing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-6 flex flex-col gap-6">
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>체중 변화 추이</CardTitle>
          <CardDescription></CardDescription>
          <div className="flex flex-col items-start gap-1 text-sm mt-4">
            <div className="text-lg flex gap-2 font-medium tracking-tighter">
              {weightTrend.direction !== 'stable' && (
                <>
                  이번 주 {weightTrend.percentage.toFixed(1)}%
                  {weightTrend.direction === 'up' ? '증가' : '감소'}
                  <p>
                    {weightTrend.direction === 'up' ? (
                      <MoveUpRight className="h-6 w-6 text-red-600 font-bold" />
                    ) : (
                      <MoveDownRight className="h-6 w-6 text-blue-600 font-bold" />
                    )}
                  </p>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground ">
              최근 7일간의 체중 변화를 보여줍니다
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={setContainerRef} className="w-full h-[240px]">
            {containerRef && lastRecord && (
              <LineChart
                width={Math.min(containerWidth - 16, 500)}
                height={300}
                data={chartData}
                margin={{ top: 20, left: 16, right: 16, bottom: 20 }}
              >
                <CartesianGrid vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  height={50}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    date.setHours(date.getHours() + 9);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval={0}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[
                    Math.min(
                      Math.floor(lastRecord.weight - 5),
                      targetWeight ? targetWeight - 1 : 0
                    ),
                    Math.max(Math.ceil(lastRecord.weight + 5), targetWeight ? targetWeight + 1 : 0),
                  ]}
                  hide
                />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#dc2626"
                    strokeDasharray="3 3"
                    label={{
                      position: 'top',
                      value: `< 목표: ${targetWeight}kg >`,
                      style: {
                        fontSize: '14px',
                        fill: '#dc2626',
                        letterSpacing: '-0.05em',
                      },
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    formatter={(value: number) => Number(value.toFixed(1))}
                    style={{
                      fontSize: '16px',
                      letterSpacing: '-0.05em',
                      fontWeight: 'bold',
                    }}
                  />
                </Line>
              </LineChart>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium mb-1">
            오늘의 체중 입력 (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="20"
            max="300"
            step="0.1"
            className="w-full p-2 border rounded"
            placeholder="체중을 입력하세요"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-800 text-white p-2 py-4 rounded disabled:bg-gray-400"
        >
          {isLoading ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  );
}
