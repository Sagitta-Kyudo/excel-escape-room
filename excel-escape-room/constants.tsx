
import React from 'react';
import { Mission } from './types';

export const TRAINING_CODE = "ExcelEscape_202601";
export const APP_VERSION = "1.1.0"; 

// Latest SharePoint Upload URL
export const UPLOAD_FOLDER_URL = "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgAIOQuwu-40Q5UOND7AFchEAaNfQoJGIvqjRD7jWPS7jMU?e=IEqkt6";
export const EXCEL_DB_URL = "https://agileterraforming-my.sharepoint.com/:x:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IQBN85_ozme9S5ExHT7Q4EReAfR5bpHPSG7BinO-KVmhvis?e=uiWwHr";

export const MISSIONS: Mission[] = [
  { 
    id: 1, 
    name: "Data Integrity Audit", 
    objective: "Identify and fix all data corruptions in the PO Log. Cross-reference with the Employee list to find unauthorized requestors (terminated staff).", 
    duration: 1800,
    datasetUrl: "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgC6vZYppH1-R5CviyeNET2TAYZpauJkhv8qBMOslKVHxB4?e=JSGsck" 
  },
  { 
    id: 2, 
    name: "Financial Enrichment", 
    objective: "Link the Approval Limits to the PO Log. Calculate and highlight all limit breaches where requestors exceeded their authorized spending levels.", 
    duration: 1800,
    datasetUrl: "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgAtS_0j905jS7IFiN7ME0GdAU2M8f1uE3sGw4GiC5upoj4?e=ZY7F64" 
  },
  { 
    id: 3, 
    name: "Leakage Analysis", 
    objective: "Generate a summary report highlighting the top 3 risky vendors based on rejection rates and total invoice volume.", 
    duration: 1800,
    datasetUrl: "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgBcfOpmq_FcR4xsF8E4AXKJAXAxkPNA8E4Ac-YDf2ENiuA?e=EnrJPY" 
  },
  { 
    id: 4, 
    name: "Control Tower", 
    objective: "Create a dynamic dashboard template with Slicers for Dept_Code and Vendor_Name to monitor spend versus budget real-time.", 
    duration: 1800,
    datasetUrl: "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgBt_-CSrLOjTKNIPCb05xVgAZedJ_Z_2EHB8yo7JCU7jaI?e=9O3Vvg" 
  },
  { 
    id: 5, 
    name: "Executive Briefing", 
    objective: "Prepare a 3-slide CEO presentation using AI to summarize findings and propose a system upgrade to prevent future leakage.", 
    duration: 1800,
    datasetUrl: "https://agileterraforming-my.sharepoint.com/:f:/g/personal/ecopoiesis_agileterraforming_onmicrosoft_com/IgBCCXHoVV5XSY6xc-VtLVirAWnhDiFqgiIpIUngOC7VhiQ?e=wwHOTM" 
  }
];

export const MISSION_OVERTIME = 120;
export const BRIEFING_DURATION = 300;

export const Icons = {
  Lock: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  CheckCircle: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
  Clock: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Upload: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Zap: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  ChevronRight: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ArrowLeft: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  User: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Terminal: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>,
  AlertTriangle: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  Trophy: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Download: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  XCircle: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>,
  Flag: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  Ban: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>,
  Play: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  // Added FileText icon for Mission Briefing UI
  FileText: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  // Added ShieldAlert icon for Mission Briefing UI
  ShieldAlert: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
};
