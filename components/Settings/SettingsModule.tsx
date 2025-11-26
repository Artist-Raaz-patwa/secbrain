
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { 
    User, Monitor, Cpu, Database, LogOut, Check, Sun, Moon, 
    RefreshCw, Terminal, CreditCard, Briefcase, Activity, Download, 
    Box, Shield, AlertTriangle, Type, Layout, Calendar, MousePointer,
    Grid, Square, FileText, Info
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { AppSettings, LogEntry, LogCategory } from '../../types';

type SettingsTab = 'identity' | 'appearance' | 'apps' | 'intelligence' | 'system';

export const SettingsModule: React.FC = () => {
  const { user, settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [keySaved, setKeySaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<LogCategory | 'ALL'>('ALL');

  const saveSettingsToCloud = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;
    try {
        await db.collection('settings').doc(user.uid).set(newSettings, { merge: true });
        updateSettings(newSettings);
    } catch (error) {
        console.error("Failed to save settings to cloud", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
        await user.updateProfile({ displayName });
        await saveSettingsToCloud({ userName: displayName });
    } catch (error) {
        console.error("Failed to update profile", error);
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleExportData = async () => {
    if(!user) return;
    const data = {
        settings: settings,
        timestamp: new Date().toISOString(),
        user: user.email,
        note: "Full export requires backend function. This is a manifest."
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second_brain_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!user || activeTab !== 'system') return;
    setLoadingLogs(true);
    
    let query = db.collection('system_logs').where('userId', '==', user.uid);
    
    const unsubscribe = query.onSnapshot((snapshot) => {
        const fetched: LogEntry[] = [];
        snapshot.forEach(doc => {
            fetched.push({ id: doc.id, ...doc.data() } as LogEntry);
        });
        
        // Client side sort
        fetched.sort((a,b) => b.timestamp - a.timestamp);
        
        setSystemLogs(fetched);
        setLoadingLogs(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  ];

  const TabButton = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 p-4 font-display text-xs font-bold border-l-4 transition-all uppercase tracking-wider
            ${activeTab === id 
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' 
                : 'bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 border-transparent'}
        `}
    >
        <Icon size={16} />
        {label}
    </button>
  );

  const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
      <header className="mb-8 border-b-2 border-black/10 dark:border-white/10 pb-4">
          <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-black dark:text-white">{title}</h3>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
      </header>
  );

  const ToggleRow = ({ label, desc, value, onChange }: { label: string, desc: string, value: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 border-2 border-black dark:border-white shadow-sm dark:shadow-none bg-white dark:bg-neutral-900 transition-all hover:shadow-hard-sm">
        <div>
            <h4 className="font-bold font-display text-sm uppercase text-black dark:text-white">{label}</h4>
            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
        <button 
            onClick={onChange}
            className={`w-12 h-6 border-2 border-black dark:border-white relative transition-all ${value ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-neutral-800'}`}
        >
            <div className={`absolute top-0.5 bottom-0.5 w-4 bg-white dark:bg-black border border-black dark:border-white transition-all ${value ? 'right-0.5' : 'left-0.5'}`}></div>
        </button>
    </div>
  );

  const filteredLogs = logFilter === 'ALL' ? systemLogs : systemLogs.filter(l => l.category === logFilter);

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white flex flex-col md:flex-row h-[80vh] overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-black dark:border-white bg-gray-50 dark:bg-neutral-800 flex flex-col">
        <div className="p-6">
            <h2 className="font-display font-black text-xl tracking-tighter text-black dark:text-white">SYS_CONFIG</h2>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">ONLINE v1.7.0</span>
            </div>
        </div>
        
        <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-2 font-mono text-[10px] text-gray-400 font-bold mt-2">USER</div>
            <TabButton id="identity" label="Identity" icon={User} />
            
            <div className="px-4 py-2 font-mono text-[10px] text-gray-400 font-bold mt-2">SYSTEM</div>
            <TabButton id="appearance" label="Visuals" icon={Monitor} />
            <TabButton id="apps" label="Modules" icon={Box} />
            <TabButton id="intelligence" label="Neural Link" icon={Cpu} />
            <TabButton id="system" label="Diagnostics" icon={Database} />
        </nav>

        <div className="p-4 border-t-2 border-black dark:border-white">
             <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold font-mono text-xs hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-500"
             >
                <LogOut size={14} /> TERMINATE_SESSION
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 overflow-y-auto bg-dots dark:bg-neutral-900 text-black dark:text-white relative custom-scrollbar">
        
        {/* IDENTITY TAB */}
        {activeTab === 'identity' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl">
                <SectionHeader title="Identity Management" sub="Configure your digital persona and access credentials." />
                
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white">
                        <NoirInput 
                            label="Display Name" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                        />
                        <div className="mt-4 flex justify-end">
                            <NoirButton onClick={handleSaveProfile} disabled={isSavingProfile}>
                                {isSavingProfile ? 'UPDATING...' : 'SAVE CHANGES'}
                            </NoirButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-100 dark:bg-neutral-800 border-2 border-dashed border-gray-300 dark:border-neutral-700">
                            <span className="block font-mono text-[10px] text-gray-500 uppercase mb-1">User ID</span>
                            <code className="block font-mono text-xs font-bold truncate text-black dark:text-white">{user?.uid}</code>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-neutral-800 border-2 border-dashed border-gray-300 dark:border-neutral-700">
                            <span className="block font-mono text-[10px] text-gray-500 uppercase mb-1">Auth Provider</span>
                            <code className="block font-mono text-xs font-bold text-black dark:text-white">{user?.providerData[0]?.providerId || 'Email'}</code>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SectionHeader title="Visual Interface" sub="Customize the OS rendering engine and feedback." />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {/* Theme Section */}
                        <div>
                             <h4 className="font-mono text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-neutral-800 pb-2 mb-4">Theme Engine</h4>
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => saveSettingsToCloud({ theme: 'light' })}
                                    className={`flex-1 p-6 border-2 flex flex-col items-center gap-3 transition-all ${settings.theme === 'light' ? 'border-black bg-white shadow-hard' : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-100'}`}
                                >
                                    <Sun size={32} className="text-black" />
                                    <span className="font-display font-bold text-black uppercase">Light Mode</span>
                                </button>
                                <button 
                                    onClick={() => saveSettingsToCloud({ theme: 'dark' })}
                                    className={`flex-1 p-6 border-2 flex flex-col items-center gap-3 transition-all ${settings.theme === 'dark' ? 'border-white bg-black shadow-hard-white' : 'border-neutral-700 bg-neutral-800 opacity-60 hover:opacity-100'}`}
                                >
                                    <Moon size={32} className="text-white" />
                                    <span className="font-display font-bold text-white uppercase">Dark Mode</span>
                                </button>
                            </div>
                        </div>

                        {/* Font Size & Density */}
                        <div>
                            <h4 className="font-mono text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-neutral-800 pb-2 mb-4">Typography & Layout</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                                        <Type size={14} /> Font Size
                                    </label>
                                    <div className="flex border-2 border-black dark:border-white">
                                        {['small', 'medium', 'large'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => saveSettingsToCloud({ fontSize: s as any })}
                                                className={`flex-1 py-2 text-xs font-bold uppercase font-mono ${settings.fontSize === s ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                                        <Layout size={14} /> Density
                                    </label>
                                    <div className="flex border-2 border-black dark:border-white">
                                        {['compact', 'comfortable'].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => saveSettingsToCloud({ density: d as any })}
                                                className={`flex-1 py-2 text-xs font-bold uppercase font-mono ${settings.density === d ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Border & Structure (NEW) */}
                        <div>
                             <h4 className="font-mono text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-neutral-800 pb-2 mb-4">Structure</h4>
                             <div className="space-y-4">
                                <div>
                                    <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                                        <MousePointer size={14} /> Corner Radius
                                    </label>
                                    <div className="flex border-2 border-black dark:border-white">
                                        {['sharp', 'rounded'].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => saveSettingsToCloud({ borderRadius: r as any })}
                                                className={`flex-1 py-2 text-xs font-bold uppercase font-mono ${settings.borderRadius === r ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                                        <Square size={14} /> Border Thickness
                                    </label>
                                    <div className="flex border-2 border-black dark:border-white">
                                        {['thin', 'standard', 'thick'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => saveSettingsToCloud({ borderThickness: t as any })}
                                                className={`flex-1 py-2 text-xs font-bold uppercase font-mono ${settings.borderThickness === t ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white flex items-center gap-2">
                                        <Grid size={14} /> Background Grid
                                    </label>
                                    <div className="flex border-2 border-black dark:border-white">
                                        {['dots', 'lines', 'cross'].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => saveSettingsToCloud({ gridStyle: g as any })}
                                                className={`flex-1 py-2 text-xs font-bold uppercase font-mono ${settings.gridStyle === g ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div>
                             <h4 className="font-mono text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-neutral-800 pb-2 mb-4">Rendering Options</h4>
                             <div className="space-y-2">
                                <ToggleRow 
                                    label="Tactical Grid" 
                                    desc="Display background alignment matrix." 
                                    value={settings.showGrid} 
                                    onChange={() => saveSettingsToCloud({ showGrid: !settings.showGrid })}
                                />
                                <ToggleRow 
                                    label="Reduced Motion" 
                                    desc="Minimize interface animations for speed." 
                                    value={settings.reducedMotion} 
                                    onChange={() => saveSettingsToCloud({ reducedMotion: !settings.reducedMotion })}
                                />
                                <ToggleRow 
                                    label="UI Sounds" 
                                    desc="Enable feedback clicks and blips." 
                                    value={settings.soundEnabled} 
                                    onChange={() => saveSettingsToCloud({ soundEnabled: !settings.soundEnabled })}
                                />
                             </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="border-4 border-black dark:border-white p-6 relative overflow-hidden flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900/50">
                         <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '10px 10px'}}></div>
                        <div className="absolute top-2 left-2 font-mono text-[10px] bg-black text-white px-1">PREVIEW</div>
                        
                        <div className={`
                            w-64 p-4 border-2 shadow-hard transition-all duration-500
                            ${settings.theme === 'light' ? 'bg-white border-black shadow-black' : 'bg-neutral-900 border-white shadow-white'}
                        `}>
                            <div className="font-display font-black text-xl mb-2">HEADLINE</div>
                            <div className={`h-2 w-full mb-1 ${settings.theme === 'light' ? 'bg-gray-200' : 'bg-neutral-700'}`}></div>
                            <div className={`h-2 w-5/6 mb-4 ${settings.theme === 'light' ? 'bg-gray-200' : 'bg-neutral-700'}`}></div>
                            
                            <div className={`mt-4 px-4 py-2 text-xs font-bold text-center border-2 uppercase ${settings.theme === 'light' ? 'border-black text-black' : 'border-white text-white'}`}>
                                BUTTON
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* APPS / MODULES TAB */}
        {activeTab === 'apps' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SectionHeader title="Module Configuration" sub="Set defaults for specific applications." />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CRM Config */}
                    <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white hover:shadow-hard dark:hover:shadow-hard-white transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={20} className="text-black dark:text-white" />
                            <h4 className="font-display font-bold uppercase text-black dark:text-white">CRM / Agency</h4>
                        </div>
                        <div className="space-y-4">
                            <NoirInput 
                                label="Default Hourly Rate"
                                type="number"
                                value={settings.defaultHourlyRate}
                                onChange={(e) => saveSettingsToCloud({ defaultHourlyRate: parseFloat(e.target.value) })}
                            />
                             <NoirInput 
                                label="Default Tax Rate (%)"
                                type="number"
                                value={settings.defaultTaxRate || 0}
                                onChange={(e) => saveSettingsToCloud({ defaultTaxRate: parseFloat(e.target.value) })}
                            />
                            {/* New Options */}
                             <NoirInput 
                                label="Invoice ID Prefix"
                                value={settings.invoicePrefix || 'INV-'}
                                onChange={(e) => saveSettingsToCloud({ invoicePrefix: e.target.value })}
                            />
                             <NoirInput 
                                label="Payment Terms"
                                value={settings.defaultPaymentTerms || 'Net 30'}
                                onChange={(e) => saveSettingsToCloud({ defaultPaymentTerms: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Wallet Config */}
                    <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white hover:shadow-hard dark:hover:shadow-hard-white transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={20} className="text-black dark:text-white" />
                            <h4 className="font-display font-bold uppercase text-black dark:text-white">Wallet / Finance</h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                 <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Base Currency</label>
                                 <select 
                                    className="w-full p-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white font-mono text-sm text-black dark:text-white"
                                    value={settings.baseCurrency}
                                    onChange={(e) => saveSettingsToCloud({ baseCurrency: e.target.value })}
                                 >
                                    {currencies.map(c => (
                                        <option key={c.code} value={c.symbol}>{c.code} - {c.symbol} ({c.name})</option>
                                    ))}
                                 </select>
                            </div>
                            
                            <div>
                                 <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Currency Position</label>
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => saveSettingsToCloud({ currencyPosition: 'left' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.currencyPosition === 'left' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        LEFT ($100)
                                     </button>
                                     <button 
                                        onClick={() => saveSettingsToCloud({ currencyPosition: 'right' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.currencyPosition === 'right' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        RIGHT (100$)
                                     </button>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Habits Config */}
                    <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white hover:shadow-hard dark:hover:shadow-hard-white transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={20} className="text-black dark:text-white" />
                            <h4 className="font-display font-bold uppercase text-black dark:text-white">Habit Tracker</h4>
                        </div>
                        <div className="space-y-4">
                             <div>
                                 <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Week Starts On</label>
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => saveSettingsToCloud({ weekStartsOn: 'sun' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.weekStartsOn === 'sun' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        SUNDAY
                                     </button>
                                     <button 
                                        onClick={() => saveSettingsToCloud({ weekStartsOn: 'mon' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.weekStartsOn === 'mon' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        MONDAY
                                     </button>
                                 </div>
                            </div>
                            
                            <div>
                                 <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Date Format</label>
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => saveSettingsToCloud({ dateFormat: 'US' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.dateFormat === 'US' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        MM/DD
                                     </button>
                                     <button 
                                        onClick={() => saveSettingsToCloud({ dateFormat: 'INTL' })}
                                        className={`flex-1 py-2 border-2 font-mono text-xs ${settings.dateFormat === 'INTL' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400'}`}
                                    >
                                        DD/MM
                                     </button>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* INTELLIGENCE TAB */}
        {activeTab === 'intelligence' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl">
                <SectionHeader title="Neural Link" sub="Configure Gemini AI connection parameters." />

                <div className="bg-black text-white dark:bg-neutral-800 dark:border-white p-8 border-4 border-black shadow-hard-lg dark:shadow-hard-lg-white relative overflow-hidden group">
                    {/* Background decoration */}
                    <Cpu size={200} className="absolute -right-10 -bottom-10 text-white/5 dark:text-white/5 rotate-12 transition-transform group-hover:rotate-45 duration-700" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="font-bold font-display text-xl">GEMINI 2.5 FLASH</h4>
                                <p className="text-xs font-mono text-gray-400">STATUS: {apiKey ? 'CONNECTED' : 'DISCONNECTED'}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-red-500'}`}></div>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="block font-display text-xs font-bold uppercase tracking-wider text-gray-400">
                                API Access Key
                            </label>
                            <div className="flex gap-2 relative">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className={`flex-grow bg-gray-900 text-white font-mono text-sm px-4 py-3 border ${apiKey ? 'border-green-500' : 'border-gray-700'} focus:border-white outline-none transition-colors`}
                                    placeholder="AIza..."
                                />
                                <button 
                                    onClick={handleSaveKey}
                                    className="bg-white text-black px-6 font-bold font-display text-sm hover:bg-gray-200 transition-colors"
                                >
                                    {keySaved ? <Check size={18} /> : 'UPDATE'}
                                </button>
                            </div>
                            <p className="text-[10px] font-mono text-gray-500">
                                The API Key is securely stored in your local browser storage. It allows the AI to control your Second Brain.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SYSTEM / AUDIT LOGS TAB */}
        {activeTab === 'system' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                         <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Diagnostics</h3>
                         <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time system events and development roadmap.</p>
                    </div>
                    <div className="flex gap-2">
                        <NoirButton onClick={handleExportData} variant="secondary" className="px-3">
                            <div className="flex items-center gap-2 text-xs"><Download size={14}/> EXPORT JSON</div>
                        </NoirButton>
                    </div>
                </div>

                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Log Terminal */}
                    <div className="lg:col-span-2 bg-[#0c0c0c] border-4 border-black dark:border-white shadow-hard dark:shadow-hard-white p-4 font-mono text-xs overflow-hidden flex flex-col rounded-sm">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2">
                            <div className="flex items-center gap-2 text-green-500">
                                <Terminal size={14} />
                                <span>audit.log -f</span>
                            </div>
                            <div className="flex gap-1">
                                {['ALL', 'DB', 'AI'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setLogFilter(cat as any)}
                                        className={`px-2 py-0.5 text-[10px] ${logFilter === cat ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto space-y-1 custom-scrollbar">
                            {loadingLogs && <div className="text-gray-500">Connecting...</div>}
                            
                            {!loadingLogs && filteredLogs.length === 0 && (
                                <div className="text-gray-500">No logs found.</div>
                            )}

                            {filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-2 hover:bg-white/5 p-1 rounded group cursor-default">
                                    <span className="text-gray-600 min-w-[130px]">
                                        {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                                    </span>
                                    <span className={`w-16 font-bold ${
                                        log.level === 'ERROR' ? 'text-red-500' :
                                        log.level === 'WARN' ? 'text-yellow-500' :
                                        log.level === 'SUCCESS' ? 'text-green-400' :
                                        'text-blue-400'
                                    }`}>
                                        [{log.level}]
                                    </span>
                                    <span className="text-purple-400 w-20 font-bold">[{log.category}]</span>
                                    <span className="text-gray-300 group-hover:text-white transition-colors">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roadmap / Missing Things Plan */}
                    <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-4 flex flex-col shadow-hard-sm">
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-black/10 dark:border-white/10 pb-2">
                            <Info size={16} />
                            <h4 className="font-bold font-display uppercase text-sm">System Roadmap</h4>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-4 font-mono text-xs">
                            <div className="opacity-50">
                                <h5 className="font-bold text-black dark:text-white mb-1">COMPLETED</h5>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li className="line-through">Core OS Kernel</li>
                                    <li className="line-through">Visual Config</li>
                                    <li className="line-through">Net Worth Analytics</li>
                                </ul>
                            </div>
                             <div>
                                <h5 className="font-bold text-black dark:text-white mb-1">IN DEVELOPMENT</h5>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>Data Restore (Import)</li>
                                    <li>Mobile Swipe Gestures</li>
                                    <li>Global Command Palette</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-black dark:text-white mb-1">PLANNED</h5>
                                <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-500">
                                    <li>Offline Sync Refinement</li>
                                    <li>Calendar Master View</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};
