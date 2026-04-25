import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Filter, Search, Download, ChevronRight, AlertTriangle, ShieldCheck, Activity, Info } from 'lucide-react';
import { cn } from '../components/Layout';
import apiService from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [severityStats, setSeverityStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAlerts({ limit: 100 });
        setAlerts(data);
        
        const stats = data.reduce((acc, alert) => {
          const severity = (alert.severity || 'medium').toLowerCase();
          if (severity === 'critical') acc.critical++;
          else if (severity === 'high') acc.high++;
          else if (severity === 'medium') acc.medium++;
          else if (severity === 'low') acc.low++;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });
        
        setSeverityStats(stats);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' || 
      (alert.alert_type && alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alert.message && alert.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alert.session_id && alert.session_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unresolved' && !alert.resolved) ||
      (filterStatus === 'resolved' && alert.resolved);
    
    return matchesSearch && matchesStatus;
  });

  const totalAlerts = severityStats.critical + severityStats.high + severityStats.medium + severityStats.low;

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{totalAlerts} Incidents</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
             <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Real-time Event Stream</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight text-gradient">
            Incident Logs
          </h1>
          <p className="text-white/40 text-sm max-w-lg">
            A chronological sequence of behavioral anomalies and security violations flagged by the Integrity Neural Network.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl">
          <Download size={14} className="text-blue-500" />
          Export Protocol
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Risk Distribution</h3>
               <Activity size={16} className="text-blue-500/50" />
            </div>
            
            <div className="space-y-6">
              <SeverityMetric label="Critical Violations" count={severityStats.critical} color="bg-red-500" glow="shadow-[0_0_12px_rgba(239,68,68,0.4)]" percent={totalAlerts > 0 ? (severityStats.critical / totalAlerts) * 100 : 0} />
              <SeverityMetric label="High Anomaly" count={severityStats.high} color="bg-orange-500" glow="shadow-[0_0_12px_rgba(249,115,22,0.4)]" percent={totalAlerts > 0 ? (severityStats.high / totalAlerts) * 100 : 0} />
              <SeverityMetric label="Behavioral Warning" count={severityStats.medium} color="bg-amber-500" glow="shadow-[0_0_12px_rgba(245,158,11,0.4)]" percent={totalAlerts > 0 ? (severityStats.medium / totalAlerts) * 100 : 0} />
              <SeverityMetric label="Environment Shift" count={severityStats.low} color="bg-blue-500" glow="shadow-[0_0_12px_rgba(59,130,246,0.4)]" percent={totalAlerts > 0 ? (severityStats.low / totalAlerts) * 100 : 0} />
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
               <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/30 leading-relaxed font-medium">
                     Neural Network is prioritizing <span className="text-white/60">Gaze Tracking</span> and <span className="text-white/60">Multi-Face Detection</span>.
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col h-full border border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between bg-white/[0.01] gap-4">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All Logs" />
              <FilterTab active={filterStatus === 'unresolved'} onClick={() => setFilterStatus('unresolved')} label="Flagged" />
              <FilterTab active={filterStatus === 'resolved'} onClick={() => setFilterStatus('resolved')} label="Resolved" />
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all w-full sm:w-48 font-medium" 
              />
            </div>
          </div>
          
          <div className="flex-1 divide-y divide-white/5 overflow-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-6 flex items-center gap-6 animate-pulse opacity-50">
                    <div className="w-2 h-2 bg-white/10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-1/3" />
                      <div className="h-3 bg-white/10 rounded w-full" />
                    </div>
                  </div>
                ))
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={alert.id} 
                    className="p-6 flex items-center gap-6 hover:bg-white/[0.02] transition-all group cursor-pointer"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      alert.severity === 'critical' ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" :
                      alert.severity === 'high' ? "bg-orange-500" : alert.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    
                    <div className="w-20 shrink-0">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">
                        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{alert.alert_type || 'System Event'}</span>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0",
                          alert.severity === 'critical' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          alert.severity === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                          alert.severity === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {alert.severity || 'Standard'}
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mt-1 line-clamp-1 italic font-medium">{alert.message}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-4">
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors uppercase tracking-widest">{alert.session_id || 'AUDIT_LNK'}</span>
                       </div>
                       <ChevronRight size={14} className="text-white/5 group-hover:text-blue-500 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center flex flex-col items-center opacity-20">
                  <ShieldCheck size={64} className="mb-6 text-blue-500" />
                  <h4 className="text-sm font-black uppercase tracking-[0.25em]">No Anomalies Found</h4>
                  <p className="text-[10px] mt-2 font-medium">All neural links reported zero deviations in recent cycles.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const SeverityMetric = ({ label, count, color, percent, glow }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-mono font-bold text-white">{count}</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        className={cn("h-full rounded-full transition-all duration-1000", color, glow)} 
      />
    </div>
  </div>
);

const FilterTab = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-white/5 text-white/30 hover:text-white/60"
    )}
  >
    {label}
  </button>
);

export default Alerts;
