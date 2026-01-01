
export interface Mission {
  id: number;
  name: string;
  objective: string;
  duration: number;
  datasetUrl: string;
}

export interface LeaderboardEntry {
  name: string;
  missionsDone: number;
  totalPoints: number;
  lastTime: string;
}

export interface RawDataRow {
  training_code: string;
  team: string;
  mission_id: number;
  mission_name: string;
  points: number;
  time_taken: number;
  timestamp: string;
  file_name: string;
}

export type AppView = 'login' | 'dashboard' | 'briefing' | 'active' | 'completed' | 'billboard';

export enum MissionStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
