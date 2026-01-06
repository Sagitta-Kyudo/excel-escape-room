import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  MISSIONS, 
  MISSION_OVERTIME, 
  BRIEFING_DURATION,
  Icons, 
  TRAINING_CODE,
  APP_VERSION,
  UPLOAD_FOLDER_URL
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
  
  // Mission 1 Specific Inputs
  const [formulaCount, setFormulaCount] = useState<string>('');
  const [errorCount, setErrorCount] = useState<string>('');

  // Evidence Submission Workflow
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
  const excelImportRef = useRef<HTMLInputElement>(null);

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
    setSelectedFile(null);
    
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

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEvidenceUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const mission = MISSIONS[currentMissionIdx];
    const elapsed = Math.floor((Date.now() - (missionStartTime || Date.now())) / 1000);
    
    const now = new Date();
    const ts = now.getFullYear().toString() + 
               (now.getMonth() + 1).toString().padStart(2, '0') + 
               now.getDate().toString().padStart(2, '0') + 
               now.getHours().toString().padStart(2, '0') + 
               now.getMinutes().toString().padStart(2, '0') + 
               now.getSeconds().toString().padStart(2, '0');

    const missionCode = `M${mission.id.toString().padStart(2, '0')}`;
    const extension = selectedFile.name.split('.').pop() || 'xlsx';
    const finalName = `${teamName.replace(/\s+/g, '_')}_${missionCode}_${ts}.${extension}`;

    setVerificationLog([
      `File Selected: ${selectedFile.name}`,
      mission.id === 1 ? `Input Data: ${formulaCount} Formulas, ${errorCount} Errors` : `Validating payload...`,
      `Renaming to: ${finalName}`,
      `Target: Shared Folder (ExcelEscape_202601)`,
      `Establishing Secure handshake...`,
      `Upload Signal Verified.`,
      `ACCESS GRANTED.`
    ]);

    const success = await submitMissionEvidence(
      teamName, 
      mission.id, 
      mission.name, 
      elapsed, 
      selectedFile,
      mission.id === 1 ? parseInt(formulaCount) : undefined,
      mission.id === 1 ? parseInt(errorCount) : undefined
    );
    
    if (success) {
      setTimeout(() => {
        setIsUploading(false);
        setIsOvertime(false);
        setCompletedMissions(prev => [...prev, mission.id]);
        setMissionTimes(prev => ({...prev, [mission.id]: elapsed}));
        setSelectedFile(null);
        setFormulaCount('');
        setErrorCount('');
        if (fileInputRef.current) fileInputRef.current.value = "";

        if (currentMissionIdx < MISSIONS.length - 1) {
          setCurrentMissionIdx(prev => prev + 1);
          setView('dashboard');
        } else {
          // Final mission complete - redirect to Leaderboard
          setView('billboard');
        }
      }, 2500);
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
      setSelectedFile(null);
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
      team: "", // Default to blank for admin convenience
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

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(adminRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AuditVault");
    XLSX.writeFile(workbook, `ExcelEscape_Vault_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);
      
      const valid = json.length > 0 && json[0].training_code !== undefined;
      if (valid) {
        if (window.confirm(`Found ${json.length} records. Overwrite current local vault?`)) {
          const success = await saveRawRecords(json as RawDataRow[]);
          if (success) {
            setAdminRecords(json as RawDataRow[]);
            refreshLeaderboard();
            alert("Local Vault Seeded from Excel Successfully.");
          }
        }
      } else {
        alert("Error: Invalid Excel structure. Use an exported file as a template.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelImportRef.current) excelImportRef.current.value = "";
  };

  const handleDownloadMissionData = () => {
    const code = `import { RawDataRow } from '../types';\nimport { TRAINING_CODE } from '../constants';\n\nexport const INITIAL_MISSION_DATA: RawDataRow[] = ${JSON.stringify(adminRecords, null, 2).replace(new RegExp(`"${TRAINING_CODE}"`, 'g'), 'TRAINING_CODE')};`;
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missionData.ts';
    a.click();
    URL.revokeObjectURL(url);
    alert("New baseline generated. Replace 'src/data/missionData.ts' with this file to save changes permanently.");
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
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelection} />
      <input type="file" ref={excelImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportExcel} />

      {/* RELEASE NOTES MODAL */}
      {showReleaseNotes && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
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

      {/* ADMIN PANEL VIEW */}
      {isAdminMode && (
        <div className="fixed inset-0 z-[200] bg-[#020617] p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 border-b border-slate-900 pb-8 gap-6">
              <div>
                <h1 className="text-5xl font-black italic text-[#33B8D9] tracking-tighter uppercase leading-tight">Admin Control Panel</h1>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-2">v{APP_VERSION} / EXCEL_HYBRID_SYNC_READY</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg">
                  <Icons.FileSpreadsheet className="w-4 h-4" /> EXPORT EXCEL
                </button>
                <button onClick={() => excelImportRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Icons.Upload className="w-4 h-4" /> IMPORT EXCEL
                </button>
                <button onClick={handleAddRecord} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Icons.Plus className="w-4 h-4" /> ADD RECORD
                </button>
                <button onClick={handleDownloadMissionData} className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Icons.Download className="w-4 h-4" /> BUILD SOURCE
                </button>
                <button onClick={handleResetSystem} className="bg-red-950/30 border border-red-900/50 text-red-500 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-900/40 transition-all">
                   RESET
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

      {/* ADMIN AUTH MODAL */}
      {isAdminAuthOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
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
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">EXCEL ESCAPE ROOM</h1>
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

        {/* DASHBOARD VIEW (MISSION CONTROL) */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <header className="mb-12 flex justify-between items-end border-b border-slate-900/50 pb-8">
              <div>
                <p className="text-[#33B8D9] font-mono text-[10px] tracking-[0.3em] mb-2 uppercase font-bold">SYSTEMS ONLINE // {teamName.toUpperCase() || 'AGENT'}</p>
                <h1 className="text-6xl font-black tracking-tighter uppercase text-white leading-none">Mission Control</h1>
              </div>
              <div className="text-right">
                <p className="text-slate-600 font-mono text-[9px] uppercase tracking-widest mb-1">ENCRYPTION LEVEL</p>
                <p className="text-white font-black uppercase text-xs tracking-widest">AES-256 SECURE</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {MISSIONS.map((m, idx) => {
                const isComp = completedMissions.includes(m.id);
                const isFail = failedMissions.includes(m.id);
                const isLocked = idx > progressIdx;

                return (
                  <div 
                    key={m.id} 
                    className={`relative p-8 rounded-[32px] border-2 transition-all duration-300 min-h-[260px] flex flex-col group ${isLocked ? 'border-slate-900 bg-[#020617] opacity-60' : isComp ? 'border-green-500/30 bg-green-950/5' : 'border-[#33B8D9]/40 bg-[#0f172a]/40 shadow-xl'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl flex items-center justify-center ${isLocked ? 'bg-slate-900 text-slate-800' : 'bg-[#33B8D9]/10 text-[#33B8D9]'}`}>
                        {isComp ? <Icons.CheckCircle className="w-8 h-8" /> : isLocked ? <Icons.Lock className="w-8 h-8" /> : <Icons.Unlock className="w-8 h-8" />}
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest">M-0{m.id}</span>
                    </div>

                    <div className="flex-1">
                      <h3 className={`text-2xl font-black mb-1 tracking-tight ${isLocked ? 'text-slate-700' : 'text-white'}`}>
                        {isLocked ? "ENCRYPTED DATA" : m.name}
                      </h3>
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${isLocked ? 'text-slate-800' : isComp ? 'text-green-500' : 'text-slate-500'}`}>
                        {isLocked ? "Access Denied" : isComp ? "Evidence Submitted" : isFail ? "Failed" : ""}
                      </p>
                    </div>

                    {!isLocked && !isComp && !isFail && (
                      <button 
                        onClick={() => startBriefing(idx)}
                        className="mt-6 text-[#33B8D9] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                      >
                        OPEN DOSSIER <Icons.ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BRIEFING VIEW */}
        {view === 'briefing' && (
          <div className="fixed inset-0 z-[150] bg-[#020617] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0f172a] border border-slate-800 p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                <header className="mb-10">
                  <p className="text-[#33B8D9] font-mono text-[11px] uppercase tracking-[0.4em] mb-3 font-black">MISSION BRIEFING: {mission.id}</p>
                  <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-tight">{mission.name}</h1>
                </header>

                <div className="bg-[#020617] p-10 rounded-[32px] border border-slate-800/50 mb-10 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <Icons.FileText className="text-[#33B8D9] w-5 h-5" />
                    <p className="text-[#33B8D9] text-[10px] font-black uppercase tracking-widest">PRIMARY OBJECTIVE</p>
                  </div>
                  <p className="text-2xl italic text-slate-300 leading-relaxed font-light">"{mission.objective}"</p>
                </div>

                <div className="flex items-center gap-8 mb-12 text-slate-600 font-mono text-[10px] font-black tracking-widest uppercase">
                  <div className="flex items-center gap-2">
                    <Icons.Clock className="w-4 h-4" /> 30:00 LIMIT
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.ShieldAlert className="w-4 h-4" /> 02:00 OVERTIME GRACE
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.3em] border border-slate-800 transition-all"
                  >
                    BACK
                  </button>
                  <button 
                    onClick={initiateMission}
                    className="flex-[3] bg-[#33B8D9] hover:bg-[#4ed0f0] text-slate-950 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl transition-all"
                  >
                    <Icons.Play className="w-5 h-5 fill-current" /> INITIATE MISSION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE MISSION VIEW */}
        {view === 'active' && (
          <div className="max-w-7xl mx-auto flex flex-col min-h-[80vh]">
            <header className="flex justify-between items-start mb-16 border-b border-slate-900 pb-10">
              <div className="space-y-4">
                {/* Back link removed to prevent timer bypass */}
                <div className="h-6"></div> 
                <div>
                  <p className="text-[#33B8D9] font-mono text-[10px] uppercase tracking-[0.4em] mb-1 font-black">CURRENT OBJECTIVE</p>
                  <h1 className="text-5xl font-black text-white uppercase tracking-tighter">M-0{mission.id}: {mission.name}</h1>
                </div>
              </div>

              <div className={`p-8 rounded-[32px] border-2 min-w-[200px] transition-all duration-500 shadow-2xl ${isOvertime ? 'bg-red-950/30 border-red-600 animate-pulse' : 'bg-slate-900/50 border-[#33B8D9]/20'}`}>
                <p className="text-[9px] font-mono uppercase text-center mb-1 text-slate-600 font-black tracking-widest">MISSION CLOCK</p>
                <p className={`text-6xl font-mono font-black text-center ${isOvertime ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] shadow-xl">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-6">MISSION MEMO</p>
                  <p className="text-lg italic text-slate-400 leading-relaxed font-light">"{mission.objective}"</p>
                </div>

                <div className="bg-[#33B8D9]/5 border border-[#33B8D9]/20 p-6 rounded-[24px] flex items-start gap-4">
                  <Icons.Sparkles className="w-5 h-5 text-[#33B8D9] shrink-0 mt-1" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-[#33B8D9] font-black uppercase tracking-widest mr-2">TIP:</span>
                    Ensure all Pivot Table filters are cleared before submission to pass AI validation.
                  </p>
                </div>
                
                {mission.id === 1 && (
                  <a 
                    href={mission.datasetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900/50 border border-slate-800 p-6 rounded-[24px] flex items-center justify-between group hover:bg-slate-800/80 transition-all"
                  >
                    <span className="text-[10px] font-black text-slate-500 group-hover:text-[#33B8D9] uppercase tracking-widest transition-colors">Download Source Dossier</span>
                    <Icons.Download className="w-5 h-5 text-slate-700 group-hover:text-[#33B8D9] transition-colors" />
                  </a>
                )}
              </div>

              <div className="lg:col-span-8">
                <div className="bg-[#0f172a]/50 border-2 border-dashed border-slate-800 p-12 rounded-[48px] min-h-[500px] flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden backdrop-blur-sm">
                  {isUploading ? (
                    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-black/90 p-8 rounded-[24px] text-left font-mono text-[10px] text-[#33B8D9] h-64 overflow-y-auto custom-scrollbar border border-[#33B8D9]/20 mb-8 shadow-2xl">
                          {verificationLog.map((log, i) => <div key={i} className="mb-2 leading-tight tracking-widest font-bold">{`[SYSTEM_SECURE] &gt; ${log}`}</div>)}
                        </div>
                        <div className="h-1.5 bg-slate-900 w-full rounded-full overflow-hidden">
                          <div className="h-full bg-[#33B8D9] animate-[progress_2s_linear_infinite]" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-[#33B8D9] tracking-[0.5em] text-center mt-4 animate-pulse">Secure Encryption Channel Open</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-8 bg-slate-900/50 rounded-full mb-8 text-slate-700">
                        <Icons.Upload className="w-16 h-16" />
                      </div>
                      
                      <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter italic">Ready for Extraction?</h3>
                      <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-12 font-bold">Select your updated .xlsx dossier for verification.</p>

                      {/* MISSION 1 ONLY FIELDS */}
                      {mission.id === 1 && (
                        <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-10">
                          <div className="space-y-2 text-left">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest pl-2">FORMULA COUNT</label>
                            <input 
                              type="number" 
                              value={formulaCount}
                              onChange={(e) => setFormulaCount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white text-center text-sm font-bold focus:border-[#33B8D9]/50 outline-none transition-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2 text-left">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest pl-2">ERROR COUNT</label>
                            <input 
                              type="number" 
                              value={errorCount}
                              onChange={(e) => setErrorCount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white text-center text-sm font-bold focus:border-[#33B8D9]/50 outline-none transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}

                      {selectedFile && (
                        <div className="mb-10 px-8 py-5 bg-[#33B8D9]/5 border border-[#33B8D9]/20 rounded-3xl flex items-center gap-4 w-full max-w-md animate-in slide-in-from-top-2 duration-300">
                           <Icons.FileSpreadsheet className="w-7 h-7 text-[#33B8D9]" />
                           <div className="text-left overflow-hidden flex-1">
                              <p className="text-[11px] font-black text-white uppercase tracking-widest truncate">{selectedFile.name}</p>
                              <p className="text-[8px] text-slate-600 uppercase font-bold">READY TO TRANSMIT</p>
                           </div>
                           <button onClick={() => setSelectedFile(null)} className="text-slate-700 hover:text-red-500 transition-colors p-2">
                             <Icons.X className="w-5 h-5" />
                           </button>
                        </div>
                      )}

                      <div className="w-full max-w-sm">
                        {!selectedFile ? (
                          <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="w-full py-7 rounded-2xl font-black text-[12px] uppercase flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl tracking-[0.3em] bg-[#1e293b] text-[#33B8D9] border border-slate-800 hover:bg-slate-800"
                          >
                            SELECT EVIDENCE <Icons.ChevronRight className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            onClick={handleEvidenceUpload} 
                            className="w-full py-7 rounded-2xl font-black text-[12px] uppercase flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(51,184,217,0.3)] tracking-[0.3em] bg-[#33B8D9] text-slate-950 hover:bg-[#4ed0f0]"
                          >
                            UPLOAD EVIDENCE <Icons.Zap className="w-5 h-5 fill-current" />
                          </button>
                        )}
                      </div>
                      
                      <p className="mt-8 text-[8px] font-mono font-black text-slate-800 uppercase tracking-[0.5em]">SECURE ENCRYPTION CHANNEL OPEN</p>
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
              <button onClick={() => setView('billboard')} className="bg-[#42A5C5] hover:bg-[#5bc0e0] text-slate-950 px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl">Leaderboard Feed</button>
              <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs">Exit Protocol</button>
            </div>
          </div>
        )}

        {/* BILLBOARD VIEW (Leaderboard) */}
        {view === 'billboard' && (
          <div className="max-w-6xl mx-auto min-h-screen pb-20 relative">
            <header className="flex justify-between items-start mb-16">
              <div>
                <h1 className="text-[120px] font-black italic tracking-tighter text-[#33B8D9] uppercase leading-none select-none">LEADERBOARD</h1>
                <p className="text-[14px] font-mono font-black text-slate-800 uppercase tracking-[0.5em] mt-2">MISSION CONTROL FEED</p>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button 
                  onClick={() => setView('login')} 
                  className="bg-[#1e293b] hover:bg-slate-800 text-slate-500 hover:text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-slate-800 whitespace-nowrap"
                >
                  BACK TO APP
                </button>
                <button 
                  onClick={() => setIsAdminAuthOpen(true)}
                  className="p-3 text-[#33B8D9] hover:text-[#4ed0f0] transition-all duration-300 bg-[#1e293b] border border-slate-800 rounded-full"
                  title="Admin Mode"
                >
                  <Icons.Settings className="w-6 h-6" />
                </button>
              </div>
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
                        <h4 className="text-xl font-black text-slate-500 group-hover:text-white transition-colors uppercase tracking-tight">{team.name}</h4>
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