import React, { useState, useMemo } from 'react';
import { Channel, VideoProject, VideoStatus } from '../types';
import { Layers, ArrowRight, CheckCircle2, Circle, Clock, AlertTriangle, TrendingUp, Hammer } from 'lucide-react';

interface WorkflowManagerProps {
  channels: Channel[];
  videos: VideoProject[];
  onUpdateVideo: (video: VideoProject) => void;
  onUpdateChannel: (channel: Channel) => void;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({ channels, videos, onUpdateVideo, onUpdateChannel }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');

  const activeChannel = channels.find(c => c.id === selectedChannelId);
  
  const channelVideos = useMemo(() => {
    return videos.filter(v => v.channelId === selectedChannelId && v.status !== VideoStatus.PUBLISHED);
  }, [videos, selectedChannelId]);

  const calculateScore = (chan: Channel) => {
    const base = (chan.growthPotential || 5) * (chan.productionEase || 5);
    return chan.isMonetized ? base * 1.5 : base;
  };

  const updateChannelMetric = (key: 'growthPotential' | 'productionEase', val: number) => {
    if (!activeChannel) return;
    onUpdateChannel({ ...activeChannel, [key]: val });
  };

  const nextStatus = (current: VideoStatus): VideoStatus => {
    const flow = Object.values(VideoStatus);
    const idx = flow.indexOf(current);
    return flow[idx + 1] || current;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-800 p-4 rounded-xl border border-dark-700">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-brand-500" /> Workflow de Produção
          </h2>
          <p className="text-sm text-gray-400">Gerencie passos de atividades e prioridades estratégicas.</p>
        </div>
        <select 
          value={selectedChannelId}
          onChange={(e) => setSelectedChannelId(e.target.value)}
          className="bg-dark-900 text-white border border-dark-600 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-500"
        >
          {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {activeChannel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Configuração de Prioridade */}
          <div className="lg:col-span-1 bg-dark-800 p-6 rounded-xl border border-dark-700 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" /> Matriz de Prioridade
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-400">Potencial de Crescimento</label>
                  <span className="text-brand-400 font-bold">{activeChannel.growthPotential || 5}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={activeChannel.growthPotential || 5} 
                  onChange={(e) => updateChannelMetric('growthPotential', parseInt(e.target.value))}
                  className="w-full accent-brand-500 bg-dark-900 rounded-lg appearance-none h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-400">Facilidade de Produção</label>
                  <span className="text-amber-400 font-bold">{activeChannel.productionEase || 5}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={activeChannel.productionEase || 5} 
                  onChange={(e) => updateChannelMetric('productionEase', parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-dark-900 rounded-lg appearance-none h-2"
                />
              </div>

              <div className="p-4 bg-dark-900 rounded-lg border border-dark-600">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Score de Prioridade</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{calculateScore(activeChannel).toFixed(1)}</span>
                  <span className="text-xs text-gray-400 pb-1">pts</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic">
                  *Calculado: (Crescimento × Facilidade) {activeChannel.isMonetized ? '× 1.5 (Monetizado)' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Coluna de Atividades por Vídeo */}
          <div className="lg:col-span-2 space-y-4">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Hammer size={20} className="text-blue-400" /> Fluxo Ativo ({channelVideos.length})
            </h3>

            {channelVideos.length === 0 ? (
              <div className="bg-dark-800 p-12 rounded-xl border border-dark-700 text-center text-gray-500 italic">
                Nenhum vídeo em produção para este canal.
              </div>
            ) : (
              channelVideos.sort((a,b) => (b.priorityScore || 0) - (a.priorityScore || 0)).map(video => (
                <div key={video.id} className="bg-dark-800 p-5 rounded-xl border border-dark-700 group hover:border-brand-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold">{video.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-dark-900 text-gray-400 px-2 py-0.5 rounded border border-dark-600 uppercase">
                          {video.status}
                        </span>
                        {video.publishDate && (
                          <span className="text-[10px] text-brand-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(video.publishDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onUpdateVideo({ ...video, status: nextStatus(video.status) })}
                      className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-xs"
                    >
                      Avançar <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Blocos de Atividades Clicáveis */}
                  <div className="flex flex-wrap gap-2">
                    {Object.values(VideoStatus).map((status) => {
                      const isPast = Object.values(VideoStatus).indexOf(video.status) >= Object.values(VideoStatus).indexOf(status);
                      const isCurrent = video.status === status;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => onUpdateVideo({ ...video, status })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                            isCurrent 
                              ? 'bg-brand-600 border-brand-500 text-white shadow-lg scale-105' 
                              : isPast 
                                ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' 
                                : 'bg-dark-900 border-dark-700 text-gray-500 hover:border-gray-500'
                          }`}
                        >
                          {isPast ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};