
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
  Cloud, CloudCheck, ArrowLeftRight, FileAudio, Upload, Trash2, Headphones, CheckCircle2, CloudUpload, Volume2, VolumeX, Wand2, Download, Music4
} from 'lucide-react';

const RowCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="复制">
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

// --- Clean Modern Audio Player (Redesigned) ---
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
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const newTime = (Number(e.target.value) / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(Number(e.target.value));
    };

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = src;
        a.download = fileName || 'audio.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
             <audio ref={audioRef} src={src} preload="metadata" />

             {/* Top Info Section */}
             <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isPlaying ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                         <Music4 className={`w-7 h-7 ${isPlaying ? 'animate-pulse' : ''}`} />
                     </div>
                     <div>
                         <h4 className="text-base font-bold text-slate-800 line-clamp-1" title={fileName}>
                             {fileName}
                         </h4>
                         <div className="flex items-center gap-2 mt-1">
                            {isLocal ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">待上传</span>
                            ) : (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">云端存储</span>
                            )}
                            <span className="text-xs text-slate-400 font-medium tracking-wide">MP3 Audio</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* Visualizer Bars (Simulated) */}
                 <div className="hidden sm:flex items-center gap-0.5 h-8">
                    {[...Array(12)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-1 bg-indigo-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-1 opacity-20'}`}
                            style={{ 
                                height: isPlaying ? `${Math.random() * 100}%` : '4px',
                                animationDelay: `${i * 0.1}s` 
                            }} 
                        />
                    ))}
                 </div>
             </div>

             {/* Progress Section */}
             <div className="mb-6">
                 <div className="relative w-full h-2 bg-slate-100 rounded-full cursor-pointer group mb-2">
                      <div 
                         className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all group-hover:bg-indigo-500" 
                         style={{ width: `${progress}%` }}
                     />
                      {/* Thumb */}
                      <div 
                         className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                         style={{ left: `${progress}%`, marginLeft: '-6px' }}
                      />
                      <input 
                         type="range" 
                         min="0" 
                         max="100" 
                         value={progress} 
                         onChange={handleSeek}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     />
                 </div>
                 <div className="flex justify-between text-xs font-bold text-slate-400 font-mono">
                     <span>{formatTime(currentTime)}</span>
                     <span>{formatTime(duration)}</span>
                 </div>
             </div>

             {/* Controls & Actions */}
             <div className="flex items-center justify-between">
                 
                 {/* Play Button */}
                 <button 
                     onClick={togglePlay}
                     className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 hover:scale-105 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                 >
                     {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                 </button>

                 {/* Actions Toolbar */}
                 <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                     <button 
                        onClick={handleDownload} 
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                        title="下载音频"
                     >
                         <Download className="w-4 h-4" />
                     </button>
                     <div className="w-px h-4 bg-slate-200 mx-1"></div>
                     <button 
                        onClick={onReplace} 
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                        title="替换文件"
                     >
                         <RefreshCw className="w-4 h-4" />
                     </button>
                     {onDelete && (
                         <button 
                            onClick={onDelete} 
                            className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                            title="删除"
                         >
                              <Trash2 className="w-4 h-4" />
                         </button>
                     )}
                 </div>
             </div>

             {/* Upload Action (Only Local) */}
             {isLocal && (
                 <div className="mt-6 pt-5 border-t border-slate-100 animate-in slide-in-from-top-2">
                      {isUploading ? (
                          <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                              </div>
                              <span className="text-xs font-bold text-indigo-600 w-10 text-right">{Math.round(uploadProgress || 0)}%</span>
                          </div>
                      ) : (
                          <button 
                             onClick={onUpload}
                             className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                          >
                             <CloudUpload className="w-4 h-4" /> 上传到云端
                          </button>
                      )}
                 </div>
             )}
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
    autoCleanAsterisks?: boolean;
}

const TextResultBox = ({ content, title, onSave, placeholder, showStats, readOnly, autoCleanAsterisks }: TextResultBoxProps) => {
  // Helper to remove asterisks if autoCleanAsterisks is enabled
  const cleanText = (txt: string) => autoCleanAsterisks ? txt.replace(/\*/g, '') : txt;

  const [value, setValue] = useState(cleanText(content || ''));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) setValue(cleanText(content || ''));
  }, [content, isDirty, autoCleanAsterisks]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(cleanText(e.target.value));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (onSave) {
        onSave(value);
        setIsDirty(false);
    }
  };

  const calculateStats = (text: string) => {
      const totalChars = text.length;
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      return `【共${totalChars}字符，共${chineseChars}个汉字】`;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
             {showStats && (
                 <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                    {calculateStats(value)}
                 </span>
             )}
        </div>
        <div className="flex items-center gap-2">
            {!readOnly && onSave && isDirty && (
                 <button onClick={handleSave} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100">
                    <Check className="w-3 h-3" /> 保存
                 </button>
            )}
            <RowCopyButton text={value} />
        </div>
      </div>
      {onSave && !readOnly ? (
        <textarea 
            className="flex-1 w-full p-4 text-sm text-slate-700 leading-relaxed outline-none resize-none bg-white focus:bg-slate-50/50 transition-colors font-mono"
            value={value}
            onChange={handleChange}
            placeholder={placeholder || "在此输入或生成内容..."}
        />
      ) : (
        <div className="p-4 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed flex-1 font-mono">
          {content || <span className="text-slate-400 italic">暂无内容</span>}
        </div>
      )}
    </div>
  );
};

// --- Configuration ---

const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;

// Workflow Layout Definition
const NODES_CONFIG = [
  { id: 'input', label: '项目输入', panelTitle: '项目策划', icon: Layout, color: 'blue', description: '定义主题与基调', x: 50, y: 300 },
  { id: 'script', label: '视频脚本', panelTitle: '脚本编辑器', icon: FileText, color: 'violet', promptKey: 'SCRIPT', description: '生成完整口播文案', model: 'Gemini 2.5', x: 450, y: 300 },
  { id: 'titles', label: '爆款标题', panelTitle: '标题策划', icon: Type, color: 'amber', promptKey: 'TITLES', description: '生成高点击率标题', model: 'Gemini 2.5', x: 850, y: 100 },
  { id: 'audio_file', label: '上传MP3文件', panelTitle: '上传音频文件', icon: FileAudio, color: 'fuchsia', description: '上传配音/BGM文件', x: 850, y: 300 },
  { id: 'summary', label: '简介与标签', panelTitle: '发布元数据', icon: List, color: 'emerald', promptKey: 'SUMMARY', description: 'SEO 简介与标签', model: 'Gemini 2.5', x: 850, y: 500 },
  { id: 'cover', label: '封面策划', panelTitle: '封面方案', icon: Palette, color: 'rose', promptKey: 'COVER_GEN', description: '画面描述与文案', model: 'Gemini 2.5', x: 850, y: 700 },
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
  const [pendingAudio, setPendingAudio] = useState<{file: File, url: string} | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Canvas State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Sync Status
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'synced' | 'error' | null>(null);
  
  const mountedRef = useRef(true);

  useEffect(() => {
    const init = async () => {
        if (id) {
            const p = await storage.getProject(id);
            if (p) setProject(p);
            setLoading(false);
        }
        const loadedPrompts = await storage.getPrompts();
        setPrompts(loadedPrompts);
    };
    init();
  }, [id]);

  const updateProjectField = async (field: keyof ProjectData, value: any) => {
    if (!project) return;
    const updated = { ...project, [field]: value };
    setProject(updated);
    await storage.saveProject(updated);
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { alert('文件过大'); return; }
    if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
    const url = URL.createObjectURL(file);
    setPendingAudio({ file, url });
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const executeAudioUpload = async () => {
      if (!pendingAudio || !project) return;
      setIsUploading(true);
      try {
          const cloudUrl = await storage.uploadFile(pendingAudio.file, project.id, (p) => setAudioUploadProgress(p));
          const updated = { ...project, audioFile: cloudUrl };
          setProject(updated);
          await storage.saveProject(updated);
          setPendingAudio(null);
      } catch(e) { alert('上传失败'); }
      setIsUploading(false);
  };

  const handleNodeAction = async (nodeId: string) => {
    if (!project) return;
    
    // Audio is special - just open file dialog
    if (nodeId === 'audio_file') {
        audioInputRef.current?.click();
        return;
    }

    // Check dependency: most nodes need Script first (except input and script itself)
    if (['titles', 'summary', 'cover'].includes(nodeId) && !project.script) {
        alert("请先生成视频脚本");
        return;
    }

    setGeneratingNodes(prev => new Set(prev).add(nodeId));

    try {
        let update: Partial<ProjectData> = {};
        const nodeConfig = NODES_CONFIG.find(n => n.id === nodeId);
        if (!nodeConfig) return;

        const promptKey = nodeConfig.promptKey;
        const promptTemplate = promptKey ? prompts[promptKey]?.template : '';

        if (!promptTemplate && nodeId !== 'script') {
             throw new Error("Prompt template missing");
        }

        // Logic based on Node ID
        if (nodeId === 'script') {
             const inputPrompt = prompts['SCRIPT']?.template 
                .replace('{{topic}}', project.inputs.topic || project.title)
                .replace('{{tone}}', project.inputs.tone)
                .replace('{{language}}', project.inputs.language) || '';
            let text = await gemini.generateText(inputPrompt);
            // Auto clean asterisks from generated script
            text = text.replace(/\*/g, '');
            update = { script: text };
        } else if (nodeId === 'titles') {
             const p = promptTemplate
                .replace('{{title}}', project.title)
                .replace('{{script}}', project.script || '');
             const data = await gemini.generateJSON<TitleItem[]>(p);
             update = { titles: data };
        } else if (nodeId === 'summary') {
             const p = promptTemplate.replace('{{script}}', project.script || '');
             const text = await gemini.generateText(p);
             update = { summary: text };
        } else if (nodeId === 'cover') {
             const p = promptTemplate
                .replace('{{title}}', project.title)
                .replace('{{script}}', project.script || '');
             
             // Define schema to ensure correct structure
             const schema = {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    visual: { type: "STRING" },
                    titleTop: { type: "STRING" },
                    titleBottom: { type: "STRING" },
                    score: { type: "NUMBER" }
                  },
                  required: ["visual", "titleTop", "titleBottom"]
                }
             };

             const data = await gemini.generateJSON<CoverOption[]>(p, schema);
             update = { coverOptions: data };
        }

        const newProject = { ...project, ...update };
        setProject(newProject);
        await storage.saveProject(newProject);
        
    } catch (e: any) {
        console.error(e);
        alert(`生成失败: ${e.message}`);
    } finally {
        setGeneratingNodes(prev => { const n = new Set(prev); n.delete(nodeId); return n; });
    }
  };

  const handleOneClickStart = async () => {
    if (!project) return;
    if (!project.script) {
        alert("请先生成视频脚本，然后才能一键生成后续内容。");
        return;
    }

    // Targets: Titles, Summary, Cover
    const targets = [
        { id: 'titles', hasData: !!project.titles && project.titles.length > 0 },
        { id: 'summary', hasData: !!project.summary },
        { id: 'cover', hasData: !!project.coverOptions && project.coverOptions.length > 0 }
    ];

    const toGenerate = targets.filter(t => !t.hasData);
    if (toGenerate.length === 0) {
        alert("所有板块均已生成，无需操作。");
        return;
    }

    // Fire concurrently
    toGenerate.forEach(t => handleNodeAction(t.id));
  };

  const getCurvePath = (start: {x:number, y:number}, end: {x:number, y:number}) => {
      const sx = start.x + NODE_WIDTH;
      const sy = start.y + NODE_HEIGHT / 2;
      const ex = end.x;
      const ey = end.y + NODE_HEIGHT / 2;
      return `M ${sx} ${sy} C ${sx + (ex - sx) / 2} ${sy} ${ex - (ex - sx) / 2} ${ey} ${ex} ${ey}`;
  };

  if (loading || !project) return <div className="flex justify-center items-center h-full text-slate-500 font-bold">加载中...</div>;

  return (
    <div className="flex h-full relative overflow-hidden bg-slate-50">
        
        {/* Hidden Audio Input for Trigger */}
        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioFileSelect} />

        {/* Top Left Project Title */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none select-none">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight opacity-50">
                {project.title || '未命名项目'}
            </h1>
        </div>

        {/* Top Right "One Click" Button */}
        <div className="absolute top-4 right-4 z-20">
            <button
                onClick={handleOneClickStart}
                disabled={generatingNodes.size > 0}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:transform-none disabled:shadow-none"
            >
                <Wand2 className="w-4 h-4" /> 一键生成
            </button>
        </div>

        {/* Canvas Area */}
        <div 
            ref={canvasRef}
            className={`flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing`}
            onMouseDown={(e) => { setIsDragging(true); dragStartRef.current = { x: e.clientX, y: e.clientY }; }}
            onMouseMove={(e) => {
                if (isDragging) {
                    const dx = e.clientX - dragStartRef.current.x;
                    const dy = e.clientY - dragStartRef.current.y;
                    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
                    dragStartRef.current = { x: e.clientX, y: e.clientY };
                }
            }}
            onMouseUp={() => setIsDragging(false)}
            onClick={(e) => {
                // Close sidebar if clicking blank canvas (and not dragging)
                if (!isDragging) {
                     setSelectedNodeId(null);
                }
            }}
            onWheel={(e) => {
                 if (e.ctrlKey) {
                    e.preventDefault();
                    setTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.5, prev.scale - e.deltaY * 0.001), 2) }));
                 } else {
                    setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
                 }
            }}
        >
             {/* Dot Grid Background */}
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
                    backgroundPosition: `${transform.x}px ${transform.y}px`
                }}
            />

            <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}>
                {/* Connections */}
                <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
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
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {NODES_CONFIG.map((node) => {
                     const isActive = selectedNodeId === node.id;
                     const isGenerating = generatingNodes.has(node.id);
                     let hasData = false;
                     
                     if (node.id === 'input') hasData = !!project.title;
                     if (node.id === 'script') hasData = !!project.script;
                     if (node.id === 'titles') hasData = !!project.titles && project.titles.length > 0;
                     if (node.id === 'audio_file') hasData = !!project.audioFile || !!pendingAudio;
                     if (node.id === 'summary') hasData = !!project.summary;
                     if (node.id === 'cover') hasData = !!project.coverOptions && project.coverOptions.length > 0;

                     // Determine button label/icon based on node type
                     let actionLabel = '生成';
                     let ActionIcon = Sparkles;
                     if (node.id === 'audio_file') {
                         actionLabel = '上传';
                         ActionIcon = Upload;
                     } else if (hasData) {
                         actionLabel = '重新生成';
                         ActionIcon = RefreshCw;
                     }

                     return (
                         <div 
                            key={node.id}
                            style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                            className={`absolute rounded-2xl shadow-sm border transition-all cursor-pointer flex flex-col overflow-hidden group hover:shadow-md ${
                                isActive 
                                ? `ring-2 ring-offset-2 ring-${node.color}-400 border-${node.color}-200` 
                                : hasData
                                    ? 'bg-emerald-50/80 border-emerald-200'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                         >
                             {/* Header */}
                             <div className={`h-12 w-full border-b flex items-center px-4 justify-between bg-gradient-to-r ${hasData ? 'from-emerald-50 to-white border-emerald-100' : 'from-white to-slate-50 border-slate-100'}`}>
                                 <div className="flex items-center gap-2 font-bold text-slate-700">
                                     <node.icon className={`w-5 h-5 ${hasData ? 'text-emerald-500' : `text-${node.color}-500`}`} />
                                     {node.label}
                                 </div>
                                 {isActive && <div className={`w-2 h-2 rounded-full bg-${node.color}-500 animate-pulse`}></div>}
                             </div>

                             <div className="p-5 flex flex-col justify-between flex-1 relative">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{node.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                        hasData 
                                        ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                        {isGenerating ? '处理中...' : hasData ? '已完成' : '待处理'}
                                    </span>
                                    
                                    {/* Fixed Generate/Action Button */}
                                    {node.id !== 'input' && (
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleNodeAction(node.id);
                                            }}
                                            disabled={isGenerating}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                                isGenerating 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : hasData 
                                                    ? 'bg-white text-slate-600 border border-slate-200 hover:text-blue-600 hover:border-blue-200' 
                                                    : `bg-${node.color}-500 hover:bg-${node.color}-600 text-white`
                                            }`}
                                        >
                                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ActionIcon className="w-3 h-3" />}
                                            {isGenerating ? '处理中' : actionLabel}
                                        </button>
                                    )}
                                </div>
                             </div>
                         </div>
                     );
                 })}
            </div>
        </div>

        {/* Right Sidebar - Clean Panel */}
        <div className={`absolute top-0 right-0 bottom-0 w-[500px] bg-white border-l border-slate-200 shadow-xl transition-transform duration-300 z-30 flex flex-col ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {selectedNodeId && (() => {
                        const n = NODES_CONFIG.find(x => x.id === selectedNodeId);
                        return <><n.icon className={`w-5 h-5 text-${n?.color}-500`} /> {n?.panelTitle}</>
                    })()}
                </h3>
                <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                    <PanelRightClose className="w-5 h-5" />
                </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                 {selectedNodeId === 'input' && (
                     <TextResultBox 
                        title="视频主题 (Project Input)" 
                        content={project.inputs.topic || project.title} 
                        readOnly={true}
                        showStats={true}
                    />
                 )}

                 {selectedNodeId === 'audio_file' && (
                    <div className="flex flex-col h-full gap-4">
                        {/* Split View: Script Top */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">参考脚本</h4>
                            <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {project.script || "暂无脚本内容。"}
                            </p>
                        </div>

                        {/* Player Bottom */}
                        <div className="shrink-0">
                            {(project.audioFile || pendingAudio) ? (
                                <FancyAudioPlayer 
                                    src={pendingAudio ? pendingAudio.url : project.audioFile!}
                                    fileName={pendingAudio ? pendingAudio.file.name : '音频文件.mp3'}
                                    isLocal={!!pendingAudio}
                                    isUploading={isUploading}
                                    uploadProgress={audioUploadProgress}
                                    onReplace={() => audioInputRef.current?.click()}
                                    onUpload={executeAudioUpload}
                                    onDelete={async () => { /* delete logic */ }}
                                />
                            ) : (
                                <div 
                                    onClick={() => audioInputRef.current?.click()}
                                    className="h-32 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                        <FileAudio className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600">点击选择音频文件</span>
                                </div>
                            )}
                        </div>
                    </div>
                 )}

                 {selectedNodeId === 'script' && (
                    <TextResultBox 
                        title="视频脚本" 
                        content={project.script || ''} 
                        placeholder="AI 将在此生成脚本..."
                        onSave={(val) => updateProjectField('script', val)} 
                        showStats={true}
                        autoCleanAsterisks={true}
                    />
                 )}

                 {selectedNodeId === 'titles' && (
                    <div className="space-y-4">
                        {!project.titles || project.titles.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Type className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>暂无标题，请点击节点上的“生成”按钮。</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {project.titles.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-1.5 py-0.5 rounded">{idx + 1}</span>
                                                {item.score && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                        item.score >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        item.score >= 80 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>{item.score}分</span>
                                                )}
                                            </div>
                                            <RowCopyButton text={item.title} />
                                        </div>
                                        <h4 className="text-slate-800 font-bold mb-2">{item.title}</h4>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 )}

                 {selectedNodeId === 'summary' && (
                    <TextResultBox 
                        title="简介与标签" 
                        content={project.summary || ''} 
                        placeholder="AI 将在此生成视频简介和标签..."
                        onSave={(val) => updateProjectField('summary', val)} 
                        showStats={true}
                    />
                 )}

                 {selectedNodeId === 'cover' && (
                     <div className="space-y-4">
                        {!project.coverOptions || project.coverOptions.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Palette className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>暂无封面方案，请点击节点上的“生成”按钮。</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {project.coverOptions.map((item, idx) => {
                                    // Logic to automatically split Top Title if separators exist
                                    let displayTop = item.titleTop || item.copy || '';
                                    let displayBottom = item.titleBottom || '';

                                    // Check for separators ｜, |, /, -, or space to split the main title
                                    const separators = ['｜', '|', '/', '-', ' '];
                                    let splitIndex = -1;
                                    
                                    for (const sep of separators) {
                                        if (displayTop.includes(sep)) {
                                            splitIndex = displayTop.indexOf(sep);
                                            break;
                                        }
                                    }

                                    if (splitIndex !== -1) {
                                        const p1 = displayTop.substring(0, splitIndex).trim();
                                        const p2 = displayTop.substring(splitIndex + 1).trim(); // +1 to skip separator
                                        // If split results in two non-empty parts, use them
                                        // This overrides existing bottom title if split happens
                                        if (p1 && p2) {
                                            displayTop = p1;
                                            displayBottom = p2;
                                        }
                                    }

                                    return (
                                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase">方案 {idx + 1}</span>
                                                {item.score && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{item.score} 推荐</span>
                                                )}
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">封面文案</span>
                                                        <RowCopyButton text={`${displayTop}\n${displayBottom}`} />
                                                    </div>
                                                    
                                                    {/* Rendering Main Title (Top) and Sub Title (Bottom) */}
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                                        {/* Main Title - Prominent */}
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1 rounded uppercase tracking-wider">主标题 (上行)</span>
                                                            <div className="text-lg font-black text-slate-900 leading-tight">
                                                                {displayTop || '—'}
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className="border-t border-slate-200 border-dashed"></div>

                                                        {/* Sub Title - Secondary */}
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1 rounded uppercase tracking-wider">副标题 (下行)</span>
                                                            <div className="text-sm font-bold text-slate-600 leading-snug">
                                                                {displayBottom || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

