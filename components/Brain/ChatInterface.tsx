import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { MessageSquare, X, Send, Key, Minimize2, Terminal, Sparkles } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { ChatMessage } from '../../types';

export const ChatInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
      serviceRef.current = new GeminiService(storedKey);
      setMessages([{
        id: 'init',
        role: 'system',
        content: 'SYSTEM ONLINE. NEURAL LINK ACTIVE. WAITING FOR INPUT...',
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    serviceRef.current = new GeminiService(apiKey);
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'API KEY ACCEPTED. ACCESS GRANTED.',
        timestamp: Date.now()
    }]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !serviceRef.current) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
        const history = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out. The operation took too long.")), 60000)
        );

        const responsePromise = serviceRef.current.chat(userMsg.content, history);
        const response = await Promise.race([responsePromise, timeoutPromise]) as string;
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: response,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
        console.error(error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `ERROR: ${error.message || 'CONNECTION LOST'}. RETRYING...`,
            timestamp: Date.now()
        }]);
    } finally {
        setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 border-2 border-white shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all group"
      >
        <MessageSquare size={24} className="group-hover:animate-bounce" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col bg-white border-4 border-black shadow-hard-lg animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-black text-white p-3 flex justify-between items-center border-b-4 border-black cursor-move select-none">
        <div className="flex items-center gap-2">
            <Terminal size={16} />
            <h3 className="font-mono font-bold tracking-wider text-sm">THE_BRAIN.EXE</h3>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors">
                <Minimize2 size={18} />
            </button>
        </div>
      </div>

      {!serviceRef.current ? (
         <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-4 bg-dots">
            <Key size={48} className="text-gray-300" />
            <p className="text-center font-display font-black text-lg">ACCESS KEY REQUIRED</p>
            <p className="text-center font-mono text-xs text-gray-500">Enter Google Gemini API Key to enable neural control.</p>
            <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 border-2 border-black font-mono text-xs focus:shadow-hard transition-shadow outline-none"
                placeholder="AIza..."
            />
            <NoirButton fullWidth onClick={handleSaveKey}>INITIALIZE LINK</NoirButton>
         </div>
      ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar font-mono text-xs">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'system' ? (
                            <div className="w-full text-center my-2">
                                <span className="bg-black text-white px-2 py-1 text-[10px] uppercase font-bold tracking-widest">{msg.content}</span>
                            </div>
                        ) : (
                            <div className={`
                                max-w-[85%] p-3 border-2 shadow-hard-sm
                                ${msg.role === 'user' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}
                            `}>
                                {msg.role === 'model' && (
                                    <div className="flex items-center gap-1 mb-1 text-gray-400 font-bold text-[10px] uppercase">
                                        <Sparkles size={10} /> AI RESPONSE
                                    </div>
                                )}
                                <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        )}
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-transparent text-gray-500 font-mono text-xs flex items-center gap-1">
                            <span className="w-2 h-4 bg-black animate-blink"></span>
                            PROCESSING...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t-4 border-black bg-white flex gap-2">
                <div className="flex-grow flex items-center bg-gray-100 border-2 border-transparent focus-within:border-black transition-colors px-2">
                    <span className="text-green-600 font-bold mr-2">{`>`}</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Execute command..."
                        className="flex-grow font-mono text-sm outline-none bg-transparent py-2"
                        autoFocus
                    />
                </div>
                <button type="submit" disabled={isProcessing} className="bg-black text-white p-2 hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                    <Send size={18} />
                </button>
            </form>
          </>
      )}
    </div>
  );
};