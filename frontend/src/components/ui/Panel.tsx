import { HTMLAttributes, ReactNode } from 'react';

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-8',
} as const;

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: keyof typeof paddingClasses;
  variant?: 'default' | 'elevated';
}

export default function Panel({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  ...props
}: PanelProps) {
  const base = variant === 'elevated' ? 'panel-elevated' : 'panel';

  return (
    <div className={`${base} ${paddingClasses[padding]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
