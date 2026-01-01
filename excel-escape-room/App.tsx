
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MISSIONS, 
  MISSION_OVERTIME, 
  BRIEFING_DURATION,
  Icons, 
  TRAINING_CODE 
} from './constants';
import { 
  AppView, 
  LeaderboardEntry 
} from './types';
import { getLeaderboardData, submitMissionEvidence } from './services/dataService';

const App: React.FC = () => {
  // Navigation & Identity
  const [view, setView] = useState<AppView>('login');
  const [teamName, setTeamName] = useState('');
  
  // Mission Tracking
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [failedMissions, setFailedMissions] = useState<number[]>([]); 
  const [missionTimes, setMissionTimes] = useState<Record<number, number>>({});
  
  // Computed progress
  const progressIdx = useMemo(() => completedMissions.length + failedMissions.length, [completedMissions, failedMissions]);

  // Persistent Timer State (Mission)
  const [missionStartTime, setMissionStartTime] = useState<number | null>(null);
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  // Briefing Timer State
  const [briefingTime, setBriefingTime] = useState(BRIEFING_DURATION);
  const [showBriefingTimeout, setShowBriefingTimeout] = useState(false);
  
  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update leaderboard on specific view changes
  useEffect(() => {
    if (['billboard', 'completed', 'login', 'dashboard'].includes(view)) {
      getLeaderboardData().then(setLeaderboard);
    }
  }, [view, completedMissions, failedMissions]);

  const handleMissionFailure = useCallback(() => {
    const mission = MISSIONS[currentMissionIdx];
    setFailedMissions(prev => [...prev, mission.id]);
    setMissionTimes(prev => ({...prev, [mission.id]: mission.duration + MISSION_OVERTIME}));
    
    setIsMissionActive(false);
    setMissionStartTime(null);
    setIsOvertime(false);
    
    if (currentMissionIdx < MISSIONS.length - 1) {
      setCurrentMissionIdx(prev => prev + 1);
      setView('dashboard');
    } else {
      setView('completed');
    }
  }, [currentMissionIdx]);

  // Persistent Mission Clock Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isMissionActive && missionStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - missionStartTime) / 1000);
        const mission = MISSIONS[currentMissionIdx];
        const totalAllocated = mission.duration;
        
        if (elapsed < totalAllocated) {
          setTimeRemaining(totalAllocated - elapsed);
          setIsOvertime(false);
        } else {
          const otElapsed = elapsed - totalAllocated;
          if (otElapsed < MISSION_OVERTIME) {
            setTimeRemaining(MISSION_OVERTIME - otElapsed);
            setIsOvertime(true);
          } else {
            handleMissionFailure();
          }
        }
      }, 1000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isMissionActive, missionStartTime, currentMissionIdx, handleMissionFailure]);

  // Briefing Clock Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (view === 'briefing' && briefingTime > 0 && !showBriefingTimeout) {
      interval = setInterval(() => {
        setBriefingTime(prev => {
          if (prev <= 1) {
            setShowBriefingTimeout(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, briefingTime, showBriefingTimeout]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const mission = MISSIONS[currentMissionIdx];
    const elapsed = Math.floor((Date.now() - (missionStartTime || Date.now())) / 1000);

    setVerificationLog([
      `IDENTITY: ${teamName} authenticated.`,
      `INTEGRITY: Mission 0${mission.id} evidence detected.`,
      `CONVENTION: Applying SharePoint naming rules...`,
      `SYNC: Establishing secure bridge to SharePoint Vault...`,
    ]);

    const success = await submitMissionEvidence(teamName, mission.id, mission.name, elapsed, file);
    
    if (success) {
      setVerificationLog(prev => [...prev, `UPLOAD SUCCESSFUL.`, `STATUS: SECURED.`]);
      setIsMissionActive(false);
      setMissionStartTime(null);
      
      setTimeout(() => {
        setIsUploading(false);
        setIsOvertime(false);
        setCompletedMissions(prev => [...prev, mission.id]);
        setMissionTimes(prev => ({...prev, [mission.id]: elapsed}));
        if (fileInputRef.current) fileInputRef.current.value = "";

        if (currentMissionIdx < MISSIONS.length - 1) {
          setCurrentMissionIdx(prev => prev + 1);
          setView('dashboard');
        } else {
          setView('completed');
        }
      }, 1500);
    } else {
      setVerificationLog(prev => [...prev, "ERROR: Secure transfer failed. Critical sync error."]);
      setIsUploading(false);
    }
  };

  const initiateMission = () => {
    if (!isMissionActive) {
      setMissionStartTime(Date.now());
      setTimeRemaining(MISSIONS[currentMissionIdx].duration);
      setIsMissionActive(true);
      setIsOvertime(false);
    }
    setShowBriefingTimeout(false);
    setView('active');
  };

  const startBriefing = (idx: number) => {
    setCurrentMissionIdx(idx);
    setBriefingTime(BRIEFING_DURATION);
    setShowBriefingTimeout(false);
    setView('briefing');
  };

  const mission = MISSIONS[currentMissionIdx];

  return (
    <div className="min-h-screen bg-[#020617] text-[#94a3b8] p-6 md:p-12 font-sans overflow-x-hidden">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="flex flex-col items-center justify-center min-h-[85vh]">
          <div className="max-w-md w-full bg-[#0f172a]/90 border border-slate-800 rounded-[48px] p-12 shadow-2xl relative">
            <button 
              onClick={() => setView('billboard')}
              className="absolute -top-3 -right-3 bg-[#42A5C5] text-slate-950 px-6 py-2 rounded-full text-[10px] font-black tracking-widest shadow-xl hover:bg-[#5bc0e0] transition-colors"
            >
              LEADERBOARD
            </button>

            <div className="text-center mb-10">
              <Icons.Terminal className="text-cyan-400 w-16 h-16 mx-auto mb-6" />
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">EXCEL ESCAPE v1.3</h1>
              <p className="text-slate-500 text-[10px] font-mono tracking-[0.2em] italic uppercase">
                Enter you credentials to begin the audit.
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Icons.User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:ring-1 focus:ring-cyan-500/50 font-sans text-sm"
                  placeholder="Enter Group Name..."
                />
              </div>
              <button 
                onClick={() => teamName && setView('dashboard')} 
                className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg text-[13px] tracking-widest uppercase ${teamName ? 'bg-[#3390B0] hover:bg-[#3ca7cd] text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                disabled={!teamName}
              >
                INITIATE LOGIN <Icons.ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {view === 'dashboard' && (
        <div className="max-w-7xl mx-auto">
          <header className="mb-16 pb-10 flex justify-between items-start border-b border-slate-900/50">
            <div>
              <p className="text-cyan-500 font-mono text-[10px] tracking-[0.3em] mb-2 uppercase font-bold text-cyan-400">AGENT > {teamName || 'UNKNOWN'}</p>
              <h1 className="text-5xl font-black tracking-tighter uppercase text-white leading-none">Mission Control</h1>
            </div>
            <div className="text-right">
              <p className="text-slate-600 font-mono text-[9px] uppercase tracking-widest mb-1">ENCRYPTION LEVEL</p>
              <p className="text-white font-black uppercase text-xs tracking-widest">AES-256 SECURE</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {MISSIONS.map((m, idx) => {
              const isComp = completedMissions.includes(m.id);
              const isFail = failedMissions.includes(m.id);
              const isCurrent = idx === progressIdx;
              const isLocked = idx > progressIdx;
              const isStarted = isCurrent && isMissionActive;

              // Determine Container Styling
              let cardClasses = "relative p-10 rounded-[40px] border-2 transition-all duration-500 min-h-[300px] flex flex-col group ";
              
              if (isLocked) {
                cardClasses += "border-slate-900/40 bg-[#020617] opacity-60 cursor-not-allowed";
              } else if (isComp) {
                cardClasses += "border-green-500/30 bg-green-950/5";
              } else if (isFail) {
                cardClasses += "border-slate-900 bg-slate-900/20";
              } else {
                // Available or Pending
                cardClasses += "border-cyan-500/60 bg-[#0f172a]/40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.1)]";
              }

              return (
                <div 
                  key={m.id} 
                  className={cardClasses} 
                  onClick={() => !isLocked && !isFail && !isComp && (isStarted ? setView('active') : startBriefing(idx))}
                >
                  {/* Top Bar: Icon and Mission Code */}
                  <div className="flex justify-between items-start mb-6 w-full">
                    <div className={`p-4 rounded-2xl flex items-center justify-center ${isComp ? 'bg-green-500/10 text-green-500' : (isFail || isLocked) ? 'bg-slate-900/50 text-slate-800' : 'bg-cyan-500/10 text-cyan-400'}`}>
                      {isComp ? <Icons.CheckCircle className="w-8 h-8" /> : isFail ? <Icons.XCircle className="w-8 h-8" /> : isLocked ? <Icons.Lock className="w-8 h-8 opacity-40" /> : <Icons.Unlock className="w-8 h-8" />}
                    </div>
                    <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">M0{m.id}</span>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 flex flex-col justify-center">
                    {isLocked ? (
                      <div className="text-center">
                        <h3 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">CLASSIFIED</h3>
                      </div>
                    ) : (
                      <>
                        <h3 className={`text-2xl font-black mb-4 tracking-tight transition-all ${isComp ? 'uppercase text-white' : isFail ? 'text-slate-600 line-through' : 'text-white'}`}>
                          {m.name}
                        </h3>
                        
                        {isComp ? (
                          <div className="space-y-2 mt-auto">
                            <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                               EVIDENCE UPLOADED
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">TIME TAKEN: {formatTime(missionTimes[m.id])}</p>
                          </div>
                        ) : isFail ? (
                          <div className="space-y-2 mt-auto">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                               <Icons.Ban className="w-3 h-3" /> MISSION FAILED
                            </p>
                            <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest font-bold font-mono">Time: {formatTime(missionTimes[m.id])} (Timeout)</p>
                          </div>
                        ) : isStarted ? (
                          <div className="space-y-4 mt-auto">
                            <p className="text-yellow-600 text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em]">
                              <Icons.Clock className="w-3 h-3" /> PENDING EVIDENCE
                            </p>
                            <p className="text-cyan-400 text-[10px] font-black uppercase flex items-center gap-2 group-hover:translate-x-1 transition-transform tracking-widest">
                              OPEN DOSSIER <Icons.ChevronRight className="w-4 h-4" />
                            </p>
                          </div>
                        ) : (
                          // Available (Ready to take)
                          <div className="mt-auto">
                             <p className="text-cyan-400 text-[10px] font-black uppercase flex items-center gap-2 group-hover:translate-x-1 transition-transform tracking-widest">
                                OPEN DOSSIER <Icons.ChevronRight className="w-4 h-4" />
                             </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BRIEFING VIEW */}
      {view === 'briefing' && (
        <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center relative">
          
          {/* Timeout Overlay */}
          {showBriefingTimeout && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-[#0f172a] border-4 border-red-600/50 rounded-[40px] p-12 text-center shadow-[0_0_80px_rgba(220,38,38,0.3)] animate-in fade-in zoom-in duration-300">
                <div className="bg-red-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Icons.AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">TIMEOUT!</h2>
                <p className="text-slate-400 text-sm mb-12 uppercase tracking-widest font-bold leading-relaxed">
                  Briefing window exceeded! Immediate deployment is mandatory.
                </p>
                <button 
                  onClick={initiateMission} 
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]"
                >
                  START MISSION NOW
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#0f172a] border border-slate-800 p-16 rounded-[40px] w-full shadow-2xl relative overflow-hidden">
            <header className="flex justify-between items-start mb-10">
              <div>
                <p className="text-cyan-500 font-mono text-[11px] uppercase tracking-[0.4em] mb-4 font-bold">MISSION BRIEFING: {mission.id}</p>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter">{mission.name}</h1>
              </div>
              
              <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-3xl min-w-[120px] text-center shadow-inner">
                <p className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest mb-1">TIMER</p>
                <p className={`text-4xl font-mono font-black ${briefingTime < 60 ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(briefingTime)}
                </p>
              </div>
            </header>

            <div className="bg-[#020617] p-10 rounded-3xl border border-slate-800/50 mb-12">
               <div className="flex items-center gap-3 mb-4 text-cyan-400">
                  <Icons.FileText className="w-5 h-5" />
                  <span className="text-xs font-black uppercase">PRIMARY OBJECTIVE</span>
               </div>
               <p className="text-xl italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
            </div>

            <div className="flex gap-10 mb-12">
               <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest font-mono font-bold"><Icons.Clock className="w-4 h-4" /> 30:00 LIMIT</span>
               <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest font-mono font-bold"><Icons.ShieldAlert className="w-4 h-4" /> 02:00 OVERTIME GRACE</span>
            </div>

            <div className="flex flex-col gap-6">
              <button 
                onClick={initiateMission} 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
              >
                <Icons.Play className="w-5 h-5 fill-current" /> START MISSION
              </button>
              
              <button 
                onClick={() => setView('dashboard')} 
                className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
              >
                RE-CHECK HQ DATA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MISSION VIEW */}
      {view === 'active' && (
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setView('dashboard')} 
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group"
          >
            <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Mission Control
          </button>

          <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <div className="bg-[#0f172a] p-8 rounded-[32px] border border-slate-800/50 flex-1 w-full">
              <p className="text-cyan-500 font-mono text-[9px] tracking-[0.4em] mb-2 uppercase font-bold">ACTIVE OBJECTIVE</p>
              <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">{mission.name}</h1>
            </div>
            
            <div className={`p-8 rounded-[32px] border-2 min-w-[240px] shadow-xl transition-all ${isOvertime ? 'bg-red-950/50 border-red-600 animate-pulse' : 'bg-[#0f172a] border-cyan-500/20'}`}>
              <p className="text-[9px] font-mono uppercase text-center mb-1 text-slate-500 font-bold tracking-widest">REMAINING</p>
              <p className={`text-6xl font-mono font-black text-center ${isOvertime ? 'text-red-500' : 'text-white'}`}>{formatTime(timeRemaining)}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-[#0f172a] p-10 rounded-[32px] border border-slate-800/50 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase mb-6 font-bold tracking-widest underline underline-offset-8">INTEL DIGEST</p>
                  <p className="text-lg italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
                  <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col gap-4">
                    <a href={mission.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em]">
                       <Icons.Download className="w-4 h-4" /> Download Dataset
                    </a>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4">
                  <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 flex items-start gap-4">
                    <Icons.Zap className="text-cyan-400 w-5 h-5 flex-shrink-0 mt-1" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      <span className="text-cyan-400 font-black uppercase font-bold">TIP:</span> Ensure all Pivot Table filters are cleared before submission to pass AI validation.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {if(window.confirm('Are you sure you want to abort? This counts as a mission failure.')) handleMissionFailure();}}
                    className="flex items-center gap-2 text-slate-800 hover:text-red-800 transition-colors text-[9px] font-black uppercase tracking-widest w-fit"
                  >
                    <Icons.Flag className="w-3 h-3" /> ABORT MISSION (FAIL)
                  </button>
               </div>
            </div>

            <div className="lg:col-span-7">
               <div className="bg-[#0f172a]/30 border-2 border-dashed border-slate-800 p-16 rounded-[48px] text-center min-h-[460px] flex flex-col justify-center items-center shadow-inner relative">
                  {isUploading ? (
                    <div className="w-full space-y-8 px-8">
                      <div className="bg-black p-10 rounded-[32px] text-left font-mono text-[10px] text-cyan-400 h-56 overflow-y-auto custom-scrollbar border border-cyan-900/30 shadow-2xl">
                        {verificationLog.map((log, i) => <div key={i} className="mb-2 leading-tight tracking-widest">{`[SECURE_SYNC] > ${log}`}</div>)}
                        <div className="animate-pulse">_</div>
                      </div>
                      <div className="h-1 bg-slate-900 w-full rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-[progress_1.5s_linear_infinite]" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mb-10 shadow-xl border border-slate-700/30">
                        <Icons.Upload className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-3 uppercase tracking-tighter">SUBMIT DOSSIER</h3>
                      <p className="text-slate-600 text-[10px] mb-12 uppercase tracking-[0.2em] font-bold max-w-xs mx-auto leading-relaxed">
                        Transmit your updated Excel for forensic verification.
                      </p>
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className={`px-20 py-7 rounded-2xl font-black text-sm uppercase flex items-center gap-4 transition-all active:scale-[0.98] shadow-2xl tracking-[0.2em] ${isOvertime ? 'bg-red-600 text-white' : 'bg-[#33B8D9] text-slate-950 hover:bg-[#4ed0f0]'}`}
                      >
                        UPLOAD DATASET <Icons.Zap className="w-5 h-5 fill-current" />
                      </button>
                      <p className="mt-12 text-[8px] font-mono uppercase text-slate-800 tracking-[0.6em] font-black">SECURE ENCRYPTION CHANNEL OPEN</p>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED VIEW */}
      {view === 'completed' && (
        <div className="max-w-3xl mx-auto text-center py-24">
          <div className="bg-cyan-500/10 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <Icons.Trophy className="w-16 h-16 text-cyan-400" />
          </div>
          <h1 className="text-7xl font-black uppercase italic tracking-tighter mb-4 text-white">Vault Secured</h1>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mb-16 font-bold leading-relaxed">All audits finalized for Team {teamName}. MISSION SUCCESSFUL.</p>
          
          <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[40px] mb-12 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-8 border-b border-slate-800 pb-4">MISSION DEBRIEF</h3>
            {MISSIONS.map(m => (
              <div key={m.id} className="flex justify-between items-center py-6 border-b border-slate-800/50 last:border-0 group">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">Mission 0{m.id}: {m.name}</span>
                <span className={`text-[10px] font-mono font-black px-4 py-1 rounded-full ${completedMissions.includes(m.id) ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                  {completedMissions.includes(m.id) ? 'SECURED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={() => setView('billboard')} className="bg-[#42A5C5] hover:bg-[#5bc0e0] text-slate-950 px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl">Leaderboard</button>
            <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all">Exit Protocol</button>
          </div>
        </div>
      )}

      {/* BILLBOARD VIEW (Podium) */}
      {view === 'billboard' && (
        <div className="max-w-6xl mx-auto min-h-screen pb-20 pt-10">
          <div className="flex justify-between items-center mb-16 border-b border-slate-900 pb-10">
            <h1 className="text-7xl font-black italic tracking-tighter text-cyan-400 uppercase leading-none">Leaderboard</h1>
            <button onClick={() => setView('login')} className="bg-slate-900 px-10 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] border border-slate-800 transition-all">BACK</button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-end gap-10 mb-20 px-10">
            {leaderboard[1] && (
              <div className="bg-[#0f172a] border border-slate-800 w-full md:w-64 h-72 rounded-[40px] flex flex-col items-center justify-center p-8 shadow-2xl relative order-2 md:order-1 opacity-90">
                <div className="text-5xl font-black text-slate-800 mb-2 font-mono">02</div>
                <Icons.Trophy className="w-12 h-12 text-slate-400 mb-6" />
                <h3 className="text-xl font-black text-white text-center uppercase tracking-tighter truncate w-full">{leaderboard[1].name}</h3>
                <p className="text-cyan-500 font-mono mt-4 font-bold text-lg">{leaderboard[1].totalPoints} PTS</p>
              </div>
            )}
            
            {leaderboard[0] && (
              <div className="relative bg-[#0f172a] border-2 border-cyan-500 w-full md:w-80 h-96 rounded-[48px] flex flex-col items-center justify-center p-10 shadow-[0_0_60px_rgba(6,182,212,0.15)] order-1 md:order-2">
                <div className="absolute -top-6 bg-cyan-500 text-slate-950 font-black px-10 py-3 rounded-full shadow-2xl uppercase tracking-[0.2em] text-[10px]">1st PLACE</div>
                <div className="text-6xl font-black text-cyan-500/10 mb-2 font-mono">01</div>
                <Icons.Trophy className="w-20 h-20 text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                <h3 className="text-3xl font-black text-white text-center leading-none mb-3 uppercase tracking-tighter truncate w-full">{leaderboard[0].name}</h3>
                <p className="text-cyan-400 font-mono text-2xl font-bold">{leaderboard[0].totalPoints} PTS</p>
              </div>
            )}
            
            {leaderboard[2] && (
              <div className="bg-[#0f172a] border border-slate-800 w-full md:w-64 h-64 rounded-[40px] flex flex-col items-center justify-center p-8 shadow-2xl order-3 opacity-80">
                <div className="text-4xl font-black text-slate-800 mb-2 font-mono">03</div>
                <Icons.Trophy className="w-10 h-10 text-amber-700 mb-6" />
                <h3 className="text-lg font-black text-white text-center uppercase tracking-tighter truncate w-full">{leaderboard[2].name}</h3>
                <p className="text-cyan-600 font-mono mt-4 font-bold">{leaderboard[2].totalPoints} PTS</p>
              </div>
            )}
          </div>

          <div className="space-y-4 max-w-4xl mx-auto px-6">
            {leaderboard.slice(3).map((team, idx) => (
              <div key={team.name} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-8 flex items-center justify-between hover:bg-slate-800/60 transition-all group">
                 <div className="flex items-center gap-10">
                   <span className="text-sm font-black text-slate-700 w-10 font-mono">#{idx + 4}</span>
                   <h4 className="text-xl font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">{team.name}</h4>
                 </div>
                 <div className="text-right">
                   <span className="text-cyan-500 font-mono font-black text-xl">{team.totalPoints} <span className="text-[10px] uppercase ml-1">pts</span></span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
