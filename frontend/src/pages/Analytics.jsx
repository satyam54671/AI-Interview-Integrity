import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { TrendingUp, Users, Calendar, Filter, Activity, Globe, Zap, Target } from 'lucide-react';
import { cn } from '../components/Layout';

const radarData = [
  { subject: 'Gaze Pattern', A: 120, B: 110, fullMark: 150 },
  { subject: 'Identity Sync', A: 98, B: 130, fullMark: 150 },
  { subject: 'Acoustic Auth', A: 86, B: 130, fullMark: 150 },
  { subject: 'OS Focus', A: 99, B: 100, fullMark: 150 },
  { subject: 'Behavioral Vector', A: 85, B: 90, fullMark: 150 },
];

const pieData = [
  { name: 'Direct Approval', value: 400 },
  { name: 'Critical Flag', value: 300 },
  { name: 'Rejected Protocol', value: 300 },
  { name: 'Pending Review', value: 200 },
];

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

const Analytics = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-blink" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Data Processing Active</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight text-gradient">
            Behavioral Intelligence
          </h1>
          <p className="text-white/40 text-sm max-w-lg">
            Multi-dimensional analysis of candidate behavior patterns and global integrity distributions.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50">
            <Calendar size={14} className="text-blue-500" />
            <span>Cycle: Q2 2024</span>
          </div>
          <button className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Violation Radar */}
        <div className="glass-card rounded-3xl p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
            <Target size={120} />
          </div>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             Biometric Vector Analysis
          </h3>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 10, fontWeight: 700 }} />
                <Radar
                  name="Global Benchmark"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Current Stream"
                  dataKey="B"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-card rounded-3xl p-8 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Activity size={120} />
          </div>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             Outcome Distribution
          </h3>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-y-4 mt-8 relative z-10">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Activity */}
        <div className="glass-card rounded-3xl p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Globe size={120} />
          </div>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             Regional Integrity
          </h3>
          <div className="space-y-8 relative z-10">
            <RegionMetric name="North America" score={94} trend={+2} />
            <RegionMetric name="European Union" score={88} trend={-1} />
            <RegionMetric name="Asia Pacific" score={91} trend={+5} />
            <RegionMetric name="Latin America" score={76} trend={+3} />
            <RegionMetric name="Middle East" score={82} trend={-2} />
          </div>
        </div>
      </div>

      {/* Hourly Heatmap Simulation */}
      <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Temporal Anomaly Map</h3>
            <p className="text-white/40 text-xs mt-1">High-density violation periods mapped by hourly telemetry.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-white/5" />
                <span className="text-[9px] font-black text-white/20 uppercase">Baseline</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-red-500/60" />
                <span className="text-[9px] font-black text-white/20 uppercase">High Risk</span>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-[repeat(24,1fr)] gap-1.5 h-40">
          {Array.from({ length: 24 * 5 }).map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.005 }}
              className={cn(
                "rounded-md transition-all duration-300 hover:z-10 hover:scale-125 cursor-pointer relative group",
                i % 12 === 0 ? "bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : 
                i % 7 === 0 ? "bg-red-500/30" : 
                i % 4 === 0 ? "bg-blue-500/40" : "bg-white/[0.03]"
              )}
            >
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-black text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  LOG_{i}: FLAG
               </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-6 text-[9px] text-white/10 uppercase font-black tracking-[0.4em] px-2">
          <span>00:00 UTC</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:59 UTC</span>
        </div>
      </div>
    </div>
  );
};

const RegionMetric = ({ name, score, trend }) => (
  <div className="flex items-center justify-between group">
    <div className="flex flex-col">
      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{name}</span>
      <span className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-0.5">Integrity Sync</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className={cn(
          "text-lg font-black font-mono leading-none",
          score > 90 ? "text-blue-500" : score > 80 ? "text-amber-500" : "text-red-500"
        )}>
          {score}%
        </span>
        <div className={cn(
          "flex items-center text-[8px] font-black uppercase mt-1 px-1.5 py-0.5 rounded",
          trend > 0 ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      </div>
      <Zap size={14} className={cn("transition-colors", score > 90 ? "text-blue-500/50" : "text-white/5")} />
    </div>
  </div>
);

export default Analytics;
