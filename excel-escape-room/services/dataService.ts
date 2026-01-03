
import { LeaderboardEntry, RawDataRow } from '../types';
import { TRAINING_CODE } from '../constants';
import { INITIAL_MISSION_DATA } from '../data/missionData';

const STORAGE_KEY = 'excel_escape_rawdata_v1_7_3';

// Initialize data if storage is empty
const initializeDataIfEmpty = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MISSION_DATA));
  }
};

export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  initializeDataIfEmpty();
  const allRows: RawDataRow[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const activeData = allRows.filter(row => row.training_code === TRAINING_CODE);
  
  const teamStats: Record<string, { missionsDone: Set<number>; totalPoints: number; totalTime: number }> = {};

  activeData.forEach(row => {
    const teamName = (row.team || "Unknown").trim();
    if (!teamStats[teamName]) teamStats[teamName] = { missionsDone: new Set(), totalPoints: 0, totalTime: 0 };
    
    // Only 'Submission' counts towards "Missions Completed" progress bars
    if (row.action === 'Submission') {
      teamStats[teamName].missionsDone.add(row.mission_id);
      teamStats[teamName].totalTime += (row.time_taken || 0);
    }
    
    // All actions (Submission, Bonus, Correct Answer) contribute to points
    teamStats[teamName].totalPoints += (row.points || 0);
  });

  return Object.entries(teamStats)
    .map(([name, stats]) => ({
      name,
      missionsDone: stats.missionsDone.size,
      totalPoints: stats.totalPoints,
      lastTime: formatSecondsToMMSS(stats.totalTime)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
};

export const getAllRawRecords = async (): Promise<RawDataRow[]> => {
  initializeDataIfEmpty();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const saveRawRecords = async (records: RawDataRow[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (e) {
    return false;
  }
};

export const resetAllData = async (): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MISSION_DATA));
    return true;
  } catch (e) {
    return false;
  }
};

export const submitMissionEvidence = async (team: string, missionId: number, missionName: string, timeTaken: number, file: File): Promise<boolean> => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const safeTeam = team.replace(/[^a-zA-Z0-9]/g, '_');
  const extension = file.name.split('.').pop() || 'xlsx';
  const finalFileName = `${safeTeam}_M0${missionId}_${timeTaken}s_${timestamp.replace(/[:\s-]/g, '')}.${extension}`;

  const newRow: RawDataRow = {
    training_code: TRAINING_CODE,
    team: team,
    mission_id: missionId,
    mission_name: missionName.startsWith('M') ? missionName : `M${missionId.toString().padStart(2, '0')}`,
    action: 'Submission',
    points: 1,
    time_taken: timeTaken,
    timestamp: timestamp,
    file_name: finalFileName
  };

  try {
    initializeDataIfEmpty();
    const existing: RawDataRow[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(newRow);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    return false;
  }
};

const formatSecondsToMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
