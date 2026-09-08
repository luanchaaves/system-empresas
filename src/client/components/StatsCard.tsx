import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  accentGradient?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-400',
  accentGradient = 'from-brand-600/20 to-purple-600/10',
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 card-glass card-glass-hover">
      {/* Decorative background glow */}
      <div
        className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-br ${accentGradient} blur-2xl pointer-events-none opacity-40`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
