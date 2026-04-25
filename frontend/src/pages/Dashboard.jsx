import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ShieldAlert, Users, Timer, Activity, TrendingUp, AlertCircle, ShieldCheck, Zap, Play, Download } from 'lucide-react';
import { cn } from '../components/Layout';
import apiService from '../services/api';

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "blue" }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} />
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className={cn("p-2.5 rounded-xl border", colors[color])}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full border", 
            trend > 0 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {subValue && <span className="text-[10px] font-medium text-white/20 uppercase tracking-tighter">{subValue}</span>}
        </div>
      </div>
      
      <div className="w-full h-[2px] bg-white/5 mt-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "70%" }}
          className={cn("h-full", color === "blue" ? "bg-blue-500" : color === "red" ? "bg-red-500" : "bg-green-500")}
        />
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalViolations: 0,
    averageRiskScore: 0,
    totalCandidates: 0
  });
  const [analyticsData, setAnalyticsData] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sessions, alerts, analytics] = await Promise.all([
          apiService.getSessions(),
          apiService.getAlerts({ limit: 5 }),
          apiService.getAnalytics()
        ]);
        
        const activeCount = sessions.filter(s => s.status === 'active' || s.status === 'In Progress').length;
        const totalCount = sessions.length;
        
        const riskScores = sessions.map(s => s.risk_score || 0).filter(score => score > 0);
        const avgRisk = riskScores.length > 0 
          ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
          : 0;
        
        setStats({
          activeSessions: activeCount,
          totalViolations: alerts.length, // This should probably be total violations from backend, but using alerts for now
          averageRiskScore: avgRisk,
          totalCandidates: totalCount
        });
        
        setRecentAlerts(alerts);
        
        if (analytics && analytics.timeline) {
          setAnalyticsData(analytics.timeline.map(item => ({
            name: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            alerts: item.alert_count || 0,
            risk: item.avg_risk_score || 0
          })));
        }
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        setError("Failed to synchronize with Command Center. Retrying...");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full animate-blink", error ? "bg-red-500" : "bg-blue-500")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", error ? "text-red-500" : "text-blue-500")}>
              {error || "System Live"}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight text-gradient">
            Command Center
          </h1>
          <p className="text-white/40 text-sm max-w-md">
            {loading ? 'Analyzing system integrity...' : `Real-time monitoring active across ${stats.activeSessions} candidates with neural-network surveillance.`}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(`/platform/SESS-${Math.floor(Math.random() * 9000 + 1000)}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
          >
            <Play size={14} fill="currentColor" />
            Start New Interview
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
            <Download size={14} className="text-blue-500" />
            Export Protocol
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Sessions" value={stats.activeSessions} subValue="Real-time" icon={Activity} color="blue" />
        <StatCard title="Recent Alerts" value={stats.totalViolations} subValue="Flagged" icon={ShieldAlert} color="red" />
        <StatCard title="Integrity Score" value={`${100 - stats.averageRiskScore}%`} subValue="System-wide" icon={ShieldCheck} color="green" />
        <StatCard title="Total Audits" value={stats.totalCandidates} subValue="Lifetime" icon={Zap} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Integrity Analytics</h3>
              <p className="text-white/40 text-xs mt-1">Real-time behavior metrics from neural engine</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Risk Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Alerts</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {analyticsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                  <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAlerts)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-10">
                <TrendingUp size={48} />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Recent Incidents</h3>
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <AlertCircle size={16} className="text-white/40" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              ))
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alert, index) => (
                <motion.div 
                  key={alert.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 hover:bg-white/[0.04] transition-all group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
                    alert.severity === 'critical' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                    alert.severity === 'high' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    <ShieldAlert size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-white truncate">{alert.alert_type || 'System Alert'}</p>
                      <span className="text-[9px] font-mono text-white/20 whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-20">
                <ShieldCheck size={64} className="mb-4" />
                <p className="text-sm font-medium">All systems operational</p>
              </div>
            )}
          </div>
          
          <button onClick={() => navigate('/alerts')} className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors border-t border-white/5 pt-6">
            View Protocol History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
