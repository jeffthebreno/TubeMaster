export enum VideoStatus {
  IDEA = 'Ideia',
  SCRIPTING = 'Roteiro',
  FILMING = 'Gravando',
  EDITING = 'Editando',
  SCHEDULED = 'Agendado',
  PUBLISHED = 'Publicado'
}

export enum WeekDay {
  MON = 'Segunda',
  TUE = 'Terça',
  WED = 'Quarta',
  THU = 'Quinta',
  FRI = 'Sexta',
  SAT = 'Sábado',
  SUN = 'Domingo'
}

export interface WorkflowStep {
  id: string;
  label: string;
  statusMapping: VideoStatus;
  completed: boolean;
}

export interface Channel {
  id: string;
  name: string;
  channelUrl?: string;
  avatarUrl?: string;
  totalSubscribers: number;
  totalViews: number;
  totalVideos: number;
  uploadSchedule: WeekDay[];
  uploadTime: string;
  isMonetized?: boolean;
  avgDuration?: string;
  videosPerWeek?: number;
  titlePatterns?: string;
  themeAnalysis?: string;
  strategyNotes?: string;
  audiencePersona?: string;
  contentTone?: string;
  
  // Novos campos de priorização
  growthPotential: number; // 1-10
  productionEase: number;  // 1-10
}

export type ContentCategory = 'Prompt' | 'Roteiro' | 'Descrição' | 'Tags SEO' | 'Hashtags' | 'Observação';

export interface VideoProject {
  id: string;
  channelId: string;
  title: string;
  status: VideoStatus;
  publishDate?: string;
  completionDate?: number; // Timestamp de quando foi marcado como concluído
  contentDetails: Partial<Record<ContentCategory, string>>; 
  tags: string[];
  priorityScore?: number;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUsed?: string;
}

// Viral Scripts Types
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ScriptConfig {
  duration: string;
  tone: string;
  strategy: string;
}

export interface ViralSession {
  id: string;
  title: string;
  knowledgeBase: string;
  contextFiles?: { name: string, data: string, mimeType: string }[];
  config: ScriptConfig;
  messages: ChatMessage[];
  lastUpdated: number;
}

// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
}

export type AccessLevel = 'view' | 'edit';

// Backend Config
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}