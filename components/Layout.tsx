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
    <div className="h-screen flex text-slate-900 font-sans overflow-hidden bg-slate-50">
        
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="sm:hidden fixed bottom-6 left-6 z-40 p-3 bg-slate-900 rounded-full shadow-lg text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-20 flex flex-col items-center py-6 
        bg-white border-r border-slate-200 shadow-sm
        transition-transform duration-300 ease-in-out
        sm:relative sm:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <button 
            onClick={() => setMobileMenuOpen(false)}
            className="sm:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-8 gap-2">
            <Link to="/dashboard" className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Video className="text-white w-6 h-6" />
            </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full px-2 items-center overflow-y-auto no-scrollbar">
          
          <button
            onClick={handleCreateClick}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-all mb-2"
            title="新建项目"
          >
            <Plus className="w-5 h-5" />
          </button>

          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center py-2 w-full rounded-xl transition-all gap-1 ${
              isActive('/dashboard') 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          
          <Link
            to="/images"
            className={`flex flex-col items-center justify-center py-2 w-full rounded-xl transition-all gap-1 ${
              isActive('/images') 
                ? 'bg-fuchsia-50 text-fuchsia-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">生图</span>
          </Link>

          <Link
            to="/inspiration"
            className={`flex flex-col items-center justify-center py-2 w-full rounded-xl transition-all gap-1 ${
              isActive('/inspiration') 
                ? 'bg-amber-50 text-amber-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            <span className="text-[10px] font-medium">灵感</span>
          </Link>

          <Link
            to="/ai-titles"
            className={`flex flex-col items-center justify-center py-2 w-full rounded-xl transition-all gap-1 ${
              isActive('/ai-titles') 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-medium">标题</span>
          </Link>
          
          <Link
            to="/archive"
            className={`flex flex-col items-center justify-center py-2 w-full rounded-xl transition-all gap-1 ${
              isActive('/archive') 
                ? 'bg-slate-100 text-slate-800' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span className="text-[10px] font-medium">归档</span>
          </Link>

          <div className="mt-auto w-full flex flex-col gap-2 pt-4 border-t border-slate-100">
             <button
                onClick={handleUpload}
                disabled={!!syncing}
                className={`flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 disabled:opacity-50 relative overflow-hidden ${
                    hasUnsavedChanges
                    ? 'bg-rose-50 text-rose-600 animate-pulse'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
            >
                {syncing === 'upload' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                <span className="text-[10px] font-medium">上传</span>
            </button>
            <button
                onClick={handleDownload}
                disabled={!!syncing}
                className="flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
                {syncing === 'download' ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <CloudDownload className="w-5 h-5" />}
                <span className="text-[10px] font-medium">下载</span>
            </button>

            <Link
                to="/settings"
                className={`flex flex-col items-center justify-center py-2 px-1 w-full rounded-xl transition-all gap-1 ${
                isActive('/settings') 
                    ? 'text-slate-900' 
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
          /* Page Mode: Centered Container */
          <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
             <div className="container mx-auto p-4 md:p-8 max-w-7xl min-h-full">
              {children}
            </div>
          </div>
        )}
      </main>

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <CloudUpload className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">数据同步中</h3>
                    <p className="text-sm text-slate-500 mt-1">请勿关闭窗口</p>
                </div>

                <div className="space-y-3">
                    {['Projects', 'Images', 'Inspirations', 'Tools', 'Settings'].map((key) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase">{key}</span>
                            <StatusIcon status={uploadState[key.toLowerCase() as keyof UploadState]} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200 relative">
                
                <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                        <Sparkles className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">新建项目</h3>
                     <p className="text-sm text-slate-500 mt-1">开始你的创作之旅</p>
                </div>

                <form onSubmit={handleConfirmCreate}>
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">视频主题</label>
                        <input
                            autoFocus
                            required
                            type="text"
                            value={newProjectTopic}
                            onChange={(e) => setNewProjectTopic(e.target.value)}
                            placeholder="输入视频主题..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!newProjectTopic.trim() || creating}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            创建
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
