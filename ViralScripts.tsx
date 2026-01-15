import React, { useState, useRef, useEffect } from 'react';
import { ViralSession, ChatMessage, ScriptConfig } from '../types';
import { MessageSquare, Plus, Save, Send, Trash2, Settings, FileText, Clock, Mic, Upload, Zap, Paperclip, X, Check } from 'lucide-react';
import { sendViralScriptMessage } from '../services/geminiService';

interface ViralScriptsProps {
  // We can lift state up if needed, but managing local storage here for sessions is fine
}

const INITIAL_CONFIG: ScriptConfig = {
  duration: 'Shorts (60s)',
  tone: 'Enérgico, Curioso',
  strategy: 'Gancho Visual + Storytelling Rápido'
};

const DURATION_PRESETS = [
  'Shorts (60s)',
  'Curto (até 5 min)',
  'Médio (7 min)',
  'Longo (> 8 min)'
];

const TONE_PRESETS = [
  'Enérgico',
  'Curioso',
  'Polêmico',
  'Educativo',
  'Humorístico',
  'Sério',
  'Motivacional',
  'Investigativo',
  'Sarcástico',
  'Empático'
];

const STRATEGY_PRESETS = [
  'Storytelling',
  'Lista / Top 10',
  'Tutorial / How-to',
  'Reaction / Comentário',
  'Vlog / Bastidores',
  'Análise Profunda',
  'Desafio / Experimento'
];

export const ViralScripts: React.FC<ViralScriptsProps> = () => {
  // State
  const [sessions, setSessions] = useState<ViralSession[]>(() => {
    const saved = localStorage.getItem('tm_viral_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Form/Input State
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [fileAttachment, setFileAttachment] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Session Helper
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Persistence
  useEffect(() => {
    localStorage.setItem('tm_viral_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ViralSession = {
      id: crypto.randomUUID(),
      title: 'Novo Roteiro Viral',
      knowledgeBase: '',
      config: { ...INITIAL_CONFIG },
      messages: [{
        role: 'model',
        text: 'Olá! Sou seu assistente de roteiros virais. Configure meus dados de treinamento ao lado (duração, tom, estratégia) e me diga sobre qual tema vamos criar hoje.',
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setShowConfig(true); // Open config by default for new session
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const updateSessionConfig = (key: keyof ScriptConfig, value: string) => {
    if (!activeSessionId) return;
    setSessions(sessions.map(s => 
      s.id === activeSessionId ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
  };

  // Helper for multi-select tones
  const toggleTone = (tone: string) => {
    if (!activeSessionId || !activeSession) return;
    const currentTones = activeSession.config.tone.split(',').map(t => t.trim()).filter(Boolean);
    
    let newTones;
    if (currentTones.includes(tone)) {
      newTones = currentTones.filter(t => t !== tone);
    } else {
      newTones = [...currentTones, tone];
    }
    
    updateSessionConfig('tone', newTones.join(', '));
  };

  const updateKnowledgeBase = (text: string) => {
    if (!activeSessionId) return;
    setSessions(sessions.map(s => 
        s.id === activeSessionId ? { ...s, knowledgeBase: text } : s
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeSessionId) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Store file temporarily for the next message
              setFileAttachment({
                  name: file.name,
                  data: reader.result as string,
                  mimeType: file.type
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !fileAttachment) || !activeSession) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    // Optimistic Update
    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions(sessions.map(s => s.id === activeSession.id ? { ...s, messages: updatedMessages, lastUpdated: Date.now() } : s));
    setInputText('');
    setIsTyping(true);

    // Call Gemini
    const responseText = await sendViralScriptMessage(
        userMsg.text,
        activeSession.messages, // History
        activeSession.knowledgeBase,
        activeSession.config,
        fileAttachment ? [fileAttachment] : [] 
    );

    const modelMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => 
        s.id === activeSession.id 
        ? { ...s, messages: [...s.messages, userMsg, modelMsg], lastUpdated: Date.now() } // Re-add userMsg to be safe against race conditions
        : s
    ));
    
    // Auto-update title if it's the first real interaction
    if (activeSession.title === 'Novo Roteiro Viral' && updatedMessages.length === 2) {
         const newTitle = inputText.slice(0, 30) + (inputText.length > 30 ? '...' : '');
         setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: newTitle } : s));
    }

    setFileAttachment(null);
    setIsTyping(false);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4 overflow-hidden">
      
      {/* Sidebar: Sessions List */}
      <div className="w-64 bg-dark-800 rounded-xl border border-dark-700 flex flex-col shrink-0">
         <div className="p-4 border-b border-dark-700">
             <button 
                onClick={createNewSession}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
                 <Plus size={18} /> Novo Roteiro
             </button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {sessions.sort((a,b) => b.lastUpdated - a.lastUpdated).map(session => (
                 <div 
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`p-3 rounded-lg cursor-pointer group flex items-center justify-between transition-colors ${activeSessionId === session.id ? 'bg-dark-900 border border-brand-500/50' : 'hover:bg-dark-700 text-gray-400'}`}
                 >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare size={16} className={activeSessionId === session.id ? 'text-brand-400' : 'text-gray-600'} />
                        <span className={`text-sm truncate ${activeSessionId === session.id ? 'text-white font-medium' : ''}`}>
                            {session.title}
                        </span>
                     </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                     >
                         <Trash2 size={14} />
                     </button>
                 </div>
             ))}
             {sessions.length === 0 && (
                 <p className="text-center text-xs text-gray-500 mt-4">Nenhum chat ativo.</p>
             )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-dark-800 rounded-xl border border-dark-700 relative overflow-hidden">
         {!activeSession ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                 <Zap size={48} className="mb-4 text-brand-500 opacity-50" />
                 <h3 className="text-xl font-bold text-white mb-2">Roteiros Virais</h3>
                 <p className="max-w-md text-center text-sm">Crie chats padronizados com dados de treinamento, PDFs e notas. A IA usará seu histórico e contexto para gerar scripts perfeitos.</p>
                 <button onClick={createNewSession} className="mt-6 text-brand-400 hover:underline">Começar agora</button>
             </div>
         ) : (
             <>
                {/* Header */}
                <div className="h-16 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900/50">
                    <div>
                        <h3 className="font-bold text-white">{activeSession.title}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-2 truncate max-w-md">
                           <Clock size={10}/> {activeSession.config.duration} • <Mic size={10}/> {activeSession.config.tone}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-dark-700'}`}
                        title="Configurações da IA"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-1 flex flex-col relative">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin pb-20">
                            {activeSession.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                                        msg.role === 'user' 
                                        ? 'bg-brand-600 text-white rounded-tr-none' 
                                        : 'bg-dark-700 text-gray-100 rounded-tl-none border border-dark-600'
                                    }`}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-dark-700 rounded-2xl rounded-tl-none p-4 border border-dark-600 flex gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-dark-900 border-t border-dark-700 absolute bottom-0 left-0 right-0 z-10">
                            {fileAttachment && (
                                <div className="flex items-center gap-2 mb-2 bg-dark-800 p-2 rounded-lg max-w-fit border border-dark-600">
                                    <FileText size={14} className="text-brand-400" />
                                    <span className="text-xs text-white truncate max-w-[200px]">{fileAttachment.name}</span>
                                    <button onClick={() => setFileAttachment(null)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                                    title="Anexar PDF ou Imagem para contexto"
                                >
                                    <Paperclip size={20} />
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="application/pdf,image/*" 
                                        onChange={handleFileUpload}
                                    />
                                </button>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Digite sua ideia ou comando..."
                                    className="flex-1 bg-dark-800 border border-dark-600 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 resize-none h-[50px] max-h-[150px]"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() && !fileAttachment}
                                    className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Config Panel (Collapsible) */}
                    {showConfig && (
                        <div className="w-80 bg-dark-900 border-l border-dark-700 flex flex-col animate-fade-in shadow-xl z-20">
                            <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-800">
                                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <Settings size={16} /> Parâmetros do Roteiro
                                </h4>
                                <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-white md:hidden"><X size={16}/></button>
                            </div>

                            <div className="overflow-y-auto p-4 space-y-6 flex-1">
                                {/* Knowledge Base */}
                                <div>
                                    <label className="text-xs font-bold text-brand-400 uppercase mb-2 block flex items-center gap-1">
                                        <FileText size={12}/> Dados de Treinamento
                                    </label>
                                    <textarea 
                                        value={activeSession.knowledgeBase}
                                        onChange={(e) => updateKnowledgeBase(e.target.value)}
                                        placeholder="Cole aqui notas de estilo, estrutura padrão, ou exemplos..."
                                        className="w-full h-32 bg-dark-800 border border-dark-700 rounded-lg p-3 text-xs text-gray-300 focus:outline-none focus:border-brand-500 resize-none mb-1"
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="text-xs font-bold text-brand-400 uppercase mb-2 block flex items-center gap-1">
                                        <Clock size={12}/> Duração do Vídeo
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {DURATION_PRESETS.map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => updateSessionConfig('duration', preset)}
                                                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                                                    activeSession.config.duration === preset
                                                    ? 'bg-brand-600 border-brand-500 text-white shadow-sm'
                                                    : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-gray-500'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={activeSession.config.duration}
                                        onChange={(e) => updateSessionConfig('duration', e.target.value)}
                                        placeholder="Ou digite manual (ex: 45s)..."
                                        className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>

                                {/* Tone (Multi-select) */}
                                <div>
                                    <label className="text-xs font-bold text-brand-400 uppercase mb-2 block flex items-center gap-1">
                                        <Mic size={12}/> Tom de Voz (Múltiplo)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {TONE_PRESETS.map(tone => {
                                            const isSelected = activeSession.config.tone.includes(tone);
                                            return (
                                                <button
                                                    key={tone}
                                                    onClick={() => toggleTone(tone)}
                                                    className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 transition-all ${
                                                        isSelected
                                                        ? 'bg-purple-600 border-purple-500 text-white'
                                                        : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-gray-500'
                                                    }`}
                                                >
                                                    {tone}
                                                    {isSelected && <Check size={8} />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={activeSession.config.tone}
                                        onChange={(e) => updateSessionConfig('tone', e.target.value)}
                                        placeholder="Personalizado (separe por vírgula)..."
                                        className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>

                                {/* Strategy */}
                                <div>
                                    <label className="text-xs font-bold text-brand-400 uppercase mb-2 block flex items-center gap-1">
                                        <Zap size={12}/> Estratégia de Retenção
                                    </label>
                                    <div className="flex flex-col gap-1.5 mb-2">
                                        {STRATEGY_PRESETS.map(strategy => (
                                            <button
                                                key={strategy}
                                                onClick={() => updateSessionConfig('strategy', strategy)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border text-left transition-all ${
                                                    activeSession.config.strategy === strategy
                                                    ? 'bg-emerald-900/40 border-emerald-500 text-emerald-100'
                                                    : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-gray-500'
                                                }`}
                                            >
                                                {strategy}
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={activeSession.config.strategy}
                                        onChange={(e) => updateSessionConfig('strategy', e.target.value)}
                                        placeholder="Estratégia manual..."
                                        className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-dark-800 border-t border-dark-700">
                                <p className="text-[10px] text-gray-500 text-center">
                                    Configurações salvas automaticamente.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </>
         )}
      </div>
    </div>
  );
};