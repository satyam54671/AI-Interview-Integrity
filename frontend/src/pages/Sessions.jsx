import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, MoreHorizontal, ExternalLink, User, Calendar, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../components/Layout';
import apiService from '../services/api';

const Sessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSessions();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      (session.candidate_name && session.candidate_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.id && session.id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (session.status && session.status.toLowerCase() === filterStatus.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight text-gradient">
            Audit Directory
          </h1>
          <p className="text-white/40 text-sm">
            Comprehensive archive of all monitored interview cycles and integrity reports.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search candidate ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all w-full sm:w-72 font-medium"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white/50 uppercase tracking-widest hover:bg-white/10 transition-all focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="all">Global Archive</option>
              <option value="active">Live Streams</option>
              <option value="completed">Finalized</option>
              <option value="flagged">Critical Anomaly</option>
            </select>
          </div>
        </div>
      </header>

      <div className="glass-card rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Deployment ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Subject</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Network Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Integrity Delta</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-8 py-6">
                      <div className="h-4 bg-white/5 rounded-full w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredSessions.length > 0 ? (
                filteredSessions.map((session, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={session.id} 
                    className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                    onClick={() => navigate(`/platform/${session.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-white/20 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
                          <Clock size={14} />
                        </div>
                        <span className="text-sm font-mono font-bold text-white/40 group-hover:text-white/80 transition-colors">{session.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{session.candidate_name || 'Subject Unknown'}</span>
                        <span className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-0.5">Verified Identity</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-white/40">
                        <Calendar size={12} />
                        <span className="text-xs font-medium">
                          {session.created_at ? new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden p-[1px]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${session.risk_score || 0}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              (session.risk_score || 0) < 30 ? "bg-blue-500" : (session.risk_score || 0) < 60 ? "bg-amber-500" : "bg-red-500"
                            )}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-mono font-black",
                          (session.risk_score || 0) < 30 ? "text-blue-500" : (session.risk_score || 0) < 60 ? "text-amber-500" : "text-red-500"
                        )}>{session.risk_score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button className="p-2.5 hover:bg-blue-500/10 rounded-xl text-white/20 hover:text-blue-500 border border-transparent hover:border-blue-500/20 transition-all">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Search size={48} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Zero records found on neural link</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status = "" }) => {
  const s = status.toLowerCase();
  
  if (s === 'completed' || s === 'finalized') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 w-fit">
        <CheckCircle2 size={12} />
        <span className="text-[10px] font-black uppercase tracking-widest">Finalized</span>
      </div>
    );
  }
  
  if (s === 'active' || s === 'in progress' || s === 'live') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 w-fit animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blink" />
        <span className="text-[10px] font-black uppercase tracking-widest">Streaming</span>
      </div>
    );
  }
  
  if (s === 'flagged' || s === 'critical') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 w-fit">
        <AlertTriangle size={12} />
        <span className="text-[10px] font-black uppercase tracking-widest">Flagged</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/30 w-fit">
      <Clock size={12} />
      <span className="text-[10px] font-black uppercase tracking-widest">{status || 'Awaiting'}</span>
    </div>
  );
};

export default Sessions;
