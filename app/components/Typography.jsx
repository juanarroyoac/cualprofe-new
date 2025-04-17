// components/Typography.jsx
'use client';

/**
 * Typography component for consistent text styling across the application
 */
export default function Typography({
  variant = 'body', // 'h1', 'h2', 'h3', 'body', 'small'
  weight = null, // null, 'thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'
  color = null, // null, 'white', 'primary', 'gray', etc.
  align = null, // null, 'left', 'center', 'right'
  className = '',
  children
}) {
  // Default styling based on variant
  const variantClasses = {
    h1: 'text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight',
    h2: 'text-2xl md:text-3xl font-semibold leading-tight',
    h3: 'text-xl md:text-2xl font-semibold leading-tight',
    body: 'text-base leading-relaxed',
    small: 'text-sm leading-relaxed',
  };

  // Weight classes (customize based on your design system)
  const weightClasses = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  };

  // Color classes
  const colorClasses = {
    white: 'text-white',
    primary: 'text-[#00103f]',
    gray: 'text-gray-800',
  };

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Combine classes
  const combinedClasses = [
    variantClasses[variant] || variantClasses.body,
    weight ? (weightClasses[weight] || '') : '',
    color ? (colorClasses[color] || '') : '',
    align ? (alignClasses[align] || '') : '',
    className
  ].filter(Boolean).join(' ');

  // Render appropriate HTML element based on variant
  switch (variant) {
    case 'h1':
      return <h1 className={combinedClasses}>{children}</h1>;
    case 'h2':
      return <h2 className={combinedClasses}>{children}</h2>;
    case 'h3':
      return <h3 className={combinedClasses}>{children}</h3>;
    case 'small':
      return <p className={combinedClasses}>{children}</p>;
    default:
      return <p className={combinedClasses}>{children}</p>;
  }
}