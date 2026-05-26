import { ReactNode } from 'react';
import Panel from './Panel';
import SectionHeader from './SectionHeader';

interface PanelSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Skip default horizontal padding on body (e.g. tables, lists) */
  flushBody?: boolean;
}

export default function PanelSection({
  title,
  description,
  action,
  footer,
  children,
  className = '',
  bodyClassName = '',
  flushBody = false,
}: PanelSectionProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Panel padding="none" className={`overflow-hidden ${className}`.trim()}>
      {hasHeader && (
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-border-subtle">
          {title || description ? (
            <div className="min-w-0">
              {title && <h2 className="text-sm font-medium text-text-primary">{title}</h2>}
              {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
            </div>
          ) : (
            <div />
          )}
          {action}
        </div>
      )}

      <div className={flushBody ? bodyClassName : `px-5 py-5 ${bodyClassName}`.trim()}>
        {children}
      </div>

      {footer && (
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-container-high/30 text-xs text-text-muted">
          {footer}
        </div>
      )}
    </Panel>
  );
}

/** Section header for use inside a padded Panel (charts, forms) */
export function PanelBlock({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={className}>
      <SectionHeader title={title} description={description} action={action} inset />
      {children}
    </Panel>
  );
}
