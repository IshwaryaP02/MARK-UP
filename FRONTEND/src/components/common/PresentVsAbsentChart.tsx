import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceDualSeriesPoint } from '../../services/attendanceService';
import { ChartCard, ChartState } from './ChartCard';

interface PresentVsAbsentChartProps {
  title: string;
  subtitle?: string;
  data: AttendanceDualSeriesPoint[];
  icon?: LucideIcon;
  loading?: boolean;
  emptyMessage?: string;
}

interface DualTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
}

const DualTooltip: React.FC<DualTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const label = payload[0]?.name || '';
  return (
    <div className="bg-[#080C14] dark:bg-[#0A0A0A] border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="font-mono" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

/** Present vs Absent grouped bars — GREEN #22C55E = Present, RED #EF4444 = Absent. */
export const PresentVsAbsentChart: React.FC<PresentVsAbsentChartProps> = ({
  title,
  subtitle,
  data,
  icon: Icon,
  loading = false,
  emptyMessage = 'Attendance data will appear here once data is available.'
}) => {
  return (
    <ChartCard title={title} subtitle={subtitle} icon={Icon}>
      <ChartState loading={loading} dataCount={data.length} emptyMessage={emptyMessage} height="h-64">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} interval={0} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} width={42} />
              <Tooltip content={<DualTooltip />} cursor={{ fill: 'var(--accent)', fillOpacity: 0.08 }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
              />
              <Bar dataKey="present" name="Present" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={16} />
              <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartState>
    </ChartCard>
  );
};