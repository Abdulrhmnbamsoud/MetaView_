
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Globe, Menu, Search, Settings, LayoutDashboard, RefreshCw, Database, Landmark } from 'lucide-react';
import { apiService } from '../services/apiService';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    // فرض الوضع الليلي بشكل دائم في جذور المستند
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.backgroundColor = '#000000';
  }, []);

  const checkHealthAndSync = async () => {
    const health = await apiService.getHealth();
    setIsOnline(health.status !== 'offline');
    setRowCount(health.rows);
  };

  useEffect(() => {
    checkHealthAndSync();
    const healthInterval = setInterval(checkHealthAndSync, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  const navItems = [
    { to: '/', icon: Home, label: 'الأرشيف الحي' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-['Cairo']">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 h-20 flex items-center px-6">
        <div className="flex items-center gap-6 w-64">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <Landmark className="w-8 h-8 text-saudi-gold group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-white tracking-tighter">MetaView</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-auto px-10">
          <div className="relative group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-saudi-gold transition-colors" />
            <input 
              type="text" 
              placeholder="البحث في MetaView..."
              className="w-full bg-white/5 border border-white/10 focus:border-saudi-gold py-3 pr-14 pl-6 rounded-2xl text-[11px] font-black outline-none transition-all text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-5 w-72 justify-end">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <Database className="w-4 h-4 text-saudi-gold" />
            <span className="text-[10px] font-black text-slate-300 tracking-widest">{rowCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto relative">
        <aside className={`fixed lg:sticky top-20 h-[calc(100vh-80px)] overflow-y-auto no-scrollbar transition-all duration-300 z-30 bg-black border-l border-white/10 ${isSidebarOpen ? 'w-72 opacity-100 pr-6' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="py-10 space-y-2">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-l-full transition-all ${isActive ? 'bg-white/10 text-saudi-gold border-r-4 border-saudi-gold font-black shadow-[10px_0_30px_-10px_rgba(197,160,89,0.3)]' : 'text-slate-500 hover:text-saudi-gold hover:bg-white/[0.02]'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[13px] uppercase tracking-widest">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
