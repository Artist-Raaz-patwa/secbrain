
import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Client, Project, ProjectTask } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, Users, Briefcase, FileText, ChevronDown, ChevronRight, Check, DollarSign, Edit2, Trash2, Settings, TrendingUp, PieChart, BarChart } from 'lucide-react';
import { AddClientModal } from './AddClientModal';
import { ReportGenerator } from './ReportGenerator';
import { BillTaskModal } from './BillTaskModal';
import { EditProjectModal } from './EditProjectModal';
import { EditClientModal } from './EditClientModal';
import { NoirBarChart, NoirPieChart } from '../ui/NoirCharts'; // Updated Import

export const CRMModule: React.FC = () => {
    const { user, clients, setClients, projects, setProjects, projectTasks, setProjectTasks, settings } = useAppStore();
    const [viewMode, setViewMode] = useState<'dashboard' | 'clients' | 'reports'>('dashboard');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    // Project Board State
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskHours, setNewTaskHours] = useState('');
    const [newTaskRate, setNewTaskRate] = useState('');
    const [addingToProject, setAddingToProject] = useState<string | null>(null);

    // Chart Toggle State
    const [chartMode, setChartMode] = useState<'revenue' | 'efficiency' | 'clients'>('revenue');

    // Editing State
    const [taskToBill, setTaskToBill] = useState<ProjectTask | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    // Fetch Data
    useEffect(() => {
        if (!user) return;
        
        const unsubClients = db.collection('clients')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched = snap.docs.map(d => ({id: d.id, ...d.data()} as Client));
                fetched.sort((a,b) => b.createdAt - a.createdAt);
                setClients(fetched);
            }, (error) => {
                console.error("CRM Clients sync error:", error);
            });
        
        const unsubProjects = db.collection('projects')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched = snap.docs.map(d => ({id: d.id, ...d.data()} as Project));
                setProjects(fetched);
            }, (error) => {
                console.error("CRM Projects sync error:", error);
            });
        
        const unsubTasks = db.collection('project_tasks')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched = snap.docs.map(d => ({id: d.id, ...d.data()} as ProjectTask));
                fetched.sort((a,b) => b.createdAt - a.createdAt);
                setProjectTasks(fetched);
            }, (error) => {
                console.error("CRM Tasks sync error:", error);
            });

        return () => { unsubClients(); unsubProjects(); unsubTasks(); };
    }, [user]);

    // Helpers
    const handleAddProject = async (clientId: string) => {
        if (!newProjectTitle.trim() || !user) return;
        try {
            await db.collection('projects').add({
                clientId,
                title: newProjectTitle,
                status: 'planning',
                userId: user.uid,
                createdAt: Date.now()
            });
            setNewProjectTitle('');
        } catch(e) { console.error("Failed to add project", e); }
    };

    const handleAddTask = async (projectId: string) => {
        if (!newTaskTitle.trim() || !newTaskHours || !user) return;
        try {
            await db.collection('project_tasks').add({
                projectId,
                title: newTaskTitle,
                hours: parseFloat(newTaskHours),
                rate: parseFloat(newTaskRate) || 50, 
                completed: false, // Start false so we can bill it later
                billed: false,
                userId: user.uid,
                createdAt: Date.now()
            });
            setAddingToProject(null);
            setNewTaskTitle('');
            setNewTaskHours('');
        } catch(e) { console.error("Failed to add task", e); }
    };

    const handleToggleTask = async (task: ProjectTask) => {
        if (!task.completed) {
            // Opening billing modal
            setTaskToBill(task);
        } else {
            // Uncheck (simple revert)
            try {
                await db.collection('project_tasks').doc(task.id).update({ completed: false });
            } catch(e) { console.error(e); }
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if(confirm('Delete this task?')) {
            await db.collection('project_tasks').doc(taskId).delete();
        }
    };

    // Metrics
    const activeClients = clients.filter(c => c.status === 'active');
    const totalRevenuePipeline = projectTasks.reduce((acc, t) => acc + (t.hours * t.rate), 0);
    const avgProjectValue = projects.length > 0 ? totalRevenuePipeline / projects.length : 0;

    // Revenue Trend Chart Data
    const revenueTrend = useMemo(() => {
        const monthMap: Record<string, number> = {};
        projectTasks.forEach(t => {
            if(t.completed || t.billed) {
                const d = new Date(t.createdAt);
                const k = d.toLocaleDateString('default', { month: 'short' });
                monthMap[k] = (monthMap[k] || 0) + (t.hours * t.rate);
            }
        });
        const data = Object.entries(monthMap).map(([label, value]) => ({ label, value }));
        return data.length > 0 ? data : [{ label: 'No Data', value: 0 }];
    }, [projectTasks]);

    // Efficiency Data
    const efficiencyData = useMemo(() => {
        const billed = projectTasks.filter(t => t.billed).reduce((acc, t) => acc + (t.hours * t.rate), 0);
        const unbilled = projectTasks.filter(t => !t.billed && t.completed).reduce((acc, t) => acc + (t.hours * t.rate), 0);
        const pipeline = projectTasks.filter(t => !t.completed).reduce((acc, t) => acc + (t.hours * t.rate), 0);
        
        return [
            { label: 'Settled', value: billed },
            { label: 'Unbilled', value: unbilled },
            { label: 'Pipeline', value: pipeline }
        ];
    }, [projectTasks]);

    // Top Clients Data
    const topClientsData = useMemo(() => {
        const clientRevenue: Record<string, number> = {};
        projectTasks.forEach(t => {
            if(t.completed || t.billed) {
                const proj = projects.find(p => p.id === t.projectId);
                if(proj) {
                    const client = clients.find(c => c.id === proj.clientId);
                    if(client) {
                        clientRevenue[client.company] = (clientRevenue[client.company] || 0) + (t.hours * t.rate);
                    }
                }
            }
        });
        return Object.entries(clientRevenue)
            .map(([label, value]) => ({ label, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);
    }, [projectTasks, projects, clients]);

    if (viewMode === 'reports') {
        return <ReportGenerator clients={clients} projects={projects} tasks={projectTasks} onClose={() => setViewMode('dashboard')} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Agency_CRM</h2>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">CLIENTS / PROJECTS / REPORTS</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode('dashboard')}
                        className={`px-4 py-2 font-bold font-mono text-xs uppercase border-2 border-black dark:border-white ${viewMode === 'dashboard' ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setViewMode('clients')}
                        className={`px-4 py-2 font-bold font-mono text-xs uppercase border-2 border-black dark:border-white ${viewMode === 'clients' ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
                    >
                        Management
                    </button>
                    <NoirButton onClick={() => setViewMode('reports')} variant="secondary">
                        <div className="flex items-center gap-2"><FileText size={18}/> REPORTS</div>
                    </NoirButton>
                </div>
            </div>

            {/* DASHBOARD VIEW */}
            {viewMode === 'dashboard' && (
                <div className="space-y-6">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-display font-black text-xl uppercase">Active Clients</h3>
                                <Users size={24} className="text-gray-400"/>
                            </div>
                            <div className="text-4xl font-mono font-bold">{activeClients.length}</div>
                            <div className="text-xs font-mono text-gray-500 mt-2">TOTAL: {clients.length}</div>
                        </div>
                        
                        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-display font-black text-xl uppercase">Total Pipeline</h3>
                                <Briefcase size={24} className="text-gray-400"/>
                            </div>
                            <div className="text-4xl font-mono font-bold">{settings.baseCurrency}{totalRevenuePipeline.toLocaleString()}</div>
                            <div className="text-xs font-mono text-gray-500 mt-2">ACROSS {projects.length} PROJECTS</div>
                        </div>

                         <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-display font-black text-xl uppercase">Avg Value</h3>
                                <TrendingUp size={24} className="text-gray-400"/>
                            </div>
                            <div className="text-4xl font-mono font-bold">{settings.baseCurrency}{avgProjectValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-xs font-mono text-gray-500 mt-2">PER PROJECT</div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-display font-black text-xl uppercase">Billed Status</h3>
                                <DollarSign size={24} className="text-gray-400"/>
                            </div>
                            {/* Simple Bar */}
                            <div className="w-full h-4 bg-gray-200 dark:bg-neutral-800 mt-2 border border-black dark:border-white relative">
                                <div className="h-full bg-black dark:bg-white absolute left-0 top-0" style={{ width: '45%' }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono mt-2 uppercase">
                                <span>Unbilled</span>
                                <span>Billed</span>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Chart */}
                    <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white min-h-[350px]">
                         <div className="flex justify-between items-center mb-6 border-b-2 border-gray-200 dark:border-gray-800 pb-2">
                             <div className="flex items-center gap-2">
                                {chartMode === 'revenue' ? <TrendingUp size={20}/> : chartMode === 'efficiency' ? <PieChart size={20}/> : <BarChart size={20}/>}
                                <h3 className="font-display font-black text-xl uppercase">
                                    {chartMode === 'revenue' ? 'Revenue Trend' : chartMode === 'efficiency' ? 'Value Distribution' : 'Top Clients'}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setChartMode('revenue')} 
                                    className={`px-3 py-1 text-[10px] font-bold uppercase border border-black dark:border-white ${chartMode === 'revenue' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500'}`}
                                >
                                    Trend
                                </button>
                                <button 
                                    onClick={() => setChartMode('efficiency')} 
                                    className={`px-3 py-1 text-[10px] font-bold uppercase border border-black dark:border-white ${chartMode === 'efficiency' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500'}`}
                                >
                                    Dist
                                </button>
                                <button 
                                    onClick={() => setChartMode('clients')} 
                                    className={`px-3 py-1 text-[10px] font-bold uppercase border border-black dark:border-white ${chartMode === 'clients' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500'}`}
                                >
                                    Clients
                                </button>
                            </div>
                        </div>
                        {chartMode === 'revenue' ? (
                            <NoirBarChart data={revenueTrend} height={250} />
                        ) : chartMode === 'efficiency' ? (
                            <NoirPieChart data={efficiencyData} height={250} />
                        ) : (
                            <NoirBarChart data={topClientsData} height={250} />
                        )}
                    </div>
                </div>
            )}

            {/* CLIENT MANAGEMENT VIEW */}
            {viewMode === 'clients' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                         <NoirButton onClick={() => setIsClientModalOpen(true)}>
                            <div className="flex items-center gap-2"><Plus size={18}/> ADD CLIENT</div>
                        </NoirButton>
                    </div>

                    {clients.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-neutral-700 font-mono text-gray-400">
                            NO CLIENTS IN DATABASE
                        </div>
                    ) : (
                        clients.map(client => (
                            <div key={client.id} className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white overflow-hidden transition-all">
                                {/* Client Header Row */}
                                <div 
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800"
                                    onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {expandedClient === client.id ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                                        <div>
                                            <h3 className="font-display font-bold text-lg uppercase tracking-wide">{client.company}</h3>
                                            <p className="font-mono text-xs text-gray-500">{client.name} • {client.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-1 text-[10px] font-bold font-mono uppercase border ${client.status === 'active' ? 'bg-green-100 text-green-800 border-green-800' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                                            {client.status}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setClientToEdit(client); }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded"
                                        >
                                            <Settings size={16} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Projects Dropdown */}
                                {expandedClient === client.id && (
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-800 space-y-4">
                                        {projects.filter(p => p.clientId === client.id).map(project => (
                                            <div key={project.id} className="border-2 border-black/10 dark:border-white/10 bg-white dark:bg-black p-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold font-mono text-sm uppercase">{project.title}</h4>
                                                            <button onClick={() => setProjectToEdit(project)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] bg-black text-white px-1">STATUS: {project.status.toUpperCase()}</span>
                                                    </div>
                                                    <div className="text-right font-mono text-xs">
                                                        <div className="text-gray-500">TASKS</div>
                                                        <div className="font-bold text-lg">{projectTasks.filter(t => t.projectId === project.id).length}</div>
                                                    </div>
                                                </div>

                                                {/* Task List */}
                                                <div className="space-y-1 mb-4">
                                                    {projectTasks.filter(t => t.projectId === project.id).map(task => (
                                                        <div key={task.id} className="flex justify-between items-center text-xs font-mono border-b border-dashed border-gray-200 dark:border-neutral-800 py-2 group">
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => handleToggleTask(task)}
                                                                    className={`w-4 h-4 border border-black dark:border-white flex items-center justify-center transition-colors ${task.completed ? 'bg-black dark:bg-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                                                                >
                                                                    {task.completed && <Check size={12} className="text-white dark:text-black" />}
                                                                </button>
                                                                <span className={task.completed ? 'line-through opacity-50' : ''}>{task.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="opacity-70">{task.hours} hrs @ {settings.baseCurrency}{task.rate}</span>
                                                                <span className="font-bold">{settings.baseCurrency}{(task.hours * task.rate).toFixed(2)}</span>
                                                                <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                                                    <Trash2 size={12}/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {projectTasks.filter(t => t.projectId === project.id).length === 0 && (
                                                        <div className="text-center text-[10px] text-gray-400 italic py-2">No tasks logged.</div>
                                                    )}
                                                </div>

                                                {/* Add Task Inline Form */}
                                                {addingToProject === project.id ? (
                                                    <div className="flex gap-2 items-center bg-gray-100 dark:bg-neutral-900 p-2 border border-black dark:border-white animate-in slide-in-from-left">
                                                        <input className="flex-1 bg-transparent outline-none text-xs font-mono text-black dark:text-white" placeholder="Task Desc..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus />
                                                        <input className="w-16 bg-transparent outline-none text-xs font-mono border-l border-gray-300 px-2 text-black dark:text-white" placeholder="Hrs" type="number" value={newTaskHours} onChange={e => setNewTaskHours(e.target.value)} />
                                                        <input className="w-16 bg-transparent outline-none text-xs font-mono border-l border-gray-300 px-2 text-black dark:text-white" placeholder="Rate" type="number" value={newTaskRate} onChange={e => setNewTaskRate(e.target.value)} />
                                                        <button onClick={() => handleAddTask(project.id)} className="text-xs font-bold bg-black text-white px-2 py-1 hover:opacity-80">SAVE</button>
                                                        <button onClick={() => setAddingToProject(null)}><Plus size={14} className="rotate-45"/></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setAddingToProject(project.id); setNewTaskRate(settings.defaultHourlyRate.toString()); }} className="text-[10px] font-bold font-mono uppercase hover:underline flex items-center gap-1 mt-2">
                                                        <Plus size={10}/> ADD BILLABLE TASK
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* New Project Input */}
                                        <div className="flex gap-2 mt-6">
                                            <input 
                                                className="border-b-2 border-black dark:border-white bg-transparent outline-none font-mono text-sm px-2 py-1 flex-grow text-black dark:text-white placeholder:text-gray-400"
                                                placeholder="New Project Title..."
                                                value={newProjectTitle}
                                                onChange={e => setNewProjectTitle(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleAddProject(client.id)}
                                                className="font-bold font-mono text-xs uppercase bg-black text-white dark:bg-white dark:text-black px-4 py-1 hover:opacity-80"
                                            >
                                                Init Project
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <AddClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} />
            
            {taskToBill && (
                <BillTaskModal task={taskToBill} onClose={() => setTaskToBill(null)} />
            )}
            
            {projectToEdit && (
                <EditProjectModal project={projectToEdit} onClose={() => setProjectToEdit(null)} />
            )}
            
            {clientToEdit && (
                <EditClientModal client={clientToEdit} onClose={() => setClientToEdit(null)} />
            )}
        </div>
    );
};
