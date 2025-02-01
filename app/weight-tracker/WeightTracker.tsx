'use client';

import { useState, useEffect, useCallback } from 'react';
import createSupabaseBrowserClient from '@/lib/supabse/client';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, LabelList, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveUpRight, MoveDownRight, ChevronLeft } from 'lucide-react';
import MainLoading from '../Mainloading';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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

export default function WeightTracker({ currentUser_id }: { currentUser_id: string }) {
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
  const router = useRouter();

  const fetchWeightRecords = useCallback(async () => {
    if (!currentUser_id) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const [weightResponse, goalResponse] = await Promise.all([
        supabase
          .from('weight_tracking')
          .select('weight, created_at')
          .eq('user_id', currentUser_id)
          .gte('created_at', startDate.toISOString())
          .order('created_at'),
        supabase
          .from('fitness_goals')
          .select('target_weight')
          .eq('user_id', currentUser_id)
          .eq('status', 'active')
          .single(),
      ]);

      if (weightResponse.error) throw weightResponse.error;
      const data = weightResponse.data;

      if (goalResponse.data) {
        setTargetWeight(goalResponse.data.target_weight);
      }

      if (data) {
        const dates = Array.from({ length: 7 }, (_, i) => {
          const today = new Date();
          const d = new Date(today);
          d.setDate(today.getDate() - (6 - i));
          const kstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
          return kstDate.toISOString().split('T')[0];
        });

        const groupedByDate = data.reduce((acc: { [key: string]: WeightRecord[] }, record) => {
          const kstDate = new Date(new Date(record.created_at).getTime() + 9 * 60 * 60 * 1000);
          const dateStr = kstDate.toISOString().split('T')[0];

          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(record);
          return acc;
        }, {});

        const processedData = dates.map((date) => {
          if (groupedByDate[date]) {
            const latestRecord = groupedByDate[date].reduce((latest, current) =>
              new Date(current.created_at) > new Date(latest.created_at) ? current : latest
            );

            return {
              date,
              weight: latestRecord.weight,
            };
          }

          const previousDate = dates
            .slice(0, dates.indexOf(date))
            .reverse()
            .find((d) => groupedByDate[d]);

          if (previousDate) {
            const latestPreviousRecord = groupedByDate[previousDate].reduce((latest, current) =>
              new Date(current.created_at) > new Date(latest.created_at) ? current : latest
            );
            return {
              date,
              weight: latestPreviousRecord.weight,
            };
          }

          const nextDate = dates.slice(dates.indexOf(date) + 1).find((d) => groupedByDate[d]);

          if (nextDate) {
            const earliestNextRecord = groupedByDate[nextDate].reduce((earliest, current) =>
              new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
            );
            return {
              date,
              weight: earliestNextRecord.weight,
            };
          }

          return {
            date,
            weight: data[0]?.weight || 0,
          };
        });

        setChartData(processedData);

        if (processedData.length >= 2) {
          const firstWeight = processedData[0].weight;
          const lastWeight = processedData[processedData.length - 1].weight;
          const weightChange = ((lastWeight - firstWeight) / firstWeight) * 100;

          setWeightTrend({
            direction: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable',
            percentage: Math.abs(weightChange),
          });
        }

        const lastDate = dates[dates.length - 1];
        if (groupedByDate[lastDate]) {
          const latestRecord = groupedByDate[lastDate].reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest
          );
          setLastRecord(latestRecord);
        } else {
          const lastRecordDate = [...dates].reverse().find((d) => groupedByDate[d]);
          if (lastRecordDate) {
            const latestRecord = groupedByDate[lastRecordDate].reduce((latest, current) =>
              new Date(current.created_at) > new Date(latest.created_at) ? current : latest
            );
            setLastRecord(latestRecord);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }, [currentUser_id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !currentUser_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('weight_tracking').upsert({
        user_id: currentUser_id,
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
    return <MainLoading />;
  }

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6">
      {/* <div className="w-full h-8  flex items-center justify-between">
        <button className="w-6 h-6 flex items-center justify-center" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-lg font-semibold">체중</p>
        <button className="w-6 h-6 flex items-center justify-center"></button>
      </div> */}
      <Card className="p-4">
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
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white p-6 rounded disabled:bg-gray-400"
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </Button>
            {/* <Button className="w-full p-6" variant={'outline'} onClick={() => router.back()}>
              뒤로가기
            </Button> */}
          </div>
        </form>
      </Card>
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>체중 변화 추이</CardTitle>
          <CardDescription></CardDescription>
          <div className="flex flex-col items-start text-sm mt-4">
            <div className="text-lg flex gap-2 font-medium tracking-tighter">
              {weightTrend.direction !== 'stable' && (
                <>
                  이번 주 {weightTrend.percentage.toFixed(1)}%
                  {weightTrend.direction === 'up' ? '증가' : '감소'}
                  <p>
                    {weightTrend.direction === 'up' ? (
                      <MoveUpRight className="h-6 w-6 text-rose-600 font-bold" />
                    ) : (
                      <MoveDownRight className="h-6 w-6 text-blue-600 font-bold" />
                    )}
                  </p>
                </>
              )}
            </div>

            <p className="text-rose-600">
              <span className="text-2xl font-bold">{targetWeight}</span>
              kg <span className="text-gray-400">(★=목표체중)</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={setContainerRef} className="w-full h-[240px]">
            {containerRef && lastRecord && (
              <LineChart
                width={Math.min(containerWidth, 500)}
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
                    className="-ml-2"
                    label={{
                      position: 'right',
                      value: `★`,
                      style: {
                        fontSize: '16px',
                        fill: '#e11d48',
                        letterSpacing: '-0.1em',
                        zIndex: 50,
                        transform: 'translateX(-4px)',
                      },
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    if (!props) return <circle cx={0} cy={0} r={4} fill="hsl(var(--primary))" />;

                    const today = new Date();
                    const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0];
                    const isToday = props.payload?.date === kstToday;

                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={isToday ? 'rgb(225 29 72)' : 'hsl(var(--primary))'}
                      />
                    );
                  }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="weight"
                    position="top"
                    offset={12}
                    content={({ x, y, value, payload }: any) => {
                      const valueIndex = chartData.findIndex((item) => item.weight === value);
                      const currentDate = chartData[valueIndex]?.date;

                      const today = new Date();
                      const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0];

                      const isToday = currentDate === kstToday;

                      return (
                        <text
                          x={x}
                          y={y}
                          dy={-12}
                          textAnchor="middle"
                          fill={isToday ? 'rgb(225 29 72)' : 'black'}
                          fontSize={isToday ? '16px' : '12px'}
                          fontWeight={isToday ? 'bold' : 'normal'}
                          letterSpacing="-0.05em"
                        >
                          {value.toFixed(1)}
                        </text>
                      );
                    }}
                  />
                </Line>
              </LineChart>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
