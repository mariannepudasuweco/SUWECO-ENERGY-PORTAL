import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Download, Save, MousePointer2, Trash2, Loader2, ClipboardList, Users, Clock, Calendar, Flag, ArrowRight } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useWbsData } from '../hooks/useWbsData';

// --- Types ---
type Arrow = {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: 'black' | 'red';
  thickness: 'thin' | 'medium' | 'thick';
  isDashed: boolean;
  hasArrowhead: boolean;
};

type NodeData = {
  id: string;
  title: string;
  colorCode: string;
  t1: string;
  t2: string;
  s1: string;
  s2: string;
  stat: string;
  reqs?: string;
  totalReqs?: number;
  totalAcq?: number;
};

type PhaseDuration = {
  targetNum: string;
  targetUnit: string;
  actualNum: string;
  actualUnit: string;
};

const getPhaseStatusColor = (nodes: NodeData[]) => {
  if (!nodes || nodes.length === 0) return '#64748b';
  const allCompleted = nodes.every(n => n.stat === 'COMPLETED');
  if (allCompleted) return '#4C9A74';
  const anyDelayed = nodes.some(n => n.stat === 'DELAYED');
  if (anyDelayed) return '#C86969';
  const anyOngoing = nodes.some(n => n.stat === 'ONGOING');
  if (anyOngoing) return '#4A7CA8';
  return '#64748b'; // Not Started default
};

const getPhaseStatusText = (nodes: NodeData[]) => {
  if (!nodes || nodes.length === 0) return 'NOT YET STARTED';
  const allCompleted = nodes.every(n => n.stat === 'COMPLETED');
  if (allCompleted) return 'COMPLETED';
  const anyDelayed = nodes.some(n => n.stat === 'DELAYED');
  if (anyDelayed) return 'DELAYED';
  const anyOngoing = nodes.some(n => n.stat === 'ONGOING');
  if (anyOngoing) return 'ONGOING';
  return 'NOT YET STARTED';
};

// --- Initial Data ---
const nodesData: Record<string, NodeData[]> = {
  'COMPETITIVE SELECTION PROCESS': [
    { id: 'n1', title: 'COMPETITIVE SELECTION PROCESS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' }
  ],
  'PRE-DEVELOPMENT PHASE 1': [
    { id: 'n2', title: 'DENR - ONLINE REGISTRATION', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'PCO Accreditation' },
    { id: 'n3', title: 'LOT ACQUISITION', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Letter of Intent<br/>Plant Layout<br/>Public Hearing' },
    { id: 'n4', title: 'TECHNICAL STUDIES', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Barangay Resolution (Adjacent Barangay If applicable)<br/>SB Session<br/>Public Hearing<br/>Taxing Ordinance' },
    { id: 'n5', title: 'ENGINEERING DESIGNS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Letter of Intent<br/>Barangay Resolution (Adjacent Barangay If applicable)<br/>SB Session<br/>Public Hearing<br/>Taxing Ordinance' },
    { id: 'n6', title: 'WATER CONNECTION', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Application Form<br/>Sketch location of Proposed Service' },
    { id: 'n7', title: 'BANK FINANCING', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
    { id: 'n8', title: 'TIELCO - TEMPORARY ELECTRICAL PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Application Form<br/>Electrical Drawings (Signed by PEE)<br/>Site Inspection by Tielco' }
  ],
  'PRE-DEVELOPMENT PHASE 2': [
    { id: 'n9', title: 'BRGY. RESOLUTION', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 22, totalAcq: 0, reqs: 'Letter of Intent<br/>Plant Layout<br/>Public Hearing' },
    { id: 'n10', title: 'SB RESOLUTION NO OBJECTION', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 18, totalAcq: 0, reqs: 'Letter of Intent<br/>Barangay Resolution (Adjacent Barangay if applicable)<br/>SB Session<br/>Public Hearing<br/>Zoning Ordinance' },
    { id: 'n12', title: 'SB RESOLUTION RECLASSIFICATION', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 19, totalAcq: 0, reqs: 'Letter of Intent<br/>Barangay Resolution (Adjacent Barangay if applicable)<br/>SB Session<br/>Public Hearing<br/>Zoning Ordinance' },
    { id: 'n14', title: 'BARANGAY CERTIFICATE', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 1, totalAcq: 0, reqs: '*A Barangay certificate confirming no coconut trees are present is required if none (0) exist.' },
    { id: 'o2_2', title: 'PHILIPPINE COCONUT AUTHORITY (PCA) - PERMIT TO CUT COCONUT TREE', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Certificate of Marking<br/>Barangay Certificate<br/>Tax Declaration<br/>PCA Inspection<br/>Barangay Certificate' },
    { id: 'o2_3', title: 'DOLE - CONSTRUCTION SAFETY AND HEALTH PROGRAM', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Letter of Intent<br/>SO Certificate<br/>First Aider Certificate' },
    { id: 'n14_dar', title: 'DAR CERTIFICATION', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 6, totalAcq: 0, reqs: 'Letter of Intent<br/>Lot Documents(Lot Title, DOAS, Tax Dec, MOA)<br/>Site Inspection' }
  ]
};

const offsets1: NodeData[] = [
  { id: 'o1_1', title: 'MPDC - ZONING CERTIFICATE', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 12, totalAcq: 0, reqs: 'SB Resolution for Reclassification<br/>SB Resolution of No Objection<br/>Vicinity Map<br/>Site Development Plan<br/>Plant Layout<br/>Project Profile<br/>Lot Documents ( Lot Title, DOAS, Tax Dec MOA)' },
  { id: 'n11', title: 'NCIP - CERTIFICATE OF NON-OVERLAP', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 21, totalAcq: 0, reqs: 'Letter of Request addressed to the EPIMB Director<br/>Company Profile<br/>Project Background<br/>Vicinity Map<br/>Project Fact Sheet' },
  { id: 'n13', title: 'MPDC - LOCATIONAL CLEARANCE', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 13, totalAcq: 0, reqs: 'Location or Vicinity Map<br/>Land Development Plan<br/>Certified photocopy of TCT<br/>Memorandum of Agreement<br/>SB Resolution of No Objection<br/>SB Resolution for Reclassification' },
  { id: 'n15', title: 'BFP - FIRE SAFETY EVALUATION CLEARANCE FOR BUILDING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 8, totalAcq: 0, reqs: 'Application Form<br/>Engineering Design (Architectural, Electrical and Mechanical Drawings)<br/>Bill of Materials' }
];

const offsets2: NodeData[] = [
  { id: 'o2_1', title: 'DENR - ECC / CNC', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 22, totalAcq: 0, reqs: 'Project Description<br/>Environmental Management Plan<br/>Certification from LGU (Zoning Certificate)<br/>PCO Accreditation<br/>Lot Documents(Lot Title, DOAS, Tax Dec, MOA)<br/>PEMAPS<br/>Initial Environmental Examination (IEE) Checklist Report<br/>Project components and operation information<br/>Compliance for ECC (60) days upon receipt<br/>Tree Planting<br/>DENR-Geo Hazard Investigation Report<br/>SMR/CMR' },
  { id: 'o1_2', title: "MAYOR'S PERMIT FOR BUILDING PERMIT", colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 8, totalAcq: 0 },
  { id: 'o1_3', title: 'OBO - BUILDING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 9, totalAcq: 0, reqs: "Application form<br/>Engineering plans<br/>Bill of materials<br/>Barangay Resolution<br/>Locational Clearance from MPDC<br/>Mayor's Permit" },
  { id: 'o1_4', title: 'OBO - EXCAVATION AND GROUND PREPARATION PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Excavation Permit Form<br/>Excavation plans<br/>Locational Clearance from MPDC' },
  { id: 'n16', title: 'OBO - FENCING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Fencing Permit Form<br/>Bill of materials for fence<br/>Fencing permit plan<br/>Locational Clearance from MPDC' }
];

const preDevPhase3: NodeData[] = [
  { id: 'n17', title: 'NWRB - WATER PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Location Plan<br/>DENR - (ECC)<br/>Lot Documents (Lot Title, DOAS, Tax Dec- MOA)<br/>Permit to Drill<br/>Conditional Water Permit' },
  { id: 'n18', title: 'PROJECT AGREEMENTS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'EPC Agreement (Onshore/Offshore)<br/>Offtake Agreement<br/>Operations and Maintenance Agreement<br/>Coordination Agreement' }
];

const developmentPhase: NodeData[] = [
  { id: 'n19', title: 'PROCUREMENT AND CONSTRUCTION', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Revolving Fund<br/>Procurement (Subcon-Manila)<br/>Other Expenses<br/>Weekly Reports<br/>Manpower and Equipment Records<br/>Material Inventory<br/>Budget Monitoring<br/>Progress Photos<br/>DOLE(Safety)<br/>Meetings and Coordination<br/>PCA (Permit to Cut Coconut Tree)<br/>NCIP-CNO' },
  { id: 'n20', title: 'DOE - COC / COE', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'DENR (ECC)<br/>NWRB Water Permit<br/>Final Certificate of Approval to Connect (FP/PTC)<br/>Permit to Operate (PTO)<br/>General Utility Capability Test (GUCT)<br/>Business Permit' },
  { id: 'n21', title: 'MUNICIPAL HEALTH OFFICE - SANITARY CERTIFICATE FOR DISCHARGE PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Site inspection' },
  { id: 'n22', title: 'MPDC - LOCATIONAL CLEARANCE FOR OCCUPANCY PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Designs (As-built plans)' },
  { id: 'n23', title: 'BFP - FIRE SAFETY INSPECTION CLEARANCE FOR OCCUPANCY PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Designs (As-built plans)' },
  { id: 'n24', title: "MAYOR'S PERMIT FOR OCCUPANCY PERMIT", colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Designs (As-built plans)<br/>Locational Clearance' },
  { id: 'n24_1', title: "BFP - FIRE SAFETY INSPECTION CLEARANCE FOR BUSINESS PERMIT", colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Electrical plans' },
  { id: 'n24_2', title: "BARANGAY CLEARANCE FOR BUSINESS PERMIT", colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
  { id: 'n24_3', title: "MUNICIPAL HEALTH OFFICE - SANITARY FOR BUSINESS PERMIT", colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
  { id: 'n24_4', title: "BFP - FIRE SAFETY CLEARANCE FOR ELECTRICAL CONNECTION", colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' }
];

const offsets3: NodeData[] = [
  { id: 'o3_1', title: 'ERC - PAO / COC PRE-FILING APPLICATION', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Proof of Application for ERC - P2P<br/>Proof of Application for TAC<br/>NWRB - Water Permit<br/>NCIP - CNO<br/>COC Form No. 1<br/>COC Form No. 4<br/>Engineering Designs (SLD, Connection Point)<br/>DENR - ECC<br/>DENR - PTO (Genset & Fuel Tanks)<br/>DENR - Discharge Permit<br/>DENR - Hazardous Waste<br/>Business Permit (Principal Office & Generation Facility)' },
  { id: 'o3_2', title: 'DOE - COE TO ERC', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Nameplate Photo<br/>Mapping Requirements<br/>Target COD<br/>Proof of Financial Closing' },
  { id: 'o3_3', title: 'ERC - PRE-FILLING APPLICATION (PSA APPROVAL)', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'DENR - ECC<br/>DOE - COE<br/>Engineering Designs<br/>Proof of Project Cost' },
  { id: 'o3_4', title: 'DENR - DISCHARGE PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'DENR - ECC<br/>Engineering Designs<br/>Photo of oil-water separator<br/>Accredited PCO<br/>Lab Analysis Certificate' },
  { id: 'o3_5', title: 'DENR - PTO', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'DENR - ECC<br/>Engineering Designs<br/>Genset Nameplates<br/>Fuel Tank Nameplates<br/>Photo of MRP<br/>Composting pit<br/>Accredited PCO' },
  { id: 'o3_6', title: 'DOLE - PTO', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Designs and Analysis<br/>Technical Safety Inspection' },
  { id: 'o3_7', title: 'DENR - HAZARDOUS WASTE', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'DENR - ECC<br/>Accredited PCO' },
  { id: 'o3_8', title: 'OBO - OCCUPANCY PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: "Engineering Designs (As-built plans)<br/>MPDC - Locational Clearance<br/>LGU - Fire Safety Inspection Clearance<br/>Mayor's Permit" },
  { id: 'o3_9', title: 'BPLO - BUSINESS PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Barangay Clearance<br/>Sanitary Permit (w/ Site Inspection)<br/>LGU - Building Permit<br/>Fire Safety Inspection Certificate<br/>LGU - Occupancy Permit' },
  { id: 'o3_10', title: 'TIELCO - PERMANENT ELECTRICAL PERMIT', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' }
];

const postDevPhase: NodeData[] = [
  { id: 'n25', title: 'ERC - PAO / COC POST-TEST & COMMISSIONING', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Updated COC Form No. 1 - w/ Generating unit technical information<br/>Updated COC Form No. 2<br/>Updated COC Form No. 4 - w/ Genset, alternator & engine nameplates<br/>FCATC<br/>GUCT Results & Certificates<br/>WESM Registration<br/>ERC - P2P Application<br/>DOE - COE<br/>DENR - ECC<br/>DENR - PTO (Gensets & Fuel Tanks)<br/>DENR - Discharge Permit<br/>Business Permit (Generation Facility in location)<br/>ERC Inspection' },
  { id: 'n26', title: 'TURNOVER', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
  { id: 'n27', title: 'COMMERCIAL OPERATIONS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'ERC - PAEC / COE (Post-Test & Commissioning)<br/>DENR - PTO (Permit to Operate)<br/>DOLE - PTO (Permit to Operate)<br/>LGU - Business Permit<br/>LGU - Occupancy Permit<br/>NWRB - Water Permit<br/>Permanent ELectrical Permit<br/>ERC - Certificate of Compliance (COC)<br/>Post-Test & Commissioning Activities<br/>As-Built Plans<br/>Turnover Activities' },
  { id: 'n28', title: 'PROJECT MILESTONE', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
  { id: 'n29', title: 'CLOSING REPORTS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' }
];

const offsets4: NodeData[] = [
  { id: 'o4_testing', title: 'TESTING AND COMMISSIONING', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
  { id: 'o4_ercp2p', title: 'ERC - P2P', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Design & Studies (SIS, FS, SLD, Code, Other Drawings)<br/>DENR - ECC<br/>DOE - COE<br/>DOE - COC' }
];


// --- Component ---
export default function WbsSequenceView({ previewMode = false, projectName, selectedPhase = 'All' }: { previewMode?: boolean, projectName?: string, selectedPhase?: string }) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [globalShortenedView, setGlobalShortenedView] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  
  // Project Description
  const [projectDescription, setProjectDescription] = useState("THIS PROJECT WILL ESTABLISH A DIESEL POWER PLANT IN ROMBLON TO DELIVER ELECTRICITY FOR TABLAS ISLAND UNDER TIELCO. IT AIMS TO MITIGATE POTENTIAL POWER SHORTAGES BY PROVIDING EXTRA SUPPLY DURING PEAK DEMAND AND TO SUSTAIN THE ISLAND'S INCREASING ENERGY NEEDS.");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(projectDescription);

  // Project Title
  const [projectTitle, setProjectTitle] = useState(projectName || 'TABLAS ISLAND 13.7M DIESEL POWERPLANT PROJECT');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);

  useEffect(() => {
     if (!projectName) {
         const pId = (window as any).selectedProjectId;
         if (pId && (window as any).projects) {
             const p = (window as any).projects.find((proj: any) => proj.id === pId);
             if (p && p.title) {
                 setProjectTitle(p.title);
                 setTempTitle(p.title);
             }
         }
     } else {
         setProjectTitle(projectName);
         setTempTitle(projectName);
     }
  }, [projectName]);

  
  // Toolbar state
  const [editArrowColor, setEditArrowColor] = useState<'black' | 'red'>('black');
  const [editArrowDash, setEditArrowDash] = useState<boolean>(true);
  const [editArrowHead, setEditArrowHead] = useState<boolean>(true);
  const [editArrowThickness, setEditArrowThickness] = useState<'thin' | 'medium' | 'thick'>('medium');
  const [creationMode, setCreationMode] = useState(false);

  // Dragging state
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'start' | 'end' | 'body' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Persistence ---
  const [localNodesData, setLocalNodesData] = useState<Record<string, NodeData[]>>(nodesData);
  const [localOffsets1, setLocalOffsets1] = useState<NodeData[]>(offsets1);
  const [localOffsets2, setLocalOffsets2] = useState<NodeData[]>(offsets2);
  const [localPreDevPhase3, setLocalPreDevPhase3] = useState<NodeData[]>(preDevPhase3);
  const [localDevelopmentPhase, setLocalDevelopmentPhase] = useState<NodeData[]>(developmentPhase);
  const [localOffsets3, setLocalOffsets3] = useState<NodeData[]>(offsets3);
  const [localPostDevPhase, setLocalPostDevPhase] = useState<NodeData[]>(postDevPhase);
  const [localOffsets4, setLocalOffsets4] = useState<NodeData[]>(offsets4);
  const [phaseDurations, setPhaseDurations] = useState<Record<string, PhaseDuration>>({});

  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [toggledReqs, setToggledReqs] = useState<Record<string, boolean[]>>({});

  const toggleReq = (nodeId: string, idx: number) => {
    setToggledReqs(prev => {
      const nodeToggles = [...(prev[nodeId] || [])];
      nodeToggles[idx] = !nodeToggles[idx];
      return { ...prev, [nodeId]: nodeToggles };
    });
  };

  const updateNode = (updated: NodeData) => {
    const updateList = (list: NodeData[]) => list.map(n => n.id === updated.id ? updated : n);
    setLocalNodesData(prev => {
        const next = { ...prev };
        for (const k in next) next[k] = updateList(next[k]);
        return next;
    });
    setLocalOffsets1(prev => updateList(prev));
    setLocalOffsets2(prev => updateList(prev));
    setLocalPreDevPhase3(prev => updateList(prev));
    setLocalDevelopmentPhase(prev => updateList(prev));
    setLocalOffsets3(prev => updateList(prev));
    setLocalPostDevPhase(prev => updateList(prev));
    setLocalOffsets4(prev => updateList(prev));
  };

  const { data: globalWbsData, getPhasesSummary } = useWbsData();
  
  // Use state or effect to sync local state if needed, or simply map it directly
  useEffect(() => {
    // We update local states using hook data
    if (globalWbsData.localNodesData) setLocalNodesData(globalWbsData.localNodesData);
    if (globalWbsData.localOffsets1) setLocalOffsets1(globalWbsData.localOffsets1);
    if (globalWbsData.localOffsets2) setLocalOffsets2(globalWbsData.localOffsets2);
    if (globalWbsData.localPreDevPhase3) setLocalPreDevPhase3(globalWbsData.localPreDevPhase3);
    if (globalWbsData.localDevelopmentPhase) setLocalDevelopmentPhase(globalWbsData.localDevelopmentPhase);
    if (globalWbsData.localOffsets3) setLocalOffsets3(globalWbsData.localOffsets3);
    if (globalWbsData.localPostDevPhase) setLocalPostDevPhase(globalWbsData.localPostDevPhase);
    if (globalWbsData.localOffsets4) setLocalOffsets4(globalWbsData.localOffsets4);
    if (globalWbsData.phaseDurations) setPhaseDurations(globalWbsData.phaseDurations);
  }, [globalWbsData]);

  useEffect(() => {
  const normalizeText = (value: any) =>
    String(value || "")
      .toLowerCase()
      .replace(/pre-dev/g, "pre development")
      .replace(/pre-development/g, "pre development")
      .replace(/post-dev/g, "post development")
      .replace(/post-development/g, "post development")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeChecklistStatus = (row: any) => {
    const rawStatus = String(row?.status || "").trim().toLowerCase();

    if (
      row?.checked === true ||
      rawStatus.includes("completed") ||
      rawStatus.includes("done")
    ) {
      return "COMPLETED";
    }

    if (rawStatus.includes("ongoing") || rawStatus.includes("progress")) {
      return "ONGOING";
    }

    if (rawStatus.includes("delay") || rawStatus.includes("overdue")) {
      return "DELAYED";
    }

    if (rawStatus.includes("not applicable") || rawStatus.includes("n/a")) {
      return "NOT APPLICABLE";
    }

    return "NOT YET STARTED";
  };

  const getGroupStatus = (rows: any[]) => {
    if (!rows.length) return null;

    const statuses = rows.map(normalizeChecklistStatus);

    if (statuses.every((status) => status === "COMPLETED")) {
      return "COMPLETED";
    }

    if (statuses.some((status) => status === "DELAYED")) {
      return "DELAYED";
    }

    if (statuses.some((status) => status === "ONGOING")) {
      return "ONGOING";
    }

    if (statuses.some((status) => status === "COMPLETED")) {
      return "ONGOING";
    }

    return "NOT YET STARTED";
  };

  const syncFromChecklist = async () => {
    const supabase = (window as any).supabase;
    const projectId =
      (window as any).currentProjectId || (window as any).selectedProjectId;

    if (!supabase || !projectId) {
      console.warn("[WBS Sequence] Missing project or Supabase.");
      return;
    }

    const { data, error } = await supabase
      .from("wbs_checklist_items")
      .select("*")
      .eq("project_id", String(projectId));

    if (error) {
      console.error("[WBS Sequence] Failed to sync checklist:", error);
      return;
    }

    const rows = data || [];

    console.log("[WBS Sequence] Checklist rows loaded:", rows.length, rows);

    const findDirectMatch = (node: NodeData) => {
      const nodeTitle = normalizeText(node.title);
      const nodeId = normalizeText(node.id);

      return rows.find((row: any) => {
        const rowItem = normalizeText(row.item);
        const rowCode = normalizeText(row.task_code || row.item_no);
        const rowOriginalId = normalizeText(row.original_item_id);
        const rowSection = normalizeText(row.section);
        const rowSubsection = normalizeText(row.subsection);

        return (
          rowItem === nodeTitle ||
          rowItem.includes(nodeTitle) ||
          nodeTitle.includes(rowItem) ||
          rowCode === nodeId ||
          rowOriginalId === nodeId ||
          rowSection === nodeTitle ||
          rowSubsection === nodeTitle ||
          rowSection.includes(nodeTitle) ||
          rowSubsection.includes(nodeTitle)
        );
      });
    };

    const getRowsByPhase = (phaseName: string) => {
      const phase = normalizeText(phaseName);

      return rows.filter((row: any) => {
        const requirement = normalizeText(row.requirement);
        const section = normalizeText(row.section);
        const subsection = normalizeText(row.subsection);

        return (
          requirement === phase ||
          requirement.includes(phase) ||
          phase.includes(requirement) ||
          section === phase ||
          subsection === phase
        );
      });
    };

    const getDateRange = (matchedRows: any[]) => {
      const starts = matchedRows
        .map((row) => row.date_started)
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()));

      const ends = matchedRows
        .map((row) => row.due_date)
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()));

      const minStart =
        starts.length > 0
          ? new Date(Math.min(...starts.map((date) => date.getTime())))
          : null;

      const maxEnd =
        ends.length > 0
          ? new Date(Math.max(...ends.map((date) => date.getTime())))
          : null;

      return {
        start: minStart ? minStart.toISOString().split("T")[0] : "-",
        end: maxEnd ? maxEnd.toISOString().split("T")[0] : "-",
      };
    };

    const updateList = (list: NodeData[], phaseName: string) => {
      const phaseRows = getRowsByPhase(phaseName);
      const phaseStatus = getGroupStatus(phaseRows);
      const phaseDates = getDateRange(phaseRows);

      return (list || []).map((node) => {
        const directMatch = findDirectMatch(node);

        if (directMatch) {
          return {
            ...node,
            stat: normalizeChecklistStatus(directMatch),
            t1: directMatch.date_started || node.t1 || "-",
            t2: directMatch.due_date || node.t2 || "-",
            s1: directMatch.date_started || node.s1 || "-",
            s2: directMatch.due_date || node.s2 || "-",
          };
        }

        if (phaseStatus) {
          return {
            ...node,
            stat: phaseStatus,
            t1: phaseDates.start !== "-" ? phaseDates.start : node.t1,
            t2: phaseDates.end !== "-" ? phaseDates.end : node.t2,
            s1: phaseDates.start !== "-" ? phaseDates.start : node.s1,
            s2: phaseDates.end !== "-" ? phaseDates.end : node.s2,
          };
        }

        return node;
      });
    };

    setLocalNodesData((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((phaseName) => {
        next[phaseName] = updateList(next[phaseName], phaseName);
      });

      return next;
    });

    setLocalOffsets1((prev) => updateList(prev, "PRE-DEVELOPMENT PHASE 2"));
    setLocalOffsets2((prev) => updateList(prev, "PRE-DEVELOPMENT PHASE 2"));
    setLocalPreDevPhase3((prev) =>
      updateList(prev, "PRE-DEVELOPMENT PHASE 3")
    );
    setLocalDevelopmentPhase((prev) =>
      updateList(prev, "DEVELOPMENT PHASE")
    );
    setLocalOffsets3((prev) => updateList(prev, "DEVELOPMENT PHASE"));
    setLocalPostDevPhase((prev) =>
      updateList(prev, "POST-DEVELOPMENT PHASE")
    );
    setLocalOffsets4((prev) =>
      updateList(prev, "POST-DEVELOPMENT PHASE")
    );
  };

  syncFromChecklist();

  window.addEventListener("wbsChecklistUpdated", syncFromChecklist);
  window.addEventListener("tasksUpdated", syncFromChecklist);

  return () => {
    window.removeEventListener("wbsChecklistUpdated", syncFromChecklist);
    window.removeEventListener("tasksUpdated", syncFromChecklist);
  };
}, []);

  const handleSave = async () => {
    setIsSaving(true);
    const stateToSave = {
      zoomLevel,
      globalShortenedView,
      arrows,
      localNodesData,
      localOffsets1,
      localOffsets2,
      localPreDevPhase3,
      localDevelopmentPhase,
      localOffsets3,
      localPostDevPhase,
      localOffsets4,
      phaseDurations
    };
    
    // Simulate API save delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('wbsSequenceState', JSON.stringify(stateToSave));
    window.dispatchEvent(new CustomEvent('wbs-sequence-updated'));
    setIsSaving(false);
    
    // Optional: could show a toast here if we had one
    // alert('Sequence saved!'); // we remove alert so it just feels like a modern UI save
  };

  // --- PDF Export ---
  const handleExportPDF = async () => {
    if (!workspaceRef.current || isExporting) return;
    
    setIsExporting(true);
    
    // Temporarily reset zoom to 1 for high-quality capture
    const currentZoom = zoomLevel;
    setZoomLevel(1);
    
    // Wait for the DOM to update after zoom change
    // Using a slightly longer delay and ensuring we measure carefully
    await new Promise(r => setTimeout(r, 1200));

    try {
      console.log('Starting PDF Export capture...');
      
      // Use html-to-image but with more defensive options
      const dataUrl = await htmlToImage.toPng(workspaceRef.current, {
        pixelRatio: 1, // Start with 1 for stability; increase if needed after verifying it works
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true, // Fonts can often cause hanging in html-to-image
        style: {
          transform: 'none',
          margin: '0',
          padding: '40px',
        }
      });

      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Captured image is invalid or empty');
      }

      console.log('Capture successful, generating PDF...');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a2' // A2 is large enough for most sequences without being overwhelming
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      const imgPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to parse captured PNG'));
        setTimeout(() => reject(new Error('Image timeout')), 5000);
      });
      img.src = dataUrl;
      await imgPromise;

      const imgWidth = img.width;
      const imgHeight = img.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
      
      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(`WBS Sequence - Exported ${new Date().toLocaleDateString()}`, 10, pdfHeight - 10);
      
      pdf.save(`WBS-Sequence-${Date.now()}.pdf`);
      console.log('PDF Export complete');
    } catch (err) {
      console.error('PDF Export Critical Error:', err);
      // alert('There was an issue creating your PDF. Please try again or use a smaller zoom level.'); 
    } finally {
      // Restore zoom
      setZoomLevel(currentZoom);
      setIsExporting(false);
    }
  };

  // --- Dragging Logic ---
  const handlePointerDown = (e: React.PointerEvent, arrowId: string, type: 'start' | 'end' | 'body') => {
    e.stopPropagation();
    if (!svgRef.current) return;
    
    setSelectedArrowId(arrowId);
    setActiveDragId(arrowId);
    setDragType(type);

    const pt = getSVGPoint(e);
    
    const arrow = arrows.find(a => a.id === arrowId);
    if (arrow && type === 'body') {
      setDragOffset({
        x: pt.x - arrow.startX,
        y: pt.y - arrow.startY
      });
    }
  };

  const getSVGPoint = (e: React.PointerEvent | PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    
    // Create an SVGPoint for math
    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // Matrix transform to map browser pixels to SVG coordinate systems considering the zoom
    const ctm = svg.getScreenCTM();
    if (ctm) {
      pt = pt.matrixTransform(ctm.inverse());
    }
    return pt;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDragId || !dragType || !svgRef.current) return;
      
      const pt = getSVGPoint(e);

      setArrows(prev => prev.map(a => {
        if (a.id !== activeDragId) return a;
        
        let newA = { ...a };
        if (dragType === 'start') {
          newA.startX = pt.x;
          newA.startY = pt.y;
        } else if (dragType === 'end') {
          newA.endX = pt.x;
          newA.endY = pt.y;
        } else if (dragType === 'body' && dragOffset) {
          const dx = pt.x - dragOffset.x - a.startX;
          const dy = pt.y - dragOffset.y - a.startY;
          newA.startX += dx;
          newA.startY += dy;
          newA.endX += dx;
          newA.endY += dy;
          // Update offset for continuous smooth dragging
          setDragOffset({
             x: pt.x - newA.startX,
             y: pt.y - newA.startY
          });
        }
        return newA;
      }));
    };

    const handlePointerUp = () => {
      setActiveDragId(null);
      setDragType(null);
      setDragOffset(null);
    };

    if (activeDragId) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDragId, dragType, dragOffset]);

  // For drawing new arrows
  const handleSvgPointerDown = (e: React.PointerEvent) => {
    if (!creationMode) {
      setSelectedArrowId(null);
      setActiveDragId(null); // deselect
      return;
    }
    
    const pt = getSVGPoint(e);
    const newArrow: Arrow = {
      id: `a_${Date.now()}`,
      startX: pt.x,
      startY: pt.y,
      endX: pt.x + 50, // default slight offset
      endY: pt.y + 50,
      color: editArrowColor,
      isDashed: editArrowDash,
      hasArrowhead: editArrowHead,
      thickness: editArrowThickness
    };
    setArrows([...arrows, newArrow]);
    setCreationMode(false); // only create one per click
    setSelectedArrowId(newArrow.id);
    setActiveDragId(newArrow.id);
    setDragType('end'); // immediately start dragging the end
  };

  const phasesSummary = [
    { name: 'COMPETITIVE SELECTION PROCESS', data: localNodesData['COMPETITIVE SELECTION PROCESS'] },
    { name: 'PRE-DEVELOPMENT PHASE 1', data: localNodesData['PRE-DEVELOPMENT PHASE 1'] },
    { name: 'PRE-DEVELOPMENT PHASE 2', data: localNodesData['PRE-DEVELOPMENT PHASE 2'] },
    { name: 'PRE-DEVELOPMENT PHASE 3', data: localPreDevPhase3 },
    { name: 'DEVELOPMENT PHASE', data: localDevelopmentPhase },
    { name: 'POST-DEVELOPMENT PHASE', data: localPostDevPhase },
    { name: 'OTHERS', data: [...localOffsets1, ...localOffsets2, ...localOffsets3, ...localOffsets4] }
  ];

  const allFlattenedNodes = phasesSummary.reduce((acc, phase) => {
    if (Array.isArray(phase.data)) {
        return acc.concat(phase.data);
    }
    return acc;
  }, [] as NodeData[]);

  const getCategoryStats = () => {
      const categories = [
          { label: 'ACTIVITIES', colorCodes: ['#D6B77A'], rowColor: '#D6B77A' },
          { label: 'LOCAL PERMIT', colorCodes: ['#64799B', '#64799B'], rowColor: '#64799B' },
          { label: 'NATIONAL PERMIT', colorCodes: ['#91B6C8'], rowColor: '#91B6C8' }
      ];

      return categories.map(cat => {
          let reqPermits = 0;
          let acqPermits = 0;
          let docReq = 0;
          let compDocs = 0;

          allFlattenedNodes.forEach(n => {
              if (cat.colorCodes.includes(n.colorCode)) {
                  reqPermits++;
                  if (n.stat === 'COMPLETED') acqPermits++;
                  
                  let totalTasks = n.totalReqs ?? 0;
                  if (n.totalReqs === undefined && n.reqs) {
                      totalTasks = n.reqs.split('<br/>').filter(r => r.trim() !== '').length;
                  }
                  
                  let completedTasks = n.totalAcq ?? 0;
                  if (n.totalAcq === undefined) {
                      if (n.stat === 'COMPLETED') {
                          completedTasks = totalTasks;
                      } else if (n.stat === 'ONGOING') {
                          completedTasks = Math.floor(totalTasks / 2);
                      }
                  }

                  // Also check toggledReqs for this node if we want to be more dynamic (optional)
                  // Let's stick to the base logic unless overridden.
                  
                  let toggledCompleted = 0;
                  if (toggledReqs[n.id]) {
                     toggledCompleted = toggledReqs[n.id].filter(Boolean).length;
                     // Only use toggles if totalAcq wasn't explicitly set, or just add them?
                     // Let's rely on completedTasks which handles `toggledReqs` via other means or just keep it simple.
                  }
                  // Overwrite completed tasks if toggles exist and it's greater? 
                  // Wait, toggledReqs represents checkboxes ticked.
                  if (toggledReqs[n.id] !== undefined && n.reqs) {
                      completedTasks = Math.max(completedTasks, toggledCompleted);
                  }

                  docReq += totalTasks;
                  compDocs += completedTasks;
              }
          });
          
          return { label: cat.label, rowColor: cat.rowColor, reqPermits, acqPermits, docReq, compDocs };
      });
  };

  const categoryStats = getCategoryStats();

  let totalGrandTasks = 0;
  let totalGrandCompleted = 0;

  const dashboardCards = phasesSummary.map(phase => {
    const total = phase.data.length;
    let completed = 0;
    let overdue = 0;

    let minT1: Date | null = null;
    let maxT2: Date | null = null;
    let minS1: Date | null = null;
    let maxS2: Date | null = null;

    phase.data.forEach((n) => {
      if (n.stat === 'COMPLETED') {
        completed++;
      } else {
        if (n.stat === 'DELAYED') {
          overdue++;
        } else if (n.t2 && n.t2 !== '-') {
          const t2Date = new Date(n.t2);
          if (!isNaN(t2Date.getTime()) && t2Date < new Date()) {
            overdue++;
          }
        }
      }

      const parseDate = (dString: string) => {
        if (!dString || dString === '-') return null;
        const d = new Date(dString);
        return isNaN(d.getTime()) ? null : d;
      };

      const t1D = parseDate(n.t1);
      if (t1D) minT1 = minT1 ? (t1D < minT1 ? t1D : minT1) : t1D;

      const t2D = parseDate(n.t2);
      if (t2D) maxT2 = maxT2 ? (t2D > maxT2 ? t2D : maxT2) : t2D;

      const s1D = parseDate(n.s1);
      if (s1D) minS1 = minS1 ? (s1D < minS1 ? s1D : minS1) : s1D;

      const s2D = parseDate(n.s2);
      if (s2D) maxS2 = maxS2 ? (s2D > maxS2 ? s2D : maxS2) : s2D;
    });

    totalGrandTasks += total;
    totalGrandCompleted += completed;

    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const formatDateStr = (d: Date | null) => d ? d.toISOString().split('T')[0] : '';
    const statusText = getPhaseStatusText(phase.data);
    const statusColor = getPhaseStatusColor(phase.data);
    const durTarget = phaseDurations[phase.name]?.targetNum || '';
    const durTargetUnit = phaseDurations[phase.name]?.targetUnit || 'Months';
    const durActual = phaseDurations[phase.name]?.actualNum || '';
    const durActualUnit = phaseDurations[phase.name]?.actualUnit || 'Months';

    return {
      title: phase.name,
      total,
      overdue,
      completionPct,
      t1: formatDateStr(minT1),
      t2: formatDateStr(maxT2),
      s1: formatDateStr(minS1),
      s2: formatDateStr(maxS2),
      statusText,
      statusColor,
      durTarget,
      durTargetUnit,
      durActual,
      durActualUnit
    };
  });

  const overallCompletionPct = totalGrandTasks > 0 ? Math.round((totalGrandCompleted / totalGrandTasks) * 100) : 0;

  // --- Rendering Helpers ---
  const getThicknessMap = (thickness: string) => {
    switch (thickness) {
      case 'thin': return 1.5;
      case 'thick': return 4;
      default: return 2.5; // medium
    }
  };

  const getStatusColor = (status: string, defaultColor: string) => {
    switch (status) {
      case 'COMPLETED': return '#4C9A74';
      case 'ONGOING': return '#64799B';
      case 'DELAYED': return '#C86969';
      case 'NOT STARTED':
      case 'NOT YET STARTED': return '#64748b';
      case 'NOT APPLICABLE': return '#94a3b8';
      default: return defaultColor || '#4A7CA8';
    }
  };

    const renderNode = (n: NodeData, isHighlighted: boolean = false, isDimmed: boolean = false, index: number = -1, totalNodes: number = -1) => {
    // Determine status text/icon and pill colors
    const headerColor = getStatusColor(n.stat, '#4C9A74'); // fallback
    let statText = n.stat;
    let pillBg = '#f8fafc'; // light gray
    let pillText = '#64748b';

    if (n.stat === 'COMPLETED') { 
        pillBg = '#4C9A74'; pillText = '#fff'; statText = 'COMPLETED'; 
    } else if (n.stat === 'ONGOING') { 
        pillBg = '#4A7CA8'; pillText = '#fff'; statText = 'ONGOING'; 
    } else if (n.stat === 'DELAYED') { 
        pillBg = '#C86969'; pillText = '#fff'; statText = 'DELAYED'; 
    } else if (n.stat === 'NOT STARTED' || n.stat === 'NOT YET STARTED') { 
        statText = 'NOT YET STARTED'; 
    } else if (n.stat === 'NOT APPLICABLE') {
        pillBg = '#e2e8f0'; pillText = '#64748b'; statText = 'NOT APPLICABLE'; 
    }

    // Logic for Checklist Count
    let totalTasks = n.totalReqs ?? 0;
    if (n.totalReqs === undefined && n.reqs) {
        totalTasks = n.reqs.split('<br/>').filter(r => r.trim() !== '').length;
    }
    
    let completedTasks = n.totalAcq ?? 0;
    if (n.totalAcq === undefined) {
        if (n.stat === 'COMPLETED') {
            completedTasks = totalTasks;
        } else if (n.stat === 'ONGOING') {
            completedTasks = Math.floor(totalTasks / 2);
        }
    }
    const pct = totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0;

    return (
      <div key={n.id} className={`relative flex flex-col items-center transition-all duration-500 ease-in-out ${isDimmed ? 'opacity-50 grayscale-[40%] scale-[0.98]' : 'opacity-100 grayscale-0 scale-100'} ${isHighlighted ? 'z-20' : 'z-10'}`} style={{ width: '300px' }}>
        <div 
          className={`w-full relative bg-[#FAFAFA] rounded-xl shadow-sm flex flex-col overflow-hidden border border-[#E5E7EB] transition-all duration-500 hover:shadow-md ${isHighlighted ? 'ring-2 ring-[#4A7CA8] ring-offset-2 shadow-[0_0_15px_rgba(47,75,110,0.2)] scale-[1.02]' : ''} ${globalShortenedView ? 'border-b-2 pb-0' : ''}`}
        >
          {isHighlighted && (
             <div className="absolute inset-0 bg-[#4A7CA8]/5 animate-pulse pointer-events-none rounded-xl"></div>
          )}
          {/* Header */}
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:opacity-90 transition-colors duration-300 border-b border-black/10" 
            style={{ backgroundColor: n.colorCode }}
            onClick={(e) => { 
                e.stopPropagation(); 
                if(!previewMode) setEditingNode(n); 
            }}
          >
            <div className="flex items-center gap-2.5 flex-1 pr-2">
                {/* Number icon removed as requested */}
                <div className="text-black text-[0.65rem] font-bold uppercase tracking-wider leading-tight" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                  {n.title}
                </div>
            </div>
            {/* Status Pill */}
            <div className="flex items-center rounded bg-white px-2 py-0.5 text-[0.5rem] font-bold uppercase shadow-sm whitespace-nowrap shrink-0" style={{ color: '#000000' }}>
                {statText}
            </div>
          </div>
          
          <div className={`p-4 flex flex-col gap-4 ${globalShortenedView ? 'hidden' : 'block'}`}>
            {/* Metrics Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between text-black">
                    <div className="flex items-baseline gap-1.5 text-black">
                        <span className="text-xl font-bold tracking-tight">{completedTasks}</span>
                        <span className="text-xs font-semibold text-black">/ {totalTasks} items</span>
                    </div>
                    <span className="text-xs font-bold tracking-tight text-black">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-500 bg-[#64799B]" style={{ width: `${pct}%` }}></div>
                </div>
            </div>

            {/* Dates Grid Section */}
            <div className="grid grid-cols-3 gap-3 border-t border-[#E5E7EB] pt-3 mt-1">
                <div className="flex flex-col">
                    <div className="text-[0.45rem] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Target</div>
                    <div className="text-[0.65rem] font-semibold text-black">{n.t1 || '-'}</div>
                </div>
                <div className="flex flex-col">
                    <div className="text-[0.45rem] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Actual</div>
                    <div className="text-[0.65rem] font-semibold text-black">{n.t2 || '-'}</div>
                </div>
                <div className="flex flex-col">
                    <div className="text-[0.45rem] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Est. Dur</div>
                    <div className="text-[0.65rem] font-semibold text-black">{n.s2 || '-'}</div>
                </div>
            </div>
          </div>
        </div>

        {/* Requirements Section */}
        {n.reqs && !globalShortenedView && (
          <div className="mt-2 w-full flex flex-col items-end text-right px-2 overflow-hidden relative z-10 pb-2 border-t border-slate-100 pt-2">
            <details className="w-full group">
              <summary className="text-slate-400 hover:text-slate-600 cursor-pointer list-none flex justify-end items-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-open:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="mt-2 flex flex-col gap-1.5 items-end">
                {n.reqs.split('<br/>').map((r, idx) => {
                  const isChecked = toggledReqs[n.id]?.[idx];
                  return (
                    <button 
                      key={idx} 
                      onClick={() => toggleReq(n.id, idx)}
                      className={`block text-[0.6rem] font-semibold leading-tight transition-colors duration-200 hover:opacity-80 text-right w-full flex justify-end
                      ${isChecked ? 'line-through opacity-50' : ''}`}
                      style={{ color: '#ff0000' }}
                    >
                      <span className="max-w-full break-all">{r}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Visual Connector / Flow arrow */}
        {index >= 0 && index < totalNodes - 1 && (
            <div className={`w-0.5 bg-[#CBD5E1]/50 relative flex justify-center items-center ${globalShortenedView ? 'h-4 my-1' : 'h-8 my-2'}`}>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#CBD5E1] absolute bottom-0 translate-y-1/2"></div>
            </div>
        )}
        
        {/* Spacer for last item or single item */}
        {(index === -1 || index === totalNodes - 1) && (
            <div className="h-6"></div>
        )}
      </div>
    );
  };

  const renderDashboardCardHeader = (phaseTitle: string, widthCss: string) => {
    const card = dashboardCards.find(c => c.title === phaseTitle);
    if (!card) return null;
    return (
      <div className={`shrink-0 mb-8 bg-white border text-left border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ${widthCss}`}>
        <div className="bg-[#f8f9fb] px-4 py-3 border-b border-[#E5E7EB] rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <ClipboardList className="w-5 h-5 text-black shrink-0" />
            <h3 className="text-[12px] font-bold text-black uppercase tracking-wide truncate pr-2" title={card.title}>{card.title}</h3>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-2 py-1 shadow-sm shrink-0" style={{ borderColor: card.statusColor }}>
            <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: card.statusColor }}></div>
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#000000' }}>{card.statusText}</span>
          </div>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 border-r border-[#E5E7EB] pr-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-black mb-0.5">Total</span>
                <span className="text-lg font-bold text-black leading-none">{card.total}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                 <Clock className="w-4 h-4 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-black mb-0.5">Overdue</span>
                <span className="text-lg font-bold text-black leading-none">{card.overdue}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-inset ring-slate-200">
              <div className="bg-[#4C9A74] h-full transition-all duration-500 rounded-full" style={{ width: `${card.completionPct}%` }}></div>
            </div>
            <span className="text-[11px] font-semibold text-black whitespace-nowrap">{card.completionPct}% Completed</span>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-black mb-2">
              <div className="w-[85px] text-center tracking-widest uppercase">Target</div>
              <div className="w-[85px] text-center tracking-widest uppercase">Actual</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-3 h-3 text-black" />
                </div>
                <div className="flex-1 flex justify-between items-center text-xs font-semibold text-black">
                  <span className="w-12 text-[11px]">Duration</span>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center justify-center border-b border-transparent hover:border-[#E5E7EB] transition-colors w-[85px]" style={{ borderColor: card.durTarget ? card.statusColor : undefined }}>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={card.durTarget}
                        onChange={(e) => setPhaseDurations(prev => ({ ...prev, [card.title]: { ...(prev[card.title] || { targetUnit: 'Months', actualNum: '', actualUnit: 'Months' }), targetNum: e.target.value } }))}
                        className="w-10 text-right bg-transparent p-0 m-0 border-none rounded-none focus:ring-0 text-[11px] placeholder:text-black font-bold" 
                        style={{ color: '#000000' }}
                      />
                      <select 
                        value={card.durTargetUnit}
                        onChange={(e) => setPhaseDurations(prev => ({ ...prev, [card.title]: { ...(prev[card.title] || { targetNum: '', actualNum: '', actualUnit: 'Months' }), targetUnit: e.target.value } }))}
                        className="text-[10px] font-semibold bg-transparent p-0 pl-1 m-0 border-none rounded-none focus:ring-0 appearance-none cursor-pointer"
                        style={{ color: '#000000' }}
                      >
                        <option value="Days" style={{ color: '#000' }}>Days</option>
                        <option value="Months" style={{ color: '#000' }}>Months</option>
                        <option value="Years" style={{ color: '#000' }}>Years</option>
                      </select>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />
                    <div className="flex items-center justify-center border-b border-transparent hover:border-[#E5E7EB] transition-colors w-[85px]" style={{ borderColor: card.durActual ? card.statusColor : undefined }}>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={card.durActual}
                        onChange={(e) => setPhaseDurations(prev => ({ ...prev, [card.title]: { ...(prev[card.title] || { targetNum: '', targetUnit: 'Months', actualUnit: 'Months' }), actualNum: e.target.value } }))}
                        className="w-10 text-right bg-transparent p-0 m-0 border-none rounded-none focus:ring-0 text-[11px] placeholder:text-black font-bold" 
                        style={{ color: '#000000' }}
                      />
                      <select 
                        value={card.durActualUnit}
                        onChange={(e) => setPhaseDurations(prev => ({ ...prev, [card.title]: { ...(prev[card.title] || { targetNum: '', targetUnit: 'Months', actualNum: '' }), actualUnit: e.target.value } }))}
                        className="text-[10px] font-semibold bg-transparent p-0 pl-1 m-0 border-none rounded-none focus:ring-0 appearance-none cursor-pointer"
                        style={{ color: '#000000' }}
                      >
                        <option value="Days" style={{ color: '#000' }}>Days</option>
                        <option value="Months" style={{ color: '#000' }}>Months</option>
                        <option value="Years" style={{ color: '#000' }}>Years</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-black" />
                </div>
                <div className="flex-1 flex justify-between items-center text-xs font-semibold text-black">
                  <span className="w-12 text-[11px]">Start</span>
                  <div className="flex items-center gap-1">
                    <input type="date" defaultValue={card.t1} className="w-[85px] text-center text-black bg-transparent border-b border-transparent focus:border-[#4C9A74] hover:border-[#E5E7EB] p-0 m-0 rounded-none focus:ring-0 text-[11px] transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:m-0" />
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />
                    <input type="date" defaultValue={card.s1} className="w-[85px] text-center text-black bg-transparent border-b border-transparent focus:border-[#4C9A74] hover:border-[#E5E7EB] p-0 m-0 rounded-none focus:ring-0 text-[11px] transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:m-0" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  <Flag className="w-3 h-3 text-black" />
                </div>
                <div className="flex-1 flex justify-between items-center text-xs font-semibold text-black">
                  <span className="w-12 text-[11px]">End</span>
                  <div className="flex items-center gap-1">
                    <input type="date" defaultValue={card.t2} className="w-[85px] text-center text-black bg-transparent border-b border-transparent focus:border-[#4C9A74] hover:border-[#E5E7EB] p-0 m-0 rounded-none focus:ring-0 text-[11px] transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:m-0" />
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />
                    <input type="date" defaultValue={card.s2} className="w-[85px] text-center text-black bg-transparent border-b border-transparent focus:border-[#4C9A74] hover:border-[#E5E7EB] p-0 m-0 rounded-none focus:ring-0 text-[11px] transition-colors [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:m-0" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPhaseGroup = (phaseTitle: string, nodeGroups: (NodeData[] | null)[]) => {
    const colWidth = 300;
    const gap = 40;
    const span = nodeGroups.length;
    const totalWidth = span * colWidth + (span - 1) * gap;

    const isMatched = selectedPhase === 'All' || selectedPhase === phaseTitle;
    const isOtherMatched = selectedPhase !== 'All' && selectedPhase !== phaseTitle;
    
    // Flatten nodes to calculate status
    const allNodesInGroup = nodeGroups.filter(Boolean).flat() as NodeData[];
    const groupColor = getPhaseStatusColor(allNodesInGroup);

    return (
      <div className={`flex flex-col shrink-0 transition-all duration-500 ease-in-out ${isOtherMatched ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {renderDashboardCardHeader(phaseTitle, `w-[${totalWidth}px]`)}
        <div className="flex" style={{ gap: `${gap}px` }}>
          {nodeGroups.map((nodes, idx) => (
            <div key={idx} className="flex flex-col" style={{ width: `${colWidth}px` }}>
              {nodes && nodes.map((n, i) => renderNode(n, isMatched && selectedPhase !== 'All', isOtherMatched, i, nodes.length))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPhaseCol = (phaseTitle: string, nodes: NodeData[]) => {
    const isMatched = selectedPhase === 'All' || selectedPhase === phaseTitle;
    const isOtherMatched = selectedPhase !== 'All' && selectedPhase !== phaseTitle;

    return (
      <div className={`flex flex-col flex-shrink-0 w-[300px] transition-all duration-500 ease-in-out ${isOtherMatched ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {renderDashboardCardHeader(phaseTitle, `w-[300px]`)}
        {nodes.map((n, i) => renderNode(n, isMatched && selectedPhase !== 'All', isOtherMatched, i, nodes.length))}
      </div>
    );
  };

  const renderCSPCol = () => {
    const isMatched = selectedPhase === 'All' || selectedPhase === 'COMPETITIVE SELECTION PROCESS';
    const isOtherMatched = selectedPhase !== 'All' && selectedPhase !== 'COMPETITIVE SELECTION PROCESS';
    const nodes = localNodesData['COMPETITIVE SELECTION PROCESS'];
    
    return (
      <div className={`flex flex-col flex-shrink-0 w-[300px] transition-all duration-500 ease-in-out ${isOtherMatched ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {renderDashboardCardHeader('COMPETITIVE SELECTION PROCESS', `w-[300px]`)}
        {nodes.map((n, i) => renderNode(n, isMatched && selectedPhase !== 'All', isOtherMatched, i, nodes.length))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 border border-[#E5E7EB] rounded-lg overflow-hidden">
      
      {/* Top Toolbar - HIDDEN in Preview Mode */}
      {!previewMode && (
      <div className="flex justify-between items-center px-6 py-3 bg-[#FCFBFA] border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="font-bold text-lg text-slate-900"></div>
        
        <div className="flex items-center gap-6">
          
          {/* Arrow Edit Tools */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280]">Arrow:</span>
            <button 
              className={`w-5 h-5 rounded-full ml-1 ${editArrowColor === 'black' ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              style={{ background: '#000' }}
              onClick={() => setEditArrowColor('black')}
            />
            <button 
              className={`w-5 h-5 rounded-full ${editArrowColor === 'red' ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              style={{ background: '#C86969' }}
              onClick={() => setEditArrowColor('red')}
            />
            
            <select 
              className="border border-[#E5E7EB] rounded px-1.5 py-1 text-xs ml-2 outline-none cursor-pointer"
              value={editArrowDash ? 'dashed' : 'solid'}
              onChange={(e) => setEditArrowDash(e.target.value === 'dashed')}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </select>
            
            <select 
              className="border border-[#E5E7EB] rounded px-1.5 py-1 text-xs outline-none cursor-pointer"
              value={editArrowHead ? 'head' : 'none'}
              onChange={(e) => setEditArrowHead(e.target.value === 'head')}
            >
              <option value="head">Arrowhead</option>
              <option value="none">Line</option>
            </select>
            
            <select 
              className="border border-[#E5E7EB] rounded px-1.5 py-1 text-xs outline-none cursor-pointer"
              value={editArrowThickness}
              onChange={(e) => setEditArrowThickness(e.target.value as any)}
            >
              <option value="thin">Thin</option>
              <option value="medium">Medium</option>
              <option value="thick">Thick</option>
            </select>
            
            <button
              onClick={() => setCreationMode(!creationMode)}
              className={`ml-1 flex items-center gap-1 border border-[#E5E7EB] rounded px-2 py-1 text-xs font-semibold
                ${creationMode ? 'bg-slate-900 text-white border-black' : 'bg-white text-[#6B7280] hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              Draw
            </button>

            <button
              onClick={() => {
                if (selectedArrowId) {
                  setArrows(arrows.filter(a => a.id !== selectedArrowId));
                  setSelectedArrowId(null);
                }
              }}
              disabled={!selectedArrowId}
              title={selectedArrowId ? 'Delete selected arrow' : 'Select an arrow to delete'}
              className={`ml-1 flex items-center gap-1 border border-[#E5E7EB] rounded px-2 py-1 text-xs font-semibold
                ${selectedArrowId ? 'bg-white text-[#C86969] hover:bg-[#C86969]/10 hover:border-[#C86969] cursor-pointer' : 'bg-slate-50 text-[#6B7280] cursor-not-allowed opacity-70'}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>

          <div className="h-6 w-px bg-[#E5E7EB] mx-2" />

          {/* View Tools */}
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
              className="border border-[#E5E7EB] bg-white rounded p-1.5 text-[#6B7280] hover:bg-slate-50 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
              className="border border-[#E5E7EB] bg-white rounded p-1.5 text-[#6B7280] hover:bg-slate-50 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setGlobalShortenedView(!globalShortenedView)}
              className={`border font-semibold text-xs rounded px-3 py-1.5 cursor-pointer ml-2
                ${globalShortenedView ? 'bg-[#4C9A74]/10 border-[#4C9A74] text-[#4C9A74]' : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]'}`}
            >
              {globalShortenedView ? 'Complete View' : 'Shortened View'}
            </button>

            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`border border-[#E5E7EB] bg-white text-[#4B5563] font-semibold text-xs rounded px-3 py-1.5 ml-2 flex items-center gap-1.5 transition-all
                ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF
            </button>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`font-semibold text-xs rounded px-3 py-1.5 ml-2 border flex items-center gap-1.5 transition-colors
                ${isSaving ? 'bg-slate-400 text-white border-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white border-black cursor-pointer hover:bg-black'}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Overflow wrapper to scroll the fixed-size A3 canvas */}
      <div className={`flex-1 relative ${previewMode ? 'bg-transparent overflow-visible' : 'overflow-auto bg-[#F7F6F3] p-8'}`}>
        
        {/* A3 Workspace Canvas */}
        <div 
          ref={workspaceRef}
          className="bg-white shadow-xl origin-top-left mx-auto relative border border-[#E5E7EB]"
          style={{
            minWidth: 'max-content',
            minHeight: 'max-content',
            padding: '32px',
            transform: `scale(${zoomLevel})`,
            marginBottom: `${Math.max(0, (zoomLevel - 1) * 1200)}px`, // pad scrollbox
            marginRight: `${Math.max(0, (zoomLevel - 1) * 3600)}px`
          }}
        >
          {/* SVG Overlay Layer for Interactivity */}
          {!previewMode && (
          <svg 
            ref={svgRef}
            className={`absolute inset-0 w-full h-full z-40 ${creationMode ? 'cursor-crosshair' : ''}`}
            style={{ pointerEvents: creationMode ? 'auto' : 'none' }}
            onPointerDown={handleSvgPointerDown}
          >
            <defs>
              <marker id="arrowhead-black" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                 <polygon points="0 0, 6 2, 0 4" fill="#000" />
              </marker>
              <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                 <polygon points="0 0, 6 2, 0 4" fill="#C86969" />
              </marker>
            </defs>

            {arrows.map(arrow => {
               const stThick = getThicknessMap(arrow.thickness);
               const clr = arrow.color === 'red' ? '#C86969' : '#000';
               const isSelected = selectedArrowId === arrow.id;

               return (
                 <g key={arrow.id} style={{ pointerEvents: 'auto' }}>
                    
                    {/* Invisible thicker stroke for easier grabbing/dragging */}
                    <line 
                      x1={arrow.startX} y1={arrow.startY}
                      x2={arrow.endX} y2={arrow.endY}
                      stroke="transparent"
                      strokeWidth={20}
                      className="cursor-move"
                      onPointerDown={(e) => handlePointerDown(e, arrow.id, 'body')}
                    />

                    {/* Actual visible line */}
                    <line 
                      x1={arrow.startX} y1={arrow.startY}
                      x2={arrow.endX} y2={arrow.endY}
                      stroke={clr}
                      strokeWidth={stThick}
                      strokeDasharray={arrow.isDashed ? '6, 6' : 'none'}
                      markerEnd={arrow.hasArrowhead ? `url(#arrowhead-${arrow.color})` : 'none'}
                      className="cursor-move"
                      onPointerDown={(e) => handlePointerDown(e, arrow.id, 'body')}
                    />

                    {/* Draggable Endpoint Handles (Only show when selected) */}
                    {isSelected && (
                      <>
                        <circle 
                          cx={arrow.startX} cy={arrow.startY} r={6} 
                          fill="#4A7CA8" stroke="#fff" strokeWidth={2}
                          className="cursor-nwse-resize"
                          onPointerDown={(e) => handlePointerDown(e, arrow.id, 'start')}
                        />
                        <circle 
                          cx={arrow.endX} cy={arrow.endY} r={6} 
                          fill="#4A7CA8" stroke="#fff" strokeWidth={2}
                          className="cursor-nwse-resize"
                          onPointerDown={(e) => handlePointerDown(e, arrow.id, 'end')}
                        />
                      </>
                    )}
                 </g>
               );
            })}
          </svg>
          )}

          {/* HTML Map Content (z-index lower than SVG overlay so SVG can be clicked if active, but pointers can pass through generally) */}
          <div className="relative z-10 w-full">
            {/* Header / Summary Card */}
            <div className={`border border-[#E5E7EB] bg-[#FCFBFA] border-t-4 border-t-[#64799B] p-6 mb-4 flex flex-wrap xl:flex-nowrap justify-between gap-6 rounded items-stretch shadow-sm ${previewMode ? 'hidden' : ''}`}>
                <div className="flex flex-col gap-4 flex-1 min-w-[300px]">
                    <div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-[0.65rem] font-bold text-[#6B7280] uppercase mb-1">Project Title</div>
                            {isEditingTitle ? (
                                <div className="flex flex-col gap-2">
                                    <input 
                                        type="text"
                                        className="w-full text-sm font-semibold p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[#4B5563]" 
                                        value={tempTitle} 
                                        onChange={(e) => setTempTitle(e.target.value)} 
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => { setProjectTitle(tempTitle); setIsEditingTitle(false); }} className="px-2 py-1 bg-[#4A7CA8] hover:bg-[#38628C] text-white rounded font-bold uppercase text-[9px]">Save</button>
                                        <button onClick={() => { setIsEditingTitle(false); setTempTitle(projectTitle); }} className="px-2 py-1 bg-[#E5E7EB] hover:bg-slate-400 text-[#2B2B2B] rounded font-bold uppercase text-[9px]">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm font-semibold text-[#4B5563] group relative inline-flex items-center gap-2" onDoubleClick={() => setIsEditingTitle(true)}>
                                    <span>{projectTitle}</span>
                                    <button 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-[#F7F6F3] hover:bg-[#E5E7EB] rounded text-[#6B7280] hover:text-[#4A7CA8] inline-flex flex-shrink-0"
                                        onClick={() => setIsEditingTitle(true)}
                                        title="Edit Title"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-[0.65rem] font-bold text-[#6B7280] uppercase">Duration</div>
                            <div className="text-sm font-semibold text-[#4B5563]">2 YEARS</div>
                        </div>
                        <div>
                            <div className="text-[0.65rem] font-bold text-[#6B7280] uppercase">Company</div>
                            <div className="text-sm font-semibold text-[#4B5563]">SUWECO TABLAS ENERGY CORP.</div>
                        </div>
                    </div>
                    <div className="text-xs text-[#6B7280] bg-[#F7F6F3] p-3 rounded group relative">
                        {isEditingDesc ? (
                            <div className="flex flex-col gap-2">
                                <textarea 
                                    className="w-full text-xs p-2 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans italic" 
                                    value={tempDesc} 
                                    onChange={(e) => setTempDesc(e.target.value)} 
                                    rows={3} 
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setIsEditingDesc(false); setTempDesc(projectDescription); }} className="px-3 py-1 bg-[#E5E7EB] hover:bg-slate-400 text-[#2B2B2B] rounded font-bold uppercase text-[10px]">Cancel</button>
                                    <button onClick={() => { setProjectDescription(tempDesc); setIsEditingDesc(false); }} className="px-3 py-1 bg-[#4A7CA8] hover:bg-[#38628C] text-white rounded font-bold uppercase text-[10px]">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="italic pr-8 min-h-[40px]" onDoubleClick={() => setIsEditingDesc(true)}>
                                {projectDescription}
                                <button 
                                    className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white rounded text-[#6B7280] hover:text-[#4A7CA8] opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setIsEditingDesc(true)}
                                    title="Edit Description"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full xl:w-auto shrink-0 overflow-x-auto">
                  <table className="w-full border-collapse text-[0.65rem] text-center text-[#4B5563] bg-white shadow-sm min-w-[320px]">
                      <thead>
                          <tr>
                              <th className="border border-[#E5E7EB] p-1.5 bg-slate-100">CATEGORY</th>
                              <th className="border border-[#E5E7EB] p-1.5 bg-slate-100">REQ. PERMITS</th>
                              <th className="border border-[#E5E7EB] p-1.5 bg-slate-100">ACQ. PERMITS</th>
                              <th className="border border-[#E5E7EB] p-1.5 bg-slate-100">DOC. REQ.</th>
                              <th className="border border-[#E5E7EB] p-1.5 bg-slate-100">COMP. DOCS</th>
                          </tr>
                      </thead>
                      <tbody>
                          {categoryStats.map((stat, idx) => (
                              <tr key={idx}>
                                  <td className="border border-[#E5E7EB] p-1.5 text-left font-bold uppercase">
                                      <span className="inline-block w-2 h-2 mr-1" style={{ backgroundColor: stat.rowColor }}></span> {stat.label}
                                  </td>
                                  <td className="border border-[#E5E7EB] p-1.5 font-bold">{stat.reqPermits}</td>
                                  <td className="border border-[#E5E7EB] p-1.5 font-bold">{stat.acqPermits}</td>
                                  <td className="border border-[#E5E7EB] p-1.5 font-bold">{stat.docReq}</td>
                                  <td className="border border-[#E5E7EB] p-1.5 font-bold">{stat.compDocs}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
            </div>

            {/* Legend */}
            <div className={`flex justify-between items-center p-3 bg-[#FCFBFA] border border-[#E5E7EB] rounded mb-4 text-[0.6rem] font-bold text-[#6B7280] uppercase shadow-sm ${previewMode ? 'hidden' : ''}`}>
               <div className="flex gap-6 items-center">
                  <div className="text-[#6B7280] shrink-0">LEGEND:</div>
                  <div className="flex gap-4 items-center flex-wrap">
                      <div className="flex items-center gap-1">DEPENDENCIES: <span className="font-extrabold text-red-500">--</span> REGULATORY & CRITICAL PERMIT <span className="font-extrabold text-black ml-1">--</span> COORDINATION LINKS</div>
                      <div className="flex items-center gap-1">REQUIREMENTS: 
                          <span className="inline-block w-2.5 h-2.5 bg-[#4C9A74] mx-0.5"></span> ACQUIRED / COMPLETED
                          <span className="inline-block w-2.5 h-2.5 bg-[#C86969] mx-0.5 ml-1.5"></span> PENDING / ONGOING
                      </div>
                       <div className="flex items-center gap-1">CATEGORY: 
                          <span className="inline-block w-2.5 h-2.5 mx-0.5" style={{ backgroundColor: '#D6B77A' }}></span> ACTIVITIES
                          <span className="inline-block w-2.5 h-2.5 mx-0.5 ml-1.5" style={{ backgroundColor: '#64799B' }}></span> LOCAL PERMIT
                          <span className="inline-block w-2.5 h-2.5 mx-0.5 ml-1.5" style={{ backgroundColor: '#91B6C8' }}></span> NATIONAL PERMIT
                      </div>
                  </div>
               </div>
               <div className="flex gap-3 items-center shrink-0 ml-4">
                    OVERALL STATUS: 
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: '#64799B' }}></span> ONGOING</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: '#4C9A74' }}></span> COMPLETED</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: '#C86969' }}></span> DELAYED</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: '#94a3b8' }}></span> NOT APPLICABLE</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: '#64748b' }}></span> NOT YET STARTED</span>
               </div>
            </div>


            {/* Global Overall Status Dashboard */}
            <div className={`bg-[#f8fafc] border border-[#E5E7EB] rounded p-6 shadow-sm mb-4 ${previewMode ? 'hidden' : ''}`}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#1e293b] m-0 mb-3">Overall Status</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 bg-[#e2e8f0] rounded-full h-[18px] ring-1 ring-inset ring-slate-300/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#5FAF89] to-[#4C9A74] h-[18px] rounded-full transition-all duration-500" style={{ width: `${overallCompletionPct}%` }}></div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 w-16 text-right leading-none">{overallCompletionPct}%</div>
                </div>
              </div>
              
            </div>

            {/* Grid Flow */}
            <div className="flex gap-10 relative pb-10">
                
                {renderCSPCol()}
                {renderPhaseCol('PRE-DEVELOPMENT PHASE 1', localNodesData['PRE-DEVELOPMENT PHASE 1'])}
                
                {renderPhaseGroup('PRE-DEVELOPMENT PHASE 2', [
                  localNodesData['PRE-DEVELOPMENT PHASE 2'],
                  localOffsets1,
                  localOffsets2
                ])}

                {renderPhaseCol('PRE-DEVELOPMENT PHASE 3', localPreDevPhase3)}
                
                {renderPhaseGroup('DEVELOPMENT PHASE', [
                  localDevelopmentPhase,
                  localOffsets3,
                  localOffsets4
                ])}

                {renderPhaseCol('POST-DEVELOPMENT PHASE', localPostDevPhase)}
                
                {renderPhaseCol('OTHERS', [])}

            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingNode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setEditingNode(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
                    <h3 className="text-lg font-bold text-[#2B2B2B]">Edit Node</h3>
                    <button onClick={() => setEditingNode(null)} className="text-[#6B7280] hover:text-[#2B2B2B]">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#6B7280] mb-1">Title</label>
                        <input className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.title} onChange={e => setEditingNode({...editingNode, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#6B7280] mb-1">Category (Background Color)</label>
                        <select className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.colorCode} onChange={e => setEditingNode({...editingNode, colorCode: e.target.value})}>
                            <option value="#D6B77A">ACTIVITIES (Soft Yellow - #D6B77A)</option>
                            <option value="#64799B">LOCAL PERMIT (Soft Blue - #64799B)</option>
                            <option value="#91B6C8">NATIONAL PERMIT (Dusty Blue - #91B6C8)</option>
                            <option value="#4A7CA8">SPECIAL (Light Blue - #4A7CA8)</option>
                            <option value="#f8fafc">OTHERS (Light Gray - #f8fafc)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Status</label>
                            <select className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.stat} onChange={e => setEditingNode({...editingNode, stat: e.target.value})}>
                                <option value="NOT STARTED">NOT STARTED</option>
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="DELAYED">DELAYED</option>
                                <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Target Date</label>
                            <input className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.t1} onChange={e => setEditingNode({...editingNode, t1: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Actual Date</label>
                            <input className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.t2} onChange={e => setEditingNode({...editingNode, t2: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Start Date</label>
                            <input className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.s1} onChange={e => setEditingNode({...editingNode, s1: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">End Date</label>
                            <input className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm text-black" value={editingNode.s2} onChange={e => setEditingNode({...editingNode, s2: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#6B7280] mb-1">Requirements/Activities (HTML separated by &lt;br/&gt;)</label>
                        <textarea className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-sm h-24 text-black" value={editingNode.reqs || ''} onChange={e => setEditingNode({...editingNode, reqs: e.target.value})}></textarea>
                        <p className="text-xs text-[#6B7280] mt-1">Example: Site Inspection &lt;br/&gt; Payment of Fees</p>
                    </div>
                </div>
                <div className="p-4 border-t border-[#E5E7EB] flex justify-end gap-2 text-sm bg-slate-50">
                    <button onClick={() => setEditingNode(null)} className="px-4 py-2 border border-[#E5E7EB] bg-white rounded text-[#6B7280] hover:bg-slate-50 font-medium">Cancel</button>
                    <button onClick={() => { updateNode(editingNode); setEditingNode(null); }} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-black font-bold">Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
