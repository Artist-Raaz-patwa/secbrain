
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NoirButton } from './ui/NoirButton';
import { NoirInput } from './ui/NoirInput';
import { db } from '../firebase';
import { Terminal, Globe } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
    const { user, updateSettings } = useAppStore();
    const [name, setName] = useState(user?.displayName || '');
    const [currency, setCurrency] = useState('$');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const updates = {
            userName: name || 'User',
            baseCurrency: currency,
            hasCompletedOnboarding: true
        };

        try {
            // Attempt server save
            await db.collection('settings').doc(user.uid).set(updates, { merge: true });
            
            // Also update Auth profile if name changed
            if (user.displayName !== name) {
                await user.updateProfile({ displayName: name });
            }
        } catch (error) {
            console.warn("Onboarding cloud sync failed (Permissions/Network). Applying locally.", error);
            // Proceed anyway to unblock the user. 
            // The settings will persist locally in the store state until next refresh.
        } finally {
            // Always update local state to close the modal and apply settings
            updateSettings(updates);
            setIsSubmitting(false);
        }
    };

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
        { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-4 border-black dark:border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] relative animate-in fade-in zoom-in duration-500">
                <div className="bg-black text-white p-6 border-b-4 border-black dark:border-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Terminal size={24} className="animate-pulse text-green-400" />
                        <h2 className="text-2xl font-display font-black tracking-tighter uppercase">System Initialization</h2>
                    </div>
                    <p className="font-mono text-xs text-gray-400">CONFIGURE REGIONAL PARAMETERS FOR OPTIMAL OPERATION.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <NoirInput 
                        label="Operator Identity (Name)" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Enter your name..."
                        autoFocus
                        required
                    />

                    <div className="space-y-2">
                        <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                            <Globe size={14} /> Base Currency
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {currencies.map((curr) => (
                                <button
                                    key={curr.code}
                                    type="button"
                                    onClick={() => setCurrency(curr.symbol)}
                                    className={`
                                        p-3 text-left border-2 transition-all font-mono text-xs flex justify-between items-center
                                        ${currency === curr.symbol 
                                            ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                                            : 'bg-transparent text-gray-500 border-gray-200 dark:border-neutral-700 hover:border-black dark:hover:border-white'}
                                    `}
                                >
                                    <span className="font-bold">{curr.code}</span>
                                    <span className="text-lg">{curr.symbol}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <NoirButton fullWidth type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'INITIALIZING...' : 'BOOT SYSTEM'}
                        </NoirButton>
                    </div>
                </form>
            </div>
        </div>
    );
};
