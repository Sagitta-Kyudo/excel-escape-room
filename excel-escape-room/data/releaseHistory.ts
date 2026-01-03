
import { ReleaseNote } from '../types';

export const RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: "1.7.3",
    date: "2026-01-04 03:23",
    type: "Patch",
    changes: [
      "Stability Fix: Corrected delete icon logic in Admin Control Panel to ensure permanent record erasure via functional state updates.",
      "Persistence Bridge: Implemented immediate vault refresh after manual record deletion to synchronize Leaderboard states.",
      "Sync Feature: Added 'Export Source' capability in Admin Panel to generate TypeScript code for baseline file updates.",
      "Release Log: Standardized timestamp format for future audit trails as per requirements."
    ]
  },
  {
    version: "1.7.2",
    date: "2026-01-04",
    type: "Major",
    changes: [
      "Critical Fix: Resolved data initialization error in Mission Vault caused by syntax corruption.",
      "Admin Panel Refined: Removed redundant 'Actions' header column and streamlined inline editing workflow.",
      "Data Synchronization: Fixed the 'Save/Done' button behavior in Admin mode to ensure reactive leaderboard updates.",
      "Fidelity Check: Verified point summation logic correctly aggregates Submissions and Bonus awards.",
      "Visual Polish: Mini-bars now strictly reflect unique mission IDs from verified 'Submission' actions."
    ]
  },
  {
    version: "1.7.1",
    date: "2026-01-04",
    type: "Patch",
    changes: [
      "Refined Leaderboard Logic: Points are now the absolute sum of all records (Submissions + Bonuses), while mini-bars strictly represent unique Mission Submissions.",
      "Admin Panel Clean-up: Removed the dedicated 'ACTIONS' header column to match Excel layout; integrated edit/delete controls directly into the data rows.",
      "UI Fidelity: Fixed an issue where bonus points weren't correctly reflecting in the team's visual score readout.",
      "Version Audit: Incremented build to 1.7.1 with updated release history timestamps."
    ]
  },
  {
    version: "1.7.0",
    date: "2026-01-04",
    type: "Major",
    changes: [
      "Data Structure Expansion: Added 'Action' and 'Training_Code' columns to the core mission records to match the latest audit requirements.",
      "Refined Admin Panel: Introduced full-row inline editing with support for Action types (Submission, Bonus, Correct Answer).",
      "Timestamp Logic: Automatic generation of submission and manual entry timestamps for forensic audit trails.",
      "Leaderboard Logic Upgrade: Points are now aggregated across all actions, while 'Missions Done' strictly counts unique Submissions.",
      "Flexible Mission Entry: Admins can now manually define mission names (e.g., 'M01', 'M02') directly in the record vault."
    ]
  }
];
