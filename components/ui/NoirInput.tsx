import React from 'react';

interface NoirInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NoirInput: React.FC<NoirInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-white dark:bg-neutral-900 text-black dark:text-white font-mono text-sm px-4 py-3 
          border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white
          focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-hard-sm dark:focus:shadow-hard-sm-white
          placeholder:text-gray-400
          transition-all duration-100
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export const NoirTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">
            {label}
          </label>
        )}
        <textarea
          className={`
            w-full bg-white dark:bg-neutral-900 text-black dark:text-white font-mono text-sm px-4 py-3 
            border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white
            focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-hard-sm dark:focus:shadow-hard-sm-white
            placeholder:text-gray-400
            transition-all duration-100 min-h-[120px]
            ${className}
          `}
          {...props}
        />
      </div>
    );
  };