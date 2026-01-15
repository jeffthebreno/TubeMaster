import React, { useState } from 'react';
import { Channel, VideoProject, VideoStatus, ContentCategory } from '../types';
import { Plus, Clock, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Copy, Check, GripVertical, Lock, TrendingUp } from 'lucide-react';

interface ContentPlannerProps {
  channels: Channel[];
  videos: VideoProject[];
  onAddVideo: (video: VideoProject) => void;
  onUpdateVideo: (video: VideoProject) => void;
  onDeleteVideo: (id: string) => void;
  readOnly?: boolean;
}

const CATEGORIES: ContentCategory[] = ['Prompt', 'Roteiro', 'Descrição', 'Tags SEO', 'Hashtags', 'Observação'];

export const ContentPlanner: React.FC<ContentPlannerProps> = ({ channels, videos, onAddVideo, onUpdateVideo, onDeleteVideo, readOnly = false }) => {
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id || '');
  const [status, setStatus] = useState<VideoStatus>(VideoStatus.IDEA);
  const [date, setDate] = useState('');
  
  // Structured Content State
  const [contentDetails, setContentDetails] = useState<Partial<Record<ContentCategory, string>>>({});
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('Observação');
  const [activeContent, setActiveContent] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filter AND Sort by Priority Score (Descendente)
  const filteredVideos = (filterChannel === 'all' 
    ? videos 
    : videos.filter(v => v.channelId === filterChannel)
  ).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const openModal = (video?: VideoProject, preselectedDate?: string) => {
    // If readOnly, allow viewing but maybe show different UI. Using same modal for now but disabled inputs.
    if (video) {
      setEditingId(video.id);
      setTitle(video.title);
      setSelectedChannelId(video.channelId);
      setStatus(video.status);
      setDate(video.publishDate || '');
      setContentDetails(video.contentDetails || {});
      // Reset input fields
      setActiveCategory('Observação');
      setActiveContent('');
    } else {
      if (readOnly) return; // Cannot create new if readOnly
      setEditingId(null);
      setTitle('');
      if (selectedChannelId === '' && channels.length > 0) setSelectedChannelId(channels[0].id);
      setStatus(VideoStatus.IDEA);
      setDate(preselectedDate || new Date().toISOString().split('T')[0]);
      setContentDetails({});
      setActiveCategory('Observação');
      setActiveContent('');
    }
    setIsModalOpen(true);
  };

  const handleAddContent = () => {
    if (!activeContent.trim() || readOnly) return;
    setContentDetails({
      ...contentDetails,
      [activeCategory]: activeContent
    });
    setActiveContent('');
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    if (readOnly) return;
    if (!title || !selectedChannelId) return;
    
    // If there is content in the textarea that hasn't been added yet, add it automatically
    let finalDetails = { ...contentDetails };
    if (activeContent.trim()) {
      finalDetails[activeCategory] = activeContent;
    }

    // Get current priority based on channel
    const channel = channels.find(c => c.id === selectedChannelId);
    const base = (channel?.growthPotential || 5) * (channel?.productionEase || 5);
    const priorityScore = channel?.isMonetized ? Math.round(base * 1.2) : base;

    const newVideo: VideoProject = {
      id: editingId || crypto.randomUUID(),
      channelId: selectedChannelId,
      title,
      status,
      contentDetails: finalDetails,
      publishDate: date,
      tags: [],
      priorityScore
    };

    if (editingId) {
      onUpdateVideo(newVideo);
    } else {
      onAddVideo(newVideo);
    }
    setIsModalOpen(false);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    if (readOnly) {
        e.preventDefault();
        return;
    }
    setDraggedVideoId(videoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: VideoStatus) => {
    if (readOnly) return;
    e.preventDefault();
    if (!draggedVideoId) return;

    const video = videos.find(v => v.id === draggedVideoId);
    if (video && video.status !== newStatus) {
      onUpdateVideo({ ...video, status: newStatus });
    }
    setDraggedVideoId(null);
  };

  const getStatusColor = (s: VideoStatus) => {
    switch(s) {
      case VideoStatus.IDEA: return 'bg-gray-600';
      case VideoStatus.SCRIPTING: return 'bg-blue-600';
      case VideoStatus.FILMING: return 'bg-red-600';
      case VideoStatus.EDITING: return 'bg-purple-600';
      case VideoStatus.SCHEDULED: return 'bg-amber-600';
      case VideoStatus.PUBLISHED: return 'bg-emerald-600';
      default: return 'bg-gray-600';
    }
  };

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month); 

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-32 bg-dark-900/50 border border-dark-800/50"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // Strict Priority Sorting for the Calendar Cell
      const dayVideos = filteredVideos
        .filter(v => v.publishDate === dateStr)
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
      
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div 
          key={d} 
          onClick={() => !readOnly && openModal(undefined, dateStr)}
          className={`h-32 bg-dark-900 border border-dark-800 hover:bg-dark-800 transition-colors p-2 overflow-y-auto cursor-pointer relative group ${isToday ? 'ring-1 ring-brand-500' : ''}`}
        >
          <span className={`text-sm font-semibold mb-1 block ${isToday ? 'text-brand-400' : 'text-gray-400'}`}>{d}</span>
          <div className="space-y-1">
            {dayVideos.map(v => (
              <div 
                key={v.id}
                onClick={(e) => { e.stopPropagation(); openModal(v); }}
                className={`text-[10px] p-1.5 rounded truncate text-white cursor-pointer hover:brightness-110 flex items-center gap-1 ${getStatusColor(v.status)} relative overflow-hidden`}
                title={`Prioridade: ${v.priorityScore?.toFixed(0)} - ${v.title}`}
              >
                 {/* Priority Background Indicator for High Score */}
                 {(v.priorityScore || 0) > 80 && (
                     <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-md z-0" />
                 )}
                 
                 <div className="min-w-[16px] text-[8px] font-black text-center bg-black/20 rounded px-0.5 z-10">
                    {v.priorityScore?.toFixed(0)}
                 </div>
                 <span className="truncate z-10">{v.title}</span>
              </div>
            ))}
          </div>
          {!readOnly && (
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-brand-400">
                <Plus size={14} />
            </button>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Planejador de Conteúdo
            {readOnly && <span className="bg-dark-700 text-gray-400 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Lock size={10} /> Leitura</span>}
          </h2>
          <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <CalendarIcon size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select 
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-dark-800 text-white border border-dark-700 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="all">Todos os Canais</option>
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!readOnly && (
            <button 
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg"
            >
                <Plus size={18} /> Novo Vídeo
            </button>
          )}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4 h-full">
          {Object.values(VideoStatus).map((statusGroup) => (
            <div 
              key={statusGroup} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusGroup)}
              className="bg-dark-800 rounded-xl border border-dark-700 p-4 min-w-[280px] flex flex-col h-full transition-colors hover:bg-dark-800/80"
            >
               <div className="flex items-center justify-between mb-4 border-b border-dark-700 pb-2">
                  <h3 className="font-semibold text-gray-200">{statusGroup}</h3>
                  <span className="text-xs font-mono bg-dark-900 px-2 py-1 rounded text-gray-500">
                    {filteredVideos.filter(v => v.status === statusGroup).length}
                  </span>
               </div>

               <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
                  {/* Videos are already sorted by priority in filteredVideos */}
                  {filteredVideos.filter(v => v.status === statusGroup).map((video, idx) => {
                     const channel = channels.find(c => c.id === video.channelId);
                     const priority = video.priorityScore || 0;
                     return (
                       <div 
                         key={video.id} 
                         draggable={!readOnly}
                         onDragStart={(e) => handleDragStart(e, video.id)}
                         onClick={() => openModal(video)}
                         className={`bg-dark-900 p-3 rounded-lg border border-dark-700 ${!readOnly ? 'hover:border-brand-500 cursor-grab active:cursor-grabbing' : 'cursor-default'} transition-all group relative shadow-sm`}
                        >
                          {/* Rank Indicator */}
                          <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ opacity: Math.max(0.2, priority / 100), backgroundColor: '#6366f1' }}></div>
                          
                          <div className="flex items-center justify-between mb-2 pl-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(video.status)}`}></span>
                                <span className="text-xs text-gray-400 truncate max-w-[150px]">{channel?.name}</span>
                            </div>
                            {!readOnly && <GripVertical size={14} className="text-dark-700" />}
                          </div>
                          <h4 className="text-white font-medium mb-2 line-clamp-2 pl-2">{video.title}</h4>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-800 pl-2">
                             {video.publishDate ? (
                                <div className="flex items-center gap-1 text-xs text-brand-400">
                                    <Clock size={12} />
                                    <span>{new Date(video.publishDate).toLocaleDateString()}</span>
                                </div>
                             ) : <div></div>}
                             
                             {/* Priority Badge in Kanban Card */}
                             <div className="flex items-center gap-1" title="Pontuação de Prioridade">
                                <TrendingUp size={10} className={priority > 70 ? 'text-emerald-400' : 'text-gray-500'} />
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${priority > 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-dark-800 text-gray-500'}`}>
                                    {priority.toFixed(0)}
                                </span>
                             </div>
                          </div>

                          {!readOnly && (
                              <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteVideo(video.id); }} 
                                    className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                <span className="sr-only">Delete</span>
                                &times;
                                </button>
                          )}
                       </div>
                     );
                  })}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 bg-dark-800 rounded-xl border border-dark-700 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-dark-700 rounded-full text-white"><ChevronLeft /></button>
                <h2 className="text-xl font-bold text-white w-48 text-center">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-dark-700 rounded-full text-white"><ChevronRight /></button>
             </div>
             <div className="flex gap-4 items-center">
                 <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Publicado
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span> Agendado
                 </div>
                 <div className="text-[10px] text-gray-500 bg-dark-900 px-2 py-1 rounded border border-dark-700 text-brand-400 font-bold flex items-center gap-1">
                    <TrendingUp size={10} /> Ordenado por Prioridade (Score)
                 </div>
             </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-1">
             {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
               <div key={d} className="text-center text-sm font-medium text-gray-400 py-2">{d}</div>
             ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
             {renderCalendar()}
          </div>
        </div>
      )}

       {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl border border-dark-700 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">
                 {editingId ? 'Detalhes do Vídeo' : 'Novo Projeto'}
                 {readOnly && <span className="ml-2 text-xs font-normal text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded">Somente Leitura</span>}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><span className="sr-only">Close</span>&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 pr-2">
               {/* Left Column: Metadata */}
               <div className="space-y-4 md:col-span-1 border-r border-dark-700 pr-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Título</label>
                    <input 
                      type="text" 
                      value={title}
                      disabled={readOnly}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                   <div>
                    <label className="block text-sm text-gray-400 mb-1">Canal</label>
                    <select 
                      value={selectedChannelId}
                      disabled={readOnly}
                      onChange={(e) => setSelectedChannelId(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-white focus:outline-none disabled:opacity-50"
                    >
                      {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <select 
                      value={status}
                      disabled={readOnly}
                      onChange={(e) => setStatus(e.target.value as VideoStatus)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-white focus:outline-none disabled:opacity-50"
                    >
                      {Object.values(VideoStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Data</label>
                    <input 
                      type="date" 
                      value={date}
                      disabled={readOnly}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-white focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  {editingId && !readOnly && (
                     <button 
                      onClick={() => { onDeleteVideo(editingId); setIsModalOpen(false); }}
                      className="w-full py-2 text-red-400 hover:bg-red-400/10 border border-red-900/50 rounded-lg text-sm mt-4"
                    >
                      Excluir Projeto
                    </button>
                  )}
               </div>

               {/* Right Column: Structured Content */}
               <div className="md:col-span-2 flex flex-col">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">Detalhes & Conteúdo</h4>
                  
                  {/* Editor Area */}
                  {!readOnly && (
                    <div className="bg-dark-900 p-4 rounded-lg border border-dark-700 mb-4">
                        <div className="flex gap-2 mb-2">
                            {CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                activeCategory === cat 
                                    ? 'bg-brand-600 border-brand-500 text-white' 
                                    : 'bg-transparent border-dark-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                {cat}
                            </button>
                            ))}
                        </div>
                        <textarea 
                            value={activeContent}
                            onChange={(e) => setActiveContent(e.target.value)}
                            placeholder={`Escreva o conteúdo para: ${activeCategory}...`}
                            className="w-full h-32 bg-dark-800 border border-dark-700 rounded-lg p-3 text-white focus:outline-none resize-none text-sm mb-2"
                        />
                        <div className="flex justify-end">
                            <button 
                            onClick={handleAddContent}
                            disabled={!activeContent.trim()}
                            className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                            <Plus size={14} /> Adicionar/Atualizar {activeCategory}
                            </button>
                        </div>
                    </div>
                  )}

                  {/* List of Added Content */}
                  <div className="flex-1 overflow-y-auto space-y-3">
                     {Object.entries(contentDetails).map(([key, value]) => (
                        value ? (
                          <div key={key} className="bg-dark-900 border border-dark-700 rounded-lg p-3 group">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{key}</span>
                                <div className="flex items-center gap-2">
                                  {!readOnly && (
                                    <button 
                                        onClick={() => { setActiveCategory(key as ContentCategory); setActiveContent(value as string); }}
                                        className="text-gray-500 hover:text-white text-xs"
                                    >
                                        Editar
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => copyToClipboard(value as string, key)}
                                    className="text-gray-400 hover:text-brand-400"
                                    title="Copiar"
                                  >
                                    {copiedField === key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                  </button>
                                </div>
                             </div>
                             <p className="text-sm text-gray-300 whitespace-pre-wrap">{value as string}</p>
                          </div>
                        ) : null
                     ))}
                     {Object.keys(contentDetails).length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-sm">
                           Nenhum conteúdo adicionado ainda.
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-800">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">
                {readOnly ? 'Fechar' : 'Cancelar'}
              </button>
              {!readOnly && (
                <button onClick={handleSave} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg">Salvar Tudo</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};