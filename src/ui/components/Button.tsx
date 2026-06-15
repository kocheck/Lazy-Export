import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  fullWidth?: boolean;
  /** Marks the button as the in-flight control: sets `aria-busy` and disables it. */
  busy?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  fullWidth = false,
  busy = false,
}) => {
  return (
    <button
      className={`figma-button figma-button--${variant} ${fullWidth ? 'figma-button--full' : ''}`}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {children}
    </button>
  );
};
