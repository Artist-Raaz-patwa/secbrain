
import firebase from 'firebase/compat/app';

export interface Notebook {
  id: string;
  title: string;
  type: 'general' | 'journal';
  coverColor: 'black' | 'white' | 'striped';
  userId: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  userId: string;
  notebookId?: string; // Link to a notebook
  tags?: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  userId: string;
  subtasks: Subtask[];
}

export interface Habit {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  archived?: boolean;
}

export interface HabitLog {
  id: string; // Composite key usually: habitId_date
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  userId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

// WALLET TYPES
export interface WalletAccount {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit';
    balance: number;
    currency: string;
    colorTheme: 'blue' | 'purple' | 'green' | 'black' | 'gold' | 'red' | 'cyan' | 'pink' | 'orange' | 'teal' | 'silver' | 'indigo';
    userId: string;
    createdAt: number;
    excludeFromTotals?: boolean; // New property for calculation selection
}

export interface Transaction {
    id: string;
    accountId: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: number; // Timestamp
    userId: string;
}

// CRM TYPES
export interface Client {
    id: string;
    name: string;
    company: string;
    email: string;
    status: 'active' | 'lead' | 'inactive';
    userId: string;
    createdAt: number;
}

export interface Project {
    id: string;
    clientId: string;
    title: string;
    status: 'planning' | 'in-progress' | 'completed' | 'paused';
    hourlyRate?: number; // Optional override
    budget?: number;
    deadline?: number;
    userId: string;
}

export interface ProjectTask {
    id: string;
    projectId: string;
    title: string;
    completed: boolean;
    hours: number;
    rate: number; // Snapshot of rate at time of creation
    billed: boolean;
    userId: string;
    createdAt: number;
}

// GOAL TYPES
export interface Goal {
    id: string;
    title: string;
    targetDate: number; // Timestamp
    targetAmount?: number; // Optional financial goal or metric
    currentAmount?: number;
    imageUrl?: string; // Optional cover image
    userId: string;
    createdAt: number;
    status: 'active' | 'completed' | 'failed';
}

// LOGGING TYPES
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogCategory = 'AUTH' | 'DB' | 'AI' | 'SYSTEM' | 'USER' | 'WALLET' | 'CRM' | 'GOALS';

export interface LogEntry {
    id: string;
    userId: string;
    timestamp: number;
    level: LogLevel;
    category: LogCategory;
    message: string;
    details?: string; // Optional context
}

// DASHBOARD TYPES
export type WidgetType = 'clock' | 'modules' | 'quick_note' | 'tasks_list' | 'wallet_summary' | 'habit_today' | 'goals_list';

export interface DashboardWidget {
    id: string;
    type: WidgetType;
    x: number; // Grid layout placeholder (future proofing)
    y: number;
}

// ANALYTICS TYPES
export type AnalyticsWidgetType = 'net_worth' | 'expense_pie' | 'revenue_bar' | 'task_pie' | 'habit_trend' | 'goal_progress';

export interface AnalyticsWidget {
    id: string;
    type: AnalyticsWidgetType;
    x: number;
    y: number;
}

export interface AppSettings {
  // Visuals
  theme: 'light' | 'dark';
  showGrid: boolean;
  gridStyle: 'dots' | 'lines' | 'cross'; // NEW
  reducedMotion: boolean;
  soundEnabled: boolean;
  density: 'compact' | 'comfortable';
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'sharp' | 'rounded';
  borderThickness: 'thin' | 'standard' | 'thick'; // NEW

  // Identity
  userName?: string;
  hasCompletedOnboarding?: boolean;

  // Module Configuration
  defaultHourlyRate: number; // CRM
  invoicePrefix: string; // NEW
  defaultPaymentTerms: string; // NEW
  baseCurrency: string;      // Wallet
  weekStartsOn: 'mon' | 'sun'; // Habits
  defaultTaxRate: number;    
  dateFormat: 'US' | 'INTL';
  currencyPosition: 'left' | 'right';

  // Dashboard
  dashboardLayout: DashboardWidget[];
  
  // Analytics
  analyticsLayout: AnalyticsWidget[];
}

export type ViewState = 'dashboard' | 'notebooks' | 'tasks' | 'settings' | 'chat' | 'habits' | 'wallet' | 'crm' | 'goals' | 'analytics';

export interface AppState {
  user: firebase.User | null;
  currentView: ViewState;
  settings: AppSettings;
  
  // Notebook State
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  selectedNoteId: string | null; // The currently open page
  
  // Task State
  tasks: Task[];
  
  // Habit State
  habits: Habit[];
  habitLogs: Record<string, boolean>; // Key: habitId_date, Value: completed

  // Chat State
  conversations: Conversation[];
  activeConversationId: string | null;

  // Wallet State
  accounts: WalletAccount[];
  transactions: Transaction[];

  // CRM State
  clients: Client[];
  projects: Project[];
  projectTasks: ProjectTask[];

  // Goal State
  goals: Goal[];

  isNoteModalOpen: boolean; 
  isNotebookModalOpen: boolean;
  isTaskModalOpen: boolean;

  notes: Note[]; 
  isLoading: boolean;
  
  // Actions
  setUser: (user: firebase.User | null) => void;
  setView: (view: ViewState) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  setNotebooks: (notebooks: Notebook[]) => void;
  addNotebook: (notebook: Notebook) => void;
  setSelectedNotebookId: (id: string | null) => void;
  setSelectedNoteId: (id: string | null) => void;

  setNoteModalOpen: (isOpen: boolean) => void;
  setNotebookModalOpen: (isOpen: boolean) => void;
  setTaskModalOpen: (isOpen: boolean) => void;
  
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;

  setHabits: (habits: Habit[]) => void;
  setHabitLogs: (logs: Record<string, boolean>) => void;

  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;

  setAccounts: (accounts: WalletAccount[]) => void;
  setTransactions: (transactions: Transaction[]) => void;

  setClients: (clients: Client[]) => void;
  setProjects: (projects: Project[]) => void;
  setProjectTasks: (projectTasks: ProjectTask[]) => void;

  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  setLoading: (loading: boolean) => void;
}
