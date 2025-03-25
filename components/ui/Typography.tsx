import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function Heading1({ children, className = '' }: TypographyProps) {
  return (
    <h1 className={`text-3xl font-bold leading-tight ${className}`}>
      {children}
    </h1>
  );
}

export function Heading2({ children, className = '' }: TypographyProps) {
  return (
    <h2 className={`text-2xl font-semibold leading-tight ${className}`}>
      {children}
    </h2>
  );
}

export function Heading3({ children, className = '' }: TypographyProps) {
  return (
    <h3 className={`text-xl font-semibold leading-tight ${className}`}>
      {children}
    </h3>
  );
}

export function Paragraph({ children, className = '' }: TypographyProps) {
  return (
    <p className={`text-base leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function Label({ children, className = '' }: TypographyProps) {
  return (
    <span className={`text-sm font-medium ${className}`}>
      {children}
    </span>
  );
}

export function Caption({ children, className = '' }: TypographyProps) {
  return (
    <span className={`text-xs text-gray-500 ${className}`}>
      {children}
    </span>
  );
}