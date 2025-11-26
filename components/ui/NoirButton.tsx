import React from 'react';

interface NoirButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const NoirButton: React.FC<NoirButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  // Enhanced physics for "Game Feel"
  // On hover: slight lift (-2px)
  // On active: hard press (+2px), shadow disappears (looks like button is pressed into page)
  const baseStyle = "font-display font-bold text-sm px-6 py-3 border-2 transition-all duration-150 ease-out uppercase tracking-wide select-none";
  
  const threeDStyle = "shadow-hard dark:shadow-hard-white border-black dark:border-white hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-hard-lg dark:hover:shadow-hard-lg-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";
  
  const variants = {
    primary: "bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-900 dark:hover:bg-gray-100",
    secondary: "bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900",
    danger: "bg-white text-black dark:bg-black dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-600",
  };

  return (
    <button
      className={`
        ${baseStyle} 
        ${threeDStyle} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};