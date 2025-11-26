
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { useAppStore } from '../store/useAppStore';
import { db } from '../firebase';
import { LoggerService } from './logger';

const controlTools: FunctionDeclaration[] = [
  {
    name: "change_view",
    description: "Navigate the user to a different section of the application.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          enum: ["dashboard", "notebooks", "tasks", "settings", "chat", "habits", "wallet", "crm", "goals", "analytics"],
          description: "The view to navigate to."
        }
      },
      required: ["view"]
    }
  },
  // --- NOTEBOOK & NOTES TOOLS ---
  {
    name: "create_notebook",
    description: "Create a new notebook or journal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        type: { type: Type.STRING, enum: ["general", "journal"] }
      },
      required: ["title", "type"]
    }
  },
  {
    name: "list_notebooks",
    description: "List all notebooks titles.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "read_notebook",
    description: "Read all content within a specific notebook by providing its name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        notebookName: { type: Type.STRING, description: "The title of the notebook to read (e.g. 'Journal', 'Ideas')." }
      },
      required: ["notebookName"]
    }
  },
  {
    name: "search_notes",
    description: "Search across all notes for specific keywords.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING }
      },
      required: ["query"]
    }
  },
  {
    name: "create_note",
    description: "Create a new note. Can optionally specify a notebook name to file it into.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        notebookName: { type: Type.STRING, description: "Optional: Name of the notebook to add this note to." }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "modify_note",
    description: "Append text to an existing note.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        noteTitle: { type: Type.STRING, description: "Title of note to find." },
        appendText: { type: Type.STRING, description: "Text to add to the note." }
      },
      required: ["noteTitle", "appendText"]
    }
  },
  // --- TASKS TOOLS ---
  {
    name: "create_task",
    description: "Create a new task.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING }
      },
      required: ["title"]
    }
  },
  {
      name: "modify_task",
      description: "Modify/Delete a task.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              currentTitle: { type: Type.STRING },
              action: { type: Type.STRING, enum: ["complete", "incomplete", "delete", "rename"] },
              newTitle: { type: Type.STRING }
          },
          required: ["currentTitle", "action"]
      }
  },
  // --- HABIT TOOLS ---
  {
    name: "create_habit",
    description: "Start tracking a new habit.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING }
      },
      required: ["title"]
    }
  },
  {
    name: "get_habits",
    description: "List all active habits and check status.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "log_habit",
    description: "Mark a habit as done/not done for today.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        habitTitle: { type: Type.STRING },
        completed: { type: Type.BOOLEAN }
      },
      required: ["habitTitle", "completed"]
    }
  },
  // --- WALLET TOOLS ---
  {
    name: "create_transaction",
    description: "Log income or expense.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["expense", "income"] },
        amount: { type: Type.NUMBER },
        description: { type: Type.STRING },
        category: { type: Type.STRING }
      },
      required: ["type", "amount", "description"]
    }
  },
  {
    name: "get_wallet_status",
    description: "Get total net worth, account balances, and recent transactions.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  // --- CRM TOOLS ---
  {
    name: "create_client",
    description: "Add a CRM client.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        company: { type: Type.STRING },
        email: { type: Type.STRING }
      },
      required: ["name", "company"]
    }
  },
  {
    name: "get_crm_data",
    description: "List clients and projects.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "create_project",
    description: "Create a project for a client.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING, description: "Approximate company name." },
        projectTitle: { type: Type.STRING }
      },
      required: ["clientName", "projectTitle"]
    }
  },
  // --- GOAL TOOLS ---
  {
    name: "create_goal",
    description: "Set a new goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        monthsFromNow: { type: Type.NUMBER },
        targetAmount: { type: Type.NUMBER }
      },
      required: ["title", "monthsFromNow"]
    }
  },
  {
    name: "get_goals",
    description: "List active goals and progress.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "update_goal",
    description: "Update goal progress or status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalTitle: { type: Type.STRING },
        addAmount: { type: Type.NUMBER, description: "Amount to ADD to current progress." },
        setStatus: { type: Type.STRING, enum: ["active", "completed", "failed"] }
      },
      required: ["goalTitle"]
    }
  },
  // --- SYSTEM ---
  {
    name: "update_settings",
    description: "Update app settings.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        theme: { type: Type.STRING, enum: ["light", "dark"] },
        showGrid: { type: Type.BOOLEAN },
        userName: { type: Type.STRING }
      }
    }
  },
  {
      name: "manage_content",
      description: "Delete content (notes, notebooks, habits, goals).",
      parameters: {
          type: Type.OBJECT,
          properties: {
              contentType: { type: Type.STRING, enum: ["note", "notebook", "habit", "goal"] },
              identifier: { type: Type.STRING },
              action: { type: Type.STRING, enum: ["delete"] }
          },
          required: ["contentType", "identifier", "action"]
      }
  }
];

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateJournalPrompt(): Promise<string> {
    if (!this.ai) return "What is on your mind today?";
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a deep, philosophical, or productivity-focused journal prompt. Under 20 words.",
      });
      return response.text?.trim() || "What did you achieve today?";
    } catch (e) { return "Write about your goals."; }
  }

  async generateReportSummary(clientName: string, projects: any[], totalAmount: number, currency: string): Promise<string> {
    if (!this.ai) return "AI Summary unavailable.";
    try {
        const currencyMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR', '¥': 'JPY', '₽': 'RUB' };
        const currencyCode = currencyMap[currency] || currency;
        const workContext = projects.map(p => `- Project "${p.title}": ${p.tasks.join(', ')}`).join('\n');
        const prompt = `Write a professional Invoice Executive Summary (60-80 words) for client ${clientName}. Total: ${currencyCode} ${totalAmount}. Work:\n${workContext}\nExplicitly mention project names and key tasks. Use currency codes.`;
        const response = await this.ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text?.trim() || "Summary generation failed.";
    } catch (e) { return "Summary error."; }
  }

  async chat(message: string, history: any[]) {
    if (!this.ai) throw new Error("AI not initialized");

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [...history, { role: 'user', parts: [{ text: message }] }],
        config: {
          tools: [{ functionDeclarations: controlTools }],
          systemInstruction: `You are the 'Second Brain' OS Chief of Staff. You have READ, WRITE, and MODIFY access to the entire system.
          
          CAPABILITIES:
          - WALLET: Check balances, Log expenses.
          - CRM: Manage clients and projects.
          - HABITS: Track and log.
          - GOALS: Manage missions.
          - NOTEBOOKS: You can READ the user's notebooks to answer questions or find context. Use 'read_notebook' with the name (e.g. "Journal").
          - NOTES: You can create notes and file them into notebooks. You can search all notes.
          
          MEMORY BEHAVIOR:
          - If the user asks "What did I say about X?", use 'search_notes' or 'read_notebook'.
          - If the user refers to a notebook by name (e.g. "Read my Journal"), use 'read_notebook' with "Journal" as the name.
          - Always confirm actions before being destructive, but generally perform requests immediately.
          `,
        }
      });

      const candidate = response.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);
      let textResponse = candidate?.content?.parts?.find(p => p.text)?.text || "";

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          try {
            const result = await this.executeFunction(call);
            textResponse += `\n> [SYSTEM]: ${result}`; 
          } catch (execError: any) {
             textResponse += `\n> [ERROR]: ${call.name} failed. ${execError.message}`;
          }
        }
      }

      if (!textResponse && (!functionCalls || functionCalls.length === 0)) return "System received input but generated no response.";
      return textResponse;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async executeFunction(call: any): Promise<string> {
    const store = useAppStore.getState();
    const user = store.user;
    if (!user) return "ACCESS DENIED. User not authenticated.";

    const log = async (msg: string) => await LoggerService.info(user.uid, 'AI', `Tool: ${call.name}`, msg);

    try {
        await log(JSON.stringify(call.args));

        switch (call.name) {
        case "change_view":
            store.setView(call.args.view);
            return `Navigated to ${call.args.view}.`;

        // --- NOTES ---
        case "create_notebook":
            const nbData = { title: call.args.title, type: call.args.type, coverColor: call.args.type === 'journal' ? 'black' : 'white', userId: user.uid, createdAt: Date.now() };
            await db.collection('notebooks').add(nbData);
            return `Notebook "${call.args.title}" created.`;

        case "list_notebooks":
            const nbs = await db.collection('notebooks').where('userId', '==', user.uid).get();
            return `Notebooks: ${nbs.docs.map(d => d.data().title).join(', ') || 'None'}.`;

        case "read_notebook":
            // Smart Lookup: Find ID by Name
            const targetName = call.args.notebookName.toLowerCase();
            const allNbs = await db.collection('notebooks').where('userId', '==', user.uid).get();
            const targetNb = allNbs.docs.find(d => d.data().title.toLowerCase().includes(targetName));
            
            if (!targetNb) return `Notebook '${call.args.notebookName}' not found. Available: ${allNbs.docs.map(d => d.data().title).join(', ')}`;
            
            const notesInNb = await db.collection('notes').where('userId', '==', user.uid).where('notebookId', '==', targetNb.id).get();
            if (notesInNb.empty) return "Notebook is empty.";
            
            return notesInNb.docs.map(d => `Title: ${d.data().title}\nContent: ${d.data().content}`).join('\n---\n');

        case "search_notes":
            // Expanded limit for better context
            const allNotes = await db.collection('notes').where('userId', '==', user.uid).limit(200).get();
            const query = call.args.query.toLowerCase();
            const matches = allNotes.docs.map(d => d.data()).filter(n => (n.title?.toLowerCase().includes(query) || n.content?.toLowerCase().includes(query)));
            return matches.length ? matches.map(n => `[${n.title}]: ${n.content?.substring(0, 200)}...`).join('\n') : "No matches.";

        case "create_note":
            let nbId = null;
            if (call.args.notebookName) {
                 const nbs = await db.collection('notebooks').where('userId', '==', user.uid).get();
                 const match = nbs.docs.find(d => d.data().title.toLowerCase().includes(call.args.notebookName.toLowerCase()));
                 if (match) nbId = match.id;
            }

            await db.collection('notes').add({ 
                title: call.args.title, 
                content: call.args.content, 
                userId: user.uid, 
                createdAt: Date.now(), 
                tags: ['AI'],
                notebookId: nbId 
            });
            return nbId ? `Note created in '${call.args.notebookName}'.` : "Note created (General).";

        case "modify_note":
            const searchNote = await db.collection('notes').where('userId', '==', user.uid).get();
            const noteToMod = searchNote.docs.find(d => d.data().title?.toLowerCase().includes(call.args.noteTitle.toLowerCase()));
            if (!noteToMod) return "Note not found.";
            const newContent = (noteToMod.data().content || "") + "\n" + call.args.appendText;
            await db.collection('notes').doc(noteToMod.id).update({ content: newContent });
            return "Note updated.";

        // --- TASKS ---
        case "create_task":
            await db.collection('tasks').add({ title: call.args.title, completed: false, userId: user.uid, createdAt: Date.now(), subtasks: [] });
            return "Task added.";

        case "modify_task":
            const tasks = await db.collection('tasks').where('userId', '==', user.uid).get();
            const task = tasks.docs.find(d => d.data().title.toLowerCase().includes(call.args.currentTitle.toLowerCase()));
            if (!task) return "Task not found.";
            if (call.args.action === 'delete') await db.collection('tasks').doc(task.id).delete();
            else if (call.args.action === 'complete') await db.collection('tasks').doc(task.id).update({ completed: true });
            else if (call.args.action === 'incomplete') await db.collection('tasks').doc(task.id).update({ completed: false });
            else if (call.args.action === 'rename') await db.collection('tasks').doc(task.id).update({ title: call.args.newTitle });
            return `Task action '${call.args.action}' completed.`;

        // --- HABITS ---
        case "create_habit":
            await db.collection('habits').add({ title: call.args.title, userId: user.uid, createdAt: Date.now(), archived: false });
            return "Habit tracker started.";

        case "get_habits":
            const hbs = await db.collection('habits').where('userId', '==', user.uid).get();
            if (hbs.empty) return "No active habits.";
            const today = new Date().toISOString().split('T')[0];
            const logs = await db.collection('habit_logs').where('userId', '==', user.uid).where('date', '==', today).get();
            const doneIds = new Set(logs.docs.map(d => d.data().habitId));
            return hbs.docs.map(d => `- ${d.data().title} [${doneIds.has(d.id) ? 'DONE' : 'PENDING'}]`).join('\n');

        case "log_habit":
            const habs = await db.collection('habits').where('userId', '==', user.uid).get();
            const targetHabit = habs.docs.find(d => d.data().title.toLowerCase().includes(call.args.habitTitle.toLowerCase()));
            if (!targetHabit) return "Habit not found.";
            const dKey = new Date().toISOString().split('T')[0];
            const logId = `${user.uid}_${targetHabit.id}_${dKey}`;
            if (call.args.completed) await db.collection('habit_logs').doc(logId).set({ userId: user.uid, habitId: targetHabit.id, date: dKey, completed: true });
            else await db.collection('habit_logs').doc(logId).delete();
            return `Habit '${targetHabit.data().title}' marked as ${call.args.completed ? 'DONE' : 'NOT DONE'}.`;

        // --- WALLET ---
        case "get_wallet_status":
            const accs = await db.collection('accounts').where('userId', '==', user.uid).get();
            const total = accs.docs.reduce((sum, d) => sum + (d.data().balance || 0), 0);
            const trans = await db.collection('transactions').where('userId', '==', user.uid).orderBy('date', 'desc').limit(5).get();
            const tList = trans.docs.map(t => `${t.data().type.toUpperCase()} ${t.data().amount} (${t.data().description})`).join(', ');
            return `Net Worth: ${total}. Recent Activity: ${tList || 'None'}.`;

        case "create_transaction":
            const acs = await db.collection('accounts').where('userId', '==', user.uid).limit(1).get();
            if (acs.empty) return "No accounts. Create one first.";
            const acId = acs.docs[0].id;
            const curBal = acs.docs[0].data().balance || 0;
            const diff = call.args.type === 'income' ? call.args.amount : -call.args.amount;
            const batch = db.batch();
            batch.update(db.collection('accounts').doc(acId), { balance: curBal + diff });
            batch.set(db.collection('transactions').doc(), { accountId: acId, userId: user.uid, type: call.args.type, amount: call.args.amount, description: call.args.description, category: call.args.category || 'AI', date: Date.now() });
            await batch.commit();
            return "Transaction logged.";

        // --- CRM ---
        case "create_client":
            await db.collection('clients').add({ name: call.args.name, company: call.args.company, email: call.args.email || '', status: 'lead', userId: user.uid, createdAt: Date.now() });
            return "Client added.";

        case "get_crm_data":
            const cls = await db.collection('clients').where('userId', '==', user.uid).get();
            const prjs = await db.collection('projects').where('userId', '==', user.uid).get();
            return `Clients: ${cls.size}. Projects: ${prjs.size}. Client List: ${cls.docs.map(d => d.data().company).join(', ')}.`;

        case "create_project":
            const clSnap = await db.collection('clients').where('userId', '==', user.uid).get();
            const client = clSnap.docs.find(d => d.data().company.toLowerCase().includes(call.args.clientName.toLowerCase()));
            if (!client) return "Client not found.";
            await db.collection('projects').add({ clientId: client.id, title: call.args.projectTitle, status: 'planning', userId: user.uid, createdAt: Date.now() });
            return `Project '${call.args.projectTitle}' created for ${client.data().company}.`;

        // --- GOALS ---
        case "create_goal":
            const tDate = new Date(); tDate.setMonth(tDate.getMonth() + call.args.monthsFromNow);
            await db.collection('goals').add({ title: call.args.title, targetDate: tDate.getTime(), targetAmount: call.args.targetAmount || null, currentAmount: 0, status: 'active', userId: user.uid, createdAt: Date.now() });
            return "Goal set.";

        case "get_goals":
            const gls = await db.collection('goals').where('userId', '==', user.uid).where('status', '==', 'active').get();
            return gls.empty ? "No active goals." : gls.docs.map(d => `${d.data().title}: ${d.data().currentAmount || 0}/${d.data().targetAmount || '?'} (Due: ${new Date(d.data().targetDate).toLocaleDateString()})`).join('\n');

        case "update_goal":
            const gSearch = await db.collection('goals').where('userId', '==', user.uid).get();
            const goal = gSearch.docs.find(d => d.data().title.toLowerCase().includes(call.args.goalTitle.toLowerCase()));
            if (!goal) return "Goal not found.";
            const updates: any = {};
            if (call.args.addAmount) updates.currentAmount = (goal.data().currentAmount || 0) + call.args.addAmount;
            if (call.args.setStatus) updates.status = call.args.setStatus;
            await db.collection('goals').doc(goal.id).update(updates);
            return "Goal updated.";

        case "update_settings":
            store.updateSettings(call.args);
            return "Settings updated.";

        case "manage_content":
            const map: any = { 'note': 'notes', 'notebook': 'notebooks', 'habit': 'habits', 'goal': 'goals' };
            const col = map[call.args.contentType];
            if(!col) return "Invalid content type.";
            const items = await db.collection(col).where('userId', '==', user.uid).get();
            const item = items.docs.find(d => d.data().title?.toLowerCase().includes(call.args.identifier.toLowerCase()));
            if (!item) return "Item not found.";
            if (call.args.action === 'delete') await db.collection(col).doc(item.id).delete();
            return "Item deleted.";

        default: return "Unknown tool.";
        }
    } catch (e: any) {
        await LoggerService.error(user.uid, 'AI', `Failed: ${call.name}`, e.message);
        throw new Error(e.message);
    }
  }
}
