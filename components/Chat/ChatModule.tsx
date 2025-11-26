
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { Send, Plus, MessageSquare, Trash2, Cpu, Sparkles } from 'lucide-react';
import { db } from '../../firebase';
import { ChatMessage, Conversation } from '../../types';
import { GeminiService } from '../../services/geminiService';

export const ChatModule: React.FC = () => {
  const { user, conversations, setConversations, activeConversationId, setActiveConversationId } = useAppStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Real-time subscription to conversations
  useEffect(() => {
    if (!user) return;
    
    // FIXED: Removed .orderBy('updatedAt', 'desc') to prevent Missing Index Error
    const unsubscribe = db.collection('conversations')
        .where('userId', '==', user.uid)
        .onSnapshot((snapshot) => {
            const fetched: Conversation[] = [];
            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as Conversation);
            });
            
            // Client-side sort
            fetched.sort((a,b) => b.updatedAt - a.updatedAt);
            
            setConversations(fetched);
        });

    return () => unsubscribe();
  }, [user, setConversations]);

  // Auto-scroll to bottom of active chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, conversations, isProcessing]);

  const activeChat = conversations.find(c => c.id === activeConversationId);

  const handleNewChat = async () => {
    if (!user) return;
    try {
        const newChat = {
            title: 'New Session',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId: user.uid
        };
        const ref = await db.collection('conversations').add(newChat);
        setActiveConversationId(ref.id);
    } catch (e) {
        console.error("Error creating chat", e);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this memory thread?')) return;
    try {
        await db.collection('conversations').doc(chatId).delete();
        if (activeConversationId === chatId) setActiveConversationId(null);
    } catch (e) {
        console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    let currentChatId = activeConversationId;
    let currentMessages = activeChat?.messages || [];

    // If no chat selected, create one first
    if (!currentChatId) {
        const newChat = {
            title: input.substring(0, 30) + '...',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId: user.uid
        };
        const ref = await db.collection('conversations').add(newChat);
        currentChatId = ref.id;
        setActiveConversationId(ref.id);
    }

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: Date.now()
    };

    const updatedMessages = [...currentMessages, userMsg];
    
    // Optimistic UI update handled by local state, but we write to DB
    setInput('');
    setIsProcessing(true);

    try {
        // 1. Save User Message
        await db.collection('conversations').doc(currentChatId).update({
            messages: updatedMessages,
            updatedAt: Date.now(),
            // Update title if it's the first message
            ...(currentMessages.length === 0 ? { title: input.substring(0, 30) + '...' } : {})
        });

        // 2. Call AI
        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) throw new Error("API Key missing in Settings");
        
        const service = new GeminiService(apiKey);
        
        const historyForService = currentMessages.map(m => ({
             role: m.role,
             parts: [{ text: m.content }]
        }));

        const realResponse = await service.chat(userMsg.content, historyForService);

        // 3. Save AI Message
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: realResponse,
            timestamp: Date.now()
        };

        await db.collection('conversations').doc(currentChatId).update({
            messages: [...updatedMessages, aiMsg],
            updatedAt: Date.now()
        });

    } catch (error: any) {
        console.error(error);
        const errorMsg: ChatMessage = {
             id: Date.now().toString(),
             role: 'system',
             content: `Error: ${error.message}`,
             timestamp: Date.now()
        };
        await db.collection('conversations').doc(currentChatId).update({
            messages: [...updatedMessages, errorMsg],
            updatedAt: Date.now()
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white">
      
      {/* Sidebar History */}
      <div className="w-64 border-r-2 border-black dark:border-white bg-gray-50 dark:bg-neutral-800 flex flex-col hidden md:flex">
        <div className="p-4 border-b-2 border-black/10 dark:border-white/10">
            <NoirButton fullWidth onClick={handleNewChat} className="text-xs py-2">
                <div className="flex items-center gap-2 justify-center">
                    <Plus size={14} /> NEW THREAD
                </div>
            </NoirButton>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {conversations.length === 0 && (
                <div className="text-center p-4 text-xs font-mono text-gray-400">NO ARCHIVES</div>
            )}
            {conversations.map(chat => (
                <div 
                    key={chat.id}
                    onClick={() => setActiveConversationId(chat.id)}
                    className={`group relative p-3 border-2 cursor-pointer transition-all ${
                        activeConversationId === chat.id 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white' 
                        : 'bg-white text-black border-transparent hover:border-black dark:bg-neutral-900 dark:text-gray-300 dark:hover:border-gray-500'
                    }`}
                >
                    <h4 className="font-mono text-xs font-bold truncate pr-4">{chat.title}</h4>
                    <span className="text-[10px] opacity-60 font-mono">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                    
                    <button 
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col relative">
        {!activeChat ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-4">
                <Cpu size={64} className="opacity-20" />
                <p className="font-mono text-sm">SELECT OR START A NEW THREAD</p>
                <NoirButton onClick={handleNewChat}>INITIALIZE</NoirButton>
            </div>
        ) : (
            <>
                {/* Chat Header (Mobile only mainly, or context) */}
                <div className="p-3 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-800 md:hidden">
                    <span className="font-mono text-xs font-bold truncate">{activeChat.title}</span>
                    <button onClick={handleNewChat}><Plus size={18}/></button>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6">
                    {activeChat.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] md:max-w-[70%] p-4 border-2 shadow-hard-sm dark:shadow-hard-sm-white
                                ${msg.role === 'user' 
                                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                                    : 'bg-white text-black border-black dark:bg-neutral-900 dark:text-gray-100 dark:border-gray-600'}
                                ${msg.role === 'system' ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                            `}>
                                <div className="font-mono text-[10px] opacity-50 mb-1 uppercase flex items-center gap-2">
                                    {msg.role === 'model' && <Sparkles size={10} />}
                                    {msg.role} 
                                    <span className="ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex justify-start">
                             <div className="bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 p-3 font-mono text-xs animate-pulse">
                                 NEURAL NETWORK PROCESSING...
                             </div>
                         </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-neutral-900 border-t-2 border-black dark:border-white">
                    <form onSubmit={handleSend} className="flex gap-4">
                        <input
                            className="flex-grow bg-gray-50 dark:bg-neutral-800 border-2 border-gray-300 dark:border-gray-600 p-3 font-mono text-sm focus:border-black dark:focus:border-white outline-none transition-colors text-black dark:text-white"
                            placeholder="Message the system..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isProcessing}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={isProcessing}
                            className="bg-black text-white dark:bg-white dark:text-black p-3 border-2 border-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white hover:translate-y-0.5 hover:shadow-none active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
