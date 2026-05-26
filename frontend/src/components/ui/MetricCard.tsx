import { ReactNode } from 'react';
import Panel from './Panel';
import ProgressBar from './ProgressBar';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  progress?: number;
  badge?: string;
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
  valueSize = 'md',
  padding = 'md',
  className = '',
}: MetricCardProps) {
  return (
    <Panel padding={padding} className={className}>
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        {badge && <span className="badge-accent">{badge}</span>}
      </div>
      <p
        className={`mt-2 font-semibold text-text-primary tabular-nums tracking-tight ${valueSizeClasses[valueSize]}`}
      >
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-4">
          <ProgressBar value={progress} />
        </div>
      )}
      {footer && (
        <div className={`text-xs text-text-muted ${progress !== undefined ? 'mt-2' : 'mt-4'}`}>{footer}</div>
      )}
    </Panel>
  );
}
