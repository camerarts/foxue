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

const FancyAudioPlayer = ({ src, fileName, isLocal, onReplace, onDelete, isUploading, uploadProgress, onUpload }: any) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const bars = useMemo(() => Array.from({ length: 12 }).map(() => ({
        delay: Math.random() * -1,
        duration: 0.6 + Math.random() * 0.8
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

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
             <style>{`@keyframes music-bar-bounce { 0%, 100% { height: 4px; opacity: 0.5; } 50% { height: 100%; opacity: 1; } }`}</style>
             <audio ref={audioRef} src={src} />
             <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPlaying ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                         <Music4 className="w-7 h-7" />
                     </div>
                     <div><h4 className="text-base font-bold text-slate-800 line-clamp-1">{fileName}</h4><span className="text-[10px] text-slate-400">{isLocal ? '待上传' : '已存云端'}</span></div>
                 </div>
                 <div className="flex items-center gap-0.5 h-8">
                    {bars.map((bar, i) => (<div key={i} className="w-1 bg-indigo-500 rounded-full" style={{ animation: isPlaying ? `music-bar-bounce ${bar.duration}s infinite` : 'none', animationDelay: `${bar.delay}s` }} />))}
                 </div>
             </div>
             <div className="relative w-full h-1.5 bg-slate-100 rounded-full mb-2">
                <div className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
                <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             </div>
             <div className="flex justify-between text-[10px] font-mono text-slate-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
             <div className="flex items-center justify-between mt-4">
                 <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-105 transition-all">{isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-1" />}</button>
                 <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                    <button onClick={onReplace} className="p-2 text-slate-500 hover:text-indigo-600"><RefreshCw className="w-4 h-4" /></button>
                    {onDelete && <button onClick={onDelete} className="p-2 text-slate-500 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                 </div>
             </div>
             {isLocal && (
                 <button onClick={onUpload} className="w-full mt-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} {isUploading ? `${Math.round(uploadProgress)}%` : '上传云端'}
                 </button>
             )}
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
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
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
            <button onClick={() => handleNodeAction('script')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"><Wand2 className="w-4 h-4" /> 一键生成</button>
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
                                     <div className="flex items-center gap-2 font-bold text-slate-700 text-sm"><n.icon className={`w-4 h-4 ${has ? 'text-emerald-500' : 'text-slate-400'}`} /> {n.label}</div>
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
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 {selectedNodeId === 'input' && <TextResultBox title="视频主题" content={project.inputs.topic} readOnly={true} />}
                 {selectedNodeId === 'script' && <TextResultBox title="视频脚本" content={project.script} showStats={true} onSave={(v: any) => updateProjectAndSyncImmediately({ ...project, script: v })} autoCleanAsterisks={true} />}
                 {selectedNodeId === 'audio_file' && (
                     <div className="space-y-4">
                        {(project.audioFile || pendingAudio) && <FancyAudioPlayer src={pendingAudio ? pendingAudio.url : project.audioFile} fileName={pendingAudio ? pendingAudio.file.name : '音频文件.mp3'} isLocal={!!pendingAudio} isUploading={isUploading} uploadProgress={uploadProgress} onReplace={() => audioInputRef.current?.click()} onUpload={executeAudioUpload} />}
                        {!project.audioFile && !pendingAudio && <div onClick={() => audioInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:bg-white transition-all"><FileAudio className="w-8 h-8" /><span className="text-xs font-bold">点击选择 MP3 文件</span></div>}
                     </div>
                 )}
                 {selectedNodeId === 'titles' && (
                     <div className="space-y-3">
                         {project.titles?.map((t, i) => (
                             <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center group">
                                 <div className="font-bold text-slate-700 text-sm">{t.title}</div>
                                 <RowCopyButton text={t.title} />
                             </div>
                         ))}
                     </div>
                 )}
                 {selectedNodeId === 'summary' && <TextResultBox title="简介标签" content={project.summary} onSave={(v: any) => updateProjectAndSyncImmediately({ ...project, summary: v })} />}
                 {selectedNodeId === 'cover' && (
                     <div className="space-y-4">
                         {project.coverOptions?.map((o, i) => (
                             <div key={i} className="bg-white rounded-xl border overflow-hidden">
                                 <div className="bg-slate-50 px-4 py-2 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">方案 {i+1}</div>
                                 <div className="p-4 space-y-3">
                                     <div className="text-lg font-black text-slate-800 leading-tight">{o.titleTop}</div>
                                     <div className="text-sm font-bold text-slate-500">{o.titleBottom}</div>
                                     <div className="pt-2 text-[10px] text-slate-400 italic">视觉: {o.visual}</div>
                                 </div>
                             </div>
                         ))}
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
