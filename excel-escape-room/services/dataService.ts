
import { LeaderboardEntry, RawDataRow } from '../types';
import { TRAINING_CODE, UPLOAD_FOLDER_URL, EXCEL_DB_URL } from '../constants';

// Persistent storage key for the virtual t_rawdata table
const STORAGE_KEY = 'excel_escape_rawdata_v1_2_0';

/**
 * High-Performance Leaderboard Retrieval
 * Filters simulated t_rawdata rows by TRAINING_CODE.
 */
export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  try {
    const rawData: RawDataRow[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Filter rows that belong to the active training code
    const activeData = rawData.filter(row => row.training_code === TRAINING_CODE);

    const teamStats: Record<string, { missionsDone: number; totalPoints: number; totalTime: number }> = {};

    activeData.forEach(row => {
      if (!teamStats[row.team]) {
        teamStats[row.team] = { missionsDone: 0, totalPoints: 0, totalTime: 0 };
      }
      teamStats[row.team].missionsDone += 1;
      teamStats[row.team].totalPoints += row.points;
      teamStats[row.team].totalTime += row.time_taken;
    });

    return Object.entries(teamStats)
      .map(([name, stats]) => ({
        name,
        missionsDone: stats.missionsDone,
        totalPoints: stats.totalPoints,
        lastTime: formatSecondsToMMSS(stats.totalTime)
      }))
      .sort((a, b) => {
        // Sort by Points (DESC), then Name (ASC)
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name);
      });
  } catch (e) {
    console.error("DB_ENGINE_ERROR: Record retrieval failed.", e);
    return [];
  }
};

/**
 * Secure Evidence Submission
 * Implements strict naming conversion and persistent row insertion.
 */
export const submitMissionEvidence = async (
  team: string, 
  missionId: number, 
  missionName: string,
  timeTaken: number, 
  file: File
): Promise<boolean> => {
  
  // 1. Mandatory File Naming Pattern: [Team]_[MissionID]_[Seconds]s_[Timestamp].[ext]
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
                  (now.getMonth() + 1).toString().padStart(2, '0') +
                  now.getDate().toString().padStart(2, '0') +
                  "_" +
                  now.getHours().toString().padStart(2, '0') +
                  now.getMinutes().toString().padStart(2, '0') +
                  now.getSeconds().toString().padStart(2, '0');
  
  const safeTeam = team.replace(/[^a-zA-Z0-9]/g, '_');
  const missionCode = `M0${missionId}`;
  const extension = file.name.split('.').pop() || 'dat';
  
  // Final formatted name: SuperTeam_M01_145s_20260115_143005.xlsx
  const finalFileName = `${safeTeam}_${missionCode}_${timeTaken}s_${timestamp}.${extension}`;

  console.log(`[FILE_CONVENTION] APPLIED: ${finalFileName}`);
  console.log(`[UPLOAD_TARGET] ${UPLOAD_FOLDER_URL}`);

  // 2. Simulated Latency (Protocol Handshake)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Update persistent t_rawdata simulation
  const newRow: RawDataRow = {
    training_code: TRAINING_CODE,
    team: team,
    mission_id: missionId,
    mission_name: missionName,
    points: 1, 
    time_taken: timeTaken,
    timestamp: timestamp,
    file_name: finalFileName
  };

  try {
    const existing: RawDataRow[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(newRow);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    
    console.log(`[DATABASE_SYNC] ROW_INSERT_SUCCESS at ${EXCEL_DB_URL}`);
    return true;
  } catch (e) {
    console.error("SYNC_ERROR: Persistence failed.", e);
    return false;
  }
};

const formatSecondsToMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
