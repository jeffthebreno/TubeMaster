import React, { useState } from 'react';
import { SavedPrompt, Channel } from '../types';
import { Sparkles, Copy, Trash2, Plus, Save, Wand2 } from 'lucide-react';
import { generateVideoIdeas, improvePrompt } from '../services/geminiService';

interface PromptLibraryProps {
  prompts: SavedPrompt[];
  channels: Channel[];
  onAddPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts, channels, onAddPrompt, onDeletePrompt }) => {
  const [activePrompt, setActivePrompt] = useState<SavedPrompt | null>(null);
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [generatedResult, setGeneratedResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContextChannel, setSelectedContextChannel] = useState<string>(channels[0]?.id || '');

  const handleSave = () => {
    if(!newPromptContent) return;
    const prompt: SavedPrompt = {
        id: crypto.randomUUID(),
        title: newPromptTitle || 'Sem Título',
        content: newPromptContent,
        category: 'Geral',
    };
    onAddPrompt(prompt);
    setNewPromptContent('');
    setNewPromptTitle('');
    setActivePrompt(prompt);
  };

  const handleGenerate = async () => {
    if (!activePrompt) return;
    setIsGenerating(true);
    setGeneratedResult('');
    
    const channel = channels.find(c => c.id === selectedContextChannel);
    const contextName = channel ? channel.name : "Canal Genérico";

    const result = await generateVideoIdeas(activePrompt.content, contextName);
    setGeneratedResult(result);
    setIsGenerating(false);
  };

  const handleImprove = async () => {
      if(!newPromptContent) return;
      setIsGenerating(true);
      const improved = await improvePrompt(newPromptContent);
      setNewPromptContent(improved);
      setIsGenerating(false);
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 bg-dark-800 rounded-xl border border-dark-700 flex flex-col overflow-hidden">
         <div className="p-4 border-b border-dark-700 flex justify-between items-center">
            <h3 className="font-bold text-white">Prompts Salvos</h3>
            <button 
                onClick={() => { setActivePrompt(null); setGeneratedResult(''); }}
                className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1"
            >
                <Plus size={16} /> Novo
            </button>
         </div>
         <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {prompts.map(p => (
                <div 
                    key={p.id} 
                    onClick={() => { setActivePrompt(p); setGeneratedResult(''); }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${activePrompt?.id === p.id ? 'bg-brand-900/30 border-brand-500' : 'bg-dark-900 border-dark-700 hover:border-gray-500'}`}
                >
                    <div className="flex justify-between items-start">
                        <h4 className="text-white font-medium text-sm">{p.title}</h4>
                        <button onClick={(e) => { e.stopPropagation(); onDeletePrompt(p.id); }} className="text-gray-500 hover:text-red-400">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                </div>
            ))}
            {prompts.length === 0 && <p className="text-gray-500 text-center text-sm py-4">Nenhum prompt salvo.</p>}
         </div>
      </div>

      {/* Main Editor/Viewer */}
      <div className="w-full lg:w-2/3 bg-dark-800 rounded-xl border border-dark-700 flex flex-col p-6">
         {activePrompt ? (
             <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-brand-500" size={20} />
                        {activePrompt.title}
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={selectedContextChannel}
                            onChange={(e) => setSelectedContextChannel(e.target.value)}
                            className="bg-dark-900 border border-dark-700 text-xs rounded-lg px-2 py-2 text-white focus:outline-none"
                        >
                            <option value="">Selecione o Canal (Contexto)</option>
                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap"
                        >
                            {isGenerating ? 'Gerando...' : 'Gerar Ideias'} <Wand2 size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="bg-dark-900 p-4 rounded-lg border border-dark-700 mb-6">
                    <p className="text-gray-300 whitespace-pre-wrap text-sm">{activePrompt.content}</p>
                </div>

                {generatedResult && (
                    <div className="flex-1 bg-dark-900 rounded-lg border border-dark-700 p-4 overflow-y-auto animate-fade-in">
                        <h4 className="text-brand-400 font-medium mb-3 text-sm uppercase tracking-wide">Resposta da IA ({channels.find(c => c.id === selectedContextChannel)?.name})</h4>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="whitespace-pre-line text-gray-200">{generatedResult}</p>
                        </div>
                    </div>
                )}
             </>
         ) : (
             <div className="h-full flex flex-col">
                 <h2 className="text-xl font-bold text-white mb-4">Criar Novo Prompt</h2>
                 <input 
                    type="text"
                    placeholder="Título do Prompt (ex: Roteiro Viral)"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white mb-4 focus:border-brand-500 focus:outline-none"
                 />
                 <div className="relative flex-1">
                    <textarea 
                        placeholder="Escreva seu prompt aqui... Ex: 'Crie uma lista de 5 ideias sobre marketing digital...'"
                        value={newPromptContent}
                        onChange={(e) => setNewPromptContent(e.target.value)}
                        className="w-full h-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none resize-none"
                    />
                    <button 
                        onClick={handleImprove}
                        disabled={isGenerating || !newPromptContent}
                        className="absolute bottom-4 right-4 bg-purple-600/80 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm"
                    >
                        <Wand2 size={12} /> {isGenerating ? 'Melhorando...' : 'Melhorar com IA'}
                    </button>
                 </div>
                 <div className="mt-4 flex justify-end">
                     <button 
                        onClick={handleSave}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                     >
                         <Save size={18} /> Salvar Prompt
                     </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};