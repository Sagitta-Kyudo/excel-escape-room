
import { read, utils } from 'xlsx';
import { LeaderboardEntry, RawDataRow } from '../types';
import { TRAINING_CODE, UPLOAD_FOLDER_URL } from '../constants';

const EXCEL_FILE_URL = "https://agileterraforming-my.sharepoint.com/:x:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IQBN85_ozme9S5ExHT7Q4EReAfR5bpHPSG7BinO-KVmhvis?e=uiWwHr&download=1";
const STORAGE_KEY = 'excel_escape_rawdata_v1_3_0';

export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  let allRows: RawDataRow[] = [];
  try {
    const response = await fetch(EXCEL_FILE_URL);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const workbook = read(arrayBuffer);
      const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('raw')) || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json<any>(worksheet);
      allRows = jsonData.map(row => ({
        training_code: row['Training_Code'] || row['training_code'],
        team: row['Team'] || row['team'],
        mission_id: row['Mission'] ? parseInt(String(row['Mission']).replace('M0','')) : 0,
        mission_name: row['Mission'] || '',
        points: Number(row['Score'] || row['points']) || 0,
        time_taken: Number(row['Time_Taken'] || row['time_taken']) || 0,
        timestamp: row['Submission_DateTime'] || row['timestamp'] || '',
        file_name: 'synced_from_excel'
      }));
    } else { throw new Error("Fetch failed"); }
  } catch (error) {
    console.warn("Falling back to local simulation.", error);
    allRows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  const activeData = allRows.filter(row => row.training_code === TRAINING_CODE);
  const teamStats: Record<string, { missionsDone: number; totalPoints: number; totalTime: number }> = {};

  activeData.forEach(row => {
    const teamName = (row.team || "Unknown").trim();
    if (!teamStats[teamName]) teamStats[teamName] = { missionsDone: 0, totalPoints: 0, totalTime: 0 };
    teamStats[teamName].missionsDone += 1;
    teamStats[teamName].totalPoints += (row.points || 0);
    teamStats[teamName].totalTime += (row.time_taken || 0);
  });

  return Object.entries(teamStats)
    .map(([name, stats]) => ({
      name,
      missionsDone: stats.missionsDone,
      totalPoints: stats.totalPoints,
      lastTime: formatSecondsToMMSS(stats.totalTime)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
};

export const submitMissionEvidence = async (team: string, missionId: number, missionName: string, timeTaken: number, file: File): Promise<boolean> => {
  const now = new Date();
  const timestamp = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + "_" + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');
  const safeTeam = team.replace(/[^a-zA-Z0-9]/g, '_');
  const extension = file.name.split('.').pop() || 'xlsx';
  const finalFileName = `${safeTeam}_M0${missionId}_${timeTaken}s_${timestamp}.${extension}`;

  console.log(`[SHAREPOINT_UPLOAD_SIM] TARGET: ${UPLOAD_FOLDER_URL}`);
  console.log(`[FILE_CONVENTION] NAME: ${finalFileName}`);

  await new Promise(r => setTimeout(r, 2000));

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
