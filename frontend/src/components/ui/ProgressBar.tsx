interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({ value, showLabel = false, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-1 rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className="h-full fill-primary-muted rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
