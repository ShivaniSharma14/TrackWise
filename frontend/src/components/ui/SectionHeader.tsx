import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Extra bottom margin when used inside a padded panel */
  inset?: boolean;
}

export default function SectionHeader({
  title,
  description,
  action,
  className = '',
  inset = false,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-3 ${inset ? 'mb-6' : ''} ${className}`.trim()}
    >
      <div className="min-w-0">
        <h3 className="section-title">{title}</h3>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
