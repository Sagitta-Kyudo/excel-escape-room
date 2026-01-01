
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MISSIONS, 
  MISSION_OVERTIME, 
  BRIEFING_DURATION, 
  Icons, 
  TRAINING_CODE,
  APP_VERSION
} from './constants';
import { 
  AppView, 
  LeaderboardEntry 
} from './types';
import { getLeaderboardData, submitMissionEvidence } from './services/dataService';

const App: React.FC = () => {
  // Identity
  const [view, setView] = useState<AppView>('login');
  const [teamName, setTeamName] = useState('');
  
  // Game State Persistence
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [failedMissions, setFailedMissions] = useState<number[]>([]); 
  const [missionTimes, setMissionTimes] = useState<Record<number, number>>({});
  
  // Persistent Timer State
  const [missionStartTime, setMissionStartTime] = useState<number | null>(null);
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  
  // Terminal/Sync State
  const [isUploading, setIsUploading] = useState(false);
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync leaderboard
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

  // Unstoppable Background Timer Logic
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const mission = MISSIONS[currentMissionIdx];
    const elapsed = Math.floor((Date.now() - (missionStartTime || Date.now())) / 1000);
    const timeTaken = elapsed;

    setVerificationLog([
      `IDENTITY: Team [${teamName}] detected.`,
      `PAYLOAD: Mission ${mission.id} evidence dossier.`,
      `FORMATTING: Applying SharePoint conversion rules...`,
      `DESTINATION: /IgAIOQuwu-40Q5UOND7AFchEAaNfQoJGIvqjRD7jWPS7jMU`,
      `UPLOADING: Establishing secure channel...`,
    ]);

    const success = await submitMissionEvidence(teamName, mission.id, mission.name, timeTaken, file);
    
    if (success) {
      setVerificationLog(prev => [
        ...prev, 
        `UPLOAD COMPLETE.`, 
        `LEDGER: Entry confirmed in t_rawdata.`,
        `STATUS: Mission Secured.`
      ]);
      
      setIsMissionActive(false);
      setMissionStartTime(null);
      
      setTimeout(() => {
        setIsUploading(false);
        setIsOvertime(false);
        setCompletedMissions(prev => [...prev, mission.id]);
        setMissionTimes(prev => ({...prev, [mission.id]: timeTaken}));
        
        if (fileInputRef.current) fileInputRef.current.value = "";

        if (currentMissionIdx < MISSIONS.length - 1) {
          setCurrentMissionIdx(prev => prev + 1);
          setView('dashboard');
        } else {
          setView('completed');
        }
      }, 2000);
    } else {
      setVerificationLog(prev => [...prev, "ERROR: Synchronization failed. Retry submission."]);
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
    setView('active');
  };

  const mission = MISSIONS[currentMissionIdx];

  return (
    <div className="min-h-screen bg-[#020617] text-[#94a3b8] p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* 1. LOGIN VIEW */}
      {view === 'login' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 shadow-2xl relative">
            <div 
              className="absolute -top-4 -right-4 bg-cyan-500 text-slate-950 px-5 py-2 rounded-full text-[10px] font-black tracking-widest animate-pulse cursor-pointer uppercase" 
              onClick={() => setView('billboard')}
            >
              Leaderboard
            </div>
            <div className="text-center mb-12">
              <Icons.Terminal className="text-cyan-400 w-16 h-16 mx-auto mb-6" />
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Excel Escape v1.1</h1>
              <p className="text-slate-500 text-[10px] font-mono mt-3 uppercase tracking-[0.2em] italic">Credentials Required</p>
            </div>
            <div className="space-y-6">
              <input 
                type="text" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700 text-xs tracking-widest uppercase font-mono"
                placeholder="Team Name..."
              />
              <button 
                onClick={() => teamName && setView('dashboard')} 
                className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase tracking-[0.2em] text-[11px] ${teamName ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                disabled={!teamName}
              >
                Access Console <Icons.ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DASHBOARD VIEW (Match Screenshot 1) */}
      {view === 'dashboard' && (
        <div className="max-w-7xl mx-auto">
          <header className="mb-16 pb-10 flex justify-between items-start border-b border-slate-900/50">
            <div>
              <p className="text-cyan-500 font-mono text-[10px] tracking-[0.3em] mb-2 uppercase font-bold">SYSTEMS ONLINE // JJK</p>
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
              const isCurrent = idx === currentMissionIdx;
              const isLocked = idx > currentMissionIdx;
              const isStarted = isCurrent && isMissionActive;

              let cardClasses = "relative p-12 rounded-[32px] border-2 transition-all duration-500 min-h-[280px] flex flex-col justify-between group ";
              
              if (isComp) cardClasses += "border-green-500/20 bg-green-950/10";
              else if (isFail) cardClasses += "border-slate-900 bg-slate-900/40 opacity-70";
              else if (isCurrent) cardClasses += "border-cyan-500 bg-cyan-950/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] cursor-pointer";
              else cardClasses += "border-slate-900 bg-[#020617] opacity-40 cursor-not-allowed";

              return (
                <div key={m.id} className={cardClasses} onClick={() => isCurrent && !isFail && (isStarted ? setView('active') : setView('briefing'))}>
                  <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-xl ${isCurrent ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-900/50 text-slate-700'}`}>
                      {isComp ? <Icons.CheckCircle className="w-8 h-8 text-green-500" /> :
                       isFail ? <Icons.XCircle className="w-8 h-8 text-slate-600" /> :
                       <Icons.Lock className="w-8 h-8" />}
                    </div>
                    <span className={`text-[10px] font-mono font-black ${isCurrent ? 'text-cyan-500' : 'text-slate-800'}`}>M-0{m.id}</span>
                  </div>

                  <div>
                    <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight leading-tight ${isLocked || isFail ? 'text-slate-600' : 'text-white'}`}>
                      {isLocked ? "ENCRYPTED DATA" : m.name}
                    </h3>

                    {isLocked ? (
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Access Denied</p>
                    ) : isComp ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Evidence Uploaded</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Time: {formatTime(missionTimes[m.id] || 0)}</p>
                      </div>
                    ) : isFail ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Mission Failed</p>
                        <p className="text-[10px] font-mono text-slate-700 uppercase">Time: {formatTime(missionTimes[m.id] || 0)} [Timed out]</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isStarted ? "IN PROGRESS" : "Awaiting Briefing..."}</p>
                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          Open Dossier <Icons.ChevronRight className="w-4 h-4" />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MISSION BRIEFING VIEW (Match Screenshot 2) */}
      {view === 'briefing' && (
        <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center">
          <div className="bg-[#0f172a] border border-slate-800 p-16 rounded-[40px] w-full shadow-2xl relative overflow-hidden">
            <header className="mb-10">
              <p className="text-cyan-500 font-mono text-[11px] uppercase tracking-[0.4em] mb-4 font-bold">MISSION BRIEFING: {mission.id}</p>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">{mission.name}</h1>
            </header>

            <div className="bg-[#020617] p-10 rounded-3xl border border-slate-800/50 mb-12 shadow-inner">
               <div className="flex items-center gap-3 mb-4 text-cyan-400">
                  <Icons.FileText className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">PRIMARY OBJECTIVE</span>
               </div>
               <p className="text-xl italic text-slate-300 leading-relaxed font-light tracking-wide">
                 "{mission.objective}"
               </p>
            </div>

            <div className="flex gap-10 mb-12 px-2">
               <div className="flex items-center gap-3">
                  <Icons.Clock className="text-slate-600 w-5 h-5" />
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">{formatTime(mission.duration)} LIMIT</span>
               </div>
               <div className="flex items-center gap-3">
                  <Icons.ShieldAlert className="text-slate-600 w-5 h-5" />
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">{formatTime(MISSION_OVERTIME)} OVERTIME GRACE</span>
               </div>
            </div>

            <div className="flex gap-6">
              <button onClick={() => setView('dashboard')} className="flex-1 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 py-6 rounded-2xl font-black text-sm transition-all uppercase tracking-[0.2em]">
                BACK
              </button>
              <button onClick={initiateMission} className="flex-[2] bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-2xl font-black text-sm transition-all shadow-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]">
                <Icons.Play className="w-5 h-5 fill-current" /> INITIATE MISSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE MISSION VIEW (Match Screenshot 3) */}
      {view === 'active' && (
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-start mb-16">
            <div>
              <p className="text-cyan-500 font-mono text-[9px] tracking-[0.4em] mb-2 uppercase font-bold">CURRENT OBJECTIVE</p>
              <h1 className="text-5xl font-black tracking-tighter uppercase text-white leading-none">{mission.name}</h1>
            </div>
            <div className={`p-8 rounded-[32px] border-2 transition-all min-w-[200px] ${isOvertime ? 'bg-red-950/50 border-red-600 animate-flash-red' : 'bg-slate-900 border-cyan-500/20'}`}>
              <p className="text-[9px] font-mono uppercase text-center mb-1 text-slate-500 font-bold tracking-widest">MISSION CLOCK</p>
              <p className={`text-6xl font-mono font-black text-center tracking-tighter leading-none ${isOvertime ? 'text-red-500' : 'text-white'}`}>{formatTime(timeRemaining)}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-8">
               {/* Mission Memo */}
               <div className="bg-[#0f172a] p-10 rounded-[32px] border border-slate-800/50 shadow-xl">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-6 font-bold">MISSION MEMO</p>
                  <p className="text-lg italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
                  <div className="mt-8 pt-8 border-t border-slate-800 flex">
                    <a href={mission.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                       <Icons.Download className="w-4 h-4" /> Download Dataset
                    </a>
                  </div>
               </div>

               {/* Tip Box */}
               <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 flex items-start gap-4">
                  <Icons.Zap className="text-cyan-400 w-5 h-5 flex-shrink-0 mt-1" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    <span className="text-cyan-400 font-black">TIP:</span> Ensure all Pivot Table filters are cleared before submission to pass AI validation.
                  </p>
               </div>

               <button onClick={() => setView('dashboard')} className="flex items-center gap-3 text-slate-700 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
                  <Icons.ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Mission Control
               </button>
            </div>

            <div className="lg:col-span-7">
               <div className="bg-[#0f172a]/50 border-2 border-dashed border-slate-800 p-16 rounded-[48px] text-center min-h-[400px] flex flex-col justify-center items-center">
                  {isUploading ? (
                    <div className="w-full space-y-8">
                      <div className="bg-black p-8 rounded-2xl text-left font-mono text-[10px] text-cyan-400 h-48 overflow-y-auto custom-scrollbar border border-cyan-900/30">
                        {verificationLog.map((log, i) => <div key={i} className="mb-2 leading-tight tracking-widest">{`[SECURE_SYNC] > ${log}`}</div>)}
                        <div className="animate-pulse">_</div>
                      </div>
                      <div className="h-2 bg-slate-900 w-full rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-[progress_1.5s_linear_infinite]" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mb-10">
                        <Icons.Upload className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">Ready for Extraction?</h3>
                      <p className="text-slate-600 text-[11px] mb-12 uppercase tracking-[0.1em] font-medium max-w-sm mx-auto">Select your updated .xlsx dossier for verification.</p>
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className={`px-16 py-6 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-2xl uppercase tracking-[0.2em] flex items-center gap-4 ${isOvertime ? 'bg-red-600 text-white' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}
                      >
                        UPLOAD EVIDENCE <Icons.Zap className="w-5 h-5 fill-current" />
                      </button>
                      
                      <p className="mt-10 text-[9px] font-mono uppercase text-slate-700 tracking-[0.5em]">SECURE ENCRYPTION CHANNEL OPEN</p>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPLETED VIEW */}
      {view === 'completed' && (
        <div className="max-w-3xl mx-auto text-center py-24">
          <Icons.Trophy className="w-24 h-24 text-cyan-400 mx-auto mb-10" />
          <h1 className="text-7xl font-black uppercase italic tracking-tighter mb-4 text-white leading-none">Vault Secured</h1>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.3em] mb-16">Data sync finalized for Team {teamName}</p>
          
          <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[40px] mb-12">
            {MISSIONS.map(m => (
              <div key={m.id} className="flex justify-between items-center py-6 border-b border-slate-800/50 last:border-0">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Mission 0{m.id}</span>
                <span className={`text-[10px] font-mono font-black ${completedMissions.includes(m.id) ? 'text-green-500' : 'text-red-500'}`}>
                  {completedMissions.includes(m.id) ? 'SECURED' : 'ABORTED'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-6 justify-center">
            <button onClick={() => setView('billboard')} className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-12 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl">Leaderboard</button>
            <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest transition-all">Exit Protocol</button>
          </div>
        </div>
      )}

      {/* 6. BILLBOARD VIEW */}
      {view === 'billboard' && (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-cyan-400 uppercase">Leaderboard</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em] mt-2">Active Feed: {TRAINING_CODE}</p>
            </div>
            <button onClick={() => setView('login')} className="bg-slate-900 px-10 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.3em] border border-slate-800">Back</button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {leaderboard.map((team, idx) => (
              <div key={team.name} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 flex items-center justify-between hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center gap-14">
                  <span className="text-5xl font-black text-cyan-500 w-20 font-mono italic opacity-30">#{idx + 1}</span>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tight mb-4 text-white">{team.name}</h3>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={`h-2.5 w-12 rounded-full ${j < team.missionsDone ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-mono font-black text-cyan-400">{team.totalPoints} <span className="text-sm">PTS</span></p>
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
