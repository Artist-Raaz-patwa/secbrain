import React from 'react';
import { Goal } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Calendar, Flag, Edit3 } from 'lucide-react';

interface Props {
  goal: Goal;
  onClick: () => void;
}

export const GoalCard: React.FC<Props> = ({ goal, onClick }) => {
  const { settings } = useAppStore();
  
  const now = Date.now();
  const timeLeft = goal.targetDate - now;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  const isExpired = daysLeft < 0;
  
  // Progress Calculation
  let progress = 0;
  if (goal.targetAmount && goal.targetAmount > 0) {
      progress = Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100);
  } else {
      progress = goal.status === 'completed' ? 100 : 0;
  }

  return (
    <div onClick={onClick} className="group bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white cursor-pointer hover:-translate-y-1 hover:shadow-hard-lg dark:hover:shadow-hard-lg-white transition-all relative overflow-hidden h-64 flex flex-col justify-end">
        
        {/* Background Image Layer */}
        {goal.imageUrl && (
            <div className="absolute inset-0 z-0 bg-black">
                <img 
                    src={goal.imageUrl} 
                    alt="Goal Cover" 
                    className="w-full h-full object-cover opacity-50 filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-0 right-0 z-10 px-3 py-1 font-mono text-[10px] font-bold uppercase
            bg-black text-white border-b-2 border-l-2 border-white
        ">
            {goal.status}
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 text-white w-full">
            <h3 className={`font-display font-black text-xl uppercase tracking-tighter leading-none line-clamp-2 mb-2 ${!goal.imageUrl ? 'text-black dark:text-white' : 'text-white drop-shadow-md'}`}>
                {goal.title}
            </h3>

            {/* Countdown */}
            <div className={`flex items-center gap-2 mb-4 text-xs font-mono ${!goal.imageUrl ? 'text-gray-600 dark:text-gray-400' : 'text-gray-300'}`}>
                <Calendar size={14} />
                <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                    {isExpired ? `${Math.abs(daysLeft)} DAYS OVERDUE` : `${daysLeft} DAYS REMAINING`}
                </span>
            </div>

            {/* Numeric Progress */}
            {goal.targetAmount && (
                <div className={`mb-2 flex justify-between font-mono text-xs font-bold ${!goal.imageUrl ? 'text-black dark:text-white' : 'text-white'}`}>
                    <span>{settings.baseCurrency}{(goal.currentAmount || 0).toLocaleString()}</span>
                    <span className="opacity-70">/ {settings.baseCurrency}{goal.targetAmount.toLocaleString()}</span>
                </div>
            )}

            {/* Progress Bar */}
            <div className={`h-2 w-full border border-white/50 relative overflow-hidden ${!goal.imageUrl ? 'bg-gray-200 dark:bg-neutral-800 border-black dark:border-white' : 'bg-black/50'}`}>
                <div 
                    className={`h-full absolute top-0 left-0 transition-all duration-500 ${goal.status === 'failed' ? 'bg-red-500' : 'bg-white'}`}
                    style={{ width: `${progress}%` }}
                >
                    {/* Noir Texture Overlay */}
                    <div className="w-full h-full opacity-20" style={{backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.5) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.5) 75%,transparent 75%,transparent)', backgroundSize: '4px 4px'}}></div>
                </div>
            </div>
            
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 size={16} className="text-white drop-shadow-md" />
            </div>
        </div>
    </div>
  );
};