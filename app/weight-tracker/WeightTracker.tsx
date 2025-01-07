'use client';

import { useState, useEffect, useCallback } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { useUserStore } from '../store/userStore';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, LabelList } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

      console.log('조회 시작 날짜:', startDate.toISOString());

      const { data, error } = await supabase
        .from('weight_tracking')
        .select('weight, created_at')
        .eq('user_id', currentUser.currentUser.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (error) throw error;

      if (data) {
        console.log('서버에서 받은 데이터:', data);

        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() + 9);
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          return date.toISOString().split('T')[0];
        });

        console.log('생성된 날짜 배열:', dates);

        const processedData = dates.map((date) => {
          // 현재 날짜의 기록 찾기
          const record = data.find((r) => {
            const recordDate = new Date(r.created_at);
            recordDate.setHours(recordDate.getHours() + 9);
            const recordDateStr = recordDate.toISOString().split('T')[0];
            return recordDateStr === date;
          });

          // 해당 날짜의 기록이 있으면 그 값을 사용
          if (record) {
            return {
              date,
              weight: record.weight,
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
            // 가장 최근 날짜의 기록 사용
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
            // 가장 빠른 날짜의 기록 사용
            nextRecords.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return {
              date,
              weight: nextRecords[0].weight,
            };
          }

          // 아무 기록도 없는 경우 (이전/이후 모두)
          return {
            date,
            weight: data[0]?.weight || 0, // 첫 번째 기록의 값을 사용하거나 0
          };
        });

        console.log('최종 처리된 데이터:', processedData);
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
      console.error('Error fetching weight records:', error);
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
    return <div className="max-w-md mx-auto p-4">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>체중 변화 추이</CardTitle>
          <CardDescription>최근 7일간의 체중 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={setContainerRef} className="w-full h-[300px]">
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
                  domain={[Math.floor(lastRecord.weight - 5), Math.ceil(lastRecord.weight + 5)]}
                  hide
                />
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
                    formatter={(value: number) => value}
                    style={{
                      fontSize: '14px',
                      letterSpacing: '-0.05em',
                      fontWeight: 'bold',
                    }}
                  />
                </Line>
              </LineChart>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none tracking-tighter">
            {weightTrend.direction !== 'stable' && (
              <>
                {weightTrend.direction === 'up' ? '증가' : '감소'}:{' '}
                {weightTrend.percentage.toFixed(1)}% 이번 주
                {weightTrend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-primary" />
                )}
              </>
            )}
          </div>
          <div className="leading-none text-muted-foreground">
            최근 7일간의 체중 변화를 보여줍니다
          </div>
        </CardFooter>
      </Card>

      {lastRecord && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">최근 기록</h3>
          <p>체중: {lastRecord.weight}kg</p>
          <p>날짜: {new Date(lastRecord.created_at).toLocaleDateString()}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium mb-1">
            오늘의 체중 (kg)
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
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  );
}
