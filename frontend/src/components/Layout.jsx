import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Users, BarChart3, Bell, User, LogOut, Activity, Hexagon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isPlatform = location.pathname.startsWith('/platform');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl z-[100] px-8 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter text-white leading-none">Integrity.AI</span>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Neural Core</span>
          </div>
        </div>

        {!isPlatform && (
          <div className="hidden lg:flex items-center gap-2">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
            <NavItem to="/sessions" icon={<Users size={18} />} label="Audits" />
            <NavItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytics" />
            <NavItem to="/alerts" icon={<Bell size={18} />} label="Incidents" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {isPlatform && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-blink shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-[9px] font-black text-red-500 tracking-[0.2em] uppercase">Surveillance Active</span>
          </motion.div>
        )}
        
        <div className="h-8 w-[1px] bg-white/5" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-white leading-none">{user?.name || 'Authorized Personnel'}</span>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
               {user?.role || 'Administrator'}
            </span>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
               <User className="w-5 h-5 text-white/40 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-500/10 rounded-xl text-white/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all"
            title="Terminate Session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "relative flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-300 group",
      isActive 
        ? "text-white" 
        : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
    )}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute inset-0 bg-blue-600/5 border border-blue-500/20 rounded-xl z-0 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
          />
        )}
        <span className={cn("relative z-10 transition-transform group-hover:scale-110", isActive && "text-blue-500")}>{icon}</span>
        <span className="relative z-10 text-[11px] font-black uppercase tracking-widest">{label}</span>
        {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />}
      </>
    )}
  </NavLink>
);

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-blue-500/30">
      <Navbar />
      <main className="pt-24 px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.div>
      </main>
      
      {/* Visual Accents */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-[101]" />
      <div className="fixed bottom-8 right-8 z-[100]">
        <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-blink" />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Regional Sync: Mumbai</span>
        </div>
      </div>
    </div>
  );
};

export default Layout;
export { cn };
