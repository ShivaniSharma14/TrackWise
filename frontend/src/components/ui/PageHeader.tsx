import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** Use h1 on full pages, h2 when duplicated in app chrome */
  headingLevel?: 1 | 2;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
  headingLevel = 1,
}: PageHeaderProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  if (actions) {
    return (
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
        <div>
          <Heading className="page-title">{title}</Heading>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">{actions}</div>
      </div>
    );
  }

  return (
    <header className={className}>
      <Heading className="page-title">{title}</Heading>
      {subtitle && <p className="page-subtitle mt-1">{subtitle}</p>}
    </header>
  );
}
