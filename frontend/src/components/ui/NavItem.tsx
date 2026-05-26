import { LucideIcon } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface NavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  variant?: 'default' | 'danger';
}

export default function NavItem({
  icon: Icon,
  label,
  active = false,
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: NavItemProps) {
  const base = active ? 'nav-item-active' : 'nav-item';
  const variantClass =
    variant === 'danger' ? 'text-text-secondary hover:text-error' : '';

  return (
    <button
      type={type}
      className={`${base} w-full text-left ${variantClass} ${className}`.trim()}
      {...props}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
      <span>{label}</span>
    </button>
  );
}
