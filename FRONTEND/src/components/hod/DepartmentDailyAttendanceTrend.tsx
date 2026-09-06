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

function countsOf(r: AttendanceRecord): { present: number; absent: number } {
  let present = 0;
  let absent = 0;
  for (const e of r.entries) {
    if ((PRESENT_STATUSES as readonly string[]).includes(e.status)) present++;
    else absent++;
  }
  return { present, absent };
}

function pctOf(present: number, absent: number): number {
  const total = present + absent;
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyPoint }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#0A0A0A] border border-[#232326] rounded-2xl px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{point.name}</p>
      {point.pct === null ? (
        <p className="text-[#A1A1AA] font-mono">No attendance recorded</p>
      ) : (
        <>
          <p className="text-white font-mono font-bold">{point.pct}%</p>
          <p className="text-[#22C55E] font-mono mt-0.5">Present: {point.presentCount}</p>
          <p className="text-[#EF4444] font-mono">Absent: {point.absentCount}</p>
        </>
      )}
    </div>
  );
};

export const DepartmentDailyAttendanceTrend: React.FC = () => {
  const { currentUser, attendanceRecords } = useApp();
  const departmentId = currentUser.departmentId || 'dept-cs';

  const data = useMemo<DailyPoint[]>(() => {
    const deptRecords = attendanceRecords.filter(
      (r) => r.departmentId === departmentId || !r.departmentId
    );
    if (deptRecords.length === 0) return [];

    const latestDate = deptRecords.reduce<string>(
      (max, r) => (r.date > max ? r.date : max),
      deptRecords[0].date
    );
    const latest = isoToDate(latestDate);
    const weekStart = mondayOf(latest);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartIso = toIso(weekStart);
    const weekEndIso = toIso(weekEnd);

    const inWeek = deptRecords.filter((r) => r.date >= weekStartIso && r.date <= weekEndIso);
    if (inWeek.length === 0) return [];

    const buckets = new Map<string, { present: number; absent: number }>();
    for (const r of inWeek) {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][isoToDate(r.date).getDay()];
      if (!(WEEKDAYS as readonly string[]).includes(dayName)) continue;
      const cur = buckets.get(dayName) || { present: 0, absent: 0 };
      const c = countsOf(r);
      cur.present += c.present;
      cur.absent += c.absent;
      buckets.set(dayName, cur);
    }

    return WEEKDAYS.map((d, dayIdx) => {
      const b = buckets.get(d);
      return {
        name: DAY_NAMES[dayIdx] ?? d,
        pct: b ? pctOf(b.present, b.absent) : null,
        presentCount: b ? b.present : null,
        absentCount: b ? b.absent : null
      };
    });
  }, [attendanceRecords, departmentId]);

  const gradientId = 'deptDailyGrad';

  return (
    <ChartCard
      title="Department Daily Attendance Trend"
      subtitle="Weekly average student attendance percentages"
      icon={CalendarRange}
    >
      <ChartState
        loading={false}
        dataCount={data.length}
        emptyMessage="No department attendance records found for the current week yet."
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#232326" />
              <XAxis
                dataKey="name"
                stroke="#A1A1AA"
                fontSize={11}
                tickLine={false}
                interval={0}
                minTickGap={0}
                tickMargin={10}
              />
              <YAxis
                stroke="#A1A1AA"
                fontSize={11}
                domain={[70, 100]}
                ticks={[100, 94, 86, 78, 70]}
                tickLine={false}
                width={46}
                tickMargin={8}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#2563EB', strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="pct"
                name="Attendance"
                stroke="#2563EB"
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
