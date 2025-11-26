import React from 'react';

interface NoirCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const NoirCard: React.FC<NoirCardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white border-2 border-black shadow-hard p-6 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-black/10">
          {title && <h3 className="font-mono font-bold text-lg uppercase tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};