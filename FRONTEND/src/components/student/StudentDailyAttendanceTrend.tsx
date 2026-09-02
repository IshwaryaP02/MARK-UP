import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { CalendarRange } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AttendanceRecord } from '../../types';
import { ChartCard, ChartState } from '../common/ChartCard';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const PRESENT_STATUSES = ['present', 'late', 'od'] as const;

interface DailyPoint {
  name: string;
  pct: number | null;
  presentCount: number | null;
  absentCount: number | null;
}

function isoToDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mondayOf(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyPoint }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#080C14] dark:bg-[#0A0A0A] border border-zinc-700 rounded-2xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{point.name}</p>
      {point.pct === null ? (
        <p className="text-zinc-400 font-mono">No attendance recorded</p>
      ) : (
        <>
          <p className="text-white font-mono font-bold">{point.pct}%</p>
          <p className="text-emerald-400 font-mono mt-0.5">Present: {point.presentCount}</p>
          <p className="text-rose-400 font-mono">Absent: {point.absentCount}</p>
        </>
      )}
    </div>
  );
};

export const StudentDailyAttendanceTrend: React.FC = () => {
  const { currentUser, attendanceRecords } = useApp();
  const studentId = currentUser.id;

  const data = useMemo<DailyPoint[]>(() => {
    const studentRecords = attendanceRecords.filter((r) =>
      r.entries.some((e) => e.studentId === studentId)
    );
    if (studentRecords.length === 0) return [];

    const latestDate = studentRecords.reduce<string>(
      (max, r) => (r.date > max ? r.date : max),
      studentRecords[0].date
    );
    const latest = isoToDate(latestDate);
    const weekStart = mondayOf(latest);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartIso = toIso(weekStart);
    const weekEndIso = toIso(weekEnd);

    const inWeek = studentRecords.filter((r) => r.date >= weekStartIso && r.date <= weekEndIso);
    if (inWeek.length === 0) return [];

    const buckets = new Map<string, { present: number; absent: number }>();
    for (const r of inWeek) {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][isoToDate(r.date).getDay()];
      if (!(WEEKDAYS as readonly string[]).includes(dayName)) continue;
      const e = r.entries.find((x) => x.studentId === studentId);
      if (!e) continue;
      const cur = buckets.get(dayName) || { present: 0, absent: 0 };
      if ((PRESENT_STATUSES as readonly string[]).includes(e.status)) cur.present++;
      else cur.absent++;
      buckets.set(dayName, cur);
    }

    return WEEKDAYS.map((d, dayIdx) => {
      const b = buckets.get(d);
      return {
        name: DAY_NAMES[dayIdx] ?? d,
        pct:
          b && b.present + b.absent > 0
            ? Math.round((b.present / (b.present + b.absent)) * 100)
            : null,
        presentCount: b ? b.present : null,
        absentCount: b ? b.absent : null
      };
    });
  }, [attendanceRecords, studentId]);

  const gradientId = 'studentDailyGrad';

  return (
    <ChartCard
      title="Daily Attendance Trend"
      subtitle="Your weekly average attendance percentage"
      icon={CalendarRange}
    >
      <ChartState
        loading={false}
        dataCount={data.length}
        emptyMessage="No attendance records found for you in the current week yet."
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415130" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                interval={0}
                minTickGap={0}
                tickMargin={10}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                domain={[70, 100]}
                ticks={[100, 94, 86, 78, 70]}
                tickLine={false}
                width={46}
                tickMargin={8}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeDasharray: '4 4' }} />
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