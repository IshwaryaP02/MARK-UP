import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color?: 'purple' | 'indigo' | 'periwinkle' | 'emerald' | 'amber' | 'rose' | 'sky';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  trend = 'neutral',
  subtitle,
  color = 'purple',
  onClick
}) => {
  const unifiedTheme = {
    cardBg: 'bg-[#1E40AF]/20 dark:bg-[#0A0A0A]',
    border: 'border-[#1E40AF]/40 dark:border-[#232326]',
    iconBox: 'bg-[#1E40AF] text-[#111827] dark:bg-[#2563EB] dark:text-[#FFFFFF]',
  };

  const theme = unifiedTheme;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`${theme.cardBg} ${theme.border} border rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:scale-[1.01] group' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">
              {value}
            </span>
            {change && (
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1E40AF]/15 dark:bg-[#2563EB]/20 text-[#1E40AF] dark:text-[#3B82F6]">
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 font-medium">{subtitle}</p>}
        </div>

        <div className={`p-2.5 rounded-2xl ${theme.iconBox} shadow-sm shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
