
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectData, TitleItem, StoryboardFrame, CoverOption, PromptTemplate, ProjectStatus } from '../types';
import * as storage from '../services/storageService';
import * as gemini from '../services/geminiService';
import { 
  ArrowLeft, Layout, FileText, Type, 
  List, PanelRightClose, Sparkles, Loader2, Copy, 
  Check, Images, ArrowRight, Palette, Film, Maximize2, Play, Pause,
  ZoomIn, ZoomOut, Move, RefreshCw, Rocket, AlertCircle, Archive,
  Cloud, CloudCheck, ArrowLeftRight, FileAudio, Upload, Trash2, Headphones, CheckCircle2, CloudUpload, Volume2, VolumeX, Wand2, Download, Music4, Clock, Settings2, Key, X, ClipboardPaste
} from 'lucide-react';

const formatTimestamp = (ts?: number) => {
  if (!ts) return null;
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `本次生成时间: ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const CompactTimestamp = ({ ts }: { ts?: number }) => {
  if (!ts) return null;
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400/80 bg-slate-100/50 px-1.5 py-0.5 rounded border border-slate-200/50">
      <Clock className="w-2.5 h-2.5" />
      {pad(d.getHours())}:{pad(d.getMinutes())}
    </div>
  );
};

const RowCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="复制">
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const FancyAudioPlayer = ({ src, fileName, downloadName, isLocal, onReplace, onDelete, isUploading, uploadProgress, onUpload }: any) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const bars = useMemo(() => Array.from({ length: 24 }).map(() => ({
        delay: Math.random() * -1.5,
        duration: 0.8 + Math.random() * 1.2
    })), []);

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
        if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: any) => {
        if (!audioRef.current) return;
        const newTime = (Number(e.target.value) / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(Number(e.target.value));
    };

    const handleDownload = async () => {
        if (!src || isDownloading) return;
        setIsDownloading(true);
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = (downloadName || fileName || 'audio').replace(/[\\/:*?"<>|]/g, "_");
            a.download = `${safeName}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('下载失败');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full relative group overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] p-6 transition-all duration-500 hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.12)]">
             <style>{`
                @keyframes music-bar-bounce { 
                    0%, 100% { height: 6px; opacity: 0.3; } 
                    50% { height: 100%; opacity: 0.9; } 
                }
                .audio-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
                }
             `}</style>
             <audio ref={audioRef} src={src} />
             
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isPlaying ? 'bg-indigo-500 text-white rotate-12' : 'bg-slate-100 text-slate-400'}`}>
                         {isPlaying ? <Music4 className="w-6 h-6 animate-pulse" /> : <Volume2 className="w-6 h-6" />}
                     </div>
                     <div className="max-w-[180px]">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-0.5 tracking-tight">{fileName}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isLocal ? 'Offline Cache' : 'Cloud Synchronized'}</span>
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-[2px] h-8 pt-1">
                    {bars.map((bar, i) => (
                        <div 
                            key={i} 
                            className="w-[2px] bg-indigo-500/80 rounded-full" 
                            style={{ 
                                animation: isPlaying ? `music-bar-bounce ${bar.duration}s infinite` : 'none', 
                                animationDelay: `${bar.delay}s`,
                                height: isPlaying ? 'auto' : `${4 + Math.random() * 8}px`
                            }} 
                        />
                    ))}
                 </div>
             </div>

             <div className="space-y-3 mb-8">
                <div className="relative h-1 w-full flex items-center">
                    <div className="absolute w-full h-[2px] bg-slate-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress} 
                        onChange={handleSeek} 
                        className="audio-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                </div>
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400 tracking-tighter">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
             </div>

             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlay} 
                        className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                    </button>
                    <div className="flex gap-1.5 px-2">
                        <button onClick={handleDownload} disabled={isDownloading} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-all" title="下载音频">
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        <button onClick={onReplace} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-all" title="替换文件"><RefreshCw className="w-4 h-4" /></button>
                        {onDelete && <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="删除"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                 </div>

                 {isLocal && (
                     <button 
                        onClick={onUpload} 
                        disabled={isUploading}
                        className="h-14 px-6 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} 
                        {isUploading ? `${Math.round(uploadProgress)}%` : 'Sync Cloud'}
                     </button>
                 )}
             </div>
        </div>
    );
};

const TextResultBox = ({ content, title, onSave, placeholder, showStats, readOnly, autoCleanAsterisks }: any) => {
  const clean = (t: string) => autoCleanAsterisks ? t.replace(/\*/g, '') : t;
  const [val, setVal] = useState(clean(content || ''));
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setVal(clean(content || '')); }, [content, dirty]);
  const stats = (t: string) => `【共${t.length}字符，汉字${(t.match(/[\u4e00-\u9fa5]/g) || []).length}个】`;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3"><h4 className="text-xs font-bold text-slate-500 uppercase">{title}</h4>{showStats && <span className="text-[10px] bg-white px-2 py-0.5 rounded border font-bold text-indigo-600 border-indigo-100">{stats(val)}</span>}</div>
        <div className="flex items-center gap-2">
            {!readOnly && onSave && dirty && <button onClick={() => { onSave(val); setDirty(false); }} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">保存</button>}
            <RowCopyButton text={val} />
        </div>
      </div>
      {onSave && !readOnly ? (
        <textarea className="flex-1 w-full p-4 text-sm text-slate-700 leading-relaxed outline-none resize-none font-mono" value={val} onChange={(e) => { setVal(clean(e.target.value)); setDirty(true); }} placeholder={placeholder} />
      ) : (
        <div className="p-4 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-relaxed flex-1 font-mono">{content || <span className="text-slate-300 italic">暂无内容</span>}</div>
      )}
    </div>
  );
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 160;
const NODES_CONFIG = [
  { id: 'input', label: '项目输入', panelTitle: '项目策划', icon: Layout, color: 'blue', description: '定义主题与基调', x: 50, y: 300 },
  { id: 'script', label: '视频脚本', panelTitle: '脚本编辑器', icon: FileText, color: 'violet', promptKey: 'SCRIPT', description: '生成完整口播文案', x: 450, y: 300 },
  { id: 'titles', label: '爆款标题', panelTitle: '标题策划', icon: Type, color: 'amber', promptKey: 'TITLES', description: '生成高点击率标题', x: 850, y: 100 },
  { id: 'audio_file', label: '上传MP3', panelTitle: '音频文件', icon: FileAudio, color: 'fuchsia', description: '上传配音/BGM', x: 850, y: 300 },
  { id: 'summary', label: '简介标签', panelTitle: '发布元数据', icon: List, color: 'emerald', promptKey: 'SUMMARY', description: 'SEO 简介与标签', x: 850, y: 500 },
  { id: 'cover', label: '封面策划', panelTitle: '封面方案', icon: Palette, color: 'rose', promptKey: 'COVER_GEN', description: '画面描述与文案', x: 850, y: 700 },
];
const CONNECTIONS = [ { from: 'input', to: 'script' }, { from: 'script', to: 'audio_file' }, { from: 'script', to: 'titles' }, { from: 'script', to: 'summary' }, { from: 'script', to: 'cover' } ];

const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [generatingNodes, setGeneratingNodes] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<Record<string, PromptTemplate>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<any>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
        if (id) {
            const p = await storage.getProject(id);
            if (p) setProject(p);
            setLoading(false);
        }
        setPrompts(await storage.getPrompts());
        setCustomKey(localStorage.getItem('lva_custom_api_key') || '');
    };
    init();
  }, [id]);

  const updateProjectAndSyncImmediately = async (updated: ProjectData) => {
      setProject(updated);
      await storage.saveProject(updated);
      setSyncStatus('saving');
      try {
          await storage.uploadProjects();
          setSyncStatus('synced');
      } catch { setSyncStatus('error'); }
  };

  const handleNodeAction = async (nodeId: string) => {
    if (!project) return;
    if (nodeId === 'audio_file') { audioInputRef.current?.click(); return; }
    if (['titles', 'summary', 'cover'].includes(nodeId) && !project.script) { alert("请先生成脚本"); return; }

    setGeneratingNodes(prev => new Set(prev).add(nodeId));
    try {
        let update: any = {};
        const config = NODES_CONFIG.find(n => n.id === nodeId);
        const template = config?.promptKey ? prompts[config.promptKey]?.template : '';

        if (nodeId === 'script') {
            let text = await gemini.generateText(prompts['SCRIPT'].template.replace(/\{\{topic\}\}/g, project.inputs.topic || project.title).replace(/\{\{tone\}\}/g, project.inputs.tone).replace(/\{\{language\}\}/g, project.inputs.language), customKey);
            update = { script: text.replace(/\*/g, '') };
        } else if (nodeId === 'titles') {
            update = { titles: await gemini.generateJSON(template.replace(/\{\{title\}\}/g, project.title).replace(/\{\{script\}\}/g, project.script || ''), undefined, customKey) };
        } else if (nodeId === 'summary') {
            let text = (await gemini.generateText(template.replace(/\{\{script\}\}/g, project.script || ''), customKey)).trim();
            if (!text) throw new Error("AI 返回内容为空");
            update = { summary: text.replace(/\*/g, '') };
        } else if (nodeId === 'cover') {
            const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { visual: { type: "STRING" }, titleTop: { type: "STRING" }, titleBottom: { type: "STRING" }, score: { type: "NUMBER" } }, required: ["visual", "titleTop", "titleBottom"] } };
            update = { coverOptions: await gemini.generateJSON(template.replace(/\{\{title\}\}/g, project.title).replace(/\{\{script\}\}/g, project.script || ''), schema, customKey) };
        }

        const now = Date.now();
        const nextProject = { ...project, ...update, moduleTimestamps: { ...(project.moduleTimestamps || {}), [nodeId]: now } };
        await updateProjectAndSyncImmediately(nextProject);

    } catch (e: any) { alert(`生成失败: ${e.message}`); } finally { setGeneratingNodes(prev => { const n = new Set(prev); n.delete(nodeId); return n; }); }
  };

  /**
   * 一键生成逻辑：仅针对 3（爆款标题）、5（简介标签）、6（封面策划）
   * 不包含 2（视频脚本），且依赖于已有脚本。
   */
  const handleOneClickBatchGenerate = async () => {
    if (!project) return;
    if (!project.script) {
        alert("请先生成或录入视频脚本后再执行一键生成。");
        return;
    }

    // 目标模块：3(titles), 5(summary), 6(cover)
    const targets = ['titles', 'summary', 'cover'];
    
    setGeneratingNodes(prev => {
        const next = new Set(prev);
        targets.forEach(t => next.add(t));
        return next;
    });

    try {
        const titlePrompt = prompts['TITLES'].template.replace(/\{\{title\}\}/g, project.title).replace(/\{\{script\}\}/g, project.script || '');
        const summaryPrompt = prompts['SUMMARY'].template.replace(/\{\{script\}\}/g, project.script || '');
        const coverPrompt = prompts['COVER_GEN'].template.replace(/\{\{title\}\}/g, project.title).replace(/\{\{script\}\}/g, project.script || '');

        const coverSchema = { type: "ARRAY", items: { type: "OBJECT", properties: { visual: { type: "STRING" }, titleTop: { type: "STRING" }, titleBottom: { type: "STRING" }, score: { type: "NUMBER" } }, required: ["visual", "titleTop", "titleBottom"] } };

        // 并行调用 AI
        const [titlesResult, summaryResult, coverResult] = await Promise.all([
            gemini.generateJSON<TitleItem[]>(titlePrompt, undefined, customKey),
            gemini.generateText(summaryPrompt, customKey).then(res => res.trim().replace(/\*/g, '')),
            gemini.generateJSON<CoverOption[]>(coverPrompt, coverSchema, customKey)
        ]);

        const now = Date.now();
        const nextProject: ProjectData = {
            ...project,
            titles: titlesResult,
            summary: summaryResult,
            coverOptions: coverResult,
            moduleTimestamps: {
                ...(project.moduleTimestamps || {}),
                titles: now,
                summary: now,
                cover: now
            }
        };

        await updateProjectAndSyncImmediately(nextProject);

    } catch (e: any) {
        alert(`一键生成部分失败: ${e.message}`);
    } finally {
        setGeneratingNodes(prev => {
            const n = new Set(prev);
            targets.forEach(t => n.delete(t));
            return n;
        });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; 
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          setSelectedNodeId(null);
      }
  };

  const executeAudioUpload = async () => {
      if (!pendingAudio || !project) return;
      setIsUploading(true);
      try {
          const url = await storage.uploadFile(pendingAudio.file, project.id, p => setUploadProgress(p));
          await updateProjectAndSyncImmediately({ ...project, audioFile: url, moduleTimestamps: { ...(project.moduleTimestamps || {}), audio_file: Date.now() } });
          setPendingAudio(null);
      } catch { alert('上传失败'); } finally { setIsUploading(false); }
  };

  if (loading || !project) return <div className="flex h-full items-center justify-center text-slate-400 font-bold">加载中...</div>;

  return (
    <div className="flex h-full relative bg-slate-50 overflow-hidden">
        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingAudio({ file: f, url: URL.createObjectURL(f) }); }} />
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
             <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/50 rounded-full border hover:bg-white transition-all"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
             <h1 className="text-2xl font-black text-slate-400 select-none">{project.title}</h1>
        </div>
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
            <button onClick={() => setShowConfigModal(true)} className="h-9 px-3 bg-white/80 border rounded-lg flex items-center gap-2 text-xs font-bold"><Settings2 className="w-4 h-4" /> API</button>
            <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full border bg-white/90 shadow-sm flex items-center gap-1.5 ${syncStatus === 'synced' ? 'text-emerald-600' : 'text-slate-400'}`}>
                {syncStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : syncStatus === 'synced' ? <CloudCheck className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
                {syncStatus === 'saving' ? '保存同步中...' : syncStatus === 'synced' ? '已同步云端' : '就绪'}
            </div>
            <button 
                onClick={handleOneClickBatchGenerate} 
                disabled={generatingNodes.has('titles') || generatingNodes.has('summary') || generatingNodes.has('cover') || !project.script}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all ${!project.script ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                title={!project.script ? "需先生成脚本" : "一键生成标题、简介和封面"}
            >
                {generatingNodes.has('titles') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} 
                一键生成 (3/5/6)
            </button>
        </div>

        <div 
          className={`flex-1 relative transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
             <div 
               className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
                 backgroundSize: '24px 24px',
                 backgroundPosition: `${transform.x}px ${transform.y}px`
               }} 
             />
             <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}>
                <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
                    {CONNECTIONS.map((c, i) => {
                        const f = NODES_CONFIG.find(n => n.id === c.from)!; const t = NODES_CONFIG.find(n => n.id === c.to)!;
                        return <path key={i} d={`M ${f.x+NODE_WIDTH} ${f.y+NODE_HEIGHT/2} C ${f.x+NODE_WIDTH+100} ${f.y+NODE_HEIGHT/2} ${t.x-100} ${t.y+NODE_HEIGHT/2} ${t.x} ${t.y+NODE_HEIGHT/2}`} stroke="#cbd5e1" strokeWidth="2" fill="none" />;
                    })}
                </svg>
                {NODES_CONFIG.map((n, i) => {
                    const has = n.id==='input' ? !!project.title : n.id==='script' ? !!project.script : n.id==='titles' ? !!project.titles?.length : n.id==='audio_file' ? !!project.audioFile||!!pendingAudio : n.id==='summary' ? !!project.summary : !!project.coverOptions?.length;
                    const ts = project.moduleTimestamps?.[n.id];
                    return (
                        <div key={n.id} style={{ left: n.x, top: n.y, width: NODE_WIDTH, height: NODE_HEIGHT }} onClick={(e) => { e.stopPropagation(); setSelectedNodeId(n.id); }} className={`absolute rounded-2xl shadow-sm border transition-all cursor-pointer flex flex-col overflow-hidden bg-white hover:shadow-md ${selectedNodeId===n.id ? 'ring-2 ring-indigo-400' : has ? 'bg-emerald-50/50 border-emerald-100' : ''}`}>
                             <div className={`h-11 border-b flex items-center px-4 justify-between ${has ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                 <div className="flex flex-col">
                                     <div className="flex items-center gap-2.5 font-bold text-slate-700 text-sm">
                                         <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm transition-colors ${has ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                                             {i + 1}
                                         </span>
                                         <n.icon className={`w-4 h-4 ${has ? 'text-emerald-500' : 'text-slate-400'}`} /> 
                                         {n.label}
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     {ts && <CompactTimestamp ts={ts} />}
                                     {has && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                 </div>
                             </div>
                             <div className="p-4 flex flex-col justify-between flex-1">
                                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{n.description}</p>
                                {n.id !== 'input' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleNodeAction(n.id); }} className={`mt-auto py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${generatingNodes.has(n.id) ? 'bg-slate-100 text-slate-400' : has ? 'bg-white border text-slate-600' : 'bg-slate-900 text-white'}`}>
                                        {generatingNodes.has(n.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : has ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {generatingNodes.has(n.id) ? '生成中' : has ? '重选' : '生成'}
                                    </button>
                                )}
                             </div>
                        </div>
                    );
                })}
             </div>
        </div>

        <div className={`absolute top-0 right-0 bottom-0 w-[500px] bg-white border-l shadow-2xl transition-transform duration-300 z-30 flex flex-col ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-14 flex items-center justify-between px-6 border-b bg-white flex-shrink-0">
                <h3 className="font-bold text-slate-800">{selectedNodeId && NODES_CONFIG.find(x => x.id === selectedNodeId)?.panelTitle}</h3>
                <button onClick={() => setSelectedNodeId(null)} className="p-2 text-slate-400 hover:text-slate-600"><PanelRightClose className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-50/50">
                 {selectedNodeId === 'input' && <div className="p-6 h-full overflow-y-auto"><TextResultBox title="视频主题" content={project.inputs.topic} readOnly={true} /></div>}
                 {selectedNodeId === 'script' && <div className="p-6 h-full overflow-y-auto"><TextResultBox title="视频脚本" content={project.script} showStats={true} onSave={(v: any) => updateProjectAndSyncImmediately({ ...project, script: v })} autoCleanAsterisks={true} /></div>}
                 {selectedNodeId === 'audio_file' && (
                     <div className="flex flex-col h-full gap-4 p-6">
                        <div className="flex-[2] overflow-hidden">
                            <TextResultBox 
                                title="参考脚本内容" 
                                content={project.script} 
                                readOnly={true} 
                                autoCleanAsterisks={true} 
                            />
                        </div>
                        <div className="flex-[1] overflow-y-auto min-h-[220px]">
                            <div className="space-y-4">
                                {(project.audioFile || pendingAudio) && (
                                    <FancyAudioPlayer 
                                        src={pendingAudio ? pendingAudio.url : project.audioFile} 
                                        fileName={pendingAudio ? pendingAudio.file.name : '音频文件.mp3'} 
                                        downloadName={project.title}
                                        isLocal={!!pendingAudio} 
                                        isUploading={isUploading} 
                                        uploadProgress={uploadProgress} 
                                        onReplace={() => audioInputRef.current?.click()} 
                                        onUpload={executeAudioUpload} 
                                    />
                                )}
                                {!project.audioFile && !pendingAudio && <div onClick={() => audioInputRef.current?.click()} className="h-40 border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-400 cursor-pointer hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all group">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-all">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm font-bold block">点击上传音频</span>
                                        <span className="text-[10px] uppercase tracking-widest opacity-60">MP3, WAV, M4A supported</span>
                                    </div>
                                </div>}
                            </div>
                        </div>
                     </div>
                 )}
                 {selectedNodeId === 'titles' && (
                     <div className="p-6 h-full overflow-y-auto">
                        <div className="space-y-3">
                            {project.titles?.map((t, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center group">
                                    <div className="font-bold text-slate-700 text-sm">{t.title}</div>
                                    <RowCopyButton text={t.title} />
                                </div>
                            ))}
                        </div>
                     </div>
                 )}
                 {selectedNodeId === 'summary' && <div className="p-6 h-full overflow-y-auto"><TextResultBox title="简介标签" content={project.summary} onSave={(v: any) => updateProjectAndSyncImmediately({ ...project, summary: v })} /></div>}
                 {selectedNodeId === 'cover' && (
                     <div className="p-6 h-full overflow-y-auto">
                        <div className="space-y-4">
                            {project.coverOptions?.map((o, i) => (
                                <div key={i} className="bg-white rounded-xl border overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">方案 {i+1}</span>
                                        <RowCopyButton text={`${o.titleTop}\n${o.titleBottom}`} />
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="text-lg font-black text-slate-800 leading-tight">{o.titleTop}</div>
                                        <div className="text-sm font-bold text-slate-500">{o.titleBottom}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}
            </div>
        </div>

        {showConfigModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                    <button onClick={() => setShowConfigModal(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
                    <h3 className="text-xl font-bold mb-6">API 配置</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Gemini API Key</label>
                        <input type="password" value={customKey} onChange={(e) => setCustomKey(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none" placeholder="sk-..." /></div>
                        <button onClick={() => { localStorage.setItem('lva_custom_api_key', customKey); setShowConfigModal(false); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">保存设置</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProjectWorkspace;
