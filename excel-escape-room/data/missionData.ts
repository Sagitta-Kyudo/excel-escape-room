
import { RawDataRow } from '../types';
import { TRAINING_CODE } from '../constants';

/**
 * Local source of truth for mission records.
 * Matches the structure of the Excel raw data table.
 */
export const INITIAL_MISSION_DATA: RawDataRow[] = [
  {
    training_code: TRAINING_CODE,
    team: "Team Alpha",
    mission_id: 1,
    mission_name: "M01",
    action: "Bonus",
    points: 2,
    time_taken: 0,
    timestamp: "2024-05-31 08:55:00",
    file_name: "manual_bonus.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Team Alpha",
    mission_id: 1,
    mission_name: "M01",
    action: "Submission",
    points: 1,
    time_taken: 45,
    timestamp: "2024-05-31 09:00:00",
    file_name: "alpha_m01.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Team Alpha",
    mission_id: 2,
    mission_name: "M02",
    action: "Submission",
    points: 1,
    time_taken: 120,
    timestamp: "2024-05-31 09:15:00",
    file_name: "alpha_m02.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Team Alpha",
    mission_id: 3,
    mission_name: "M03",
    action: "Submission",
    points: 1,
    time_taken: 180,
    timestamp: "2024-05-31 09:30:00",
    file_name: "alpha_m03.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Team Alpha",
    mission_id: 4,
    mission_name: "M04",
    action: "Submission",
    points: 1,
    time_taken: 210,
    timestamp: "2024-05-31 10:00:00",
    file_name: "alpha_m04.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Cyber Sharks",
    mission_id: 1,
    mission_name: "M01",
    action: "Submission",
    points: 1,
    time_taken: 60,
    timestamp: "2024-05-31 09:05:00",
    file_name: "sharks_m01.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Cyber Sharks",
    mission_id: 2,
    mission_name: "M02",
    action: "Submission",
    points: 1,
    time_taken: 130,
    timestamp: "2024-05-31 09:20:00",
    file_name: "sharks_m02.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Cyber Sharks",
    mission_id: 3,
    mission_name: "M03",
    action: "Submission",
    points: 1,
    time_taken: 190,
    timestamp: "2024-05-31 09:45:00",
    file_name: "sharks_m03.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Data Wizards",
    mission_id: 1,
    mission_name: "M01",
    action: "Submission",
    points: 1,
    time_taken: 90,
    timestamp: "2024-05-31 09:10:00",
    file_name: "wizards_m01.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Data Wizards",
    mission_id: 2,
    mission_name: "M02",
    action: "Submission",
    points: 0.5,
    time_taken: 300,
    timestamp: "2024-05-31 09:40:00",
    file_name: "wizards_m02.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Excel Elites",
    mission_id: 1,
    mission_name: "M01",
    action: "Submission",
    points: 1,
    time_taken: 110,
    timestamp: "2024-05-31 09:12:00",
    file_name: "elites_m01.xlsx"
  },
  {
    training_code: TRAINING_CODE,
    team: "Audit Squad",
    mission_id: 1,
    mission_name: "M01",
    action: "Submission",
    points: 0.5,
    time_taken: 240,
    timestamp: "2024-05-31 09:14:00",
    file_name: "audit_m01.xlsx"
  }
];
