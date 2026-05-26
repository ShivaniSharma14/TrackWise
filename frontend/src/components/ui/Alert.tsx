import { ReactNode } from 'react';

type AlertVariant = 'success' | 'error' | 'warning';

const variantClasses: Record<AlertVariant, string> = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
};

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

export default function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}
