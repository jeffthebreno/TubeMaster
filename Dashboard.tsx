import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Channel, VideoProject, VideoStatus, WeekDay } from '../types';
import { Users, Eye, Video, TrendingUp, Filter, Calendar, CheckCircle, Info, X } from 'lucide-react';

interface DashboardProps {
  channels: Channel[];
  videos: VideoProject[];
  onUpdateVideo: (video: VideoProject) => void;
  readOnly?: boolean;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ channels, videos, onUpdateVideo, readOnly = false }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoProject | null>(null);

  // Filter Data Logic
  const filteredChannels = useMemo(() => {
    return selectedChannelId === 'all' 
      ? channels 
      : channels.filter(c => c.id === selectedChannelId);
  }, [channels, selectedChannelId]);

  const filteredVideos = useMemo(() => {
    return selectedChannelId === 'all'
      ? videos
      : videos.filter(v => v.channelId === selectedChannelId);
  }, [videos, selectedChannelId]);

  // Aggregate Metrics
  const totalSubs = filteredChannels.reduce((acc, c) => acc + c.totalSubscribers, 0);
  const totalViews = filteredChannels.reduce((acc, c) => acc + c.totalViews, 0);
  const totalVids = filteredChannels.reduce((acc, c) => acc + c.totalVideos, 0);
  const avgViews = totalVids > 0 ? Math.round(totalViews / totalVids) : 0;

  // Prioritization helper
  const getPriorityScore = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return 0;
    const channel = channels.find(c => c.id === video.channelId);
    if (!channel) return 0;
    // Use stored priority if available, otherwise calculate
    if (video.priorityScore) return video.priorityScore;
    
    const base = (channel.growthPotential || 5) * (channel.productionEase || 5);
    return channel.isMonetized ? base * 1.5 : base;
  };

  // Weekly Schedule Data
  const weeklySchedule = useMemo(() => {
    const days = Object.values(WeekDay);
    return days.map(day => {
      const videosOnDay = filteredVideos.filter(v => {
        if (!v.publishDate || v.status === VideoStatus.PUBLISHED) return false;
        const d = new Date(v.publishDate + 'T00:00:00');
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return capitalizedDayName.includes(day) || (day === WeekDay.SAT && dayName.includes('sábado')) || (day === WeekDay.SUN && dayName.includes('domingo'));
      });

      return {
        day,
        videos: videosOnDay.sort((a,b) => getPriorityScore(b.id) - getPriorityScore(a.id))
      };
    });
  }, [filteredVideos, channels]);

  const handleCompleteVideo = (video: VideoProject) => {
    if (readOnly) return;
    onUpdateVideo({
      ...video,
      status: VideoStatus.PUBLISHED,
      completionDate: Date.now()
    });
  };

  const channelData = filteredChannels.map(c => ({
    name: c.name,
    views: c.totalViews,
    subs: c.totalSubscribers
  }));

  const statusData = Object.values(VideoStatus).map(status => ({
    name: status,
    count: filteredVideos.filter(v => v.status === status).length
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Filter Header */}
      <div className="flex justify-between items-center bg-dark-800 p-4 rounded-xl border border-dark-700">
        <h2 className="text-xl font-bold text-white">Dashboard Geral</h2>
        <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select 
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-dark-900 text-white border border-dark-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
            >
                <option value="all">Todos os Canais</option>
                {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inscritos" value={totalSubs.toLocaleString()} icon={<Users className="w-6 h-6 text-blue-400" />} color="bg-blue-400" />
        <StatCard title="Total Visualizações" value={totalViews.toLocaleString()} icon={<Eye className="w-6 h-6 text-emerald-400" />} color="bg-emerald-400" />
        <StatCard title="Vídeos Postados" value={totalVids.toLocaleString()} icon={<Video className="w-6 h-6 text-purple-400" />} color="bg-purple-400" />
        <StatCard title="Média Views/Vídeo" value={avgViews.toLocaleString()} icon={<TrendingUp className="w-6 h-6 text-amber-400" />} color="bg-amber-400" />
      </div>

      {/* Agenda de Postagem por Prioridade */}
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={20} className="text-brand-400" /> Agenda de Execução Semanal
          </h3>
          <span className="text-xs text-gray-500 bg-dark-900 px-2 py-1 rounded">Prioridade Crescente</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {weeklySchedule.map(({ day, videos }) => (
            <div key={day} className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/50 min-h-[200px] flex flex-col">
              <h4 className="text-xs font-black text-gray-500 uppercase mb-3 text-center border-b border-dark-700 pb-2">{day}</h4>
              <div className="space-y-3 flex-1">
                {videos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 py-10">
                    <Calendar size={24} className="mb-2 text-gray-600" />
                    <p className="text-[10px] text-gray-600 text-center uppercase tracking-tighter">Livre</p>
                  </div>
                ) : (
                  videos.map((v, i) => {
                    const score = getPriorityScore(v.id);
                    const chan = channels.find(c => c.id === v.channelId);
                    return (
                      <div 
                        key={v.id} 
                        className={`p-3 rounded-lg border group relative transition-all animate-fade-in ${i === 0 ? 'bg-brand-900/10 border-brand-500/50 shadow-lg shadow-brand-500/5' : 'bg-dark-800 border-dark-700'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img 
                            src={chan?.avatarUrl || `https://picsum.photos/seed/${chan?.id}/40/40`} 
                            className="w-5 h-5 rounded-full ring-1 ring-dark-600" 
                            alt="" 
                          />
                          <span className="text-[9px] font-bold text-gray-400 truncate flex-1 uppercase tracking-tight">{chan?.name}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${score > 75 ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>
                            {score.toFixed(0)}
                          </span>
                        </div>
                        
                        <p 
                            onClick={() => setSelectedVideo(v)}
                            className="text-[11px] text-white font-bold leading-tight line-clamp-2 cursor-pointer hover:text-brand-400 transition-colors"
                        >
                            {v.title}
                        </p>
                        
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-dark-700 pt-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                             <span className="text-[9px] text-gray-400 truncate font-medium uppercase">{v.status}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                                onClick={() => setSelectedVideo(v)}
                                className="text-gray-500 hover:text-white"
                                title="Ver Detalhes"
                            >
                                <Info size={14} />
                            </button>
                            {!readOnly && (
                                <button 
                                    onClick={() => handleCompleteVideo(v)}
                                    className="text-emerald-500 hover:text-emerald-400 hover:scale-110 transition-all"
                                    title="Marcar como Concluído"
                                >
                                    <CheckCircle size={16} />
                                </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes do Vídeo */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
                <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white">
                            {channels.find(c => c.id === selectedVideo.channelId)?.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="text-white font-bold">{selectedVideo.title}</h4>
                            <p className="text-xs text-gray-400">{channels.find(c => c.id === selectedVideo.channelId)?.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedVideo(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-dark-800">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-dark-900 p-3 rounded-xl border border-dark-700">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                            <span className="text-sm text-brand-400 font-medium">{selectedVideo.status}</span>
                        </div>
                        <div className="bg-dark-900 p-3 rounded-xl border border-dark-700">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Prioridade</p>
                            <span className="text-sm text-amber-400 font-medium">{getPriorityScore(selectedVideo.id).toFixed(0)} pts</span>
                        </div>
                        <div className="bg-dark-900 p-3 rounded-xl border border-dark-700">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Publicação</p>
                            <span className="text-sm text-emerald-400 font-medium">{selectedVideo.publishDate ? new Date(selectedVideo.publishDate + 'T00:00:00').toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h5 className="text-sm font-bold text-white border-b border-dark-700 pb-2">Informações de Produção</h5>
                        {Object.entries(selectedVideo.contentDetails).map(([key, value]) => (
                            <div key={key} className="bg-dark-900 p-4 rounded-xl border border-dark-700">
                                <span className="text-[10px] font-black text-brand-500 uppercase mb-2 block">{key}</span>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{value}</p>
                            </div>
                        ))}
                        {Object.keys(selectedVideo.contentDetails).length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">Nenhum detalhe adicional salvo.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-dark-900 border-t border-dark-700 flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedVideo(null)}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                    >
                        Fechar
                    </button>
                    {!readOnly && (
                        <button 
                            onClick={() => { handleCompleteVideo(selectedVideo); setSelectedVideo(null); }}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> Finalizar Vídeo
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};