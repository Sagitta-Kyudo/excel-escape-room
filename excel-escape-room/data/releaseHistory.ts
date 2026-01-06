import { ReleaseNote } from '../types';

export const RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: "1.8.4",
    date: "2026-01-04 17:00",
    type: "Patch",
    changes: [
      "Icon Styling: Updated Admin Mode gear icon to use constant cyan/teal coloring (#33B8D9) for better visibility across all states.",
      "Hover Refinement: Implemented a brighter teal hover state for the gear icon while maintaining strict background consistency.",
      "Consistency Audit: Verified 'Back To App' navigation and state persistence across mission completions."
    ]
  },
  {
    version: "1.8.3",
    date: "2026-01-04 16:30",
    type: "Major",
    changes: [
      "Navigation Lockdown: Removed the back button from active missions to ensure session integrity during timed challenges.",
      "Branding Update: Mission Control cards now correctly label completed tasks as 'Evidence Submitted' for better clarity.",
      "M-05 Completion Flow: Final mission completion now automatically triggers navigation to the Leaderboard Feed.",
      "Layout Refinement: Repositioned Admin access icons and enforced strict single-line text rendering on control elements.",
      "Admin UX: Initializing new records with blank team fields to speed up manual entry workflows.",
      "Logic Validation: Verified score aggregation triggers to ensure manual point additions reflect immediately on the podium."
    ]
  },
  {
    version: "1.8.2",
    date: "2026-01-04 14:15",
    type: "Major",
    changes: [
      "Fixed Team Persistence: Header now dynamically reflects the authenticated team name instead of static labels.",
      "UI Refinement: Removed premature status text on mission cards; cards remain clean until briefed.",
      "Contextual Submissions: Conditional logic added to restrict 'Download Source Dossier' strictly to Mission 1.",
      "Navigation Protocol: Standardized Leaderboard exits to terminate session and route back to login.",
      "Iconography Restoration: Settings/Gear icon added back to the Leaderboard header for admin convenience.",
      "Clean UI: Removed legacy entry points from Mission Control to streamline the new operational flow."
    ]
  },
  {
    version: "1.8.1",
    date: "2026-01-04 12:30",
    type: "Major",
    changes: [
      "High Fidelity UX Overhaul: Reimplemented the Mission Control dashboard to strictly match the latest design briefs (Encrypted Data states).",
      "Briefing Restoration: Reintroduced the centered briefing modal as a mandatory gate before mission deployment.",
      "Extraction Zone Redesign: Refined the active mission UI with a multi-column layout featuring 'Mission Memo' and 'Tip' cards.",
      "Technical Metadata: Standardized mission parameters to 30:00 limit and 02:00 overtime as per operational guidelines.",
      "Advanced Aesthetics: Implemented high-contrast italic headers and refined glassmorphism effects for deeper immersion."
    ]
  },
  {
    version: "1.8.0",
    date: "2026-01-04 10:45",
    type: "Major",
    changes: [
      "Evidence Workflow Update: Implemented two-step 'Select' then 'Upload' logic for all mission submissions.",
      "Mission 1 Specialization: Added specific numeric inputs for Formula Count and Error Count (Audit specific).",
      "Strict Naming Convention: Automating file renaming to <team>_<mission_code>_<timestamp> format upon transmission.",
      "UI Fidelity Upgrade: Refined mission submission card with live file status and enhanced security audit logging.",
      "Sync Destination: Updated simulated backend to target designated SharePoint/OneDrive shared folder."
    ]
  },
  {
    version: "1.7.7",
    date: "2026-01-04 07:15",
    type: "Major",
    changes: [
      "Excel Hybrid Sync: Integrated SheetJS (xlsx) for real-time Excel workbook generation and parsing.",
      "Export Workflow: Admin can now download the entire Audit Vault as a professional .xlsx spreadsheet.",
      "Import Workflow: Admin can seed or reset the vault by uploading a correctly formatted Excel file.",
      "Persistence Bridge: All user submissions and admin bonus entries are unified in the Excel-ready data structures.",
      "UI Refinement: Added dedicated Excel spreadsheet icons and improved control panel layout for wider desktop screens."
    ]
  },
  {
    version: "1.7.6",
    date: "2026-01-04 06:12",
    type: "Major",
    changes: [
      "Audit Synchronization: Introduced 'Download missionData.ts' feature to permanently commit local vault changes to source baseline.",
      "Data Integrity: Synchronized initial missionData.ts with all teams observed in latest video audit (e.g., Cancan Team).",
      "Robust Persistence: Real-time submission logic now forces a cache refresh to prevent state drift between dashboard and leaderboard.",
      "UI Update: Standardized download icons and added reassuring prompts for hard-sync operations."
    ]
  },
  {
    version: "1.7.5",
    date: "2026-01-04 05:45",
    type: "Patch",
    changes: [
      "Dependency Cleanup: Removed 'xlsx' library from build manifest to reduce bundle size and optimize runtime performance.",
      "Data Refactoring: Eliminated obsolete EXCEL_DB_URL reference from core constants.",
      "Code Hygiene: Pruned unused imports and legacy data paths related to direct Excel workbook parsing."
    ]
  },
  {
    version: "1.7.4",
    date: "2026-01-04 03:23",
    type: "Patch",
    changes: [
      "Vite Build Fix: Resolved critical JSX character error (illegal '>' character) during production compilation.",
      "Admin Panel Stability: Enhanced Delete handler logic for immediate data vault synchronization.",
      "UI Refinement: Escaped special characters in Mission Control dashboard for strict browser compatibility.",
      "Release Logging: Standardized timestamp format as per requested audit guidelines."
    ]
  },
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