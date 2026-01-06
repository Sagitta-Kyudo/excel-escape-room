import { RawDataRow } from '../types';
import { TRAINING_CODE } from '../constants';

/**
 * Local source of truth for mission records.
 * Synchronized with v1.7.6 Audit State.
 */
export const INITIAL_MISSION_DATA: RawDataRow[] = [
  {
    "training_code": TRAINING_CODE,
    "team": "Cancan Team",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 5,
    "time_taken": 45,
    "timestamp": "2026-01-04 03:10:00",
    "file_name": "cancan_m01.xlsx"
  },
  {
    "training_code": TRAINING_CODE,
    "team": "Team Alpha",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 6,
    "time_taken": 45,
    "timestamp": "2024-05-31 09:00:00",
    "file_name": "alpha_m01.xlsx"
  },
  {
    "training_code": TRAINING_CODE,
    "team": "Cyber Sharks",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 3,
    "time_taken": 60,
    "timestamp": "2024-05-31 09:05:00",
    "file_name": "sharks_m01.xlsx"
  },
  {
    "training_code": TRAINING_CODE,
    "team": "Data Wizards",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 1.5,
    "time_taken": 90,
    "timestamp": "2024-05-31 09:10:00",
    "file_name": "wizards_m01.xlsx"
  },
  {
    "training_code": TRAINING_CODE,
    "team": "Excel Elites",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 1,
    "time_taken": 110,
    "timestamp": "2024-05-31 09:12:00",
    "file_name": "elites_m01.xlsx"
  },
  {
    "training_code": TRAINING_CODE,
    "team": "Audit Squad",
    "mission_id": 1,
    "mission_name": "M01",
    "action": "Submission",
    "points": 0.5,
    "time_taken": 240,
    "timestamp": "2024-05-31 09:14:00",
    "file_name": "audit_m01.xlsx"
  }
];