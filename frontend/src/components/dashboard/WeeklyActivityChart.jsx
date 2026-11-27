import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function WeeklyActivityChart({ data = [] }) {
  const chartData = data && data.length > 0 ? data : [];
  const chartMax = Math.max(60, ...chartData.map((item) => item.minutes || 0));
  const yTicks = chartMax <= 60
    ? [0, 15, 30, 45, 60]
    : [0, Math.round(chartMax / 3), Math.round((chartMax * 2) / 3), chartMax];

  return (
    <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
          <BarChart3 className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-base text-fitverse-dark">Weekly Activity</h3>
      </div>

      {/* Chart Canvas */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#766D80', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, chartMax]}
              ticks={yTicks}
              tickFormatter={(v) => `${v} min`}
              tick={{ fill: '#766D80', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(242, 232, 250, 0.4)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-[#E9D6F7] rounded-xl px-3 py-1.5 shadow-md">
                      <p className="text-xs font-bold text-fitverse-purple">{payload[0].value} minutes</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="minutes"
              fill="#D6B8F6"
              radius={[6, 6, 0, 0]}
              barSize={18}
              className="hover:fill-[#A875D5] transition-colors duration-200"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

