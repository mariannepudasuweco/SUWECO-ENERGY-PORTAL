import { useState, useEffect } from 'react';

export type NodeData = {
  id: string;
  title: string;
  colorCode: string;
  t1: string; // Target Start
  t2: string; // Target End (named Actual in some places)
  s1: string; // Start Date
  s2: string; // End Date
  stat: string;
  reqs?: string;
  totalReqs?: number;
  totalAcq?: number;
  owner?: string; // Newly added for Assigned To
  dependencies?: string[]; // Added for dependencies
};

export type PhaseData = {
  name: string;
  data: NodeData[];
};

const DEFAULT_STATE = {
  zoomLevel: 1.0,
  globalShortenedView: false,
  arrows: [],
  localNodesData: {
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
  },
  localOffsets1: [
    { id: 'o1_1', title: 'MPDC - ZONING CERTIFICATE', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 12, totalAcq: 0, reqs: 'SB Resolution for Reclassification<br/>SB Resolution of No Objection<br/>Vicinity Map<br/>Site Development Plan<br/>Plant Layout<br/>Project Profile<br/>Lot Documents ( Lot Title, DOAS, Tax Dec MOA)' },
    { id: 'n11', title: 'NCIP - CERTIFICATE OF NON-OVERLAP', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 21, totalAcq: 0, reqs: 'Letter of Request addressed to the EPIMB Director<br/>Company Profile<br/>Project Background<br/>Vicinity Map<br/>Project Fact Sheet' },
    { id: 'n13', title: 'MPDC - LOCATIONAL CLEARANCE', colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 13, totalAcq: 0, reqs: 'Location or Vicinity Map<br/>Land Development Plan<br/>Certified photocopy of TCT<br/>Memorandum of Agreement<br/>SB Resolution of No Objection<br/>SB Resolution for Reclassification' },
    { id: 'n15', title: 'BFP - FIRE SAFETY EVALUATION CLEARANCE FOR BUILDING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 8, totalAcq: 0, reqs: 'Application Form<br/>Engineering Design (Architectural, Electrical and Mechanical Drawings)<br/>Bill of Materials' }
  ],
  localOffsets2: [
    { id: 'o2_1', title: 'DENR - ECC / CNC', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 22, totalAcq: 0, reqs: 'Project Description<br/>Environmental Management Plan<br/>Certification from LGU (Zoning Certificate)<br/>PCO Accreditation<br/>Lot Documents(Lot Title, DOAS, Tax Dec, MOA)<br/>PEMAPS<br/>Initial Environmental Examination (IEE) Checklist Report<br/>Project components and operation information<br/>Compliance for ECC (60) days upon receipt<br/>Tree Planting<br/>DENR-Geo Hazard Investigation Report<br/>SMR/CMR' },
    { id: 'o1_2', title: "MAYOR'S PERMIT FOR BUILDING PERMIT", colorCode: '#64799B', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 8, totalAcq: 0 },
    { id: 'o1_3', title: 'OBO - BUILDING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 9, totalAcq: 0, reqs: "Application form<br/>Engineering plans<br/>Bill of materials<br/>Barangay Resolution<br/>Locational Clearance from MPDC<br/>Mayor's Permit" },
    { id: 'o1_4', title: 'OBO - EXCAVATION AND GROUND PREPARATION PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Excavation Permit Form<br/>Excavation plans<br/>Locational Clearance from MPDC' },
    { id: 'n16', title: 'OBO - FENCING PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', totalReqs: 5, totalAcq: 0, reqs: 'Fencing Permit Form<br/>Bill of materials for fence<br/>Fencing permit plan<br/>Locational Clearance from MPDC' }
  ],
  localPreDevPhase3: [
    { id: 'n17', title: 'NWRB - WATER PERMIT', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Location Plan<br/>DENR - (ECC)<br/>Lot Documents (Lot Title, DOAS, Tax Dec- MOA)<br/>Permit to Drill<br/>Conditional Water Permit' },
    { id: 'n18', title: 'PROJECT AGREEMENTS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'EPC Agreement (Onshore/Offshore)<br/>Offtake Agreement<br/>Operations and Maintenance Agreement<br/>Coordination Agreement' }
  ],
  localDevelopmentPhase: [
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
  ],
  localOffsets3: [
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
  ],
  localPostDevPhase: [
    { id: 'n25', title: 'ERC - PAO / COC POST-TEST & COMMISSIONING', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Updated COC Form No. 1 - w/ Generating unit technical information<br/>Updated COC Form No. 2<br/>Updated COC Form No. 4 - w/ Genset, alternator & engine nameplates<br/>FCATC<br/>GUCT Results & Certificates<br/>WESM Registration<br/>ERC - P2P Application<br/>DOE - COE<br/>DENR - ECC<br/>DENR - PTO (Gensets & Fuel Tanks)<br/>DENR - Discharge Permit<br/>Business Permit (Generation Facility in location)<br/>ERC Inspection' },
    { id: 'n26', title: 'TURNOVER', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
    { id: 'n27', title: 'COMMERCIAL OPERATIONS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'ERC - PAEC / COE (Post-Test & Commissioning)<br/>DENR - PTO (Permit to Operate)<br/>DOLE - PTO (Permit to Operate)<br/>LGU - Business Permit<br/>LGU - Occupancy Permit<br/>NWRB - Water Permit<br/>Permanent ELectrical Permit<br/>ERC - Certificate of Compliance (COC)<br/>Post-Test & Commissioning Activities<br/>As-Built Plans<br/>Turnover Activities' },
    { id: 'n28', title: 'PROJECT MILESTONE', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
    { id: 'n29', title: 'CLOSING REPORTS', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' }
  ],
  localOffsets4: [
    { id: 'o4_testing', title: 'TESTING AND COMMISSIONING', colorCode: '#D6B77A', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED' },
    { id: 'o4_ercp2p', title: 'ERC - P2P', colorCode: '#91B6C8', t1: '-', t2: '-', s1: '-', s2: '-', stat: 'NOT YET STARTED', reqs: 'Engineering Design & Studies (SIS, FS, SLD, Code, Other Drawings)<br/>DENR - ECC<br/>DOE - COE<br/>DOE - COC' }
  ],
  phaseDurations: {}
};

export function useWbsData() {
  const [data, setData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('wbsSequenceState');
      
      if (saved) {
        let parsed = JSON.parse(saved);
        // Map old colors to new ones for existing setups
        const colorMap: Record<string, string> = {
          '#eab308': '#D6B77A', '#D9A441': '#D6B77A', '#C5A56D': '#D6B77A',
          '#0ea5e9': '#91B6C8', '#5C7C9E': '#91B6C8', '#829DB3': '#91B6C8',
          '#1e3a8a': '#64799B', '#2563eb': '#64799B', '#2F4B6E': '#64799B', '#3A5A80': '#64799B', '#647B91': '#64799B'
        };
        const walk = (obj: any) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach(walk);
          } else if (typeof obj === 'object') {
            for (let k in obj) {
              if (k === 'colorCode' && typeof obj[k] === 'string') {
                const oldColor = obj[k].toUpperCase();
                // Check against map (case-insensitive keys)
                const mapped = Object.keys(colorMap).find(m => m.toUpperCase() === oldColor);
                if (mapped) obj[k] = colorMap[mapped];
              } else {
                walk(obj[k]);
              }
            }
          }
        }
        walk(parsed);
        return parsed;
      }

    } catch (e) {
      console.warn('[useWbsData] Failed to load wbsSequenceState from localStorage:', e);
    }
    return DEFAULT_STATE;
  });

  const getPhasesSummary = (): PhaseData[] => {
    return [
      { name: 'COMPETITIVE SELECTION PROCESS', data: data.localNodesData?.['COMPETITIVE SELECTION PROCESS'] || [] },
      { name: 'PRE-DEVELOPMENT PHASE 1', data: data.localNodesData?.['PRE-DEVELOPMENT PHASE 1'] || [] },
      { name: 'PRE-DEVELOPMENT PHASE 2', data: data.localNodesData?.['PRE-DEVELOPMENT PHASE 2'] || [] },
      { name: 'PRE-DEVELOPMENT PHASE 3', data: data.localPreDevPhase3 || [] },
      { name: 'DEVELOPMENT PHASE', data: data.localDevelopmentPhase || [] },
      { name: 'POST-DEVELOPMENT PHASE', data: data.localPostDevPhase || [] },
      { name: 'OTHERS', data: [...(data.localOffsets1 || []), ...(data.localOffsets2 || []), ...(data.localOffsets3 || []), ...(data.localOffsets4 || [])] }
    ];
  };

  const saveNode = (updatedNode: NodeData) => {
    const listKeys = ['localOffsets1', 'localOffsets2', 'localPreDevPhase3', 'localDevelopmentPhase', 'localOffsets3', 'localPostDevPhase', 'localOffsets4'];
    let nextState = structuredClone(data);
    
    // Look in localNodesData first
    let found = false;
    for (const key in nextState.localNodesData) {
      const arr = nextState.localNodesData[key];
      const idx = arr.findIndex((n: NodeData) => n.id === updatedNode.id);
      if (idx !== -1) {
        arr[idx] = updatedNode;
        found = true;
        break;
      }
    }
    
    if (!found) {
        for (const key of listKeys) {
          const arr = nextState[key];
          if(arr) {
              const idx = arr.findIndex((n: NodeData) => n.id === updatedNode.id);
              if (idx !== -1) {
                arr[idx] = updatedNode;
                found = true;
                break;
              }
          }
        }
    }

    if (found) {
        setData(nextState);
        try {
          localStorage.setItem('wbsSequenceState', JSON.stringify(nextState));
        } catch (e) {
          console.error('[useWbsData] Failed to save wbsSequenceState to localStorage:', e);
        }
        window.dispatchEvent(new CustomEvent('wbs-sequence-updated'));
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      
      try {
        const saved = localStorage.getItem('wbsSequenceState');
        if (saved) {
          let parsed = JSON.parse(saved);
          const colorMap: Record<string, string> = {
            '#eab308': '#D6B77A', '#D9A441': '#D6B77A', '#C5A56D': '#D6B77A', '#D4B886': '#D6B77A',
            '#0ea5e9': '#91B6C8', '#5C7C9E': '#91B6C8', '#829DB3': '#91B6C8', '#8CA3B8': '#91B6C8',
            '#1e3a8a': '#64799B', '#2563eb': '#64799B', '#2F4B6E': '#64799B', '#3A5A80': '#64799B', '#647B91': '#64799B', '#6B829A': '#64799B'
          };
          const walk = (obj: any) => {
            if (!obj) return;
            if (Array.isArray(obj)) obj.forEach(walk);
            else if (typeof obj === 'object') {
              for (let k in obj) {
                if (k === 'colorCode' && typeof obj[k] === 'string') {
                  const oldColor = obj[k].toUpperCase();
                  const mapped = Object.keys(colorMap).find(m => m.toUpperCase() === oldColor);
                  if (mapped) obj[k] = colorMap[mapped];
                } else walk(obj[k]);
              }
            }
          };
          walk(parsed);
          setData(parsed);
        }
      } catch (e) {

        console.warn('[useWbsData] handleUpdate failed to parse wbsSequenceState:', e);
      }
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('wbs-sequence-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('wbs-sequence-updated', handleUpdate);
    };
  }, []);

  return { data, getPhasesSummary, saveNode };
}
