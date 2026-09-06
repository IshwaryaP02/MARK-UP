import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceHeatmapCell, HeatmapCellStatus } from '../../services/attendanceService';
import { ChartCard, ChartState } from './ChartCard';

interface AttendanceHeatmapProps {
  title: string;
  subtitle?: string;
  data: AttendanceHeatmapCell[];
  year: number;
  /** 1-based month (1 = January). */
  month: number;
  icon?: LucideIcon;
  loading?: boolean;
  emptyMessage?: string;
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STATUS_STYLES: Record<HeatmapCellStatus, { bg: string; text: string; label: string }> = {
  present: { bg: '#22C55E', text: '#FFFFFF', label: 'Present' },
  late: { bg: '#86EFAC', text: '#14532D', label: 'Late' },
  od: { bg: '#3B82F6', text: '#FFFFFF', label: 'On Duty' },
  leave: { bg: '#A1A1AA', text: '#18181B', label: 'Leave' },
  holiday: { bg: '#52525B', text: '#FFFFFF', label: 'Holiday' },
  absent: { bg: '#EF4444', text: '#FFFFFF', label: 'Absent' },
  none: { bg: 'transparent', text: '#A1A1AA', label: 'No Record' }
};

interface GridCell {
  key: string;
  day?: number;
  status?: HeatmapCellStatus;
  leading?: boolean;
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  title,
  subtitle,
  data,
  year,
  month,
  icon: Icon,
  loading = false,
  emptyMessage = 'Attendance data will appear here once data is available.'
}) => {
  const byDay = new Map<number, AttendanceHeatmapCell>();
  for (const cell of data) byDay.set(cell.day, cell);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const grid: GridCell[] = [];
  for (let i = 0; i < firstWeekday; i++) grid.push({ key: `lead-${i}`, leading: true });
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push({ key: `day-${day}`, day, status: byDay.get(day)?.status });
  }

  const legendStatuses = ['present', 'late', 'od', 'leave', 'absent'] as HeatmapCellStatus[];
  const presentDays = data.filter((c) => c.status === 'present' || c.status === 'late' || c.status === 'od').length;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      icon={Icon}
      badge={
        data.length > 0 ? (
          <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50">
            {presentDays} present days
          </span>
        ) : undefined
      }
    >
      <ChartState loading={loading} dataCount={data.length} emptyMessage={emptyMessage} height="h-64">
        <div className="h-64 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-2 text-right">
              {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_HEADERS.map((label, index) => (
                <div key={`h-${index}`} className="text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase pb-1">
                  {label}
                </div>
              ))}
              {grid.map((cell) => {
                if (cell.leading) {
                  return <div key={cell.key} className="aspect-square" />;
                }
                const style = STATUS_STYLES[cell.status || 'none'];
                return (
                  <div
                    key={cell.key}
                    title={`${cell.day} — ${style.label}`}
                    className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors"
                    style={{
                      backgroundColor: style.bg,
                      color: style.text,
                      borderColor: 'var(--border)'
                    }}
                  >
                    {style.bg === 'transparent' ? '' : cell.day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
            {legendStatuses.map((status) => (
              <span key={status} className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_STYLES[status].bg }} />
                {STATUS_STYLES[status].label}
              </span>
            ))}
          </div>
        </div>
      </ChartState>
    </ChartCard>
  );
};