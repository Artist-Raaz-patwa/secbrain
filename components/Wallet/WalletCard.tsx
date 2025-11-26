import React from 'react';
import { WalletAccount } from '../../types';
import { CreditCard, Wifi, Cpu, Calculator, Calculator as CalculatorOff } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface WalletCardProps {
    account: WalletAccount;
    onClick?: () => void;
    onToggleCalc?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ account, onClick, onToggleCalc }) => {
  const { settings } = useAppStore();
  const isExcluded = account.excludeFromTotals;

  const getGradient = (theme: string) => {
      switch(theme) {
          case 'blue': return 'bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500';
          case 'purple': return 'bg-gradient-to-br from-indigo-900 via-purple-700 to-pink-500';
          case 'green': return 'bg-gradient-to-br from-emerald-900 via-green-700 to-teal-500';
          case 'red': return 'bg-gradient-to-br from-red-900 via-rose-700 to-orange-500';
          case 'gold': return 'bg-gradient-to-br from-yellow-800 via-yellow-600 to-amber-400';
          case 'cyan': return 'bg-gradient-to-br from-cyan-900 via-cyan-600 to-blue-400';
          case 'pink': return 'bg-gradient-to-br from-pink-900 via-pink-600 to-rose-400';
          case 'orange': return 'bg-gradient-to-br from-orange-900 via-orange-600 to-yellow-400';
          case 'teal': return 'bg-gradient-to-br from-teal-900 via-teal-700 to-emerald-400';
          case 'silver': return 'bg-gradient-to-br from-gray-700 via-gray-500 to-gray-300';
          case 'indigo': return 'bg-gradient-to-br from-indigo-950 via-indigo-700 to-violet-500';
          default: return 'bg-gradient-to-br from-gray-900 via-black to-gray-800';
      }
  };

  return (
    <div className="group perspective-1000 h-56 w-96 cursor-pointer relative" onClick={onClick}>
        <div className={`
            relative w-full h-full rounded-2xl shadow-2xl transition-all duration-300 transform-style-3d 
            group-hover:rotate-y-[10deg] group-hover:rotate-x-[5deg] group-hover:-translate-y-2
            ${isExcluded ? 'grayscale opacity-60 bg-gray-800' : getGradient(account.colorTheme)}
            border border-white/10 text-white overflow-hidden
        `}>
            {/* Holographic Sheen */}
            {!isExcluded && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"></div>
            )}

            {/* Pattern */}
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '20px 20px'}}>
            </div>

            <div className="absolute top-6 left-8 flex items-center gap-2">
                <Cpu size={32} className="text-yellow-200 opacity-80" />
                <Wifi size={24} className="rotate-90 opacity-50" />
            </div>

            <div className="absolute top-6 right-8 font-mono text-lg font-bold tracking-widest opacity-80 uppercase">
                {account.type}
            </div>

            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2">
                 <div className="font-mono text-2xl tracking-[0.2em] opacity-90 shadow-sm" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                    **** **** **** {account.id.substring(0,4)}
                 </div>
            </div>

            <div className="absolute bottom-6 left-8">
                <div className="text-[10px] font-mono uppercase opacity-70">CARDHOLDER</div>
                <div className="font-display font-bold tracking-wider uppercase text-lg">{account.name}</div>
            </div>

            <div className="absolute bottom-6 right-8 text-right">
                <div className="text-[10px] font-mono uppercase opacity-70">BALANCE</div>
                <div className="font-mono font-bold tracking-wider text-xl">
                    {settings.baseCurrency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            
            {/* Excluded Overlay Label */}
            {isExcluded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-white/30 text-white/50 text-4xl font-black uppercase -rotate-12 p-4">
                        EXCLUDED
                    </div>
                </div>
            )}
        </div>
        
        {/* Toggle Button (Floating outside 3D context to stay clickable/flat) */}
        {onToggleCalc && (
            <button
                onClick={(e) => { e.stopPropagation(); onToggleCalc(); }}
                className={`
                    absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full border-2 border-white shadow-hard-lg flex items-center justify-center transition-all hover:scale-110
                    ${isExcluded ? 'bg-gray-500 text-gray-300' : 'bg-green-500 text-white'}
                `}
                title={isExcluded ? "Include in Total" : "Exclude from Total"}
            >
                <Calculator size={14} />
            </button>
        )}
        
        {/* Reflection/Shadow underneath */}
        {!isExcluded && (
            <div className="absolute -bottom-10 left-4 right-4 h-4 bg-black/40 blur-xl rounded-[100%] transition-all group-hover:scale-90 opacity-0 group-hover:opacity-100"></div>
        )}
    </div>
  );
};