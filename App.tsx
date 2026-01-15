import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MonitorPlay, 
  CalendarDays, 
  Lightbulb, 
  Menu, 
  X,
  Settings,
  Zap,
  Layers,
  History,
  Share2,
  Users,
  LogOut,
  Copy,
  Lock,
  Unlock,
  Check,
  Loader2,
  Globe,
  Database,
  Link as LinkIcon,
  HelpCircle,
  WifiOff,
  User as UserIcon,
  LogIn
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ChannelManager } from './components/ChannelManager';
import { ContentPlanner } from './components/ContentPlanner';
import { PromptLibrary } from './components/PromptLibrary';
import { ViralScripts } from './components/ViralScripts';
import { WorkflowManager } from './components/WorkflowManager';
import { HistoryManager } from './components/HistoryManager';
import { Channel, VideoProject, SavedPrompt, WeekDay, VideoStatus, User, AccessLevel } from './types';
import { loginWithGoogle, logout, subscribeToCollection, saveDocument, removeDocument, getAuthInstance } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  // --- System State ---
  // Default to Guest User immediately so UI renders
  const [currentUser, setCurrentUser] = useState<User>({
      id: 'guest',
      name: 'Visitante',
      email: '',
      avatar: 'https://ui-avatars.com/api/?name=Visitante&background=334155&color=fff',
      color: '#64748b'
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'channels' | 'planner' | 'prompts' | 'viral' | 'workflow' | 'history'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Data State ---
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);

  // --- UI State ---
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState(window.location.href);

  // --- 1. Auth Listener (Optional Identification) ---
  useEffect(() => {
    const auth = getAuthInstance();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && !firebaseUser.isAnonymous) {
          // Real Google User
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || '',
            color: '#6366f1'
          });
        } else {
          // Anonymous or Not Logged In -> Stay as Guest
          setCurrentUser({
            id: 'guest',
            name: 'Visitante',
            email: '',
            avatar: 'https://ui-avatars.com/api/?name=Visitante&background=334155&color=fff',
            color: '#64748b'
          });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // --- 2. Real-time Data Subscriptions (Always Active) ---
  useEffect(() => {
    // Subscribe immediately, no need to wait for "login"
    const unsubChannels = subscribeToCollection('channels', (data) => setChannels(data as Channel[]));
    const unsubVideos = subscribeToCollection('videos', (data) => setVideos(data as VideoProject[]));
    const unsubPrompts = subscribeToCollection('prompts', (data) => setPrompts(data as SavedPrompt[]));

    return () => {
      unsubChannels();
      unsubVideos();
      unsubPrompts();
    };
  }, []);

  // --- Actions ---

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      alert("Erro ao logar com Google.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // --- Write Operations (Firebase Direct) ---
  const onAddChannel = (c: Channel) => saveDocument('channels', c);
  const onUpdateChannel = (c: Channel) => saveDocument('channels', c);
  const onDeleteChannel = (id: string) => removeDocument('channels', id);

  const onAddVideo = (v: VideoProject) => {
     const channel = channels.find(c => c.id === v.channelId);
     const base = (channel?.growthPotential || 5) * (channel?.productionEase || 5);
     const priorityScore = channel?.isMonetized ? Math.round(base * 1.2) : base;
     saveDocument('videos', { ...v, priorityScore });
  };
  const onUpdateVideo = (v: VideoProject) => {
     const channel = channels.find(c => c.id === v.channelId);
     let priorityScore = v.priorityScore;
     if (channel) {
        const base = (channel.growthPotential || 5) * (channel.productionEase || 5);
        priorityScore = channel.isMonetized ? Math.round(base * 1.2) : base;
     }
     saveDocument('videos', { ...v, priorityScore });
  };
  const onDeleteVideo = (id: string) => removeDocument('videos', id);

  const onAddPrompt = (p: SavedPrompt) => saveDocument('prompts', p);
  const onDeletePrompt = (id: string) => removeDocument('prompts', id);

  // --- Sharing Logic ---
  useEffect(() => {
    setShareLink(window.location.href);
  }, [isShareModalOpen]);

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        activeTab === id 
          ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
          : 'text-gray-400 hover:bg-dark-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- RENDER: MAIN APP (Direct Access) ---
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex font-sans overflow-hidden">
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 z-30 h-full w-64 bg-dark-900 border-r border-dark-800 p-4 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">T</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">TubeMaster</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="channels" icon={MonitorPlay} label="Canais" />
          <NavItem id="workflow" icon={Layers} label="Workflow" />
          <NavItem id="planner" icon={CalendarDays} label="Planejador" />
          <NavItem id="history" icon={History} label="Histórico" />
          <NavItem id="prompts" icon={Lightbulb} label="Biblioteca IA" />
          <NavItem id="viral" icon={Zap} label="Roteiros Virais" />
        </nav>

        <div className="mt-auto pt-6 border-t border-dark-800">
           {currentUser.id !== 'guest' ? (
               <div className="flex items-center gap-3 px-4 py-2 bg-dark-800 rounded-xl border border-dark-700">
                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] truncate flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500"></span> 
                            Online
                        </p>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-white" title="Sair">
                        <LogOut size={16} />
                    </button>
               </div>
           ) : (
               <button 
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-gray-300 py-3 rounded-xl border border-dark-700 transition-colors"
               >
                   <LogIn size={16} /> Entrar com Google
               </button>
           )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-dark-800 flex items-center justify-between px-6 bg-dark-900">
           <div className="flex items-center gap-4 lg:hidden">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2 -ml-2">
                    {sidebarOpen ? <X /> : <Menu />}
                </button>
                <span className="font-bold text-white">TubeMaster</span>
           </div>
           
           <div className="hidden lg:flex items-center text-sm text-gray-400 gap-2">
               <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                   <Globe size={12} /> Sincronização em Tempo Real (Pública)
               </span>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                  {currentUser.id === 'guest' ? (
                      <span className="text-xs text-gray-500">Modo Visitante</span>
                  ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-medium hidden md:block">{currentUser.name}</span>
                        <img 
                            src={currentUser.avatar} 
                            className="w-8 h-8 rounded-full border-2 border-dark-900" 
                            alt="" 
                        />
                    </div>
                  )}
              </div>

              <div className="h-6 w-px bg-dark-700 mx-2"></div>

              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
              >
                <Share2 size={16} />
                Compartilhar
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
           {activeTab === 'dashboard' && <Dashboard channels={channels} videos={videos} onUpdateVideo={onUpdateVideo} />}
           
           {activeTab === 'channels' && (
             <ChannelManager 
                channels={channels} 
                onAddChannel={onAddChannel}
                onDeleteChannel={onDeleteChannel}
                onUpdateChannel={onUpdateChannel}
             />
           )}

           {activeTab === 'workflow' && (
             <WorkflowManager 
                channels={channels}
                videos={videos}
                onUpdateVideo={onUpdateVideo}
                onUpdateChannel={onUpdateChannel}
             />
           )}

           {activeTab === 'planner' && (
             <ContentPlanner 
                channels={channels}
                videos={videos}
                onAddVideo={onAddVideo}
                onUpdateVideo={onUpdateVideo}
                onDeleteVideo={onDeleteVideo}
             />
           )}

           {activeTab === 'history' && (
             <HistoryManager 
                channels={channels}
                videos={videos}
                onDeleteVideo={onDeleteVideo}
             />
           )}

           {activeTab === 'prompts' && (
             <PromptLibrary 
                prompts={prompts}
                channels={channels}
                onAddPrompt={onAddPrompt}
                onDeletePrompt={onDeletePrompt}
             />
           )}

            {activeTab === 'viral' && (
             <ViralScripts />
           )}
        </div>

        {/* Share Modal */}
        {isShareModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-dark-800 p-6 rounded-2xl w-full max-w-lg border border-dark-700 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-dark-700 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Share2 className="text-brand-500" /> Compartilhar Projeto
                        </h3>
                        <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl">
                            <p className="text-sm text-emerald-200 font-medium">
                                <Globe size={14} className="inline mr-2"/>
                                Link de Tempo Real
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Copie o link abaixo e envie para sua equipe. Eles entrarão diretamente neste painel e verão as atualizações instantaneamente, sem precisar de login.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">URL do Projeto</label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={shareLink} 
                                    className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-gray-400 text-sm font-mono truncate"
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareLink);
                                        alert("Link copiado!");
                                    }}
                                    className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    title="Copiar Link"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-dark-700 flex justify-end">
                        <button onClick={() => setIsShareModalOpen(false)} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium">
                            Concluído
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;