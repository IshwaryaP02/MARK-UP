import React, { useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceTrendPoint } from '../../services/attendanceService';
import { ChartCard, ChartBadge, ChartState } from './ChartCard';

export type AttendanceGraphPoint = AttendanceTrendPoint;

interface AttendanceGraphCardProps {
  title: string;
  subtitle?: string;
  data: AttendanceTrendPoint[];
  icon?: LucideIcon;
  threshold?: number;
  loading?: boolean;
  emptyMessage?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: AttendanceTrendPoint }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
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

export const AttendanceGraphCard: React.FC<AttendanceGraphCardProps> = ({
  title,
  subtitle,
  data,
  icon: Icon,
  threshold = 75,
  loading = false,
  emptyMessage = 'Attendance data will appear here once data is available.'
}) => {
  const gradientId = 'attendanceGrad-' + useId().replace(/[^a-zA-Z0-9]/g, '');
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
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} interval={0} />
              <YAxis stroke="#9CA3AF" fontSize={11} domain={[0, 100]} tickLine={false} unit="%" width={42} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeDasharray: '4 4' }} />
              <ReferenceLine y={threshold} stroke="#9CA3AF" strokeDasharray="6 3" />
              <Area
                type="monotone"
                dataKey="pct"
                name="Attendance"
                stroke="var(--accent)"
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartState>
    </ChartCard>
  );
};