
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectData, ProjectStatus } from '../types';
import * as storage from '../services/storageService';
import { Calendar, Trash2, Plus, Sparkles, Loader2, Cloud, CloudCheck, AlertCircle, FolderOpen, Video } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'synced' | 'error' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const lastActivityRef = useRef(Date.now());
  const isBusyRef = useRef(false);

  useEffect(() => {
      isBusyRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('click', updateActivity);
    return () => window.removeEventListener('click', updateActivity);
  }, []);

  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const performSync = async () => {
          const isUserActive = (Date.now() - lastActivityRef.current) < 30000;
          if (isBusyRef.current || isUserActive) {
              timeoutId = setTimeout(performSync, 2 * 60 * 1000);
              return;
          }
          setSyncStatus('saving');
          try {
              await storage.downloadAllData();
              setSyncStatus('synced');
              setLastSyncTime(new Date().toLocaleTimeString());
              const syncedData = await storage.getProjects();
              setProjects(syncedData.sort((a, b) => b.updatedAt - a.updatedAt));
          } catch (e) {
              setSyncStatus('error');
          }
          timeoutId = setTimeout(performSync, 5 * 60 * 1000);
      };
      timeoutId = setTimeout(performSync, 5 * 60 * 1000);
      return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    const localData = await storage.getProjects();
    setProjects(localData.sort((a, b) => b.updatedAt - a.updatedAt));
    setLoading(false);
    setSyncStatus('saving');
    try {
        await storage.downloadAllData();
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
        const syncedData = await storage.getProjects();
        setProjects(syncedData.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (e) {
        setSyncStatus('error');
    }
  };

  const serialMap = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...projects].sort((a, b) => a.createdAt - b.createdAt);
    const dailyCounts: Record<string, number> = {};
    sorted.forEach(p => {
        const date = new Date(p.createdAt);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;
        if (!dailyCounts[dateKey]) dailyCounts[dateKey] = 0;
        dailyCounts[dateKey]++;
        const seq = String(dailyCounts[dateKey]).padStart(3, '0');
        map.set(p.id, `[${dateKey}-${seq}]`);
    });
    return map;
  }, [projects]);

  const displayedProjects = useMemo(() => 
    projects.filter(p => p.status !== ProjectStatus.ARCHIVED),
  [projects]);

  const handleCreate = async () => {
    const newId = await storage.createProject();
    navigate(`/project/${newId}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await storage.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleteConfirmId(null);
    setSyncStatus('saving');
    try {
        await storage.uploadProjects();
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
    } catch(e) {
        setSyncStatus('error');
    }
  };

  const isProjectFullyComplete = (p: ProjectData) => {
      const hasScript = !!p.script && p.script.length > 0;
      const hasTitles = !!p.titles && p.titles.length > 0;
      const hasAudio = !!p.audioFile; 
      const hasSummary = !!p.summary && p.summary.length > 0;
      const hasCover = !!p.coverOptions && p.coverOptions.length > 0;
      return hasScript && hasTitles && hasAudio && hasSummary && hasCover;
  };

  const getEffectiveStatus = (p: ProjectData): ProjectStatus => {
      if (p.status === ProjectStatus.ARCHIVED) return ProjectStatus.ARCHIVED;
      if (isProjectFullyComplete(p)) return ProjectStatus.COMPLETED;
      return p.status;
  };

  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-emerald-200';
      case ProjectStatus.IN_PROGRESS: return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-cyan-200';
      case ProjectStatus.ARCHIVED: return 'bg-slate-300 text-slate-600';
      default: return 'bg-slate-200 text-slate-500';
    }
  };

  const getStatusText = (status: ProjectStatus) => {
      switch (status) {
        case ProjectStatus.DRAFT: return 'DRAFT';
        case ProjectStatus.IN_PROGRESS: return 'WIP';
        case ProjectStatus.COMPLETED: return 'DONE';
        case ProjectStatus.ARCHIVED: return 'ARCHIVED';
        default: return status;
      }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter y2k-text-gradient uppercase" style={{ WebkitTextStroke: '1px white' }}>Project Dashboard</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full inline-block border border-white">Manage your video pipeline</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm transition-all ${
                syncStatus === 'synced' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                syncStatus === 'saving' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                syncStatus === 'error' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
                {syncStatus === 'synced' ? <CloudCheck className="w-3 h-3" /> : 
                 syncStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                 <Cloud className="w-3 h-3" />}
                {syncStatus === 'synced' ? 'SYNCED' : syncStatus === 'saving' ? 'SYNCING...' : 'READY'}
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin drop-shadow-lg" />
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md border-4 border-white border-dashed rounded-[2rem] p-16 text-center shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-700 mb-3 uppercase">Start Creating</h3>
          <p className="text-slate-500 font-bold mb-8 max-w-md mx-auto">Use AI to generate scripts and storyboards instantly.</p>
          <button onClick={handleCreate} className="text-blue-600 hover:text-blue-500 font-black hover:underline decoration-4 underline-offset-4 text-lg uppercase tracking-wide">
            Create First Project &rarr;
          </button>
        </div>
      ) : (
        <div className="y2k-panel overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-500 border-b-2 border-white">
                        <tr>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest w-16 text-center">No.</th>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest w-40 text-center">ID</th>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest min-w-[300px]">Project Topic</th>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest w-32 text-center">Status</th>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest w-40 text-center hidden md:table-cell">Date</th>
                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest w-24 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white">
                        {displayedProjects.map((project, index) => {
                            const status = getEffectiveStatus(project);
                            const serial = serialMap.get(project.id) || '-';

                            const hasTitles = project.titles && project.titles.length > 0;
                            const hasAudio = !!project.audioFile;
                            const hasSummary = !!project.summary && project.summary.length > 0;
                            const hasCover = project.coverOptions && project.coverOptions.length > 0;

                            return (
                                <tr 
                                    key={project.id} 
                                    onClick={() => navigate(`/project/${project.id}`)}
                                    className="group hover:bg-white/80 transition-all cursor-pointer hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]"
                                >
                                    <td className="py-3 px-4 text-center text-sm font-bold text-slate-400">
                                        {index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                            {serial}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 max-w-[300px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-sm border border-white">
                                                <FolderOpen className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm md:text-base group-hover:text-blue-600 transition-colors truncate">
                                                {project.title || 'Untitled Project'}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="py-3 px-4 text-center align-middle relative">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wide shadow-md border border-white/50 ${getStatusStyle(status)}`}>
                                            {getStatusText(status)}
                                        </span>
                                        
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <div title="Titles" className={`w-2 h-2 rounded-full border border-white shadow-sm mt-1 ${hasTitles ? 'bg-green-400' : 'bg-slate-200'}`} />
                                             <div title="Audio" className={`w-2 h-2 rounded-full border border-white shadow-sm mt-1 ${hasAudio ? 'bg-green-400' : 'bg-slate-200'}`} />
                                             <div title="Summary" className={`w-2 h-2 rounded-full border border-white shadow-sm mt-8 ${hasSummary ? 'bg-green-400' : 'bg-slate-200'}`} />
                                             <div title="Cover" className={`w-2 h-2 rounded-full border border-white shadow-sm mt-8 ${hasCover ? 'bg-green-400' : 'bg-slate-200'}`} />
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 hidden md:table-cell text-center">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {deleteConfirmId === project.id ? (
                                            <button 
                                                onClick={(e) => handleDelete(e, project.id)}
                                                className="text-[10px] bg-rose-500 text-white border-2 border-rose-600 px-2 py-1.5 rounded-lg font-bold shadow-[0_4px_0_#9f1239] active:shadow-none active:translate-y-1 transition-all whitespace-nowrap uppercase"
                                                onMouseLeave={() => setDeleteConfirmId(null)}
                                            >
                                                Confirm?
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(project.id); }}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

