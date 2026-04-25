import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, User, Clock, 
  BarChart3, Brain, Activity, X, 
  ChevronRight, Play, CheckCircle2, History
} from 'lucide-react';
import { cn } from '../components/Layout';
import apiService from '../services/api';
import CodingPanel from '../components/CodingPanel';
import ReportModal from '../components/ReportModal';

const InterviewPlatform = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [analysis, setAnalysis] = useState({
    final_score: 100,
    behavior_score: 100,
    integrity_penalty: 0,
    violations: [],
    dominant_emotion: "Neutral",
    gaze_direction: "Center",
    yaw: 0,
    pitch: 0,
    face_detected: false,
    suspicion_level: 0
  });

  const [sessionInfo, setSessionInfo] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidatePosition, setCandidatePosition] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [showCodingPanel, setShowCodingPanel] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket Connection
  useEffect(() => {
    if (isStarted && sessionId) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/${sessionId}`;
      
      const connectWS = () => {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'risk_update') {
            setAnalysis(prev => ({
              ...prev,
              suspicion_level: data.overall_score,
              final_score: 100 - data.overall_score
            }));
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected. Attempting reconnect...');
          setTimeout(connectWS, 3000);
        };

        wsRef.current.onerror = (err) => {
          console.error('WebSocket error:', err);
        };
      };

      connectWS();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isStarted, sessionId]);

  // Camera and Session Initialization
  useEffect(() => {
    if (isStarted) {
      const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720, frameRate: 15 } 
          });
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          setError(null);
        } catch (err) {
          console.error("Camera error:", err);
          setError("Webcam access denied. Please enable camera permissions.");
        }
      };
      startCamera();
      
      const fetchSession = async () => {
        try {
          const data = await apiService.getSession(sessionId);
          setSessionInfo(data);
        } catch (e) {
          console.error("Session fetch failed:", e);
        }
      };
      fetchSession();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, isStarted]);

  // Analysis Loop
  useEffect(() => {
    let interval;
    if (isStarted && stream) {
      // Browser Activity Tracking
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          apiService.post('/violation', { type: 'tab_switch', session_id: sessionId });
        }
      };

      const handleWindowBlur = () => {
        apiService.post('/violation', { type: 'window_blur', session_id: sessionId });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      interval = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.5);
        
        try {
          const result = await apiService.post('/analyze', { image: base64Image, session_id: sessionId });
          setAnalysis(prev => ({
             ...prev,
             ...result,
             violations: result.violations || prev.violations
          }));
        } catch (err) {
          console.error("AI Analysis step failed:", err);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
      };
    }
  }, [isStarted, stream]);

  const handleEndInterview = () => {
    setIsEnding(true);
    setTimeout(() => {
      setShowSummary(true);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }, 800);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      console.log("🚀 Initializing session for:", candidateName, candidatePosition);
      const newSession = await apiService.createSession({
        candidate_name: candidateName,
        position: candidatePosition || "Candidate"
      });
      console.log("✅ Session initialized:", newSession);
      setSessionInfo(newSession);
      setIsStarted(true);
      // Navigate to the correct session URL if it changed
      if (newSession.id !== sessionId) {
        navigate(`/platform/${newSession.id}`, { replace: true });
      }
    } catch (err) {
      console.error("❌ Session initialization failed:", err);
      setError(`Failed to initialize session: ${err.message || "Unknown Error"}`);
    }
  };

  if (!isStarted && !showSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-100"
        >
          <div className="text-center mb-10">
             <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                <Shield className="text-white w-10 h-10" />
             </div>
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security Checkpoint</h2>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-3">Identity & Protocol Verification</p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter legal name"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Session Token / Position</label>
              <input 
                type="text" 
                value={candidatePosition}
                onChange={(e) => setCandidatePosition(e.target.value)}
                placeholder="e.g. Senior Developer"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertTriangle size={18} />
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Authorize Protocol
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Neural Integrity Link Active</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">AI Protocol Monitor</h1>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Toggle Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowCodingPanel(!showCodingPanel)}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all ${
              showCodingPanel 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showCodingPanel ? 'Hide Coding Panel' : 'Show Coding Panel'}
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-all"
          >
            Generate Report
          </button>
        </div>

        {/* Split Screen Layout */}
        <div className={`grid gap-8 ${showCodingPanel ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: Camera Feed & Monitoring */}
          <div className={`${showCodingPanel ? '' : 'lg:col-span-2'} space-y-8`}>
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-10 left-10 z-10 flex items-center gap-3 px-4 py-2 bg-gray-900/80 backdrop-blur-xl rounded-full border border-white/10">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Surveillance Live</span>
              </div>
              
              <div className="aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl relative">
                 <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {analysis.face_detected && (
                   <div className="absolute inset-0 pointer-events-none">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[60%] border border-blue-500/50 rounded-[4rem] shadow-[0_0_100px_rgba(59,130,246,0.1)]"
                      >
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/20">Target Locked</span>
                         </div>
                      </motion.div>
                   </div>
                 )}
              </div>
            </div>

            {/* Live Log */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                 <div className="space-y-1">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Anomaly Stream</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time behavior classification</p>
                 </div>
                 <Activity size={20} className="text-blue-500" />
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                 {analysis.violations.length > 0 ? analysis.violations.map((v, i) => (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50 text-red-600"
                   >
                      <div className="flex items-center gap-5">
                         <span className="text-[10px] font-mono font-bold opacity-40">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                         <span className="text-xs font-black uppercase tracking-tight">{v.reason}</span>
                      </div>
                      <div className="px-3 py-1 bg-red-500/10 rounded-full">
                         <span className="text-[10px] font-black">-{v.penalty} PT</span>
                      </div>
                   </motion.div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-16 opacity-30">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                         <CheckCircle2 size={32} className="text-blue-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Integrity Baseline Maintained</span>
                   </div>
                 )}
              </div>
            </div>

            {/* Metrics (shown when coding panel is hidden) */}
            {!showCodingPanel && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                   <div className="relative w-40 h-40 mb-6">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-gray-100 stroke-current" strokeWidth="6" cx="50" cy="50" r="45" fill="transparent"></circle>
                        <circle 
                          className={cn(
                            "stroke-current transition-all duration-1000",
                            analysis.final_score > 70 ? "text-blue-500" : analysis.final_score > 40 ? "text-yellow-500" : "text-red-500"
                          )} 
                          strokeWidth="6" 
                          strokeDasharray={282.6} 
                          strokeDashoffset={282.6 - (282.6 * analysis.final_score) / 100} 
                          strokeLinecap="round" 
                          cx="50" cy="50" r="45" 
                          fill="transparent"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black text-gray-900 tracking-tighter">{Math.round(analysis.final_score)}</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Trust Quotient</span>
                      <p className="text-[9px] font-bold text-blue-500/60 uppercase">Aggregated Integrity Score</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <MetricCard label="Neural Load" value={analysis.behavior_score} suffix="%" />
                   <MetricCard label="Active Penalties" value={analysis.integrity_penalty} color="text-red-500" suffix=" PT" />
                   <MetricCard label="Emotional State" value={analysis.dominant_emotion} />
                   <MetricCard label="Gaze Orientation" value={`${analysis.gaze_direction} (Y:${Math.round(analysis.yaw)}°)`} />
                </div>
                
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Status</span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        analysis.final_score > 70 ? "bg-green-500" : analysis.final_score > 40 ? "bg-yellow-500" : "bg-red-500"
                      )} />
                   </div>
                   <div className={cn(
                     "text-sm font-black uppercase tracking-[0.2em]",
                     analysis.final_score > 70 ? "text-green-500" : analysis.final_score > 40 ? "text-yellow-500" : "text-red-500"
                   )}>
                      {analysis.final_score > 70 ? "Verified Secure" : analysis.final_score > 40 ? "Anomaly Detected" : "Integrity Failure"}
                   </div>
                   
                   {analysis.final_score < 50 && (
                     <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                     >
                        <AlertTriangle size={16} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-tight leading-none">Critical Integrity Deviation Detected</span>
                     </motion.div>
                   )}
                </div>

                <button 
                  onClick={handleEndInterview}
                  className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-red-100 transition-all active:scale-95"
                >
                  Terminate Session
                </button>
              </div>
            )}
          </div>

          {/* Right: Coding Panel */}
          {showCodingPanel && (
            <div className="h-[800px]">
              <CodingPanel sessionId={sessionId} onReportGenerate={() => setShowReportModal(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        sessionId={sessionId}
      />

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 overflow-hidden border border-gray-100"
            >
              <div className="text-center mb-12">
                 <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Debriefing Report</h2>
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Final Protocol Conclusion</p>
              </div>

              <div className="flex items-center justify-center mb-12">
                 <div className="text-center">
                    <span className="text-9xl font-black text-blue-600 tracking-tighter leading-none">{Math.round(analysis.final_score)}</span>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-6">Final Trust Score</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-12">
                 <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Stability Index</span>
                    <span className="text-3xl font-black text-gray-900">{analysis.behavior_score}</span>
                 </div>
                 <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Deviation Loss</span>
                    <span className="text-3xl font-black text-red-500">-{analysis.integrity_penalty}</span>
                 </div>
              </div>

              <div className="space-y-5 mb-12">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Protocol Incidents</h4>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{analysis.violations.length} Detected</span>
                 </div>
                 <div className="max-h-48 overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                    {analysis.violations.length > 0 ? analysis.violations.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{v.reason}</span>
                         </div>
                         <span className="text-[10px] font-black text-red-500">-{v.penalty} PT</span>
                      </div>
                    )) : (
                      <div className="py-10 bg-green-50/50 rounded-3xl border border-green-100/50 text-center">
                         <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Zero Protocol Deviations</p>
                      </div>
                    )}
                 </div>
              </div>

              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-6 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-gray-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all"
              >
                Return to Command
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricCard = ({ label, value, color = "text-gray-900", suffix = "" }) => (
  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:border-blue-500/20 hover:shadow-md">
     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</span>
     <span className={cn("text-xl font-black truncate tracking-tight", color)}>
       {value}{suffix}
     </span>
  </div>
);

export default InterviewPlatform;
