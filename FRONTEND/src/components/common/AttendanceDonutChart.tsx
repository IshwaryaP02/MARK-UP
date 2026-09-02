import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceDonutSlice } from '../../services/attendanceService';
import { ChartCard, ChartState } from './ChartCard';

interface AttendanceDonutChartProps {
  title: string;
  subtitle?: string;
  data: AttendanceDonutSlice[];
  icon?: LucideIcon;
  loading?: boolean;
  emptyMessage?: string;
  /** Center label inside the donut (defaults to "Attendance"). */
  centerLabel?: string;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: AttendanceDonutSlice }>;
}

const DonutTooltip: React.FC<DonutTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-[#080C14] dark:bg-[#0A0A0A] border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="text-white font-mono font-bold">{item.value}</p>
      <p className="text-white/70 mt-0.5">{item.name}</p>
    </div>
  );
};

export const AttendanceDonutChart: React.FC<AttendanceDonutChartProps> = ({
  title,
  subtitle,
  data,
  icon: Icon,
  loading = false,
  emptyMessage = 'Attendance data will appear here once data is available.',
  centerLabel = 'Attendance'
}) => {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const hasValue = total > 0;

  return (
    <ChartCard title={title} subtitle={subtitle} icon={Icon}>
      <ChartState loading={loading} dataCount={data.length} emptyMessage={emptyMessage} height="h-64">
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((slice, index) => (
                    <Cell key={`cell-${index}`} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
                {hasValue ? total : '—'}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{centerLabel}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            {data.map((slice) => (
              <div
                key={slice.name}
                className="p-3 rounded-2xl flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{slice.value}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{slice.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartState>
    </ChartCard>
  );
};