import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectData, TitleItem, StoryboardFrame, CoverOption, PromptTemplate, ProjectStatus } from '../types';
import * as storage from '../services/storageService';
import * as gemini from '../services/geminiService';
import { 
  ArrowLeft, Layout, FileText, Type, 
  List, PanelRightClose, Sparkles, Loader2, Copy, 
  Check, Images, ArrowRight, Palette, Film, Maximize2, Play, Pause,
  ZoomIn, ZoomOut, Move, RefreshCw, Rocket, AlertCircle, Archive,
  Cloud, CloudCheck, ArrowLeftRight, FileAudio, Upload, Trash2, Headphones, CheckCircle2, CloudUpload, Volume2, VolumeX, Music
} from 'lucide-react';

// --- Sub-Components ---

const RowCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors" title="复制">
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

// --- Fancy Audio Player Component ---
const FancyAudioPlayer = ({ 
    src, 
    fileName, 
    isLocal, 
    onReplace, 
    onDelete, 
    isUploading, 
    uploadProgress,
    onUpload 
}: { 
    src: string, 
    fileName: string, 
    isLocal: boolean, 
    onReplace: () => void, 
    onDelete?: () => void,
    isUploading?: boolean,
    uploadProgress?: number,
    onUpload?: () => void
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const newTime = (Number(e.target.value) / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(Number(e.target.value));
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group">
            {/* Background Gradient & Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-fuchsia-900/20 to-slate-900 z-0"></div>
            <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] z-0 opacity-50 ${isPlaying ? 'animate-[spin_60s_linear_infinite]' : ''}`}></div>

            <div className="relative z-10 p-6 flex flex-col items-center">
                
                {/* Visualizer & Icon */}
                <div className="w-full h-32 flex items-center justify-center gap-1.5 mb-6 relative">
                     {/* Center Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 z-20 ${isPlaying ? 'bg-fuchsia-500 shadow-fuchsia-500/50 scale-110' : 'bg-slate-800 shadow-slate-900/50'}`}>
                        <Music className={`w-8 h-8 ${isPlaying ? 'text-white animate-bounce' : 'text-slate-500'}`} />
                    </div>

                    {/* Animated Bars (Fake Visualizer) */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-60">
                         {[...Array(20)].map((_, i) => (
                             <div 
                                key={i} 
                                className={`w-1.5 bg-gradient-to-t from-violet-500 to-fuchsia-400 rounded-full transition-all duration-150 ${isPlaying ? 'animate-pulse' : 'h-2'}`}
                                style={{ 
                                    height: isPlaying ? `${Math.random() * 80 + 10}%` : '10%',
                                    animationDelay: `${i * 0.05}s`
                                }} 
                             />
                         ))}
                    </div>
                </div>

                {/* File Info */}
                <div className="text-center mb-6 w-full">
                    <h3 className="text-white font-bold text-lg truncate px-4">{fileName}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        {isLocal ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                                待上传
                            </span>
                        ) : (
                             <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 云端已同步
                            </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <audio ref={audioRef} src={src} preload="metadata" />
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
                        <div className="relative flex-1 h-1.5 group/seek">
                             <div className="absolute inset-0 bg-slate-700 rounded-full"></div>
                             <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                             ></div>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={progress} 
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                             />
                             <div 
                                className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                                style={{ left: `${progress}%`, marginLeft: '-6px' }}
                             ></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 w-8">{formatTime(duration)}</span>
                    </div>

                    {/* Main Buttons */}
                    <div className="flex items-center justify-between">
                         <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors p-2">
                             {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                         </button>

                         <div className="flex items-center gap-4">
                             <button 
                                onClick={togglePlay}
                                className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                             >
                                 {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                             </button>
                         </div>

                         {/* Actions Menu */}
                         <div className="flex gap-2">
                             <button onClick={onReplace} className="text-slate-400 hover:text-white p-2" title="替换">
                                 <RefreshCw className="w-4 h-4" />
                             </button>
                             {onDelete && (
                                 <button onClick={onDelete} className="text-slate-400 hover:text-rose-500 p-2" title="删除">
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             )}
                         </div>
                    </div>
                </div>

                {/* Upload Status / Button */}
                {isLocal && (
                    <div className="w-full mt-4">
                        {isUploading ? (
                             <div className="w-full">
                                <div className="flex justify-between text-[10px] font-bold text-fuchsia-300 mb-1">
                                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> 上传中...</span>
                                    <span>{Math.round(uploadProgress || 0)}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-fuchsia-500 transition-all duration-300" 
                                        style={{ width: `${uploadProgress || 0}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                             <button 
                                onClick={onUpload}
                                className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-fuchsia-900/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                <CloudUpload className="w-4 h-4" /> 上传到云端
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface TextResultBoxProps {
    content: string;
    title: string;
    onSave?: (val: string) => void;
    placeholder?: string;
    showStats?: boolean;
    readOnly?: boolean;
}

const TextResultBox = ({ content, title, onSave, placeholder, showStats, readOnly }: TextResultBoxProps) => {
  const [value, setValue] = useState(content || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) setValue(content || '');
  }, [content, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (onSave) {
        onSave(value);
        setIsDirty(false);
    }
  };

  const charCount = (value || '').length;
  const chineseCount = (value || '').match(/[\u4e00-\u9fa5]/g)?.length || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
             {showStats && (
                 <div className="flex gap-2">
                     <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono flex items-center gap-1" title="总字符数">
                        <span className="font-bold text-slate-700">{charCount}</span> 字符
                     </span>
                     <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono flex items-center gap-1" title="中文字符数">
                        <span className="font-bold text-slate-700">{chineseCount}</span> 汉字
                     </span>
                 </div>
             )}
        </div>
        <div className="flex items-center gap-2">
            {!readOnly && onSave && isDirty && (
                 <button onClick={handleSave} className="flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded shadow-sm transition-all animate-pulse">
                    <Check className="w-3 h-3" /> 保存
                 </button>
            )}
            <RowCopyButton text={value} />
        </div>
      </div>
      {onSave && !readOnly ? (
        <textarea 
            className="flex-1 w-full p-4 text-sm text-slate-700 leading-relaxed font-mono outline-none resize-none bg-white focus:bg-slate-50/30 transition-colors"
            value={value}
            onChange={handleChange}
            placeholder={placeholder || "暂无内容..."}
        />
      ) : (
        <div className="p-4 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono flex-1">
          {content || <span className="text-slate-400 italic">暂无内容...</span>}
        </div>
      )}
    </div>
  );
};

interface TableResultBoxProps<T> {
    headers: string[];
    data: T[];
    renderRow: (item: T, index: number) => React.ReactNode;
}

const TableResultBox = <T extends any>({ headers, data, renderRow }: TableResultBoxProps<T>) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
          <tr>
            {headers.map((h: string) => (
              <th key={h} className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data && data.length > 0 ? data.map(renderRow) : (
            <tr><td colSpan={headers.length} className="text-center py-8 text-slate-400 text-sm">暂无数据</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Configuration ---

const NODE_WIDTH = 280;
const NODE_HEIGHT = 180;

// Workflow Layout Definition
const NODES_CONFIG = [
  { id: 'input', label: '项目输入', panelTitle: '项目基础信息', icon: Layout, color: 'blue', description: '选题与基本信息', x: 50, y: 300 },
  { id: 'script', label: '视频脚本', panelTitle: '视频文案脚本编辑器', icon: FileText, color: 'violet', promptKey: 'SCRIPT', description: '生成分章节的详细脚本', model: 'Gemini 2.5 Flash Preview', x: 450, y: 300 },
  // Column 2: Outputs from Script
  { id: 'titles', label: '爆款标题', panelTitle: '爆款标题方案', icon: Type, color: 'amber', promptKey: 'TITLES', description: '生成高点击率标题', model: 'Gemini 2.5 Flash', x: 850, y: 100 },
  // Audio Upload Node (Replaces Storyboard Text)
  { id: 'audio_file', label: '上传MP3文件', panelTitle: '上传音频文件 (MP3/WAV)', icon: FileAudio, color: 'fuchsia', description: '上传项目配音或解说文件', x: 850, y: 300 },
  { id: 'summary', label: '简介与标签', panelTitle: '视频简介与标签', icon: List, color: 'emerald', promptKey: 'SUMMARY', description: '生成简介和Hashtags', model: 'Gemini 2.5 Flash', x: 850, y: 500 },
  { id: 'cover', label: '封面策划', panelTitle: '封面视觉与文案策划', icon: Palette, color: 'rose', promptKey: 'COVER_GEN', description: '策划封面视觉与文案', model: 'Gemini 2.5 Flash', x: 850, y: 700 },
];

const CONNECTIONS = [
  { from: 'input', to: 'script' },
  { from: 'script', to: 'audio_file' },
  { from: 'script', to: 'titles' },
  { from: 'script', to: 'summary' },
  { from: 'script', to: 'cover' },
];

// --- Main Component ---

const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [generatingNodes, setGeneratingNodes] = useState<Set<string>>(new Set());
  const [failedNodes, setFailedNodes] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<Record<string, PromptTemplate>>({});
  
  // Audio Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  // Pending audio file (Selected but not uploaded)
  const [pendingAudio, setPendingAudio] = useState<{file: File, url: string} | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Canvas State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Sync Status State
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'synced' | 'error' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const mountedRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const isBusyRef = useRef(false);

  useEffect(() => {
      isBusyRef.current = loading || generatingNodes.size > 0 || isDragging || selectedNodeId !== null || isUploading;
  }, [loading, generatingNodes, isDragging, selectedNodeId, isUploading]);

  useEffect(() => {
    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('mousemove', updateActivity);
    return () => {
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('mousemove', updateActivity);
    };
  }, []);

  // Smart Auto-Sync Loop
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const performSync = async () => {
          if (!mountedRef.current || !id) return;

          const isUserActive = (Date.now() - lastActivityRef.current) < 30000;
          
          if (isBusyRef.current || isUserActive) {
              console.log("Auto-sync delayed: User active or system busy");
              timeoutId = setTimeout(performSync, 2 * 60 * 1000); 
              return;
          }

          setSyncStatus('saving');
          try {
              const remoteP = await storage.syncProject(id);
              if (remoteP && mountedRef.current) {
                  if (!project || remoteP.updatedAt > project.updatedAt) {
                      setProject(remoteP);
                  }
                  setSyncStatus('synced');
                  setLastSyncTime(new Date().toLocaleTimeString());
              } else {
                  if (mountedRef.current) setSyncStatus('synced');
              }
          } catch (e) {
              console.warn("Auto-sync failed", e);
              if (mountedRef.current) setSyncStatus('error');
          }

          timeoutId = setTimeout(performSync, 5 * 60 * 1000);
      };

      timeoutId = setTimeout(performSync, 5 * 60 * 1000);
      return () => clearTimeout(timeoutId);
  }, [id, project]);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
        if (id) {
            const p = await storage.getProject(id);
            if (p) {
                if (mountedRef.current) {
                    setProject(p);
                    setLoading(false);
                }
            }
            if (mountedRef.current) setSyncStatus('saving');
            try {
                const freshP = await storage.syncProject(id);
                if (freshP && mountedRef.current) {
                    if (!p || freshP.updatedAt > p.updatedAt) {
                        setProject(freshP);
                    }
                    setSyncStatus('synced');
                    setLastSyncTime(new Date().toLocaleTimeString());
                } else if (!p) {
                    if (mountedRef.current) navigate('/');
                    return;
                }
            } catch (e) {
                console.warn("Auto-sync failed", e);
                if (mountedRef.current) setSyncStatus('error');
            }
        }
        
        const loadedPrompts = await storage.getPrompts();
        if (mountedRef.current) setPrompts(loadedPrompts);
        if (mountedRef.current) setLoading(false);
    };
    init();
    return () => { mountedRef.current = false; };
  }, [id, navigate]);

  // Clean up Blob URLs to avoid memory leaks
  useEffect(() => {
    return () => {
        if (pendingAudio?.url) {
            URL.revokeObjectURL(pendingAudio.url);
        }
    };
  }, [pendingAudio]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.5, transform.scale + delta), 2);
        setTransform(prev => ({ ...prev, scale: newScale }));
    } else {
        setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      if (selectedNodeId) setSelectedNodeId(null);
      if (e.button === 1 || e.button === 0) { 
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleCanvasMouseUp = () => { setIsDragging(false); };

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
         if (selectedNodeId) setSelectedNodeId(null);
         setIsDragging(true);
         dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
          const dx = e.touches[0].clientX - dragStartRef.current.x;
          const dy = e.touches[0].clientY - dragStartRef.current.y;
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  };

  const handleTouchEnd = () => { setIsDragging(false); };

  const formatScore = (val: number | undefined) => {
    if (val === undefined || val === null) return '-';
    const num = Number(val);
    if (num > 10) return (num / 10).toFixed(1);
    return num.toFixed(1);
  };

  const interpolate = (template: string, data: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  };

  const saveProjectUpdate = async (updater: (p: ProjectData) => ProjectData) => {
      if (!id) return;
      const updated = await storage.updateProject(id, updater);
      if (updated && mountedRef.current) {
          setProject(updated);
          setSyncStatus('saving');
          try {
              await storage.uploadProjects();
              if (mountedRef.current) {
                  setSyncStatus('synced');
                  setLastSyncTime(new Date().toLocaleTimeString());
              }
          } catch (e) {
              console.error("Auto-save failed", e);
              if (mountedRef.current) setSyncStatus('error');
          }
      }
  };

  // 1. Select File Handler (Local Preview)
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Safety check for file size > 100MB
    if (file.size > 100 * 1024 * 1024) {
        alert(`文件太大 (${(file.size / 1024 / 1024).toFixed(2)}MB)。请上传小于 100MB 的文件。`);
        return;
    }

    // Create local preview
    if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
    const url = URL.createObjectURL(file);
    setPendingAudio({ file, url });
    
    // Reset input to allow re-selection
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  // 2. Real Upload Handler (Triggered by Button)
  const executeAudioUpload = async () => {
      if (!pendingAudio || !project) return;

      setIsUploading(true);
      setAudioUploadProgress(0);
      setSyncStatus('saving');
      try {
          // Upload to R2 with progress callback
          const cloudUrl = await storage.uploadFile(pendingAudio.file, project.id, (percent) => {
              setAudioUploadProgress(percent);
          });
          
          // Save project with new URL
          await saveProjectUpdate(p => ({ ...p, audioFile: cloudUrl }));
          
          // Cleanup local preview
          URL.revokeObjectURL(pendingAudio.url);
          setPendingAudio(null);
          
          setSyncStatus('synced');
          alert('音频文件上传成功！');
      } catch(err: any) {
          console.error(err);
          alert(`音频上传失败: ${err.message || '未知错误'}`);
          setSyncStatus('error');
      } finally {
          if (mountedRef.current) {
              setIsUploading(false);
              setAudioUploadProgress(0);
          }
      }
  };

  const generateNodeContent = async (nodeId: string) => {
      if (!project) throw new Error("项目数据未加载");

      const config = NODES_CONFIG.find(n => n.id === nodeId);
      if (!config || !config.promptKey) return;
      
      const template = prompts[config.promptKey]?.template || '';
      
      const contextData: Record<string, string> = {
          topic: project.inputs.topic,
          tone: project.inputs.tone,
          language: project.inputs.language,
          title: project.title, 
          script: project.script || ''
      };

      const prompt = interpolate(template, contextData);

      if (nodeId === 'script') {
          const text = await gemini.generateText(prompt, 'gemini-2.5-flash-preview-09-2025'); 
          await saveProjectUpdate(p => ({ 
              ...p, 
              script: text, 
              status: p.status === ProjectStatus.DRAFT ? ProjectStatus.IN_PROGRESS : p.status 
          }));
      } 
      else if (nodeId === 'summary') {
          const text = await gemini.generateText(prompt);
          await saveProjectUpdate(p => ({ ...p, summary: text }));
      }
      else if (nodeId === 'titles') {
          const data = await gemini.generateJSON<TitleItem[]>(prompt, {
              type: "ARRAY", items: {
                  type: "OBJECT", properties: {
                      title: {type: "STRING"},
                      keywords: {type: "STRING"},
                      score: {type: "NUMBER"}
                  }
              }
          });
          await saveProjectUpdate(p => ({ ...p, titles: data }));
      }
      else if (nodeId === 'cover') {
          const data = await gemini.generateJSON<CoverOption[]>(prompt, {
              type: "ARRAY", items: {
                  type: "OBJECT", properties: {
                      visual: {type: "STRING"},
                      copy: {type: "STRING"},
                      score: {type: "NUMBER"}
                  }
              }
          });
          await saveProjectUpdate(p => ({ ...p, coverOptions: data }));
      }
  };

  const handleGenerate = async (nodeId: string) => {
    if (!project) return;
    if (generatingNodes.has(nodeId)) return;
    
    if (['titles', 'summary', 'cover'].includes(nodeId) && !project.script) {
        alert("请先生成视频脚本 (Script)，然后再执行此步骤。");
        return;
    }

    setGeneratingNodes(prev => new Set(prev).add(nodeId));
    setFailedNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
    });

    try {
        await generateNodeContent(nodeId);
    } catch (error: any) {
        alert(`生成失败: ${error.message}`);
        console.error(error);
        setFailedNodes(prev => new Set(prev).add(nodeId));
    } finally {
        if (mountedRef.current) {
            setGeneratingNodes(prev => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
            });
        }
    }
  };

  const handleOneClickStart = async () => {
      if (!project?.script) {
          alert("【一键启动】需要先生成视频脚本。请先完成脚本生成。");
          return;
      }

      const targets = ['titles', 'summary', 'cover'];
      
      setGeneratingNodes(prev => {
          const next = new Set(prev);
          targets.forEach(t => next.add(t));
          return next;
      });

      const processWithRetry = async (id: string) => {
          setFailedNodes(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
          });

          try {
              await generateNodeContent(id);
          } catch (error) {
              console.warn(`模块 [${id}] 第一次生成失败，正在重试...`, error);
              await new Promise(r => setTimeout(r, 1000));
              try {
                  await generateNodeContent(id);
              } catch (retryError: any) {
                  console.error(`模块 [${id}] 第二次生成失败`, retryError);
                  setFailedNodes(prev => new Set(prev).add(id));
              }
          } finally {
               if (mountedRef.current) {
                  setGeneratingNodes(prev => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                  });
              }
          }
      };

      await Promise.all(targets.map(id => processWithRetry(id)));
  };

  const getCurvePath = (start: {x:number, y:number}, end: {x:number, y:number}) => {
      const sx = start.x + NODE_WIDTH;
      const sy = start.y + NODE_HEIGHT / 2;
      const ex = end.x;
      const ey = end.y + NODE_HEIGHT / 2;
      const c1x = sx + (ex - sx) / 2;
      const c1y = sy;
      const c2x = ex - (ex - sx) / 2;
      const c2y = ey;
      return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;
  };

  if (loading || !project) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }

  const isArchived = project.status === ProjectStatus.ARCHIVED;

  return (
    <div className="flex h-full bg-[#F8F9FC] relative overflow-hidden">
        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-8 py-4 pointer-events-none flex justify-between items-start">
             <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-2xl px-6 py-3 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-extrabold text-slate-900 truncate max-w-[200px] md:max-w-[600px]" title={project.title}>{project.title}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isArchived ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {isArchived ? '已归档 (只读)' : project.status}
                        </span>
                        <span className="text-[10px] text-slate-400">更新于 {new Date(project.updatedAt).toLocaleTimeString()}</span>
                    </div>
                </div>
             </div>

             <div className="pointer-events-auto flex gap-3">
                 <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border animate-in fade-in transition-colors bg-white/90 backdrop-blur shadow-sm h-10 ${
                    syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    syncStatus === 'saving' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    syncStatus === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                    {syncStatus === 'synced' ? <CloudCheck className="w-3 h-3" /> : 
                     syncStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     syncStatus === 'error' ? <AlertCircle className="w-3 h-3" /> :
                     <Cloud className="w-3 h-3" />}
                    
                    {syncStatus === 'synced' ? `已同步: ${lastSyncTime}` :
                     syncStatus === 'saving' ? '同步中...' :
                     syncStatus === 'error' ? '同步失败' :
                     '准备就绪'}
                </div>

                 {isArchived ? (
                     <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10">
                         <Archive className="w-4 h-4" />
                         <span>项目已归档</span>
                     </div>
                 ) : (
                    <button 
                        onClick={handleOneClickStart}
                        disabled={generatingNodes.size > 0 || !project.script}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        title={!project.script ? "请先生成视频脚本" : "一键生成标题、简介与封面 (自动失败重试)"}
                    >
                        {generatingNodes.size > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        一键启动
                    </button>
                 )}

                 <div className="flex gap-2">
                    <button onClick={() => setTransform(prev => ({...prev, scale: prev.scale + 0.1}))} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm text-slate-600">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={() => setTransform(prev => ({...prev, scale: Math.max(0.5, prev.scale - 0.1)}))} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm text-slate-600">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                 </div>
             </div>
        </div>

        {/* Canvas Area */}
        <div 
            ref={canvasRef}
            className={`flex-1 overflow-hidden relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} touch-none`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
             {/* Background Grid */}
            <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                    backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
                    backgroundPosition: `${transform.x}px ${transform.y}px`
                }}
            />

            {/* Transform Container */}
            <div 
                className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
            >
                {/* Connections Layer */}
                <svg className="overflow-visible absolute top-0 left-0 pointer-events-none" style={{ width: 1, height: 1 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                        </marker>
                    </defs>
                    {CONNECTIONS.map((conn, idx) => {
                        const fromNode = NODES_CONFIG.find(n => n.id === conn.from);
                        const toNode = NODES_CONFIG.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;
                        return (
                            <path 
                                key={idx}
                                d={getCurvePath(fromNode, toNode)}
                                stroke="#cbd5e1"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                </svg>

                {/* Nodes Layer */}
                {NODES_CONFIG.map((node) => {
                     const isActive = selectedNodeId === node.id;
                     const isGenerating = generatingNodes.has(node.id);
                     const isFailed = failedNodes.has(node.id);
                     
                     let hasData = false;
                     if (node.id === 'input') hasData = !!project.inputs.topic;
                     if (node.id === 'script') hasData = !!project.script;
                     if (node.id === 'audio_file') hasData = !!project.audioFile || !!pendingAudio; // Show active if local or remote
                     if (node.id === 'titles') hasData = !!project.titles && project.titles.length > 0;
                     if (node.id === 'summary') hasData = !!project.summary;
                     if (node.id === 'cover') hasData = !!project.coverOptions && project.coverOptions.length > 0;

                     let bgClass = 'bg-white';
                     if (['titles', 'audio_file', 'summary', 'cover'].includes(node.id)) {
                        if (hasData) {
                            bgClass = 'bg-emerald-50';
                        } else if (isFailed) {
                            bgClass = 'bg-rose-50';
                        }
                     }

                     return (
                         <div 
                            key={node.id}
                            style={{ 
                                left: node.x, 
                                top: node.y,
                                width: NODE_WIDTH,
                                height: NODE_HEIGHT
                            }}
                            className={`absolute ${bgClass} rounded-2xl p-0 border-2 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl ${
                                isActive 
                                ? `border-${node.color}-500 shadow-xl shadow-${node.color}-500/10 scale-105 z-10` 
                                : 'border-slate-100 shadow-lg shadow-slate-200/50 hover:border-slate-300'
                            }`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedNodeId(node.id);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                setSelectedNodeId(node.id);
                            }}
                         >
                             <div className="p-5 h-full relative flex flex-col justify-between">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-10 h-10 rounded-xl bg-${node.color}-100 text-${node.color}-600 flex items-center justify-center shadow-sm`}>
                                        <node.icon className="w-5 h-5" />
                                    </div>
                                    {hasData && (
                                        <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full shadow-sm">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    {!hasData && isFailed && (
                                         <div className="bg-rose-100 text-rose-600 p-1 rounded-full shadow-sm">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pr-2 mb-8">
                                    <h3 className="text-base font-bold text-slate-800 mb-1">{node.label}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium leading-snug line-clamp-2">{node.description}</p>
                                    
                                    {(node as any).model && (
                                        <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-mono text-slate-400">
                                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                            {(node as any).model}
                                        </div>
                                    )}
                                </div>

                                {node.id !== 'input' && !isArchived && node.id !== 'audio_file' && (
                                     <div className="absolute right-5 bottom-5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerate(node.id); }}
                                            disabled={isGenerating}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                hasData 
                                                ? 'bg-white border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:shadow-md' 
                                                : `bg-${node.color}-50 text-${node.color}-600 hover:bg-${node.color}-100 border border-${node.color}-100 hover:shadow-md`
                                            }`}
                                        >
                                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : (hasData ? <RefreshCw className="w-3 h-3" /> : (isFailed ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />))}
                                            {isGenerating ? '生成中...' : (hasData ? '重新生成' : (isFailed ? '重试生成' : '开始生成'))}
                                        </button>
                                     </div>
                                )}
                                {node.id === 'audio_file' && !isArchived && (
                                    <div className="absolute right-5 bottom-5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                hasData 
                                                ? 'bg-white border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:shadow-md' 
                                                : `bg-${node.color}-50 text-${node.color}-600 hover:bg-${node.color}-100 border border-${node.color}-100 hover:shadow-md`
                                            }`}
                                        >
                                            <Upload className="w-3 h-3" />
                                            {hasData ? (pendingAudio ? '等待上传' : '已上传') : '选择音频'}
                                        </button>
                                    </div>
                                )}
                                {node.id === 'input' && (
                                     <span className="absolute right-5 bottom-5 text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                                         已就绪
                                     </span>
                                )}
                             </div>
                         </div>
                     );
                 })}
            </div>
        </div>

        {/* Right Panel: Result Details */}
        <div 
            className={`absolute top-0 right-0 bottom-0 bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.05)] transform transition-all duration-300 z-30 flex flex-col w-[480px] ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50 sticky top-0 z-20 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <PanelRightClose className="w-5 h-5 text-slate-600" />
                    </button>
                    {selectedNodeId && (() => {
                        const node = NODES_CONFIG.find(n => n.id === selectedNodeId);
                        return (
                            <div className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                                <div className={`w-8 h-8 rounded-lg bg-${node?.color}-100 text-${node?.color}-600 flex items-center justify-center`}>
                                    {node?.icon && <node.icon className="w-4 h-4" />}
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">{node?.panelTitle}</h3>
                            </div>
                        );
                    })()}
                </div>
                
                <div>
                     {selectedNodeId && !isArchived && (() => {
                         const node = NODES_CONFIG.find(n => n.id === selectedNodeId);
                         return (
                            node?.id !== 'input' && node?.id !== 'audio_file' && (
                                <button 
                                    onClick={() => handleGenerate(selectedNodeId!)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all bg-${node?.color}-50 text-${node?.color}-600 hover:bg-${node?.color}-100 shadow-sm border border-${node?.color}-100`}
                                >
                                    <Sparkles className="w-3 h-3" /> 重新生成
                                </button>
                            )
                         );
                     })()}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FC] flex flex-col">
                 {selectedNodeId === 'input' && (
                     <div className="space-y-4 h-full">
                         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">项目主题</label>
                             <p className="text-base font-bold text-slate-800 pr-8">{project.inputs.topic}</p>
                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <RowCopyButton text={project.inputs.topic} />
                             </div>
                         </div>
                     </div>
                 )}

                 {selectedNodeId === 'script' && (
                    <TextResultBox 
                        content={project.script || ''} 
                        title="视频文案脚本" 
                        placeholder="在此输入或粘贴视频脚本内容。输入完成后点击右上角保存，即可作为后续步骤的依据。"
                        onSave={(val) => saveProjectUpdate(p => ({ ...p, script: val, status: p.status === ProjectStatus.DRAFT ? ProjectStatus.IN_PROGRESS : p.status }))}
                        showStats={true}
                        readOnly={isArchived}
                    />
                 )}

                 {selectedNodeId === 'summary' && (
                    <TextResultBox content={project.summary || ''} title="简介与标签" />
                 )}

                 {selectedNodeId === 'titles' && (
                     <TableResultBox 
                        headers={['序号', '爆款標題', '关键词', '得分', '操作']}
                        data={project.titles || []}
                        renderRow={(item: TitleItem, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 group">
                                <td className="py-3 px-2 text-center text-xs font-bold text-slate-400 w-[10%] align-top pt-3">{i + 1}</td>
                                <td className="py-3 px-2 text-sm text-slate-800 font-bold leading-snug w-[60%] align-top pt-3">
                                    {item.title}
                                </td>
                                <td className="py-3 px-2 w-[12%] align-top">
                                    <div className="flex flex-col gap-1.5 pt-0.5">
                                        {(item.keywords || item.type || '').split(/[,，、 ]+/).filter(Boolean).slice(0, 5).map((k, kIdx) => (
                                            <span key={kIdx} className="inline-block text-[10px] leading-none text-slate-500 bg-slate-100 px-1.5 py-1 rounded text-center">
                                                {k.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center w-[12%] align-middle">
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 italic tracking-tighter">
                                        {formatScore(item.score)}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-right w-[6%] align-top pt-3">
                                    <RowCopyButton text={`${item.title} ${item.keywords || item.type || ''}`} />
                                </td>
                            </tr>
                        )}
                     />
                 )}

                 {selectedNodeId === 'cover' && (
                     <div className="space-y-6">
                        {project.coverOptions && project.coverOptions.length > 0 ? (
                            <div className="space-y-4">
                                {project.coverOptions.map((opt, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                                            <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-rose-100">方案 {i+1}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">推荐指数</span>
                                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 italic tracking-tighter">
                                                    {formatScore(opt.score)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">画面描述</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{opt.visual}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 relative group">
                                            <p className="text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed text-center font-serif">
                                                {(opt.copy || '').replace(/\|/g, '\n')}
                                            </p>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <RowCopyButton text={(opt.copy || '').replace(/\|/g, '\n')} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                                <p>暂无封面方案，点击生成按钮开始策划。</p>
                            </div>
                        )}
                     </div>
                 )}

                 {selectedNodeId === 'audio_file' && (
                    <div className="flex flex-col h-full items-center justify-center p-6 text-center">
                        <input 
                            type="file" 
                            ref={audioInputRef} 
                            accept="audio/*" 
                            className="hidden" 
                            onChange={handleAudioFileSelect}
                        />

                        {(project.audioFile || pendingAudio) ? (
                            <div className="w-full space-y-6 animate-in zoom-in-95 duration-300">
                                <FancyAudioPlayer 
                                    src={pendingAudio ? pendingAudio.url : project.audioFile!}
                                    fileName={pendingAudio ? pendingAudio.file.name : decodeURIComponent(project.audioFile!.split('/').pop() || 'audio.mp3')}
                                    isLocal={!!pendingAudio}
                                    isUploading={isUploading}
                                    uploadProgress={audioUploadProgress}
                                    onReplace={() => audioInputRef.current?.click()}
                                    onDelete={async () => {
                                        if(confirm('确定要删除此音频文件吗？')) {
                                            if (pendingAudio) {
                                                setPendingAudio(null);
                                            } else {
                                                await saveProjectUpdate(p => ({ ...p, audioFile: undefined }));
                                            }
                                        }
                                    }}
                                    onUpload={executeAudioUpload}
                                />
                            </div>
                        ) : (
                            <div 
                                className="w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors gap-4 cursor-pointer group"
                                onClick={() => audioInputRef.current?.click()}
                            >
                                 <div className="w-16 h-16 bg-fuchsia-50 text-fuchsia-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    <Upload className="w-8 h-8" />
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-slate-700">点击选择音频文件</h3>
                                     <p className="text-sm text-slate-400 mt-1">支持 MP3, WAV 等格式 (最大100MB)</p>
                                 </div>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); audioInputRef.current?.click(); }}
                                    disabled={isUploading}
                                    className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold shadow-lg shadow-fuchsia-500/30 transition-all flex items-center gap-2 text-sm"
                                 >
                                    <Upload className="w-4 h-4" />
                                    选择文件
                                 </button>
                            </div>
                        )}
                    </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default ProjectWorkspace;
