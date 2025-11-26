
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { WalletAccount, Transaction } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, Edit2 } from 'lucide-react';
import { WalletCard } from './WalletCard';
import { WalletAnalytics } from './WalletAnalytics';
import { AddAccountModal } from './AddAccountModal';
import { AddTransactionModal } from './AddTransactionModal';
import { EditAccountModal } from './EditAccountModal';
import { EditTransactionModal } from './EditTransactionModal';

export const WalletModule: React.FC = () => {
    const { user, accounts, setAccounts, transactions, setTransactions, settings } = useAppStore();
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [isAddTransOpen, setIsAddTransOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<WalletAccount | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        if (!user) return;
        // Listen to Accounts
        const unsubAcc = db.collection('accounts')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched: WalletAccount[] = [];
                snap.forEach(doc => fetched.push({id: doc.id, ...doc.data()} as WalletAccount));
                fetched.sort((a,b) => b.createdAt - a.createdAt);
                setAccounts(fetched);
            }, (error) => {
                console.error("Accounts sync error:", error);
            });

        // Listen to Transactions
        const unsubTrans = db.collection('transactions')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched: Transaction[] = [];
                snap.forEach(doc => fetched.push({id: doc.id, ...doc.data()} as Transaction));
                // Client-side Sort
                fetched.sort((a, b) => b.date - a.date);
                setTransactions(fetched);
            }, (error) => {
                console.error("Transactions sync error:", error);
            });

        return () => { unsubAcc(); unsubTrans(); };
    }, [user]);

    const handleDeleteTransaction = async (id: string) => {
        if (confirm("Delete this transaction record? Balance will NOT automatically revert (Manual adjustment required for safety).")) {
             try {
                 await db.collection('transactions').doc(id).delete();
             } catch(e) { console.error(e); }
        }
    };

    const toggleAccountInclusion = async (account: WalletAccount) => {
        try {
            await db.collection('accounts').doc(account.id).update({
                excludeFromTotals: !account.excludeFromTotals
            });
        } catch (e) {
            console.error("Failed to toggle account inclusion", e);
        }
    };

    // Calculation Logic: Only include accounts NOT excluded
    const activeAccounts = accounts.filter(a => !a.excludeFromTotals);
    const totalBalance = activeAccounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    // Filter transactions: Only show transactions from active accounts in analytics/totals
    // Note: Transaction log below shows ALL, but analytics uses filtered.
    const activeAccountIds = new Set(activeAccounts.map(a => a.id));
    const activeTransactions = transactions.filter(t => activeAccountIds.has(t.accountId));

    const incomeThisMonth = activeTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0); 
    const expenseThisMonth = activeTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
             {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Finance_HQ</h2>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">
                        NET WORTH: {settings.baseCurrency}{totalBalance.toLocaleString()} 
                        <span className="opacity-50 ml-2">({activeAccounts.length}/{accounts.length} SOURCES)</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <NoirButton onClick={() => setIsAddAccountOpen(true)} variant="secondary">
                        <div className="flex items-center gap-2"><Wallet size={18}/> ADD ACCOUNT</div>
                    </NoirButton>
                    <NoirButton onClick={() => setIsAddTransOpen(true)}>
                         <div className="flex items-center gap-2"><Plus size={18}/> LOG CASH</div>
                    </NoirButton>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-4 shadow-hard dark:shadow-hard-white flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Total Assets</div>
                        <div className="text-2xl font-bold font-mono">{settings.baseCurrency}{totalBalance.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-4 shadow-hard dark:shadow-hard-white flex items-center justify-between">
                    <div>
                         <div className="text-[10px] font-mono text-gray-500 uppercase">Inflow</div>
                        <div className="text-2xl font-bold font-mono text-green-600">{settings.baseCurrency}{incomeThisMonth.toLocaleString()}</div>
                    </div>
                    <TrendingUp className="text-green-600" />
                </div>
                <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-4 shadow-hard dark:shadow-hard-white flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Outflow</div>
                        <div className="text-2xl font-bold font-mono text-red-600">{settings.baseCurrency}{expenseThisMonth.toLocaleString()}</div>
                    </div>
                     <TrendingDown className="text-red-600" />
                </div>
            </div>

            {/* Cards Carousel */}
            <div className="overflow-x-auto pb-8 pt-4">
                 <div className="flex gap-6 w-max px-2">
                    {accounts.length === 0 && (
                        <div className="h-56 w-96 border-2 border-dashed border-gray-400 flex items-center justify-center font-mono text-gray-500">
                            NO ACCOUNTS LINKED
                        </div>
                    )}
                    {accounts.map(acc => (
                        <WalletCard 
                            key={acc.id} 
                            account={acc} 
                            onClick={() => setEditingAccount(acc)} 
                            onToggleCalc={() => toggleAccountInclusion(acc)}
                        />
                    ))}
                 </div>
            </div>

            {/* Analytics & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <WalletAnalytics transactions={activeTransactions} currentBalance={totalBalance} />
                </div>
                <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white p-6 flex flex-col h-[300px] md:h-auto">
                    <h3 className="font-display font-black text-xl uppercase mb-4">Recent_Log</h3>
                    <div className="flex-grow overflow-y-auto space-y-3">
                        {transactions.length === 0 && <div className="text-center text-gray-400 font-mono text-xs">NO DATA</div>}
                        {transactions.map(t => (
                            <div key={t.id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2 group">
                                <div>
                                    <div className="font-bold font-mono text-sm">{t.description}</div>
                                    <div className="text-[10px] text-gray-400 uppercase">{new Date(t.date).toLocaleDateString()} • {t.category}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`font-mono font-bold ${t.type === 'income' ? 'text-green-600' : 'text-black dark:text-white'}`}>
                                        {t.type === 'income' ? '+' : '-'}{settings.baseCurrency}{t.amount}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button onClick={() => setEditingTransaction(t)} className="text-gray-300 hover:text-black dark:hover:text-white">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-300 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddAccountModal isOpen={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} />
            <AddTransactionModal isOpen={isAddTransOpen} onClose={() => setIsAddTransOpen(false)} />
            
            {editingAccount && (
                <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} />
            )}

            {editingTransaction && (
                <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />
            )}
        </div>
    );
};
