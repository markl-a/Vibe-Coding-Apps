import React, { HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  hoverable = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-lg transition-shadow',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'hover:shadow-xl cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';
