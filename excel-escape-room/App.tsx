
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  LeaderboardEntry,
  RawDataRow
} from './types';
import { 
  getLeaderboardData, 
  submitMissionEvidence, 
  getAllRawRecords, 
  saveRawRecords, 
  resetAllData 
} from './services/dataService';
import { RELEASE_HISTORY } from './data/releaseHistory';

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
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRecords, setAdminRecords] = useState<RawDataRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RawDataRow | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentFormattedTime = () => {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  };

  // Update leaderboard
  const refreshLeaderboard = useCallback(() => {
    getLeaderboardData().then(setLeaderboard);
  }, []);

  useEffect(() => {
    if (['billboard', 'completed', 'login', 'dashboard'].includes(view)) {
      refreshLeaderboard();
    }
  }, [view, completedMissions, failedMissions, refreshLeaderboard]);

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
      `ACTION: Auto-flagged as 'Submission'.`,
      `SYNC: Transmitting to Central Data Vault...`,
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

  // ADMIN ACTIONS
  const handleAdminAuth = () => {
    if (adminPassword === 'admin') {
      setIsAdminMode(true);
      setIsAdminAuthOpen(false);
      setAdminPassword('');
      refreshAdminData();
    } else {
      alert('ACCESS DENIED. INVALID CREDENTIALS.');
    }
  };

  const refreshAdminData = async () => {
    const records = await getAllRawRecords();
    setAdminRecords(records);
  };

  const handleAddRecord = () => {
    const newRecord: RawDataRow = {
      training_code: TRAINING_CODE,
      team: "TEAM ALPHA",
      mission_id: 1,
      mission_name: "M01",
      action: "Submission",
      points: 1,
      time_taken: 60,
      timestamp: getCurrentFormattedTime(),
      file_name: "manual_entry.xlsx"
    };
    setAdminRecords(prev => [newRecord, ...prev]);
    setEditingIndex(0);
    setEditForm(newRecord);
  };

  const handleEditRecord = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...adminRecords[index] });
  };

  const handleDeleteRecord = async (index: number) => {
    if (window.confirm('PERMANENTLY DELETE THIS RECORD FROM THE VAULT?')) {
      const updated = adminRecords.filter((_, i) => i !== index);
      const success = await saveRawRecords(updated);
      if (success) {
        setAdminRecords(updated);
        refreshLeaderboard();
      } else {
        alert("CRITICAL: FAILED TO UPDATE VAULT AFTER DELETION.");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editingIndex !== null && editForm) {
      const updated = [...adminRecords];
      
      // Auto-extract mission ID from name if needed
      const match = editForm.mission_name.match(/M(\d+)/i);
      const missionId = match ? parseInt(match[1]) : editForm.mission_id;
      
      const savedRecord: RawDataRow = { 
        ...editForm, 
        mission_id: missionId 
      };
      
      updated[editingIndex] = savedRecord;
      
      const success = await saveRawRecords(updated);
      if (success) {
        setAdminRecords(updated);
        setEditingIndex(null);
        setEditForm(null);
        refreshLeaderboard();
      } else {
        alert("CRITICAL: DATA VAULT WRITE FAILED.");
      }
    }
  };

  const handleExportCode = () => {
    const code = `import { RawDataRow } from '../types';\nimport { TRAINING_CODE } from '../constants';\n\nexport const INITIAL_MISSION_DATA: RawDataRow[] = ${JSON.stringify(adminRecords, null, 2).replace(new RegExp(`"${TRAINING_CODE}"`, 'g'), 'TRAINING_CODE')};`;
    navigator.clipboard.writeText(code).then(() => {
      alert("Source code for missionData.ts copied to clipboard! Update the baseline file to reflect changes permanently.");
    });
  };

  const handleResetSystem = async () => {
    if (window.confirm('WARNING: RESET ALL RECORDS TO BASELINE?')) {
      await resetAllData();
      refreshAdminData();
      refreshLeaderboard();
    }
  };

  const ProgressSegments = ({ count, total = 5 }: { count: number; total?: number }) => {
    return (
      <div className="flex gap-1.5 mt-4">
        {Array.from({ length: total }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1 w-6 rounded-full transition-colors ${i < count ? 'bg-cyan-400' : 'bg-slate-800'}`}
          />
        ))}
      </div>
    );
  };

  const mission = MISSIONS[currentMissionIdx];

  return (
    <div className="min-h-screen bg-[#020617] text-[#94a3b8] font-sans overflow-x-hidden relative flex flex-col">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* RELEASE NOTES MODAL */}
      {showReleaseNotes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-[#0f172a] border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="p-10 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/30">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Release History</h2>
                <p className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase mt-1">Audit Trail Active</p>
              </div>
              <button 
                onClick={() => setShowReleaseNotes(false)}
                className="p-3 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
              >
                <Icons.X className="w-6 h-6" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
              {RELEASE_HISTORY.map((note) => (
                <div key={note.version} className="relative pl-8 border-l border-slate-800">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xl font-black text-white font-mono">v{note.version}</span>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${note.type === 'Major' ? 'bg-red-500/10 text-red-400' : note.type === 'Minor' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      {note.type}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold uppercase ml-auto">{note.date}</span>
                  </div>
                  <ul className="space-y-3">
                    {note.changes.map((change, i) => (
                      <li key={i} className="text-sm text-slate-400 leading-relaxed flex gap-3">
                        <span className="text-cyan-600 font-black shrink-0">›</span> {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN AUTH MODAL */}
      {isAdminAuthOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="max-w-md w-full bg-[#0f172a] border border-slate-800 rounded-[32px] p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-white uppercase italic mb-6">ADMIN ACCESS</h2>
            <input 
              type="password" 
              placeholder="ENTER PASSCODE"
              className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white font-mono text-sm mb-6 outline-none focus:ring-1 focus:ring-cyan-500"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
            />
            <div className="flex gap-4">
              <button onClick={handleAdminAuth} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest">AUTHENTICATE</button>
              <button onClick={() => setIsAdminAuthOpen(false)} className="flex-1 bg-slate-800 text-slate-400 font-black py-4 rounded-xl text-xs uppercase tracking-widest">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PANEL VIEW */}
      {isAdminMode && (
        <div className="fixed inset-0 z-[120] bg-[#020617] p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            <header className="flex justify-between items-center mb-10 border-b border-slate-900 pb-8">
              <div>
                <h1 className="text-5xl font-black italic text-[#33B8D9] tracking-tighter uppercase leading-tight">Admin Control Panel</h1>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-2">v{APP_VERSION} / DATA_VAULT_ACTIVE</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handleAddRecord} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Icons.Plus className="w-4 h-4" /> ADD RECORD
                </button>
                <button onClick={handleExportCode} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Icons.Copy className="w-4 h-4" /> EXPORT SOURCE
                </button>
                <button onClick={handleResetSystem} className="bg-red-950/30 border border-red-900/50 text-red-500 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-900/40 transition-all">
                   RESET SYSTEM
                </button>
                <button onClick={() => setIsAdminMode(false)} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                  EXIT
                </button>
              </div>
            </header>

            <div className="bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 border-b border-slate-800">
                      <th className="p-5 uppercase tracking-widest">Timestamp</th>
                      <th className="p-5 uppercase tracking-widest">Training_Code</th>
                      <th className="p-5 uppercase tracking-widest">Team</th>
                      <th className="p-5 uppercase tracking-widest text-center">Mission</th>
                      <th className="p-5 uppercase tracking-widest text-center">Action</th>
                      <th className="p-5 uppercase tracking-widest text-center">Points</th>
                      <th className="p-5 uppercase tracking-widest text-center">Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminRecords.map((record, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => editingIndex === null && handleEditRecord(idx)}>
                        {editingIndex === idx ? (
                          <>
                            <td className="p-4"><input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded outline-none focus:border-cyan-500" value={editForm?.timestamp} onChange={e => setEditForm({...editForm!, timestamp: e.target.value})} onClick={e => e.stopPropagation()} /></td>
                            <td className="p-4"><input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded outline-none focus:border-cyan-500" value={editForm?.training_code} onChange={e => setEditForm({...editForm!, training_code: e.target.value})} onClick={e => e.stopPropagation()} /></td>
                            <td className="p-4"><input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded uppercase font-black outline-none focus:border-cyan-500" value={editForm?.team} onChange={e => setEditForm({...editForm!, team: e.target.value.toUpperCase()})} onClick={e => e.stopPropagation()} /></td>
                            <td className="p-4"><input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded text-center outline-none focus:border-cyan-500" value={editForm?.mission_name} onChange={e => setEditForm({...editForm!, mission_name: e.target.value})} placeholder="M01" onClick={e => e.stopPropagation()} /></td>
                            <td className="p-4" onClick={e => e.stopPropagation()}>
                              <select className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded text-center outline-none focus:border-cyan-500" value={editForm?.action} onChange={e => setEditForm({...editForm!, action: e.target.value})}>
                                <option value="Submission">Submission</option>
                                <option value="Bonus">Bonus</option>
                                <option value="Correct Answer">Correct Answer</option>
                              </select>
                            </td>
                            <td className="p-4"><input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded text-center outline-none focus:border-cyan-500" type="number" step="0.5" value={editForm?.points} onChange={e => setEditForm({...editForm!, points: parseFloat(e.target.value)})} onClick={e => e.stopPropagation()} /></td>
                            <td className="p-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input className="bg-slate-800 border border-slate-700 text-white w-full p-2 rounded text-center outline-none focus:border-cyan-500" type="number" disabled={editForm?.action !== 'Submission'} value={editForm?.time_taken} onChange={e => setEditForm({...editForm!, time_taken: parseInt(e.target.value)})} />
                              <div className="flex gap-1 ml-auto">
                                <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} title="Save Record" className="bg-green-600 hover:bg-green-500 p-2 rounded-lg text-white transition-all shadow-lg"><Icons.CheckCircle className="w-3 h-3" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingIndex(null); }} title="Cancel Changes" className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-white transition-all"><Icons.X className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 text-slate-500">{record.timestamp}</td>
                            <td className="p-4 text-slate-600 font-bold">{record.training_code}</td>
                            <td className="p-4 text-white font-black uppercase tracking-tight">{record.team}</td>
                            <td className="p-4 text-center text-cyan-400 font-bold">{record.mission_name}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${record.action === 'Submission' ? 'bg-cyan-900/30 text-cyan-400' : record.action === 'Bonus' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                                {record.action}
                              </span>
                            </td>
                            <td className="p-4 text-center text-white font-bold">{record.points}</td>
                            <td className="p-4 text-center text-slate-500 font-mono relative pr-16">
                              {record.action === 'Submission' ? record.time_taken : '-'}
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button onClick={(e) => { e.stopPropagation(); handleEditRecord(idx); }} title="Edit Record" className="text-slate-500 hover:text-white transition-colors p-1"><Icons.Edit className="w-5 h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(idx); }} title="Delete Record" className="text-red-900 hover:text-red-500 transition-colors p-1"><Icons.Trash className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-12">
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="max-w-md w-full bg-[#0f172a]/90 border border-slate-800 rounded-[48px] p-12 shadow-2xl relative">
              <button 
                onClick={() => setView('billboard')}
                className="absolute -top-3 -right-3 bg-[#42A5C5] text-slate-950 px-6 py-2 rounded-full text-[10px] font-black tracking-widest shadow-xl hover:bg-[#5bc0e0] transition-colors"
              >
                LEADERBOARD
              </button>

              <div className="text-center mb-10">
                <Icons.Terminal className="text-cyan-400 w-16 h-16 mx-auto mb-6" />
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">EXCEL ESCAPE</h1>
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

            <div className="mt-12 opacity-20 hover:opacity-50 transition-opacity cursor-pointer" onClick={() => setShowReleaseNotes(true)}>
              <p className="text-[9px] font-mono tracking-[0.3em] font-black uppercase flex items-center gap-2">
                SECURE BUILD {APP_VERSION} <Icons.ShieldAlert className="w-3 h-3" />
              </p>
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
              <div className="text-right flex flex-col items-end">
                <button 
                  onClick={() => setShowReleaseNotes(true)}
                  className="text-slate-500 hover:text-cyan-400 font-mono text-[9px] uppercase tracking-widest mb-1 flex items-center gap-2 transition-colors font-bold"
                >
                  <Icons.History className="w-3 h-3" /> v{APP_VERSION}
                </button>
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

                let cardClasses = "relative p-10 rounded-[40px] border-2 transition-all duration-500 min-h-[300px] flex flex-col group ";
                
                if (isLocked) cardClasses += "border-slate-900/40 bg-[#020617] opacity-60 cursor-not-allowed";
                else if (isComp) cardClasses += "border-green-500/30 bg-green-950/5";
                else if (isFail) cardClasses += "border-slate-900 bg-slate-900/20";
                else cardClasses += "border-cyan-500/60 bg-[#0f172a]/40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.15)]";

                return (
                  <div 
                    key={m.id} 
                    className={cardClasses} 
                    onClick={() => !isLocked && !isFail && !isComp && (isStarted ? setView('active') : startBriefing(idx))}
                  >
                    <div className="flex justify-between items-start mb-6 w-full">
                      <div className={`p-4 rounded-2xl flex items-center justify-center ${isComp ? 'bg-green-500/10 text-green-500' : (isFail || isLocked) ? 'bg-slate-900/50 text-slate-800' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {isComp ? <Icons.CheckCircle className="w-8 h-8" /> : isFail ? <Icons.XCircle className="w-8 h-8" /> : isLocked ? <Icons.Lock className="w-8 h-8 opacity-40" /> : <Icons.Unlock className="w-8 h-8" />}
                      </div>
                      <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">M0{m.id}</span>
                    </div>
                    
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
                              <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">EVIDENCE UPLOADED</p>
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">TIME TAKEN: {formatTime(missionTimes[m.id])}</p>
                            </div>
                          ) : isFail ? (
                            <div className="space-y-2 mt-auto">
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Icons.Ban className="w-3 h-3" /> MISSION FAILED</p>
                              <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest font-bold font-mono">Time: {formatTime(missionTimes[m.id])}</p>
                            </div>
                          ) : isStarted ? (
                            <div className="space-y-4 mt-auto">
                              <p className="text-yellow-600 text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em]"><Icons.Clock className="w-3 h-3" /> PENDING EVIDENCE</p>
                              <p className="text-cyan-400 text-[10px] font-black uppercase flex items-center gap-2 group-hover:translate-x-1 transition-transform tracking-widest">OPEN DOSSIER <Icons.ChevronRight className="w-4 h-4" /></p>
                            </div>
                          ) : (
                            <div className="mt-auto">
                               <p className="text-cyan-400 text-[10px] font-black uppercase flex items-center gap-2 group-hover:translate-x-1 transition-transform tracking-widest">OPEN DOSSIER <Icons.ChevronRight className="w-4 h-4" /></p>
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
            {showBriefingTimeout && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#0f172a] border-4 border-red-600/50 rounded-[40px] p-12 text-center shadow-[0_0_80px_rgba(220,38,38,0.3)] animate-in fade-in zoom-in duration-300">
                  <div className="bg-red-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Icons.AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">TIMEOUT!</h2>
                  <p className="text-slate-400 text-sm mb-12 uppercase tracking-widest font-bold leading-relaxed">Mandatory deployment initiated.</p>
                  <button onClick={initiateMission} className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl">START MISSION NOW</button>
                </div>
              </div>
            )}
            <div className="bg-[#0f172a] border border-slate-800 p-16 rounded-[40px] w-full shadow-2xl relative overflow-hidden">
              <header className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-cyan-500 font-mono text-[11px] uppercase tracking-[0.4em] mb-4 font-bold font-mono">MISSION BRIEFING: {mission.id}</p>
                  <h1 className="text-5xl font-black text-white uppercase tracking-tighter">{mission.name}</h1>
                </div>
                <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-3xl min-w-[120px] text-center shadow-inner font-mono">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TIMER</p>
                  <p className={`text-4xl font-black ${briefingTime < 60 ? 'text-red-500' : 'text-white'}`}>{formatTime(briefingTime)}</p>
                </div>
              </header>
              <div className="bg-[#020617] p-10 rounded-3xl border border-slate-800/50 mb-12 font-mono">
                 <p className="text-xl italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
              </div>
              <div className="flex flex-col gap-6">
                <button onClick={initiateMission} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl uppercase tracking-[0.2em] text-sm"><Icons.Play className="w-5 h-5 fill-current" /> START MISSION</button>
                <button onClick={() => setView('dashboard')} className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors font-mono">RE-CHECK HQ DATA</button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE MISSION VIEW */}
        {view === 'active' && (
          <div className="max-w-7xl mx-auto">
            <button onClick={() => setView('dashboard')} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group"><Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Mission Control</button>
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
                 <div className="bg-[#0f172a] p-10 rounded-[32px] border border-slate-800/50 shadow-xl relative overflow-hidden font-mono">
                    <p className="text-lg italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
                    <div className="mt-8 pt-8 border-t border-slate-800/50"><a href={mission.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em]"><Icons.Download className="w-4 h-4" /> Download Dataset</a></div>
                 </div>
                 <button onClick={() => {if(window.confirm('ABORT MISSION?')) handleMissionFailure();}} className="flex items-center gap-2 text-slate-800 hover:text-red-800 transition-colors text-[9px] font-black uppercase tracking-widest"><Icons.Flag className="w-3 h-3" /> ABORT MISSION (FAIL)</button>
              </div>
              <div className="lg:col-span-7">
                 <div className="bg-[#0f172a]/30 border-2 border-dashed border-slate-800 p-16 rounded-[48px] text-center min-h-[460px] flex flex-col justify-center items-center relative">
                    {isUploading ? (
                      <div className="w-full space-y-8 px-8">
                        <div className="bg-black p-10 rounded-[32px] text-left font-mono text-[10px] text-cyan-400 h-56 overflow-y-auto custom-scrollbar border border-cyan-900/30">
                          {verificationLog.map((log, i) => <div key={i} className="mb-2 leading-tight tracking-widest">{`[SECURE_SYNC] > ${log}`}</div>)}
                        </div>
                        <div className="h-1 bg-slate-900 w-full rounded-full overflow-hidden"><div className="h-full bg-cyan-500 animate-[progress_1.5s_linear_infinite]" /></div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-4xl font-black text-white mb-3 uppercase tracking-tighter">SUBMIT DOSSIER</h3>
                        <button onClick={() => fileInputRef.current?.click()} className={`px-20 py-7 rounded-2xl font-black text-sm uppercase flex items-center gap-4 transition-all active:scale-[0.98] shadow-2xl tracking-[0.2em] ${isOvertime ? 'bg-red-600 text-white' : 'bg-[#33B8D9] text-slate-950 hover:bg-[#4ed0f0]'}`}>UPLOAD DATASET <Icons.Zap className="w-5 h-5 fill-current" /></button>
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
            <h1 className="text-7xl font-black uppercase italic tracking-tighter mb-4 text-white">Vault Secured</h1>
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mb-16 font-bold leading-relaxed font-mono">MISSION SUCCESSFUL.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => setView('billboard')} className="bg-[#42A5C5] hover:bg-[#5bc0e0] text-slate-950 px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl">Leaderboard</button>
              <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs">Exit Protocol</button>
            </div>
          </div>
        )}

        {/* BILLBOARD VIEW (Podium) */}
        {view === 'billboard' && (
          <div className="max-w-6xl mx-auto min-h-screen pb-20 relative">
            <button 
              onClick={() => setIsAdminAuthOpen(true)}
              className="absolute top-0 right-0 p-4 text-slate-500 hover:text-[#33B8D9] transition-all duration-300 z-[50]"
              title="Admin Mode"
            >
              <Icons.Settings className="w-6 h-6" />
            </button>

            <header className="flex justify-between items-start mb-16">
              <div>
                <h1 className="text-[120px] font-black italic tracking-tighter text-[#33B8D9] uppercase leading-none select-none">LEADERBOARD</h1>
                <p className="text-[14px] font-mono font-black text-slate-600 uppercase tracking-[0.5em] mt-2">MISSION CONTROL FEED</p>
              </div>
              <button 
                onClick={() => setView(teamName ? 'dashboard' : 'login')} 
                className="bg-[#1e293b] hover:bg-slate-800 text-slate-500 hover:text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-slate-800 mt-6"
              >
                BACK TO APP
              </button>
            </header>
            
            <div className="flex flex-col md:flex-row justify-center items-end gap-10 mb-24 px-10 font-mono">
              {leaderboard[1] && (
                <div className="bg-[#0f172a] border border-slate-800/50 w-full md:w-64 h-80 rounded-[48px] flex flex-col items-center justify-center p-8 shadow-2xl relative order-2 md:order-1 hover:-translate-y-2 transition-transform duration-500">
                  <div className="text-5xl font-black text-slate-800 mb-2">02</div>
                  <Icons.Trophy className="w-12 h-12 text-slate-400 mb-6" />
                  <h3 className="text-xl font-black text-white text-center uppercase tracking-tighter truncate w-full mb-2">{leaderboard[1].name}</h3>
                  <div className="flex items-baseline gap-2"><span className="text-3xl font-black text-cyan-400">{leaderboard[1].totalPoints}</span><span className="text-[10px] font-black text-slate-600 uppercase">pts</span></div>
                  <ProgressSegments count={leaderboard[1].missionsDone} />
                </div>
              )}
              {leaderboard[0] && (
                <div className="relative bg-[#0f172a] border-2 border-cyan-500/50 w-full md:w-80 h-[440px] rounded-[60px] flex flex-col items-center justify-center p-10 shadow-[0_0_80px_rgba(6,182,212,0.15)] order-1 md:order-2 z-10 hover:-translate-y-4 transition-transform duration-500">
                  <div className="text-7xl font-black text-cyan-500/10 mb-2">01</div>
                  <Icons.Trophy className="w-24 h-24 text-yellow-500 mb-8 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
                  <h3 className="text-3xl font-black text-white text-center leading-none mb-4 uppercase tracking-tighter truncate w-full">{leaderboard[0].name}</h3>
                  <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-cyan-400">{leaderboard[0].totalPoints}</span><span className="text-xs font-black text-slate-600 uppercase">pts</span></div>
                  <ProgressSegments count={leaderboard[0].missionsDone} />
                </div>
              )}
              {leaderboard[2] && (
                <div className="bg-[#0f172a] border border-slate-800/50 w-full md:w-64 h-72 rounded-[48px] flex flex-col items-center justify-center p-8 shadow-2xl order-3 hover:-translate-y-1 transition-transform duration-500">
                  <div className="text-4xl font-black text-slate-800 mb-2">03</div>
                  <Icons.Trophy className="w-10 h-10 text-amber-700 mb-6" />
                  <h3 className="text-lg font-black text-white text-center uppercase tracking-tighter truncate w-full mb-2">{leaderboard[2].name}</h3>
                  <div className="flex items-baseline gap-2"><span className="text-2xl font-black text-cyan-400">{leaderboard[2].totalPoints}</span><span className="text-[9px] font-black text-slate-600 uppercase">pts</span></div>
                  <ProgressSegments count={leaderboard[2].missionsDone} />
                </div>
              )}
            </div>

            <div className="space-y-4 max-w-4xl mx-auto px-6 font-mono">
              {leaderboard.slice(3).map((team, idx) => (
                <div key={team.name} className="bg-slate-900/40 border border-slate-800/30 rounded-3xl p-8 flex items-center justify-between hover:bg-slate-800/60 transition-all group shadow-sm">
                   <div className="flex items-center gap-12">
                     <span className="text-sm font-black text-slate-700 w-10 italic">#{idx + 4}</span>
                     <div>
                        <h4 className="text-xl font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">{team.name}</h4>
                        <ProgressSegments count={team.missionsDone} />
                     </div>
                   </div>
                   <div className="text-right"><span className="text-cyan-400 font-black text-2xl">{team.totalPoints} <span className="text-[10px] text-slate-600 uppercase ml-1">pts</span></span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
