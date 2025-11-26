
import { create } from 'zustand';
import { AppState, Note, Notebook, Task, ViewState, Conversation, Habit, WalletAccount, Transaction, Client, Project, ProjectTask, Goal } from '../types';

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentView: 'dashboard',
  
  settings: {
    showGrid: true,
    gridStyle: 'dots',
    reducedMotion: false,
    soundEnabled: true,
    density: 'comfortable',
    fontSize: 'medium',
    borderRadius: 'sharp',
    borderThickness: 'standard',
    
    userName: 'User',
    theme: 'light',
    
    defaultHourlyRate: 50,
    invoicePrefix: 'INV-',
    defaultPaymentTerms: 'Net 30',
    baseCurrency: '$',
    weekStartsOn: 'mon',
    defaultTaxRate: 0,
    dateFormat: 'US',
    currencyPosition: 'left',

    hasCompletedOnboarding: false,
    dashboardLayout: [
        { id: '1', type: 'clock', x: 0, y: 0 },
        { id: '2', type: 'modules', x: 0, y: 1 },
        { id: '3', type: 'tasks_list', x: 0, y: 2 }
    ],
    analyticsLayout: [
        { id: 'a1', type: 'net_worth', x: 0, y: 0 },
        { id: 'a2', type: 'expense_pie', x: 1, y: 0 },
        { id: 'a3', type: 'revenue_bar', x: 0, y: 1 },
        { id: 'a4', type: 'task_pie', x: 1, y: 1 },
        { id: 'a5', type: 'habit_trend', x: 0, y: 2 },
    ]
  },

  notebooks: [],
  selectedNotebookId: null,
  selectedNoteId: null,
  
  tasks: [],

  habits: [],
  habitLogs: {},

  conversations: [],
  activeConversationId: null,

  accounts: [],
  transactions: [],

  clients: [],
  projects: [],
  projectTasks: [],

  goals: [],

  isNoteModalOpen: false,
  isNotebookModalOpen: false,
  isTaskModalOpen: false,
  
  notes: [],
  isLoading: true,

  setUser: (user) => set({ user }),
  
  setView: (view: ViewState) => set({ currentView: view }),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  setNotebooks: (notebooks) => set({ notebooks }),
  addNotebook: (notebook) => set((state) => ({ notebooks: [notebook, ...state.notebooks] })),
  
  setSelectedNotebookId: (id) => set({ selectedNotebookId: id }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  setNoteModalOpen: (isOpen) => set({ isNoteModalOpen: isOpen }),
  setNotebookModalOpen: (isOpen) => set({ isNotebookModalOpen: isOpen }),
  setTaskModalOpen: (isOpen) => set({ isTaskModalOpen: isOpen }),
  
  setNotes: (notes: Note[]) => set({ notes }),
  addNote: (note: Note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n))
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),

  setTasks: (tasks: Task[]) => set({ tasks }),
  addTask: (task: Task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)
  })),

  setHabits: (habits) => set({ habits }),
  setHabitLogs: (logs) => set({ habitLogs: logs }),

  setConversations: (conversations: Conversation[]) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setAccounts: (accounts: WalletAccount[]) => set({ accounts }),
  setTransactions: (transactions: Transaction[]) => set({ transactions }),

  setClients: (clients: Client[]) => set({ clients }),
  setProjects: (projects: Project[]) => set({ projects }),
  setProjectTasks: (projectTasks: ProjectTask[]) => set({ projectTasks }),

  setGoals: (goals: Goal[]) => set({ goals }),
  addGoal: (goal: Goal) => set((state) => ({ goals: [goal, ...state.goals] })),
  updateGoal: (id, updates) => set((state) => ({
    goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g))
  })),
  removeGoal: (id) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== id)
  })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
