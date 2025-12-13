
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Video, Plus, Image as ImageIcon, Lightbulb, LogOut, CloudUpload, CloudDownload, Loader2, CheckCircle2, XCircle, Circle, Menu, X, Sparkles, Type, Archive } from 'lucide-react';
import * as storage from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface UploadState {
  projects: SyncStatus;
  images: SyncStatus;
  inspirations: SyncStatus;
  tools: SyncStatus;
  settings: SyncStatus;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState<'upload' | 'download' | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    projects: 'idle',
    images: 'idle',
    inspirations: 'idle',
    tools: 'idle',
    settings: 'idle'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTopic, setNewProjectTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  // Check if we are in a project context for rendering main area
  const isWorkspace = location.pathname.startsWith('/project/') && !location.pathname.endsWith('/images');

  // Poll for unsaved changes status
  useEffect(() => {
    const checkStatus = () => {
        setHasUnsavedChanges(storage.hasUnsavedChanges());
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleCreateClick = () => {
    setNewProjectTopic('');
    setShowCreateModal(true);
  };

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTopic.trim()) return;

    setCreating(true);
    try {
        const newId = await storage.createProject(newProjectTopic);
        setShowCreateModal(false);
        setMobileMenuOpen(false);
        navigate(`/project/${newId}`);
    } catch (err) {
        console.error(err);
    } finally {
        setCreating(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      localStorage.removeItem('lva_auth_expiry');
      navigate('/');
    }
  };

  const handleUpload = async () => {
    if (!window.confirm('确定要将所有本地数据上传覆盖到云端吗？')) return;

    setShowUploadModal(true);
    setSyncing('upload');
    setUploadState({ projects: 'loading', images: 'loading', inspirations: 'idle', tools: 'idle', settings: 'idle' });

    try {
        // 1. Upload Projects (Covers Project List & Image List data)
        await storage.uploadProjects();
        setUploadState(prev => ({ ...prev, projects: 'success', images: 'success', inspirations: 'loading' }));
        
        // 2. Upload Inspirations
        await storage.uploadInspirations();
        setUploadState(prev => ({ ...prev, inspirations: 'success', tools: 'loading' }));
        
        // 3. Upload Tools (AI Titles etc.)
        await storage.uploadTools();
        setUploadState(prev => ({ ...prev, tools: 'success', settings: 'loading' }));

        // 4. Upload Prompts
        await storage.uploadPrompts();
        setUploadState(prev => ({ ...prev, settings: 'success' }));

        // Finalize
        storage.updateLastUploadTime();
        
        // Short delay to show completion before closing or reloading
        setTimeout(() => {
            alert('所有数据上传成功！');
            window.location.reload(); 
        }, 500);

    } catch (e: any) {
        console.error(e);
        // Mark currently loading as error
        setUploadState(prev => {
            const next = { ...prev };
            if (next.projects === 'loading') { next.projects = 'error'; next.images = 'error'; }
            if (next.inspirations === 'loading') next.inspirations = 'error';
            if (next.tools === 'loading') next.tools = 'error';
            if (next.settings === 'loading') next.settings = 'error';
            return next;
        });
        alert(`上传过程中发生错误: ${e.message}`);
        setShowUploadModal(false);
        setSyncing(null);
    }
  };

  const handleDownload = async () => {
    if (window.confirm('确定要从云端下载数据吗？这将更新本地的记录。')) {
        setSyncing('download');
        try {
            await storage.downloadAllData();
            alert('数据下载成功！');
            window.location.reload();
        } catch (e: any) {
            console.error(e);
             alert(`下载失败: ${e.message}\n请检查您的网络连接或确认后台 R2 存储桶已正确配置绑定 (BUCKET)。`);
        } finally {
            setSyncing(null);
        }
    }
  };

  const StatusIcon = ({ status }: { status: SyncStatus }) => {
      switch (status) {
          case 'loading': return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
          case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
          case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
          default: return <Circle className="w-5 h-5 text-slate-200" />;
      }
  };

  return (
    <div className="h-screen flex text-slate-900 font-sans overflow-hidden bg-transparent">
        
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="sm:hidden fixed bottom-6 left-6 z-40 p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-[0_4px_0_#993399] active:translate-y-1 active:shadow-none text-white border-2 border-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/40 z-40 sm:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Y2K Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-24 flex flex-col items-center py-6 
        bg-white/40 backdrop-blur-xl border-r-2 border-white/60 shadow-[4px_0_16px_rgba(0,0,0,0.1)]
        transition-transform duration-300 ease-in-out
        sm:relative sm:translate-x-0 sm:m-4 sm:rounded-3xl sm:h-[calc(100vh-32px)]
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <button 
            onClick={() => setMobileMenuOpen(false)}
            className="sm:hidden absolute top-2 right-2 p-2 text-slate-500 hover:text-pink-600 transition-colors"
        >
            <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-6 gap-2">
            <Link to="/dashboard" className="w-14 h-14 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_8px_rgba(0,0,0,0.2)] border-2 border-white group transition-transform hover:scale-110">
              <Video className="text-white w-7 h-7 drop-shadow-md group-hover:rotate-12 transition-transform" />
            </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-3 w-full px-3 items-center overflow-y-auto no-scrollbar">
          
          {/* Big Add Button - Glossy Pill */}
          <button
            onClick={handleCreateClick}
            className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-full flex items-center justify-center shadow-[0_4px_0_#be123c,inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-1 transition-all border-2 border-white group mb-4"
            title="新建项目"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500 stroke-[3px]" />
          </button>

          <div className="w-10 h-0.5 bg-white/50 rounded-full my-1"></div>

          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center py-3 w-full rounded-2xl transition-all gap-1 duration-200 border-2 ${
              isActive('/dashboard') 
                ? 'bg-white/80 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] scale-105' 
                : 'border-transparent hover:bg-white/40 hover:border-white/40'
            }`}
          >
            <LayoutDashboard className={`w-6 h-6 ${isActive('/dashboard') ? 'text-blue-600 fill-blue-100' : 'text-slate-500'}`} />
            <span className={`text-[9px] font-bold tracking-wide ${isActive('/dashboard') ? 'text-blue-600' : 'text-slate-500'}`}>首页</span>
          </Link>
          
          <Link
            to="/images"
            className={`flex flex-col items-center justify-center py-3 w-full rounded-2xl transition-all gap-1 duration-200 border-2 ${
              isActive('/images') 
                ? 'bg-white/80 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] scale-105' 
                : 'border-transparent hover:bg-white/40 hover:border-white/40'
            }`}
          >
            <ImageIcon className={`w-6 h-6 ${isActive('/images') ? 'text-fuchsia-600 fill-fuchsia-100' : 'text-slate-500'}`} />
            <span className={`text-[9px] font-bold tracking-wide ${isActive('/images') ? 'text-fuchsia-600' : 'text-slate-500'}`}>生图</span>
          </Link>

          <Link
            to="/inspiration"
            className={`flex flex-col items-center justify-center py-3 w-full rounded-2xl transition-all gap-1 duration-200 border-2 ${
              isActive('/inspiration') 
                ? 'bg-white/80 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] scale-105' 
                : 'border-transparent hover:bg-white/40 hover:border-white/40'
            }`}
          >
            <Lightbulb className={`w-6 h-6 ${isActive('/inspiration') ? 'text-amber-500 fill-amber-100' : 'text-slate-500'}`} />
            <span className={`text-[9px] font-bold tracking-wide ${isActive('/inspiration') ? 'text-amber-600' : 'text-slate-500'}`}>灵感</span>
          </Link>

          <Link
            to="/ai-titles"
            className={`flex flex-col items-center justify-center py-3 w-full rounded-2xl transition-all gap-1 duration-200 border-2 ${
              isActive('/ai-titles') 
                ? 'bg-white/80 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] scale-105' 
                : 'border-transparent hover:bg-white/40 hover:border-white/40'
            }`}
          >
            <Type className={`w-6 h-6 ${isActive('/ai-titles') ? 'text-indigo-600 fill-indigo-100' : 'text-slate-500'}`} />
            <span className={`text-[9px] font-bold tracking-wide ${isActive('/ai-titles') ? 'text-indigo-600' : 'text-slate-500'}`}>标题</span>
          </Link>
          
          <Link
            to="/archive"
            className={`flex flex-col items-center justify-center py-3 w-full rounded-2xl transition-all gap-1 duration-200 border-2 ${
              isActive('/archive') 
                ? 'bg-white/80 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] scale-105' 
                : 'border-transparent hover:bg-white/40 hover:border-white/40'
            }`}
          >
            <Archive className={`w-6 h-6 ${isActive('/archive') ? 'text-slate-700 fill-slate-200' : 'text-slate-500'}`} />
            <span className={`text-[9px] font-bold tracking-wide ${isActive('/archive') ? 'text-slate-700' : 'text-slate-500'}`}>归档</span>
          </Link>

          <div className="mt-auto w-full flex flex-col gap-3 pt-2">
             <button
                onClick={handleUpload}
                disabled={!!syncing}
                className={`flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 border-2 border-white shadow-sm disabled:opacity-50 relative overflow-hidden ${
                    hasUnsavedChanges
                    ? 'bg-gradient-to-br from-rose-400 to-red-500 text-white animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                    : 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
                } y2k-btn`}
            >
                {syncing === 'upload' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5 stroke-2" />}
                <span className="text-[9px] font-bold tracking-wide">上传</span>
            </button>
            <button
                onClick={handleDownload}
                disabled={!!syncing}
                className="flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 bg-white/60 hover:bg-white text-slate-600 border border-white hover:border-blue-200 disabled:opacity-50"
            >
                {syncing === 'download' ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <CloudDownload className="w-5 h-5 stroke-2" />}
                <span className="text-[9px] font-bold tracking-wide">下载</span>
            </button>

            <Link
                to="/settings"
                className={`flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 duration-200 ${
                isActive('/settings') 
                    ? 'text-purple-600 font-bold' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                <Settings className={`w-5 h-5 ${isActive('/settings') ? 'animate-spin-slow' : ''}`} />
            </Link>
          </div>

        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Workspace Mode: Full Screen */}
        {isWorkspace ? (
          <div className="flex-1 h-full overflow-hidden w-full">
            {children}
          </div>
        ) : (
          /* Page Mode: Centered Container with Glass Effect */
          <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
             <div className="container mx-auto p-6 md:p-10 max-w-7xl y2k-glass min-h-full">
              {children}
            </div>
          </div>
        )}
      </main>

      {/* Upload Progress Modal - Y2K Style */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl border-2 border-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 w-full max-w-sm animate-in zoom-in-95 duration-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                        <CloudUpload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">DATA UPLOADING...</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Do not close window</p>
                </div>

                <div className="space-y-3">
                    {['Projects', 'Images', 'Inspirations', 'Tools', 'Settings'].map((key) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white shadow-sm">
                            <span className="text-xs font-bold text-slate-600 uppercase">{key}</span>
                            <StatusIcon status={uploadState[key.toLowerCase() as keyof UploadState]} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* New Project Modal - Y2K Style */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white/95 border-4 border-white rounded-[2rem] shadow-[0_0_0_4px_rgba(255,255,255,0.3),0_20px_60px_rgba(0,0,0,0.5)] p-8 w-full max-w-md animate-in zoom-in-95 duration-200 relative">
                
                <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                     <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-fuchsia-500/40 mb-4 border-2 border-white">
                        <Sparkles className="w-8 h-8 text-white" />
                     </div>
                     <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600">NEW PROJECT</h3>
                     <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Start something awesome</p>
                </div>

                <form onSubmit={handleConfirmCreate}>
                    <div className="mb-8">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Video Topic</label>
                        <input
                            autoFocus
                            required
                            type="text"
                            value={newProjectTopic}
                            onChange={(e) => setNewProjectTopic(e.target.value)}
                            placeholder="Type your idea here..."
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-lg focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors uppercase text-sm tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newProjectTopic.trim() || creating}
                            className="flex-1 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-2xl font-bold shadow-[0_4px_0_#9333ea,inset_0_2px_4px_rgba(255,255,255,0.4)] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase text-sm tracking-wide y2k-btn"
                        >
                            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Launch
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

