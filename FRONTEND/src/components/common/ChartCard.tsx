import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Optional element rendered at the top-right of the card header. */
  badge?: ReactNode;
  height?: string;
  children: ReactNode;
}

/**
 * Shared shell for every attendance chart card. Matches the existing
 * dashboard card design exactly; chart card borders use `var(--border)`.
 */
export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  children
}) => {
  return (
    <div
      className="bg-white dark:bg-[#0A0A0A] border rounded-[28px] p-6 shadow-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
};

export interface ChartBadgeProps {
  label: string;
  tone: 'good' | 'bad';
}

/** Small "Avg xx%" pill used on percentage charts. */
export const ChartBadge: React.FC<ChartBadgeProps> = ({ label, tone }) => (
  <span
    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
      tone === 'good'
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
        : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
    }`}
  >
    {label}
  </span>
);

export interface ChartStateProps {
  height?: string;
  message?: string;
}

export const ChartLoading: React.FC<ChartStateProps> = ({ height = 'h-64' }) => (
  <div
    className={`${height} flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 text-center px-4`}
  >
    <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-[#1E40AF] dark:border-t-[#3B82F6] animate-spin" />
    Loading attendance data&hellip;
  </div>
);

export const ChartEmpty: React.FC<ChartStateProps> = ({
  height = 'h-64',
  message = 'Attendance data will appear here once data is available.'
}) => (
  <div className={`${height} flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 text-center px-4`}>
    {message}
  </div>
);

/** Renders loading, empty or the chart children depending on state. */
export const ChartState: React.FC<{
  loading?: boolean;
  dataCount: number;
  height?: string;
  emptyMessage?: string;
  children: ReactNode;
}> = ({ loading, dataCount, height, emptyMessage, children }) => {
  if (loading) return <ChartLoading height={height} />;
  if (dataCount === 0) return <ChartEmpty height={height} message={emptyMessage} />;
  return <>{children}</>;
};