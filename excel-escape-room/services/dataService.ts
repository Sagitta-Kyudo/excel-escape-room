import { read, utils } from 'xlsx';
import { LeaderboardEntry, RawDataRow } from '../types';
import { TRAINING_CODE } from '../constants';

// The SharePoint/OneDrive Direct Download Link 
// (Note: Standard share links often return HTML, not the file itself. 
// You may need a direct download URL or a proxy for production).
const EXCEL_FILE_URL = "https://agileterraforming-my.sharepoint.com/:x:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IQBN85_ozme9S5ExHT7Q4EReAfR5bpHPSG7BinO-KVmhvis?e=uiWwHr&download=1";

const STORAGE_KEY = 'excel_escape_rawdata_v1_2_0';

export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  let allRows: RawDataRow[] = [];

  try {
    // 1. Attempt to fetch real Excel file
    console.log("Fetching live leaderboard from Excel...");
    const response = await fetch(EXCEL_FILE_URL);
    
    if (!response.ok) throw new Error("Network response was not ok");
    
    const arrayBuffer = await response.arrayBuffer();
    
    // 2. Parse Excel Data
    const workbook = read(arrayBuffer);
    
    // Assume data is in the first sheet or a sheet named "t_rawdata"
    const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('raw')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json<any>(worksheet);
    
    // Map Excel columns to our RawDataRow type (handling varying column names if necessary)
    allRows = jsonData.map(row => ({
      training_code: row['Training_Code'] || row['training_code'],
      team: row['Team'] || row['team'],
      mission_id: row['Mission'] ? parseInt(row['Mission'].replace('M0','')) : 0,
      mission_name: row['Mission'] || '',
      points: Number(row['Score']) || 0,
      time_taken: Number(row['Time_Taken']) || 0,
      timestamp: row['Submission_DateTime'] || '',
      file_name: 'synced_from_excel'
    }));

  } catch (error) {
    console.warn("Live Excel fetch failed (likely CORS or Auth). Falling back to local simulation.", error);
    // Fallback to LocalStorage if Excel fetch fails
    allRows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  // 3. Process Data (Filter & Aggregate)
  const activeData = allRows.filter(row => row.training_code === TRAINING_CODE);
  
  const teamStats: Record<string, { missionsDone: number; totalPoints: number; totalTime: number }> = {};

  activeData.forEach(row => {
    // Normalize team name to avoid "Team Alpha" vs "Team  Alpha" issues
    const teamName = row.team ? row.team.trim() : "Unknown";
    
    if (!teamStats[teamName]) {
      teamStats[teamName] = { missionsDone: 0, totalPoints: 0, totalTime: 0 };
    }
    teamStats[teamName].missionsDone += 1;
    teamStats[teamName].totalPoints += row.points;
    teamStats[teamName].totalTime += row.time_taken;
  });

  // 4. Sort and Return
  return Object.entries(teamStats)
    .map(([name, stats]) => ({
      name,
      missionsDone: stats.missionsDone,
      totalPoints: stats.totalPoints,
      lastTime: formatSecondsToMMSS(stats.totalTime)
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name);
    });
};

/**
 * Helper: Format Seconds
 */
const formatSecondsToMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Keep your existing submitMissionEvidence logic exactly as is!
 * (I have omitted it here for brevity, but don't delete it from your file)
 */
export const submitMissionEvidence = async (team: string, missionId: number, missionName: string, timeTaken: number, file: File): Promise<boolean> => {
    // ... Copy your existing submit logic here ...
    // Since we can't write to the real Excel file from browser without an API backend,
    // we keep writing to LocalStorage so the user sees their own progress immediately.
    
    // 1. Mandatory File Naming Pattern...
    // [Paste your original submitMissionEvidence code here]
    
    // This ensures the user feels the app is working even if the Excel read is read-only.
    return true; 
};
