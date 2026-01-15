
import React, { useState, useMemo } from 'react';
import { Channel, VideoProject, VideoStatus } from '../types';
import { 
  History, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Download, 
  FileText, 
  X, 
  Info, 
  Tag, 
  FileJson,
  Star 
} from 'lucide-react';

interface HistoryManagerProps {
  channels: Channel[];
  videos: VideoProject[];
  onDeleteVideo: (id: string) => void;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({ channels, videos, onDeleteVideo }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoProject | null>(null);

  const completedVideos = useMemo(() => {
    return videos.filter(v => v.status === VideoStatus.PUBLISHED)
      .filter(v => selectedChannelId === 'all' || v.channelId === selectedChannelId)
      .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.completionDate || 0) - (a.completionDate || 0));
  }, [videos, selectedChannelId, searchTerm]);

  const stats = useMemo(() => {
    const total = completedVideos.length;
    const byChannel = channels.map(c => ({
      name: c.name,
      count: completedVideos.filter(v => v.channelId === c.id).length
    })).sort((a,b) => b.count - a.count);

    return { total, byChannel };
  }, [completedVideos, channels]);

  const exportToCSV = () => {
    if (completedVideos.length === 0) return;

    const headers = ['Titulo', 'Canal', 'Data Conclusao', 'Prioridade', 'Status Final'];
    const rows = completedVideos.map(v => {
      const chan = channels.find(c => c.id === v.channelId);
      const date = v.completionDate ? new Date(v.completionDate).toLocaleString('pt-BR') : 'N/A';
      return [
        `"${v.title.replace(/"/g, '""')}"`,
        `"${chan?.name || 'Desconhecido'}"`,
        date,
        v.priorityScore?.toFixed(0) || '0',
        v.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_tubemaster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-xl">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-brand-600/20 rounded-xl text-brand-400">
             <History size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-white">Histórico de Publicações</h2>
              <p className="text-sm text-gray-400">Rastreador de produtividade e análise de entrega.</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <select 
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="bg-dark-900 text-white border border-dark-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todos os Canais</option>
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            onClick={exportToCSV}
            disabled={completedVideos.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Stats */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-lg">
              <p className="text-xs font-black text-brand-500 uppercase tracking-widest mb-4">Total Produzido</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">{stats.total}</span>
                <span className="text-gray-500 font-medium">vídeos</span>
              </div>
           </div>

           <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 shadow-lg">
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Top Canais</p>
              <div className="space-y-4">
                {stats.byChannel.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 truncate max-w-[120px]">{item.name}</span>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-16 bg-dark-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(item.count / (stats.total || 1)) * 100}%` }}
                          />
                       </div>
                       <span className="text-xs font-bold text-white">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Main History Table */}
        <div className="lg:col-span-3">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-lg">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-dark-900/50 border-b border-dark-700">
                         <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Vídeo</th>
                         <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase">Canal</th>
                         <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase text-center">Finalizado em</th>
                         <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase text-center">Score</th>
                         <th className="px-6 py-4 text-right"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-dark-700">
                      {completedVideos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Nenhum histórico encontrado para os filtros selecionados.</td>
                        </tr>
                      ) : (
                        completedVideos.map(video => {
                          const chan = channels.find(c => c.id === video.channelId);
                          const date = video.completionDate ? new Date(video.completionDate) : null;
                          return (
                            <tr 
                              key={video.id} 
                              onClick={() => setSelectedVideo(video)}
                              className="hover:bg-dark-700/50 transition-colors group cursor-pointer"
                            >
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">{video.title}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle size={10} className="text-emerald-500" />
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Publicado</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   <img src={chan?.avatarUrl} className="w-6 h-6 rounded-full border border-dark-600" alt="" />
                                   <span className="text-xs text-gray-300 font-medium">{chan?.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center">
                                   <span className="text-xs text-gray-300">{date?.toLocaleDateString()}</span>
                                   <span className="text-[10px] text-gray-500 font-mono">{date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className="text-xs font-bold text-brand-400 px-2 py-0.5 bg-brand-500/10 rounded-lg border border-brand-500/20">
                                    {video.priorityScore?.toFixed(0) || 'N/A'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(video.id); }}
                                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                      title="Excluir do histórico"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes Completos do Histórico */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header do Modal */}
            <div className="p-6 border-b border-dark-700 flex justify-between items-start bg-dark-900">
                <div className="flex gap-5">
                    <img 
                      src={channels.find(c => c.id === selectedVideo.channelId)?.avatarUrl} 
                      className="w-14 h-14 rounded-full border-2 border-brand-500 shadow-lg shadow-brand-500/20" 
                      alt="" 
                    />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xl font-black text-white">{selectedVideo.title}</h4>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                              <CheckCircle size={10} /> Concluído
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                          {channels.find(c => c.id === selectedVideo.channelId)?.name} • {selectedVideo.publishDate ? new Date(selectedVideo.publishDate + 'T00:00:00').toLocaleDateString() : 'Sem data'}
                        </p>
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)} 
                  className="p-2 text-gray-500 hover:text-white bg-dark-800 rounded-xl transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-dark-800">
                {/* Metadados Rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><Clock size={12}/> Finalizado em</p>
                        <span className="text-sm text-white font-bold">{selectedVideo.completionDate ? new Date(selectedVideo.completionDate).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                        {/* Fix: Added missing Star icon from lucide-react */}
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><Star size={12} className="text-brand-400"/> Score Execução</p>
                        <span className="text-sm text-brand-400 font-bold">{selectedVideo.priorityScore?.toFixed(0)} pts</span>
                    </div>
                    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><Tag size={12} className="text-purple-400"/> Tags SEO</p>
                        <span className="text-sm text-white font-bold truncate block">{selectedVideo.contentDetails['Tags SEO'] || 'Nenhum'}</span>
                    </div>
                    <div className="bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><FileJson size={12} className="text-amber-400"/> Tipo</p>
                        <span className="text-sm text-white font-bold">Conteúdo Estático</span>
                    </div>
                </div>

                {/* Blocos de Conteúdo Detalhado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lado Esquerdo: Roteiro e Observações */}
                  <div className="space-y-6">
                    <section>
                      <h5 className="text-xs font-black text-brand-500 uppercase mb-3 flex items-center gap-2">
                        <FileText size={14} /> Roteiro de Produção
                      </h5>
                      <div className="bg-dark-900 p-5 rounded-2xl border border-dark-700 text-sm text-gray-300 leading-relaxed min-h-[150px] whitespace-pre-wrap">
                        {selectedVideo.contentDetails['Roteiro'] || 'Conteúdo do roteiro não preenchido.'}
                      </div>
                    </section>
                    
                    <section>
                      <h5 className="text-xs font-black text-amber-500 uppercase mb-3 flex items-center gap-2">
                        <Info size={14} /> Notas Internas
                      </h5>
                      <div className="bg-dark-900 p-5 rounded-2xl border border-dark-700 text-sm text-gray-400 italic">
                        {selectedVideo.contentDetails['Observação'] || 'Nenhuma observação extra registrada.'}
                      </div>
                    </section>
                  </div>

                  {/* Lado Direito: SEO e Redes Sociais */}
                  <div className="space-y-6">
                    <section>
                      <h5 className="text-xs font-black text-purple-500 uppercase mb-3 flex items-center gap-2">
                        <Tag size={14} /> Metadados & SEO
                      </h5>
                      <div className="space-y-4">
                        <div className="bg-dark-900 p-4 rounded-xl border border-dark-700">
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Descrição do Vídeo</p>
                          <p className="text-xs text-gray-300 line-clamp-4">{selectedVideo.contentDetails['Descrição'] || 'Sem descrição.'}</p>
                        </div>
                        <div className="bg-dark-900 p-4 rounded-xl border border-dark-700">
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Hashtags</p>
                          <p className="text-xs text-brand-400">{selectedVideo.contentDetails['Hashtags'] || 'Sem hashtags.'}</p>
                        </div>
                      </div>
                    </section>

                    <section className="bg-dark-900/30 p-5 rounded-2xl border border-dashed border-dark-700">
                        <h5 className="text-[10px] font-black text-gray-500 uppercase mb-3">Auditoria de Prompt IA</h5>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          {selectedVideo.contentDetails['Prompt'] || 'O prompt original usado para gerar este roteiro não foi vinculado.'}
                        </p>
                    </section>
                  </div>
                </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 bg-dark-900 border-t border-dark-700 flex justify-between items-center">
                <div className="flex gap-4">
                   <button 
                    onClick={() => { onDeleteVideo(selectedVideo.id); setSelectedVideo(null); }}
                    className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:bg-red-500/10"
                   >
                     <Trash2 size={18} /> Apagar Registro
                   </button>
                </div>
                <button 
                    onClick={() => setSelectedVideo(null)}
                    className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-brand-500/20"
                >
                    Fechar Detalhes
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
