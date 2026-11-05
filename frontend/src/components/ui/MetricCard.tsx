import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Panel from './Panel';
import ProgressBar from './ProgressBar';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  progress?: number;
  badge?: string;
  icon?: LucideIcon;
  valueSize?: 'md' | 'lg';
  padding?: 'sm' | 'md';
  className?: string;
}

const valueSizeClasses = {
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

export default function MetricCard({
  label,
  value,
  footer,
  progress,
  badge,
  icon: Icon,
  valueSize = 'md',
  padding = 'md',
  className = '',
}: MetricCardProps) {
  return (
    <Panel padding={padding} className={`relative flex h-full min-h-[148px] flex-col overflow-hidden ${className}`}>
      <div className="flex justify-between items-start gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon size={16} />
          </span>
        )}
        {badge && <span className="badge-accent">{badge}</span>}
      </div>
      <p
        className={`mt-2 min-w-0 break-words font-semibold leading-tight text-text-primary tabular-nums tracking-tight ${valueSizeClasses[valueSize]}`}
      >
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-auto pt-5">
          <ProgressBar value={progress} />
        </div>
      )}
      {footer && (
        <div className={`text-xs text-text-muted ${progress !== undefined ? 'mt-2' : 'mt-auto pt-4'}`}>{footer}</div>
      )}
    </Panel>
  );
}
