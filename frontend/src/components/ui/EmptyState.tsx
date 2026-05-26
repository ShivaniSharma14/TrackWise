import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center ${className}`.trim()}>
      <p className="text-sm text-text-primary font-medium">{title}</p>
      {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
