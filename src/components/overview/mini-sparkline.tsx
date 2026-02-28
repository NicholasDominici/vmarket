'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

type SparklineData = { symbol: string; closes: number[] };

export function MiniSparkline({ data }: { data: SparklineData }) {
  if (!data.closes.length) return null;

  const points = data.closes.map((v, i) => ({ v, i }));
  const isUp = data.closes[data.closes.length - 1] >= data.closes[0];

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={isUp ? '#3ecf8e' : '#f45b69'}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
