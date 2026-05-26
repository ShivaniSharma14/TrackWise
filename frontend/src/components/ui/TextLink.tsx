import { ChevronRight } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface TextLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  showChevron?: boolean;
}

/** Inline text action used in section headers and cards */
export default function TextLink({
  children,
  showChevron = false,
  className = '',
  type = 'button',
  ...props
}: TextLinkProps) {
  return (
    <button
      type={type}
      className={`text-xs font-medium text-text-muted hover:text-text-primary inline-flex items-center gap-0.5 transition-colors ${className}`}
      {...props}
    >
      {children}
      {showChevron && <ChevronRight size={14} />}
    </button>
  );
}
