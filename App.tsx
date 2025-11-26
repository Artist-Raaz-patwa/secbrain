
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { useAppStore } from './store/useAppStore';
import { Auth } from './components/Auth';
import { NotebookShelf } from './components/Notebooks/NotebookShelf';
import { TasksModule } from './components/Tasks/TasksModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { ChatModule } from './components/Chat/ChatModule';
import { HabitsModule } from './components/Habits/HabitsModule';
import { WalletModule } from './components/Wallet/WalletModule';
import { CRMModule } from './components/CRM/CRMModule';
import { DashboardModule } from './components/Dashboard/DashboardModule';
import { GoalsModule } from './components/Goals/GoalsModule';
import { AnalyticsModule } from './components/Analytics/AnalyticsModule';
import { CreateNotebookModal } from './components/Notebooks/CreateNotebookModal';
import { CreateTaskModal } from './components/Tasks/CreateTaskModal';
import { CreateNoteModal } from './components/Notes/CreateNoteModal';
import { ChatInterface } from './components/Brain/ChatInterface';
import { OnboardingModal } from './components/OnboardingModal';
import { LayoutDashboard, Book, Settings, CheckSquare, MessageSquare, Activity, Wallet, Brain, Briefcase, Terminal, Target, BarChart2 } from 'lucide-react';
import { AppSettings, ViewState } from './types';

// Enhanced Boot Sequence Component
const BootSequence = () => {
    const [lines, setLines] = useState<string[]>([]);
    
    useEffect(() => {
        const sequence = [
            "BIOS DATE 01/01/24 14:22:51 VER 1.02",
            "CPU: NEURAL CORE X9 @ 4.20GHz",
            "64GB RAM SYSTEM DETECTED",
            "DETECTING STORAGE... OK",
            "MOUNTING FIRESTORE SHARDS... OK",
            "INITIALIZING NEURAL LINK... OK",
            "LOADING MODULES [AUTH, DB, AI]... OK",
            "SYSTEM READY."
        ];
        
        let delay = 0;
        sequence.forEach((line, index) => {
            delay += Math.random() * 250 + 50;
            setTimeout(() => {
                setLines(prev => [...prev, line]);
            }, delay);
        });
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono text-xs p-8 cursor-wait">
            <div className="w-full max-w-lg border-2 border-white p-6 shadow-hard-white animate-pop-in">
                <div className="flex items-center gap-2 mb-4 border-b border-white pb-2">
                    <Terminal size={16} className="animate-spin" />
                    <span className="font-bold tracking-widest">BOOT_LOADER_V1.2</span>
                </div>
                <div className="space-y-1 h-48 overflow-hidden flex flex-col justify-end">
                    {lines.map((line, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-gray-500">{`>`}</span>
                            <span className={i === lines.length - 1 ? 'animate-pulse text-green-400' : 'text-gray-300'}>{line}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase">
                        <span>Loading Kernels</span>
                        <span>{Math.min(100, Math.round((lines.length / 8) * 100))}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 border border-gray-700 overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-300 ease-out" 
                            style={{ width: `${(lines.length / 8) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            <div className="mt-8 text-gray-500 animate-pulse">PRESSING ANY KEY...</div>
        </div>
    );
};

const App: React.FC = () => {
  const { user, setUser, isLoading, setLoading, settings, updateSettings } = useAppStore();
  const [bootComplete, setBootComplete] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      // Ensure boot sequence lasts at least 2.5s for "aesthetic" reasons
      setTimeout(() => {
        setLoading(false);
        setBootComplete(true);
      }, 2500); 
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!user) {
        setSettingsLoaded(true);
        return;
    } 

    const unsubscribe = db.collection('settings').doc(user.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const cloudSettings = doc.data() as Partial<AppSettings>;
                updateSettings(cloudSettings);
            } else {
                db.collection('settings').doc(user.uid).set(settings);
            }
            setSettingsLoaded(true);
        }, (err) => {
            console.error("Settings sync failed", err);
            setSettingsLoaded(true);
        });
    return () => unsubscribe();
  }, [user]); 

  if (isLoading || !bootComplete || (user && !settingsLoaded)) {
    return <BootSequence />;
  }

  // Visual settings classes
  const densityClass = settings.density === 'compact' ? 'compact-ui' : 'comfortable-ui';
  const fontSizeClass = settings.fontSize === 'small' ? 'text-xs' : settings.fontSize === 'large' ? 'text-base' : 'text-sm';
  
  // Dynamic Styles
  const borderRadiusStyle = settings.borderRadius === 'sharp' ? `* { border-radius: 0px !important; }` : ``;
  
  // Border Thickness Override
  let borderStyle = '';
  if (settings.borderThickness === 'thin') {
      borderStyle = `.border-2 { border-width: 1px !important; } .border-4 { border-width: 2px !important; }`;
  } else if (settings.borderThickness === 'thick') {
      borderStyle = `.border-2 { border-width: 3px !important; } .border-4 { border-width: 6px !important; }`;
  }

  return (
    <div className={`${settings.theme === 'dark' ? 'dark' : ''} ${densityClass} ${fontSizeClass}`}>
      <style>{borderRadiusStyle + borderStyle}</style>
      <AppContent />
    </div>
  );
};

const AppContent: React.FC = () => {
    const { user, settings, currentView, setView } = useAppStore();
    
    if (!user) return <Auth />;

    // Dynamic Background Style
    const getBackgroundStyle = () => {
        const isDark = settings.theme === 'dark';
        const baseColor = isDark ? '#050505' : '#FAFAFA'; 
        
        if (!settings.showGrid) return { backgroundColor: baseColor };

        const dotColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        
        // Grid Styles
        if (settings.gridStyle === 'lines') {
            return {
                backgroundColor: baseColor,
                backgroundImage: `linear-gradient(${dotColor} 1px, transparent 1px), linear-gradient(90deg, ${dotColor} 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            };
        } else if (settings.gridStyle === 'cross') {
             return {
                backgroundColor: baseColor,
                backgroundImage: `radial-gradient(${dotColor} 1px, transparent 0), radial-gradient(${dotColor} 1px, transparent 0)`,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
            };
        }
        
        // Default Dots
        return {
            backgroundColor: baseColor,
            backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
        };
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardModule />;
            case 'notebooks': return <NotebookShelf />;
            case 'tasks': return <TasksModule />;
            case 'settings': return <SettingsModule />;
            case 'chat': return <ChatModule />;
            case 'habits': return <HabitsModule />;
            case 'wallet': return <WalletModule />;
            case 'crm': return <CRMModule />;
            case 'goals': return <GoalsModule />;
            case 'analytics': return <AnalyticsModule />;
            default: return <NotebookShelf />;
        }
    };

    const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
        <button 
            onClick={() => setView(view)}
            className={`w-full p-4 flex items-center gap-3 transition-all border-l-4 group relative overflow-hidden
            ${currentView === view 
                ? 'border-black dark:border-white bg-black/5 dark:bg-white/10 text-black dark:text-white' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}
            `}
        >
            <div className={`absolute inset-0 bg-black/5 dark:bg-white/5 translate-x-[-100%] transition-transform duration-300 ${currentView === view ? 'translate-x-0' : 'group-hover:translate-x-0'}`}></div>
            <Icon size={20} className={`relative z-10 transition-transform duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`} />
            <span className="relative z-10 font-mono text-xs uppercase tracking-widest font-bold hidden md:inline">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen text-black dark:text-white transition-colors duration-300 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black" style={getBackgroundStyle()}>
            
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-16 md:w-64 bg-white dark:bg-neutral-900 border-r-2 border-black dark:border-white z-40 flex flex-col shadow-hard dark:shadow-hard-white animate-slide-up">
                <div className="p-6 border-b-2 border-black dark:border-white flex items-center gap-3 justify-center md:justify-start bg-gray-50 dark:bg-neutral-800">
                    <div className="bg-black dark:bg-white text-white dark:text-black p-2 shadow-sm hover:rotate-12 transition-transform duration-500">
                        <Brain size={24} />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="font-display font-black text-xl tracking-tighter leading-none">SECOND</h1>
                        <h1 className="font-display font-black text-xl tracking-tighter leading-none">BRAIN</h1>
                    </div>
                </div>

                <nav className="flex-grow py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem view="analytics" icon={BarChart2} label="Analytics" />
                    <NavItem view="notebooks" icon={Book} label="Notebooks" />
                    <NavItem view="tasks" icon={CheckSquare} label="Tasks" />
                    <NavItem view="goals" icon={Target} label="Goals" />
                    <NavItem view="crm" icon={Briefcase} label="CRM Agency" />
                    <NavItem view="wallet" icon={Wallet} label="Finance" />
                    <NavItem view="habits" icon={Activity} label="Habits" />
                    <NavItem view="chat" icon={MessageSquare} label="Neural Chat" />
                    <NavItem view="settings" icon={Settings} label="System" />
                </nav>

                <div className="p-4 border-t-2 border-black dark:border-white bg-gray-50 dark:bg-neutral-800">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold font-mono text-xs border border-gray-500 ring-2 ring-transparent group-hover:ring-black dark:group-hover:ring-white transition-all">
                            {user.email?.substring(0,2).toUpperCase()}
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <div className="font-bold text-xs font-display uppercase tracking-wider truncate">{settings.userName || 'User'}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">ONLINE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content with Transition */}
            <main className="flex-1 ml-16 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen custom-scrollbar">
                <div key={currentView} className="animate-slide-up">
                    {renderContent()}
                </div>
            </main>

            {/* Global Overlays */}
            <CreateNotebookModal />
            <CreateTaskModal />
            <CreateNoteModal />
            <ChatInterface />
            {!settings.hasCompletedOnboarding && <OnboardingModal />}
        </div>
    );
};

export default App;
