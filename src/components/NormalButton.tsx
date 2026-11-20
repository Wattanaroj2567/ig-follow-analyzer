import { type ReactNode } from 'react';

export function NormalButton({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    ghost: 'btn--ghost',
    danger: 'btn--danger',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
