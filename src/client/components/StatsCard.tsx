import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'yellow' | 'coral' | 'mint' | 'purple' | 'cyan' | 'default';
  trend?: string;
  trendPositive?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'purple',
  trend,
  trendPositive = true,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'yellow':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
          hoverBorder: 'hover:border-amber-300',
        };
      case 'coral':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
          hoverBorder: 'hover:border-rose-300',
        };
      case 'mint':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
          hoverBorder: 'hover:border-emerald-300',
        };
      case 'cyan':
        return {
          iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
          hoverBorder: 'hover:border-sky-300',
        };
      case 'purple':
      default:
        return {
          iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
          hoverBorder: 'hover:border-purple-300',
        };
    }
  };

  const { iconBg, hoverBorder } = getVariantStyles();

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all duration-200 flex flex-col justify-between ${hoverBorder}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </h3>
        
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span className={`font-bold px-1.5 py-0.5 rounded-md ${trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
