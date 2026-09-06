import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceComparisonPoint } from '../../services/attendanceService';
import { ChartCard, ChartBadge, ChartState } from './ChartCard';

interface AttendanceBarChartProps {
  title: string;
  subtitle?: string;
  data: AttendanceComparisonPoint[];
  icon?: LucideIcon;
  threshold?: number;
  loading?: boolean;
  /** Color bars below the threshold red (#EF4444) — used for low-attendance charts. */
  highlightLow?: boolean;
  emptyMessage?: string;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: AttendanceComparisonPoint }>;
}

const BarTooltip: React.FC<BarTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#080C14] dark:bg-[#0A0A0A] border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{point.fullName || point.name}</p>
      <p className="text-white font-mono font-bold">{point.pct}%</p>
      <p className="text-emerald-400 font-mono mt-0.5">Present: {point.presentCount}</p>
      <p className="text-rose-400 font-mono">Absent: {point.absentCount}</p>
    </div>
  );
};

export const AttendanceBarChart: React.FC<AttendanceBarChartProps> = ({
  title,
  subtitle,
  data,
  icon: Icon,
  threshold = 75,
  loading = false,
  highlightLow = false,
  emptyMessage = 'Attendance data will appear here once data is available.'
}) => {
  const averagePct = data.length > 0 ? data.reduce((sum, p) => sum + p.pct, 0) / data.length : 0;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      icon={Icon}
      badge={
        data.length > 0 && (
          <ChartBadge
            label={`Avg ${averagePct.toFixed(1)}%`}
            tone={averagePct >= threshold ? 'good' : 'bad'}
          />
        )
      }
    >
      <ChartState loading={loading} dataCount={data.length} emptyMessage={emptyMessage} height="h-64">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} interval={0} />
              <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} tickLine={false} unit="%" width={42} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--accent)', fillOpacity: 0.08 }} />
              <ReferenceLine y={threshold} stroke="#9CA3AF" strokeDasharray="6 3" />
              <Bar dataKey="pct" name="Attendance" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {data.map((point, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={highlightLow && point.pct < threshold ? '#EF4444' : 'var(--accent)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartState>
    </ChartCard>
  );
};