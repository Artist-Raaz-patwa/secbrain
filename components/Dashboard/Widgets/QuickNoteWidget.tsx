import React, { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { db } from '../../../firebase';
import { Save } from 'lucide-react';
import { LoggerService } from '../../../services/logger';

export const QuickNoteWidget: React.FC = () => {
    const { user } = useAppStore();
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!text.trim() || !user) return;
        setSaving(true);
        try {
            await db.collection('notes').add({
                title: 'Quick Capture',
                content: text,
                userId: user.uid,
                createdAt: Date.now(),
                tags: ['DASHBOARD']
            });
            await LoggerService.success(user.uid, 'DB', 'Quick Note Saved');
            setText('');
        } catch(e) { console.error(e); }
        finally { setSaving(false); }
    };

    return (
        <div className="h-full flex flex-col p-2">
            <textarea 
                className="flex-grow w-full bg-transparent resize-none outline-none font-mono text-xs text-black dark:text-white placeholder:text-gray-400 p-2"
                placeholder="Type thought here..."
                value={text}
                onChange={e => setText(e.target.value)}
            />
            <div className="flex justify-end pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800">
                <button 
                    onClick={handleSave}
                    disabled={!text.trim() || saving}
                    className="flex items-center gap-1 text-[10px] font-bold font-mono uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-2 py-1 transition-colors disabled:opacity-50"
                >
                    <Save size={10} /> {saving ? 'SAVING' : 'SAVE'}
                </button>
            </div>
        </div>
    );
};