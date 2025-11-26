import React, { useState, useMemo } from 'react';
import { Client, Project, ProjectTask } from '../../types';
import { Check, Copy, FileText, ChevronRight, ChevronDown, Sparkles, Download, PieChart } from 'lucide-react';
import { NoirButton } from '../ui/NoirButton';
import { useAppStore } from '../../store/useAppStore';
import { GeminiService } from '../../services/geminiService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportGeneratorProps {
    clients: Client[];
    projects: Project[];
    tasks: ProjectTask[];
    onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ clients, projects, tasks, onClose }) => {
    const { settings, user } = useAppStore();
    // Selection State
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set(clients.map(c => c.id)));
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    
    // AI State
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Grouping Logic
    const treeData = useMemo(() => {
        return clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientTreeProjects = clientProjects.map(proj => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                return { ...proj, tasks: projTasks };
            }).filter(p => p.tasks.length > 0);
            return { ...client, projects: clientTreeProjects };
        }).filter(c => c.projects.length > 0);
    }, [clients, projects, tasks]);

    // Toggles
    const toggleTask = (taskId: string) => {
        const next = new Set(selectedTaskIds);
        if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
        setSelectedTaskIds(next);
    };

    const toggleProject = (project: any) => {
        const allTaskIds = project.tasks.map((t: any) => t.id);
        const next = new Set(selectedTaskIds);
        const allSelected = allTaskIds.every((id: string) => next.has(id));
        if (allSelected) allTaskIds.forEach((id: string) => next.delete(id));
        else allTaskIds.forEach((id: string) => next.add(id));
        setSelectedTaskIds(next);
    };

    const toggleExpandClient = (id: string) => {
        const next = new Set(expandedClients);
        if(next.has(id)) next.delete(id); else next.add(id);
        setExpandedClients(next);
    };

    const toggleExpandProject = (id: string) => {
        const next = new Set(expandedProjects);
        if(next.has(id)) next.delete(id); else next.add(id);
        setExpandedProjects(next);
    };

    // Report Calculation
    const reportData = useMemo(() => {
        const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
        let grandTotal = 0;
        const groupedByClient: any[] = [];
        
        clients.forEach(client => {
            const clientProjs = projects.filter(p => p.clientId === client.id);
            const reportProjects: any[] = [];
            let clientTotal = 0;

            clientProjs.forEach(proj => {
                const pTasks = selectedTasks.filter(t => t.projectId === proj.id);
                if (pTasks.length > 0) {
                    const projTotal = pTasks.reduce((acc, t) => acc + (t.hours * t.rate), 0);
                    clientTotal += projTotal;
                    reportProjects.push({
                        title: proj.title,
                        tasks: pTasks,
                        total: projTotal
                    });
                }
            });

            if (reportProjects.length > 0) {
                groupedByClient.push({
                    name: client.company,
                    projects: reportProjects,
                    total: clientTotal
                });
                grandTotal += clientTotal;
            }
        });

        return { groupedByClient, grandTotal, taskCount: selectedTasks.length };
    }, [selectedTaskIds, tasks, clients, projects]);

    const generateAISummary = async () => {
        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) {
            alert("Please set API Key in Settings.");
            return;
        }
        setIsGeneratingAI(true);
        try {
            const service = new GeminiService(apiKey);
            
            // Build detailed project context for AI
            // We flat map across all clients and projects currently in the report
            const allProjects = reportData.groupedByClient.flatMap(c => 
                c.projects.map((p: any) => ({
                    title: p.title,
                    tasks: p.tasks.map((t: any) => t.title)
                }))
            );
            
            const summary = await service.generateReportSummary(
                reportData.groupedByClient.map(c => c.name).join(", ") || "Multiple Clients",
                allProjects,
                reportData.grandTotal,
                settings.baseCurrency
            );
            setAiSummary(summary);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const copyReport = () => {
        let text = `WORK REPORT / SUMMARY\nDate: ${new Date().toLocaleDateString()}\n`;
        if (aiSummary) text += `\nEXECUTIVE SUMMARY:\n${aiSummary}\n`;
        text += `\n===================================\n\n`;
        
        reportData.groupedByClient.forEach(client => {
            text += `CLIENT: ${client.name}\n-----------------------------------\n`;
            client.projects.forEach((proj: any) => {
                text += `PROJECT: ${proj.title}\n`;
                proj.tasks.forEach((t: any) => {
                    text += ` - ${t.title} (${t.hours}hrs @ ${settings.baseCurrency}${t.rate}) ... ${settings.baseCurrency}${(t.hours*t.rate).toFixed(2)}\n`;
                });
                text += ` Subtotal: ${settings.baseCurrency}${proj.total.toFixed(2)}\n\n`;
            });
            text += ` CLIENT TOTAL: ${settings.baseCurrency}${client.total.toFixed(2)}\n\n`;
        });
        text += `===================================\nGRAND TOTAL: ${settings.baseCurrency}${reportData.grandTotal.toFixed(2)}`;
        navigator.clipboard.writeText(text);
        alert("Report copied to clipboard.");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        
        // Helper to convert symbols to safe PDF font text
        const getSafeCurrency = (sym: string) => {
            const map: Record<string, string> = {
                '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR', '¥': 'JPY', '₽': 'RUB'
            };
            return map[sym] || sym;
        };
        const curr = getSafeCurrency(settings.baseCurrency);

        // Header Design (Noir Style)
        doc.setFillColor(10, 10, 10); // Nearly Black
        doc.rect(0, 0, 210, 50, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text("WORK REPORT", 14, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`DATE: ${new Date().toLocaleDateString().toUpperCase()}`, 14, 35);
        doc.text(`ID: WR-${Date.now().toString().slice(-6)}`, 14, 40);

        // Provider Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.userName?.toUpperCase() || "FREELANCER", 196, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(user?.email || "", 196, 26, { align: 'right' });
        doc.text("Professional Services", 196, 32, { align: 'right' });

        let yPos = 65;

        // Executive Summary Section
        if (aiSummary) {
            // Fix: Clean AI Summary of unsupported glyphs before rendering
            let cleanSummary = aiSummary;
            cleanSummary = cleanSummary.replace(/₹/g, 'INR ');
            cleanSummary = cleanSummary.replace(/€/g, 'EUR ');
            cleanSummary = cleanSummary.replace(/£/g, 'GBP ');
            cleanSummary = cleanSummary.replace(/¥/g, 'JPY ');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("EXECUTIVE SUMMARY", 14, yPos - 5);
            
            const splitText = doc.splitTextToSize(cleanSummary, 180);
            const boxHeight = (splitText.length * 5) + 12;
            
            // Box styling
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(250, 250, 250);
            doc.rect(14, yPos, 182, boxHeight, 'FD');
            
            // Accent line
            doc.setLineWidth(1);
            doc.setDrawColor(0, 0, 0);
            doc.line(14, yPos, 14, yPos + boxHeight);

            doc.setFont('helvetica', 'italic');
            doc.text(splitText, 18, yPos + 8);
            yPos += boxHeight + 15;
        }

        // Client & Project Data
        reportData.groupedByClient.forEach((client) => {
            // Page break check
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            // Client Title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(client.name.toUpperCase(), 14, yPos);
            doc.setLineWidth(0.5);
            doc.setDrawColor(0,0,0);
            doc.line(14, yPos + 2, 196, yPos + 2);
            yPos += 10;

            const tableBody: any[] = [];
            client.projects.forEach((proj: any) => {
                // Project Header
                tableBody.push([{ 
                    content: `PROJECT: ${proj.title.toUpperCase()}`, 
                    colSpan: 4, 
                    styles: { 
                        fontStyle: 'bold', 
                        fillColor: [230, 230, 230],
                        textColor: [0, 0, 0]
                    } 
                }]);
                
                // Tasks
                proj.tasks.forEach((t: any) => {
                    tableBody.push([
                        t.title,
                        `${t.hours} hrs`,
                        `${curr} ${t.rate}`,
                        `${curr} ${(t.hours * t.rate).toFixed(2)}`
                    ]);
                });
                
                // Project Subtotal
                tableBody.push([
                    { content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } },
                    { content: 'SUBTOTAL', styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250] } }, 
                    { content: `${curr} ${proj.total.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }
                ]);
            });

            // Table Generation
            // @ts-ignore
            autoTable(doc, {
                startY: yPos,
                head: [['DESCRIPTION', 'DURATION', 'RATE', 'AMOUNT']],
                body: tableBody,
                theme: 'plain',
                styles: { 
                    fontSize: 9, 
                    cellPadding: 4, 
                    textColor: [50, 50, 50],
                    lineColor: [220, 220, 220],
                    lineWidth: { bottom: 0.1 }
                },
                headStyles: { 
                    fillColor: [10, 10, 10], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold',
                    halign: 'left'
                },
                columnStyles: {
                    0: { cellWidth: 90 },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 30, halign: 'right' },
                },
                // @ts-ignore
                margin: { left: 14, right: 14 }
            });

            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
        });

        // Grand Total Block
        const finalY = yPos < 200 ? 220 : yPos + 20;
        if (finalY > 260) doc.addPage();
        
        doc.setFillColor(10, 10, 10);
        doc.rect(120, finalY, 76, 24, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("TOTAL PAYABLE AMOUNT", 158, finalY + 8, { align: 'center' });
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${curr} ${reportData.grandTotal.toFixed(2)}`, 158, finalY + 18, { align: 'center' });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
            doc.text("Generated by Second Brain OS", 14, 290);
        }

        doc.save(`WorkReport_${Date.now()}.pdf`);
    };

    // Pie Chart Logic (SVG)
    const renderPieChart = () => {
        if (reportData.groupedByClient.length <= 1) return null;
        
        const total = reportData.grandTotal;
        let cumulativePercent = 0;
        
        const slices = reportData.groupedByClient.map((client, i) => {
            const percent = client.total / total;
            const startX = Math.cos(2 * Math.PI * cumulativePercent) * 100;
            const startY = Math.sin(2 * Math.PI * cumulativePercent) * 100;
            cumulativePercent += percent;
            const endX = Math.cos(2 * Math.PI * cumulativePercent) * 100;
            const endY = Math.sin(2 * Math.PI * cumulativePercent) * 100;
            
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M 0 0 L ${startX} ${startY} A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
            
            // Noir Colors: Black, Dark Gray, Light Gray, White (Bordered)
            const colors = ['#000000', '#555555', '#AAAAAA', '#FFFFFF'];
            const fill = colors[i % colors.length];
            const stroke = i % colors.length === 3 ? '#000000' : 'none';

            return <path key={i} d={pathData} fill={fill} stroke={stroke} strokeWidth="1" />;
        });

        return (
            <div className="flex gap-8 items-center justify-center p-6 border-2 border-black dark:border-white mb-6 bg-gray-50 dark:bg-neutral-800">
                <div className="w-32 h-32 relative">
                    <svg viewBox="-105 -105 210 210" className="transform -rotate-90">
                        {slices}
                    </svg>
                </div>
                <div className="space-y-2">
                    <h4 className="font-display font-bold uppercase text-xs">Revenue Distribution</h4>
                    {reportData.groupedByClient.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                            <div className="w-3 h-3 border border-black dark:border-white" style={{background: ['#000', '#555', '#AAA', '#FFF'][i%4]}}></div>
                            <span>{c.name} ({Math.round((c.total/total)*100)}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-neutral-900 h-full flex flex-col md:flex-row border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white">
            {/* Left: Selection Tree */}
            <div className="w-full md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-black dark:border-white flex flex-col">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 border-b-2 border-black dark:border-white flex justify-between items-center">
                    <h3 className="font-display font-bold uppercase text-sm">Select Work Items</h3>
                    <NoirButton onClick={onClose} variant="secondary" className="px-2 py-1"><ChevronRight size={14} className="rotate-180"/></NoirButton>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {treeData.length === 0 && <p className="text-gray-400 font-mono text-xs">No project tasks found.</p>}
                    
                    {treeData.map(client => (
                        <div key={client.id} className="border border-gray-200 dark:border-neutral-700">
                            {/* Client Header */}
                            <div 
                                className="flex items-center justify-between p-3 bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700"
                                onClick={() => toggleExpandClient(client.id)}
                            >
                                <div className="font-bold font-display text-sm uppercase">{client.company}</div>
                                {expandedClients.has(client.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </div>
                            
                            {/* Projects */}
                            {expandedClients.has(client.id) && (
                                <div className="p-2 space-y-2">
                                    {client.projects.map(proj => (
                                        <div key={proj.id} className="ml-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <button 
                                                    onClick={() => toggleExpandProject(proj.id)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded"
                                                >
                                                    {expandedProjects.has(proj.id) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                                </button>
                                                <div 
                                                    className="font-mono text-xs font-bold cursor-pointer hover:underline"
                                                    onClick={() => toggleProject(proj)}
                                                >
                                                    {proj.title}
                                                </div>
                                            </div>

                                            {/* Tasks */}
                                            {expandedProjects.has(proj.id) && (
                                                <div className="ml-6 space-y-1 border-l-2 border-gray-300 dark:border-neutral-700 pl-2">
                                                    {proj.tasks.map(task => (
                                                        <div 
                                                            key={task.id} 
                                                            className="flex items-center gap-2 cursor-pointer group"
                                                            onClick={() => toggleTask(task.id)}
                                                        >
                                                            <div className={`
                                                                w-4 h-4 border border-black dark:border-white flex items-center justify-center
                                                                ${selectedTaskIds.has(task.id) ? 'bg-black dark:bg-white' : 'bg-transparent'}
                                                            `}>
                                                                {selectedTaskIds.has(task.id) && <Check size={12} className="text-white dark:text-black"/>}
                                                            </div>
                                                            <span className="font-mono text-[10px] md:text-xs truncate max-w-[150px]">
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Preview */}
            <div className="flex-grow flex flex-col bg-white dark:bg-black text-black dark:text-white relative">
                 <div className="p-4 bg-black text-white dark:bg-white dark:text-black flex justify-between items-center">
                    <h3 className="font-mono font-bold uppercase">REPORT_PREVIEW</h3>
                    <div className="flex gap-2">
                        <NoirButton onClick={generateAISummary} disabled={isGeneratingAI} className="px-3 py-1 text-xs">
                             <div className="flex items-center gap-2"><Sparkles size={14} className={isGeneratingAI ? "animate-spin" : ""}/> {isGeneratingAI ? 'WRITING...' : 'AI SUMMARY'}</div>
                        </NoirButton>
                        <NoirButton onClick={copyReport} variant="secondary" className="px-3 py-1 text-xs">
                             <div className="flex items-center gap-2"><Copy size={14}/> COPY</div>
                        </NoirButton>
                        <NoirButton onClick={exportPDF} variant="secondary" className="px-3 py-1 text-xs">
                             <div className="flex items-center gap-2"><Download size={14}/> PDF</div>
                        </NoirButton>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 font-mono text-sm max-w-3xl mx-auto w-full bg-white text-black dark:bg-neutral-900 dark:text-gray-100 shadow-xl my-4 border border-gray-200 dark:border-neutral-800">
                    <div className="text-center mb-8 border-b-2 border-black dark:border-white pb-4">
                        <h1 className="text-3xl font-display font-black uppercase">WORK REPORT</h1>
                        <p className="text-xs text-gray-500 mt-1">GENERATED: {new Date().toLocaleDateString()}</p>
                    </div>
                    
                    {renderPieChart()}

                    {/* AI Editor */}
                    <div className="mb-8 bg-gray-50 dark:bg-neutral-800 p-4 border-l-4 border-black dark:border-white">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-xs uppercase text-gray-400">EXECUTIVE SUMMARY (EDITABLE)</span>
                            {!aiSummary && <button onClick={generateAISummary} className="text-[10px] underline">AUTO-GENERATE</button>}
                        </div>
                        <textarea 
                            className="w-full bg-transparent outline-none resize-none h-24 text-sm leading-relaxed"
                            placeholder="Click 'AI SUMMARY' to generate a professional overview or type here..."
                            value={aiSummary}
                            onChange={(e) => setAiSummary(e.target.value)}
                        />
                    </div>

                    <div className="space-y-8">
                        {reportData.groupedByClient.length === 0 && (
                            <div className="text-center text-gray-400 italic py-10">Select tasks from the sidebar to generate report.</div>
                        )}

                        {reportData.groupedByClient.map(client => (
                            <div key={client.name}>
                                <div className="flex justify-between items-end border-b border-black dark:border-white mb-2">
                                    <h2 className="font-bold text-lg uppercase">{client.name}</h2>
                                    <span className="font-bold">{settings.baseCurrency}{client.total.toFixed(2)}</span>
                                </div>
                                <div className="space-y-4">
                                    {client.projects.map((proj: any) => (
                                        <div key={proj.title}>
                                            <div className="bg-gray-100 dark:bg-neutral-800 px-2 py-1 font-bold text-xs uppercase mb-1">{proj.title}</div>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    {proj.tasks.map((t: any) => (
                                                        <tr key={t.title} className="border-b border-gray-100 dark:border-neutral-800">
                                                            <td className="py-1">{t.title}</td>
                                                            <td className="py-1 text-right text-gray-500">{t.hours}h</td>
                                                            <td className="py-1 text-right text-gray-500">@{t.rate}</td>
                                                            <td className="py-1 text-right font-bold">{settings.baseCurrency}{(t.hours * t.rate).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-4 border-t-4 border-black dark:border-white flex justify-between items-center">
                         <div className="text-xs text-gray-400">PAYABLE TOTAL</div>
                         <div className="text-3xl font-display font-black">{settings.baseCurrency}{reportData.grandTotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};