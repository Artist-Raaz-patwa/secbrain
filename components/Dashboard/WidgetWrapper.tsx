import React from 'react';
import { X } from 'lucide-react';

interface Props {
    title?: string;
    children: React.ReactNode;
    onRemove?: () => void;
    isEditing: boolean;
    className?: string;
}

export const WidgetWrapper: React.FC<Props> = ({ title, children, onRemove, isEditing, className = '' }) => {
    return (
        <div className={`
            bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white 
            relative animate-in fade-in zoom-in-95 duration-500 overflow-hidden group ${className}
        `}>
            {isEditing && onRemove && (
                <button 
                    onClick={onRemove}
                    className="absolute top-2 right-2 z-20 bg-red-500 text-white p-1 rounded-full hover:scale-110 transition-transform shadow-md"
                >
                    <X size={12} />
                </button>
            )}
            
            {title && (
                <div className="bg-black dark:bg-white text-white dark:text-black p-2 px-4 flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">{title}</span>
                </div>
            )}
            
            <div className="h-full">
                {children}
            </div>
        </div>
    );
};