
        // ===== Access-control helpers for legacy vanilla pages =====
        window.__legacyAccessToast = function(message) {
            if (window.showToast) window.showToast(message, 'error');
            else alert(message);
        };

        window.legacyHasPermission = function(pageOrKey, action = 'view') {
            const access = window.__suwecoAccess;
            if (!access || typeof access.hasPermission !== 'function') {
                console.warn('[Access] AccessProvider not ready for', pageOrKey, action);
                return false;
            }
            return access.hasPermission(pageOrKey, action);
        };

        window.legacyCanAdd = function(pageOrKey) {
            return window.legacyHasPermission(pageOrKey, 'add');
        };

        window.legacyCanEdit = function(pageOrKey, row) {
            const access = window.__suwecoAccess;
            if (access && typeof access.canEditRow === 'function') {
                return access.canEditRow(pageOrKey, row || {});
            }
            return window.legacyHasPermission(pageOrKey, 'edit');
        };

        window.legacyCanDelete = function(pageOrKey, row) {
            const access = window.__suwecoAccess;
            if (access && typeof access.canDeleteRow === 'function') {
                return access.canDeleteRow(pageOrKey, row || {});
            }
            return window.legacyHasPermission(pageOrKey, 'delete');
        };

        window.legacyGuardAdd = function(pageOrKey) {
            if (!window.legacyCanAdd(pageOrKey)) {
                window.__legacyAccessToast('You are not allowed to add records on this page.');
                return false;
            }
            return true;
        };

        window.legacyGuardEdit = function(pageOrKey, row) {
            if (!window.legacyCanEdit(pageOrKey, row || {})) {
                window.__legacyAccessToast('You are not allowed to edit this record.');
                return false;
            }
            return true;
        };

        window.legacyGuardDelete = function(pageOrKey, row) {
            if (!window.legacyCanDelete(pageOrKey, row || {})) {
                window.__legacyAccessToast('You are not allowed to delete this record.');
                return false;
            }
            return true;
        };


        // Mock Data
        window.__cleanupTasks = window.__cleanupTasks || [];
        window.projects = window.projects || [];
        let projects = window.projects;

        // Debug & Defensiveness
        window.validateHierarchy = function(projectId) {
            const sched = window.projectSchedules[projectId];
            if (!sched) return false;
            let healthy = true;
            for (const code in sched) {
                if (code.includes('.')) {
                    const pCode = code.split('.').slice(0, -1).join('.');
                    if (!sched[pCode]) {
                        console.warn(`[VALIDATION FAILED] Orphan task detected in ${projectId}: ${code} has no parent ${pCode}`);
                        healthy = false;
                    }
                }
            }
            return healthy;
        };
        window.validateTaskData = function(data, contextCode) {
            if (!data) return false;
            if (typeof data.computedProgress !== 'number' || isNaN(data.computedProgress)) {
                console.warn(`[VALIDATION FAILED] NaN/invalid progress in ${contextCode}`);
                return false;
            }
            if (data.computedProgress < 0 || data.computedProgress > 100) {
                console.warn(`[VALIDATION FAILED] Out of bounds progress in ${contextCode}: ${data.computedProgress}`);
                return false;
            }
            return true;
        };
        window.validateProgressTree = function(projectId) {
            const sched = window.projectSchedules[projectId];
            if(!sched) return;
            for (const code in sched) {
                window.validateTaskData(sched[code], code);
            }
        };

        let equipmentList = [
            'BAGGER MIXER', 'BOOM TRUCK', 'CRANE', 'DUMP TRUCK', 'FORD', 'FORKLIFT', 
            'GENERATOR', 'NFF8971', 'PLATE COMPACTOR', 'SBD', 'SBH', 'TRACTOR HEAD', 
            'WALK BEHIND', 'BACK HOE', 'MOBILE CRANE', 'WHEEL TYPE', 'WATER PUMP'
        ];

        const subtaskChargingOptions = [
            "A1 - BIDDING DOCUMENTS", "A2 - BIDDING SECURITY", "A3 - OTHER BIDDING EXPENSES",
            "B1 - LAND ACQUISITION", "B2.1 - LGU", "B2.2 - DENR TRANSACTION", "B2.3 - NCIP", "B2.4 - NWRB",
            "B2.5 - CERTIFICATE OF ENDORSEMENT APPLICATION (COE) WITH DOE", "B2.6 - ERC APPLICATION",
            "B2.7 - EXTERNAL COUNSELS", "B3.1 - GENERAL FEASIBILITY STUDIES", "B3.2 - CIVIL WORKS STUDIES",
            "B3.3 - ELECTRICAL WORKS STUDIES", "B3.4 - MECHANICAL WORKS STUDIES", "B3.5 - POWER SYSTEM SOFTWARE",
            "B4.1 - WATER CONNECTION", "B4.2 - ELECTRICAL CONNECTION", "B4.3 - INTERNET CONNECTION",
            "B5.1 - SPECIAL TOOLS", "B5.2 - OFFICE SUPPLIES", "B5.3 - STAFF HOUSE SUPPLIES", "B5.4 - SAFETY PPE",
            "B5.5 - FIRE PROTECTION", "B6.1 - SHARED SERVICES", "B6.2 - MANILA ADMIN", "B6.3 - PROJECT ADMIN",
            "B6.4 - OTHER ADMIN COST", "C1.1 - INTERNATIONAL LOGISTICS", "C1.2 - LOCAL LOGISTICS",
            "C2.1 - MOBILIZATION (PROCUREMENT)", "C2.2 - TEMPORARY FACILITIES (PROCUREMENT)",
            "C2.3 - SITE GRADING (PROCUREMENT)", "C2.4 - ROAD DEVELOPMENT (Internal Access Road) (PROCUREMENT)",
            "C2.5 - ROAD DEVELOPMENT (Right of way) (PROCUREMENT)", "C2.6 - DOMESTIC WATER SYSTEM (PROCUREMENT)",
            "C2.7 - DRAINAGE SYSTEM (PROCUREMENT)", "C2.8 - SLOPE PROTECTION (PROCUREMENT)",
            "C2.9 - CONTROL BUILDING (PROCUREMENT)", "C2.10 - WAREHOUSE AND WORKSHOP BUILDING (PROCUREMENT)",
            "C2.11 - ADMIN AND AMENITIES BUILDING (PROCUREMENT)", "C2.12 - GUARD HOUSE (PROCUREMENT)",
            "C2.13 - MATERIAL RECOVERY FACILITY (PROCUREMENT)", "C2.14 - LIGHTNING PROTECTION (PROCUREMENT)",
            "C2.15 - CHB FENCE & GATE (PROCUREMENT)", "C2.16 - CCTV SYSTEM (PROCUREMENT)",
            "C3.1 - FOUNDATION WORKS (PROCUREMENT)", "C3.2 - FUEL SYSTEM (PROCUREMENT)",
            "C3.3 - LUBE OIL SYSTEM (PROCUREMENT)", "C3.4 - TRENCH WORKS (PROCUREMENT)",
            "C3.5 - GENERATOR SET & SKID ASSEMBLY (PROCUREMENT)", "C3.6 - WIRING & TERMINATION (PROCUREMENT)",
            "C3.7 - GROUNDING SYSTEM (Equiment & Materials) (PROCUREMENT)", "C4.1 - TRANSMISSION LINE (PROCUREMENT)",
            "C4.2 - TRANSFORMER & DISCONNECT SWITCH FOUNDATION (PROCUREMENT)",
            "C4.3 - CABLE TRENCH, MANHOLE, & DUCT BANK (PROCUREMENT)", "C4.4 - TRANSFORMER INSTALLATION (PROCUREMENT)",
            "C4.5 - SUBSTATION PROTECTION (PROCUREMENT)", "C4.6 - REVENUE WIRING AND TERMINATION (PROCUREMENT)",
            "C4.7 - CABLE WIRING AND TERMINATION (PROCUREMENT)", "C4.8 - SECLUSION FENCE AND GATE (PROCUREMENT)",
            "C4.9 - GROUNDING SYSTEM (PROCUREMENT)", "C5.1 - SCADA system (PROCUREMENT)",
            "C6.1 - CONSUMABLES (PROCUREMENT)", "C7 - MISCELLANEOUS (PROCUREMENT)",
            "D1.1 - MOBILIZATION (CONSTRUCTION)", "D1.2 - TEMPORARY FACILITIES (CONSTRUCTION)",
            "D1.3 - SITE GRADING (CONSTRUCTION)", "D1.4 - ROAD DEVELOPMENT (Internal Access Road) (CONSTRUCTION)",
            "D1.5 - ROAD DEVELOPMENT (Right of way) (CONSTRUCTION)", "D1.6 - DOMESTIC WATER SYSTEM (CONSTRUCTION)",
            "D1.7 - DRAINAGE SYSTEM (CONSTRUCTION)", "D1.8 - SLOPE PROTECTION (CONSTRUCTION)",
            "D1.9 - CONTROL BUILDING (CONSTRUCTION)", "D1.10 - WAREHOUSE AND WORKSHOP BUILDING (CONSTRUCTION)",
            "D1.11 - ADMIN AND AMENITIES BUILDING (CONSTRUCTION)", "D1.12 - GUARD HOUSE (CONSTRUCTION)",
            "D1.13 - MATERIAL RECOVERY FACILITY (CONSTRUCTION)", "D1.14 - LIGHTNING PROTECTION (CONSTRUCTION)",
            "D1.15 - CHB FENCE & GATE (CONSTRUCTION)", "D1.16 - CCTV SYSTEM (CONSTRUCTION)",
            "D2.1 - FOUNDATION WORKS (CONSTRUCTION)", "D2.2 - FUEL SYSTEM (CONSTRUCTION)",
            "D2.3 - LUBE OIL SYSTEM (CONSTRUCTION)", "D2.4 - TRENCH WORKS (CONSTRUCTION)",
            "D2.5 - GENERATOR SET & SKID ASSEMBLY (CONSTRUCTION)", "D2.6 - WIRING & TERMINATION (CONSTRUCTION)",
            "D2.7 - GROUNDING SYSTEM (CONSTRUCTION)", "D3.1 - TRANSMISSION LINE (TIELCO) (CONSTRUCTION)",
            "D3.2 - TRANSFORMER & DISCONNECT SWITCH FOUNDATION (CONSTRUCTION)",
            "D3.3 - CABLE TRENCH, MANHOLE, & DUCT BANK (CONSTRUCTION)", "D3.4 - TRANSFORMER INSTALLATION (CONSTRUCTION)",
            "D3.5 - SUBSTATION PROTECTION (CONSTRUCTION)", "D3.6 - REVENUE WIRING AND TERMINATION (CONSTRUCTION)",
            "D3.7 - CABLE WIRING AND TERMINATION (CONSTRUCTION)", "D3.8 - SECLUSION FENCE AND GATE (CONSTRUCTION)",
            "D3.9 - GROUNDING SYSTEM (LABOR) (CONSTRUCTION)", "D4.1 - SCADA system (CONSTRUCTION)",
            "D5.1 - CONSUMABLES (CONSTRUCTION)", "D6 - MISCELLANEOUS (CONSTRUCTION)"
        ];
        
        window.subtaskChargingOptions = subtaskChargingOptions;

                window.updateProjectScheduleStats = function(projectId) {
            if (!projectId) {
                console.warn('[ProjectSchedule] Missing projectId in updateProjectScheduleStats.');
                return;
            }
            if (!window.subtaskChargingOptions || !window.subtaskChargingOptions.length) {
                console.warn('[ProjectSchedule] Missing subtaskChargingOptions. Ensure options are loaded before stats calculation.');
            }

            let customProjectScheduleTasks = window.customProjectScheduleTasks || {};
            let combinedOptions = [...(window.subtaskChargingOptions||[]), ...(customProjectScheduleTasks[projectId] || [])];
            
            if(!window.projectSchedules) window.projectSchedules = {};
            if(!window.projectSchedules[projectId]) { window.projectSchedules[projectId] = {}; }
            let sched = window.projectSchedules[projectId];

            // Build map of all codes
            let allCodes = [];
            combinedOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
                if (match) {
                    const category = match[1];
                    const code = match[1] + match[2];
                    if(!sched[code]) {
                        sched[code] = {
                            duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                            actualStart: '', actualEnd: '', actualQty: '', targetQty: ''
                        };
                    }
                    allCodes.push(code);
                }
            });

            // implicitly generate parent codes if not present
            let codesSet = new Set(allCodes);
            allCodes.forEach(code => {
                let parts = code.split('.');
                while (parts.length > 1) {
                    parts.pop();
                    let pCode = parts.join('.');
                    if (!codesSet.has(pCode)) {
                        codesSet.add(pCode);
                        if (!sched[pCode]) {
                            sched[pCode] = {
                                duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                                actualStart: '', actualEnd: '', actualQty: '', targetQty: ''
                            };
                        }
                    }
                }
            });
            allCodes = Array.from(codesSet).sort((a,b) => b.length - a.length); // deepest first

            // Child mapping
            const childrenMap = {};
            const isLeaf = {};
            allCodes.forEach(code => { childrenMap[code] = []; isLeaf[code] = true; });
            allCodes.forEach(code => {
                if (code.includes('.')) {
                    let parts = code.split('.');
                    let pCode = parts.slice(0, parts.length - 1).join('.');
                    if (childrenMap[pCode] !== undefined) {
                        childrenMap[pCode].push(code);
                        isLeaf[pCode] = false;
                    }
                }
            });

            // activity mapping
            let reportsByTaskId = {};
            if (typeof window.getOrCreateWeeks === 'function') {
                const hist = window.getOrCreateWeeks(projectId);
                if(hist && hist.reports) {
                    hist.reports.forEach(r => { reportsByTaskId[r.taskId] = true; });
                }
            }

            const today = new Date();
            today.setHours(0,0,0,0);

            let weightedProgress = 0;
            let totalWeight = 0;

            // Pass 1: Leaf node calculations
            allCodes.forEach(code => {
                if (isLeaf[code]) {
                    let data = sched[code];
                    let taskProg = 0;

                    const parseQty = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        const cleaned = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
                        return Number(cleaned) || 0;
                    };
                    const t = parseQty(data.targetQty);
                    const a = parseQty(data.actualQty);
                    const tSafe = Math.max(0, t);
                    const aSafe = Math.max(0, a);
                    const manualP = (data.computedProgress !== undefined && data.computedProgress !== '') 
                        ? Number(data.computedProgress) 
                        : 0;
                    const manualPSafe = (isNaN(manualP) || manualP < 0) ? 0 : manualP;

                    if (tSafe > 0) {
                        taskProg = (aSafe / tSafe) * 100;
                    } else {
                        taskProg = manualPSafe;
                    }

                    taskProg = isNaN(taskProg) ? 0 : Math.max(0, Math.min(100, taskProg));
                    data.computedProgress = taskProg;
                    if(window.validateTaskData) window.validateTaskData(data, code);

                    const hasStartDate = !!data.actualStart || !!data.targetStart;
                    const hasActualQty = aSafe > 0;
                    const hasActivity = reportsByTaskId[code];
                    const isCompletedByQty = (tSafe > 0 && aSafe >= tSafe);

                    if (taskProg >= 100 || isCompletedByQty) {
                        data.status = 'Completed';
                        data.computedProgress = 100;
                    } else if (data.targetEnd && new Date(data.targetEnd) < today && taskProg < 100) {
                        data.status = 'Overdue';
                    } else if (hasStartDate || hasActualQty || hasActivity || taskProg > 0) {
                        data.status = 'In Progress';
                    } else {
                        data.status = 'Not Started';
                    }

                    let durationDays = 1;
                    if (data.targetStart && data.targetEnd) {
                        const ds = new Date(data.targetStart);
                        const de = new Date(data.targetEnd);
                        if (de >= ds) {
                            durationDays = Math.ceil((de.getTime() - ds.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        }
                    } else if (Number(data.duration) > 0) {
                        durationDays = Number(data.duration);
                    }

                    weightedProgress += (data.computedProgress * durationDays);
                    totalWeight += durationDays;
                }
            });

            // Pass 2: Parent rollup aggregation
            allCodes.forEach(code => {
                if (!isLeaf[code]) {
                    let data = sched[code];
                    let allCompleted = true;
                    let allNotStarted = true;
                    let anyOverdueObj = false;
                    let anyInProgress = false;

                    let sumChildProg = 0;
                    let validChildrenCount = 0;

                    let minStart = null, maxEnd = null;
                    let actualMinStart = null, actualMaxEnd = null;

                    childrenMap[code].forEach(cCode => {
                        let cData = sched[cCode];
                        let cProg = Number(cData.computedProgress);
                        if (!isNaN(cProg)) {
                            sumChildProg += cProg;
                            validChildrenCount++;
                        }

                        if (cData.targetStart && (!minStart || new Date(cData.targetStart) < minStart)) minStart = new Date(cData.targetStart);
                        if (cData.targetEnd && (!maxEnd || new Date(cData.targetEnd) > maxEnd)) maxEnd = new Date(cData.targetEnd);
                        if (cData.actualStart && (!actualMinStart || new Date(cData.actualStart) < actualMinStart)) actualMinStart = new Date(cData.actualStart);
                        if (cData.actualEnd && (!actualMaxEnd || new Date(cData.actualEnd) > actualMaxEnd)) actualMaxEnd = new Date(cData.actualEnd);

                        if (cData.status !== 'Completed') allCompleted = false;
                        if (cData.status !== 'Not Started') allNotStarted = false;
                        if (cData.status === 'Overdue' || (cData.status !== 'Completed' && cData.targetEnd && new Date(cData.targetEnd) < today)) anyOverdueObj = true;
                        if (cData.status === 'In Progress' || cData.status === 'Completed') anyInProgress = true;
                    });

                    let avgChildProg = validChildrenCount > 0 ? (sumChildProg / validChildrenCount) : 0;
                    avgChildProg = isNaN(avgChildProg) ? 0 : Math.max(0, Math.min(100, avgChildProg));
                    
                    data.computedProgress = avgChildProg;
                    if(window.validateTaskData) window.validateTaskData(data, code);

                    data.targetQty = '';
                    data.actualQty = '';

                    if(minStart) { let yr = minStart.getFullYear(); let m = String(minStart.getMonth()+1).padStart(2, '0'); let d = String(minStart.getDate()).padStart(2, '0'); data.targetStart = `${yr}-${m}-${d}`; }
                    if(maxEnd) { let yr = maxEnd.getFullYear(); let m = String(maxEnd.getMonth()+1).padStart(2, '0'); let d = String(maxEnd.getDate()).padStart(2, '0'); data.targetEnd = `${yr}-${m}-${d}`; }
                    if(actualMinStart) { let yr = actualMinStart.getFullYear(); let m = String(actualMinStart.getMonth()+1).padStart(2, '0'); let d = String(actualMinStart.getDate()).padStart(2, '0'); data.actualStart = `${yr}-${m}-${d}`; }
                    if(actualMaxEnd) { let yr = actualMaxEnd.getFullYear(); let m = String(actualMaxEnd.getMonth()+1).padStart(2, '0'); let d = String(actualMaxEnd.getDate()).padStart(2, '0'); data.actualEnd = `${yr}-${m}-${d}`; }

                    let durationDays = 1;
                    if (data.targetStart && data.targetEnd) {
                        const ds = new Date(data.targetStart);
                        const de = new Date(data.targetEnd);
                        if (de >= ds) {
                            durationDays = Math.ceil((de.getTime() - ds.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            data.duration = durationDays;
                        }
                    } else if (Number(data.duration) > 0) {
                        durationDays = Number(data.duration);
                    }

                    if (childrenMap[code].length === 0) {
                        data.status = 'Not Started';
                    } else if (allCompleted) {
                        data.status = 'Completed';
                        data.computedProgress = 100;
                    } else if (anyOverdueObj) {
                        data.status = 'Overdue';
                    } else if (anyInProgress || (!allCompleted && !allNotStarted)) {
                        data.status = 'In Progress';
                    } else {
                        data.status = 'Not Started';
                    }
                }
            });

            let targetWeightedProgress = 0;
            let targetTotalWeight = 0;

            allCodes.forEach(code => {
                if (!isLeaf[code]) return;

                const data = sched[code];
                let durationDays = 1;
                let expectedProgress = 0;

                if (data.targetStart && data.targetEnd) {
                    const ds = new Date(data.targetStart);
                    const de = new Date(data.targetEnd);

                    if (!isNaN(ds.getTime()) && !isNaN(de.getTime()) && de >= ds) {
                        durationDays = Math.ceil((de.getTime() - ds.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        if (today < ds) {
                            expectedProgress = 0;
                        } else if (today >= de) {
                            expectedProgress = 100;
                        } else {
                            const elapsedDays = Math.ceil((today.getTime() - ds.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            expectedProgress = (elapsedDays / durationDays) * 100;
                        }
                    }
                } else if (Number(data.duration) > 0) {
                    durationDays = Number(data.duration);
                    expectedProgress = 0;
                }

                targetWeightedProgress += (Math.max(0, Math.min(100, expectedProgress)) * durationDays);
                targetTotalWeight += durationDays;
            });

            let finalOverall = totalWeight > 0 ? (weightedProgress / totalWeight) : 0;
            let finalTarget = targetTotalWeight > 0 ? (targetWeightedProgress / targetTotalWeight) : 0;

            sched._overallProgressPct = isNaN(finalOverall) ? 0 : Math.max(0, Math.min(100, finalOverall));
            sched._targetProgressPct = isNaN(finalTarget) ? 0 : Math.max(0, Math.min(100, finalTarget));
            sched._variancePct = sched._overallProgressPct - sched._targetProgressPct;
        };


        // DOM Elements
        Object.defineProperty(window, 'contentArea', { get: () => document.getElementById('contentArea') });
        const themeToggle = document.getElementById('themeToggle');
        const htmlEl = document.documentElement;
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileDrawer = document.getElementById('mobileDrawer');
        const subNavBar = document.getElementById('subNavBar');
        const mobileSubNav = document.getElementById('mobileSubNav');
        const selectedProjectName = document.getElementById('selectedProjectName');
        const breadcrumbProjectName = document.getElementById('breadcrumbProjectName');
        
        const newProjectModal = document.getElementById('newProjectModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelModalBtn = document.getElementById('cancelModalBtn');
        const newProjectForm = document.getElementById('newProjectForm');

        let currentProjectId = null;
        let editingProjectId = null;
        
        window._setCurrentProjectId = function(id) {
            currentProjectId = id;
            window.currentProjectId = id;
        };
        let currentCalendarDate = new Date();
        let selectedCalendarDate = new Date();

        // --- TASK DASHBOARD STATE ---
        let tdFilterPhase = 'All';
        let tdFilterDept = 'All';
        let tdFilterPerson = 'All';
        let tdFilterStatus = 'All';
        let tdActiveTab = 'wbs';
        let tdShowWbsSequence = true;
        let tdShowKanbanDeadline = false;
        let tdSearchText = '';
        let tdSelectedTask = null;
        let tdWbsSequenceTitle = 'WBS Sequence - Alcantara DPP';

        window.mockTasks = [
            { wbs: '1.1', name: 'DENR - ONLINE REGISTRATION', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Permitting', owner: 'System', status: 'COMPLETED', start: '2026-02-10', due: '2026-02-20' },
            { wbs: '1.2', name: 'LOT ACQUISITION', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Legal', owner: 'Jane Smith', status: 'ONGOING', start: '2026-03-01', due: '2026-04-15' },
            { wbs: '1.3', name: 'TECHNICAL STUDIES', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Engineering', owner: 'John Doe', status: 'COMPLETED', start: '2026-02-02', due: '2026-03-31' },
            { wbs: '1.4', name: 'ENGINEERING DESIGNS', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Engineering', owner: 'Jane Smith', status: 'COMPLETED', start: '2026-01-21', due: '2026-02-25' },
            { wbs: '1.5', name: 'WATER CONNECTION', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Permitting', owner: 'System', status: 'ONGOING', start: '2026-03-20', due: '2026-04-30' },
            { wbs: '1.6', name: 'BANK FINANCING', phase: 'PRE-DEVELOPMENT PHASE 1', dept: 'Legal', owner: 'John Doe', status: 'ONGOING', start: '2026-03-08', due: '2026-04-20' },
            { wbs: '2.1', name: 'BRGY. RESOLUTION', phase: 'PRE-DEVELOPMENT PHASE 2', dept: 'Legal', owner: 'Jane Smith', status: 'COMPLETED', start: '2026-01-21', due: '2026-02-20' },
            { wbs: '2.2', name: 'SB RESOLUTION NO OBJECTION', phase: 'PRE-DEVELOPMENT PHASE 2', dept: 'Legal', owner: 'Jane Smith', status: 'ONGOING', start: '2026-02-03', due: '2026-04-30' },
            { wbs: '2.3', name: 'MPDC - ZONING CERTIFICATE', phase: 'PRE-DEVELOPMENT PHASE 2', dept: 'Permitting', owner: 'System', status: 'ONGOING', start: '2026-03-01', due: '2026-03-15' },
            { wbs: '3.1', name: 'NWRB - WATER PERMIT', phase: 'PRE-DEVELOPMENT PHASE 3', dept: 'Permitting', owner: 'System', status: 'NOT STARTED', start: '2026-05-01', due: '2026-06-30' },
            { wbs: '4.1', name: 'PROCUREMENT AND CONSTRUCTION', phase: 'DEVELOPMENT PHASE', dept: 'Procurement', owner: 'John Doe', status: 'ONGOING', start: '2026-03-01', due: '2026-08-01' },
            { wbs: '5.1', name: 'TESTING AND COMMISSIONING', phase: 'POST-DEVELOPMENT PHASE', dept: 'Engineering', owner: 'Jane Smith', status: 'NOT STARTED', start: '2026-08-01', due: '2026-09-01' },
            { wbs: '5.2', name: 'COMMERCIAL OPERATIONS', phase: 'POST-DEVELOPMENT PHASE', dept: 'Legal', owner: 'System', status: 'NOT STARTED', start: '2026-09-02', due: '2026-12-31' }
        ];

        // Theme Management
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlEl.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // Mobile Menu
        mobileMenuBtn.addEventListener('click', () => {
            mobileDrawer.classList.toggle('open');
        });

        // Close drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileDrawer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileDrawer.classList.remove('open');
            }
        });

        // Modal Management
        window.openProjectModal = (projectId = null) => {
            const existingProjectForAccess = projectId ? (window.projects || projects || []).find(p => String(p.id) === String(projectId)) : null;
            if (projectId ? !window.legacyGuardEdit('projects', existingProjectForAccess) : !window.legacyGuardAdd('projects')) return;
            editingProjectId = projectId;
            if (projectId) {
                document.querySelector('#newProjectModal h2').textContent = 'Edit Project';
                document.querySelector('#newProjectModal button[type="submit"]').textContent = 'Save Changes';
                const p = projects.find(p => p.id === projectId);
                if (p) {
                    document.getElementById('projTitle').value = p.title;
                    document.getElementById('projStatus').value = p.status;
                    document.getElementById('projDate').value = p.dueDate;
                    document.getElementById('projBudget').value = p.budget || '';
                }
            } else {
                document.querySelector('#newProjectModal h2').textContent = 'Create New Project';
                document.querySelector('#newProjectModal button[type="submit"]').textContent = 'Create Project';
                newProjectForm.reset();
            }
            newProjectModal.classList.add('active');
        };
        
        window.editProject = function(id) {
            openProjectModal(id);
        };
        
        window.customConfirm = function(message, callback) {
            let oldOverlay = document.getElementById('customConfirmOverlay');
            if (oldOverlay) oldOverlay.remove();
            
            let overlay = document.createElement('div');
            overlay.id = 'customConfirmOverlay';
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '9999';
            overlay.innerHTML = `
                <div class="modal" style="max-width: 400px; text-align: center; display: flex; flex-direction: column;">
                    <div style="padding: 24px;">
                        <h3 style="margin-top: 0; font-size: 1.1rem; margin-bottom: 12px; color: var(--text-main); font-weight: 700;">Confirm Action</h3>
                        <p id="customConfirmMessage" style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5;"></p>
                        <div style="display: flex; justify-content: center; gap: 12px;">
                            <button class="btn btn-secondary" onclick="document.getElementById('customConfirmOverlay').remove()">Cancel</button>
                            <button class="btn btn-primary" id="customConfirmOkBtn">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            document.getElementById('customConfirmMessage').textContent = message;
            document.getElementById('customConfirmOkBtn').onclick = function() {
                overlay.remove();
                callback();
            };
        };

        window.deleteProject = function(id) {
            const existingProjectForAccess = (window.projects || projects || []).find(p => String(p.id) === String(id));
            if (!window.legacyGuardDelete('projects', existingProjectForAccess)) return;
            customConfirm('Are you sure you want to delete this project?', () => {
                projects = projects.filter(p => p.id !== id);
                window.projects = projects;
                if (typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('projectsUpdated'));
                }
                if (currentProjectId === id) {
                    currentProjectId = null;
                    updateSubNavVisibility();
                }
                if (currentView === 'projects') renderProjectsView();
                else {
  console.warn('[Legacy] Dashboard fallback skipped.');
}
            });
        };

        window.openModal = () => newProjectModal.classList.add('active');
        const closeModal = () => {
            newProjectModal.classList.remove('active');
            newProjectForm.reset();
        };

        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);
        newProjectModal.addEventListener('click', (e) => {
            if (e.target === newProjectModal) closeModal();
        });

        // Form Submission
        newProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('projTitle').value;
            const status = document.getElementById('projStatus').value;
            const dueDate = document.getElementById('projDate').value;
            const budgetVal = document.getElementById('projBudget').value;
            
            if (editingProjectId) {
                const p = projects.find(p => p.id === editingProjectId);
                if (p) {
                    p.title = title;
                    p.status = status;
                    p.dueDate = dueDate;
                    p.budget = budgetVal ? parseInt(budgetVal, 10) : 0;
                    window.projects = projects;
                    if (typeof window.dispatchEvent === 'function') {
                        window.dispatchEvent(new CustomEvent('projectsUpdated'));
                    }
                }
            } else {
                const newProject = {
                    id: Date.now(),
                    title,
                    status,
                    progress: 0,
                    dueDate,
                    budget: budgetVal ? parseInt(budgetVal, 10) : 0,
                    tasks: []
                };
                projects.unshift(newProject);
                window.projects = projects;
                // Trigger an immediate UI update
                if (typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('projectsUpdated'));
                }
                closeModal();
                renderProjectView(newProject.id);
                return;
            }
            closeModal();
            if (currentView === 'projects') renderProjectsView();
            else {
  console.warn('[Legacy] Dashboard fallback skipped.');
}
            updateSubNavVisibility();
        });

        let sortBy = 'dueDate';
        let sortAsc = true;
        let currentView = 'dashboard';

        function getKPIs() {
            const total = projects.length;
            const active = projects.filter(p => p.status === 'Active').length;
            const completed = projects.filter(p => p.status === 'Completed').length;
            const avgProgress = total === 0 ? 0 : Math.round(projects.reduce((sum, p) => sum + (window.projectSchedules && window.projectSchedules[p.id] ? (window.projectSchedules[p.id]._overallProgressPct || 0) : (p.progress || 0)), 0) / total);
            return { total, active, completed, avgProgress };
        }

        function sortProjects(projectsArray) {
            return [...projectsArray].sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];
                
                if (sortBy === 'dueDate') {
                    valA = new Date(valA).getTime();
                    valB = new Date(valB).getTime();
                } else if (sortBy === 'title' || sortBy === 'status') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortAsc ? -1 : 1;
                if (valA > valB) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        window.handleSortChange = function(value) {
            sortBy = value;
            if (currentView === 'dashboard') {
  console.warn('[Legacy] Dashboard render skipped because dashboard is now React.');
}
            else if (currentView === 'projects') renderProjectsView();
        }

        window.toggleSortDirection = function() {
            sortAsc = !sortAsc;
            if (currentView === 'dashboard') {
  console.warn('[Legacy] Dashboard render skipped because dashboard is now React.');
}
            else if (currentView === 'projects') renderProjectsView();
        }

        window.goBack = function() {
            if (currentView === 'projects') renderProjectsView();
            else {
  console.warn('[Legacy] Dashboard fallback skipped.');
}
        }

        function generateProjectCardsHtml(projectsToRender) {
            let html = '<div class="project-grid">';
            projectsToRender.forEach(p => {
                const statusClass = p.status.toLowerCase();
                html += `
                    <div class="project-card" onclick="renderProjectView(${p.id})">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">${p.title}</h3>
                                <div class="card-subtitle">Due: ${new Date(p.dueDate).toLocaleDateString()}</div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="badge ${statusClass}">${p.status}</span>
                                <button class="icon-btn" onclick="event.stopPropagation(); editProject(${p.id})" title="Edit Project" style="padding: 4px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="icon-btn" onclick="event.stopPropagation(); deleteProject(${p.id})" title="Delete Project" style="padding: 4px; color: var(--danger);">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Progress</span>
                                <span>${window.projectSchedules && window.projectSchedules[p.id] ? Math.round(window.projectSchedules[p.id]._overallProgressPct || 0) : Math.round(p.progress || 0)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${window.projectSchedules && window.projectSchedules[p.id] ? Math.round(window.projectSchedules[p.id]._overallProgressPct || 0) : Math.round(p.progress || 0)}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }

        // Render Dashboard (KPIs + Project Grid)
        window.renderDashboard = function() { console.warn('[Legacy] Attempted to call removed renderer: renderDashboard'); };

        // Render Projects View (Just Project Grid)
        window.renderProjectsView = function() {
            currentView = 'projects';
            currentProjectId = null;
            updateSubNavVisibility();
            
            const sortedProjects = sortProjects(projects);
            
            let html = `
                <div class="view-header">
                    <h1>All Projects</h1>
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <button class="btn btn-primary" onclick="openProjectModal()">+ New Project</button>
                        <div class="sort-controls">
                            <label>Sort by:</label>
                            <select id="sortSelect" onchange="handleSortChange(this.value)">
                                <option value="dueDate" ${sortBy === 'dueDate' ? 'selected' : ''}>Due Date</option>
                                <option value="title" ${sortBy === 'title' ? 'selected' : ''}>Title</option>
                                <option value="status" ${sortBy === 'status' ? 'selected' : ''}>Status</option>
                            </select>
                            <button class="btn btn-secondary sort-btn" onclick="toggleSortDirection()">
                                ${sortAsc ? '↑ Asc' : '↓ Desc'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            html += generateProjectCardsHtml(sortedProjects);
            contentArea.innerHTML = html;
        }

        
        function getUnique(arr, key) {
            return ['All', ...new Set(arr.map(item => item[key]))];
        }

        function tdGetFilteredTasks() {
            return mockTasks.filter(t => {
                 if (tdFilterPhase !== 'All' && t.phase !== tdFilterPhase) return false;
                 if (tdFilterDept !== 'All' && t.dept !== tdFilterDept) return false;
                 if (tdFilterPerson !== 'All' && t.owner !== tdFilterPerson) return false;
                 if (tdFilterStatus !== 'All' && t.status !== tdFilterStatus) return false;
                 if (tdSearchText && !t.name.toLowerCase().includes(tdSearchText.toLowerCase()) && !t.wbs.toLowerCase().includes(tdSearchText.toLowerCase())) return false;
                 return true;
            });
        }

        window.tdResetFilters = function() {
             tdFilterPhase = 'All';
             tdFilterDept = 'All';
             tdFilterPerson = 'All';
             tdFilterStatus = 'All';
             tdSearchText = '';
             renderTaskDashboardView();
        }

        window.tdSetTab = function(tab) {
             tdActiveTab = tab;
             renderTaskDashboardView();
        }

        window.tdSelectTask = function(wbs) {
             tdSelectedTask = mockTasks.find(t => t.wbs === wbs) || null;
             renderTaskDashboardView();
        }

        window.tdUpdateFilter = function(key, val) {
             if (key === 'phase') tdFilterPhase = val;
             if (key === 'dept') tdFilterDept = val;
             if (key === 'person') tdFilterPerson = val;
             if (key === 'status') tdFilterStatus = val;
             if (key === 'search') tdSearchText = val;
             renderTaskDashboardView();
        }

        function renderTdPhaseOverview(tasks) {
            let completed = tasks.filter(t => t.status === 'COMPLETED').length;
            let total = tasks.length;
            let percentFormat = total === 0 ? 0 : Math.round((completed / total) * 100);

            // Group by phase
            const phaseGroups = {};
            tasks.forEach(t => {
                if (!phaseGroups[t.phase]) phaseGroups[t.phase] = [];
                phaseGroups[t.phase].push(t);
            });

            let orderedPhases = window.tdPhasesListForOverview || Object.keys(phaseGroups);

            let grids = orderedPhases.filter(phase => phase !== 'All').map(phase => {
                let pTasks = phaseGroups[phase] || [];
                let pCompleted = pTasks.filter(t => t.status === 'COMPLETED').length;
                let pTotal = pTasks.length;
                let pct = pTotal === 0 ? 0 : Math.round((pCompleted/pTotal)*100);
                
                let pOverdue = 0;
                if (window.dateFns) {
                     pOverdue = pTasks.filter(t => t.status !== 'COMPLETED' && window.dateFns.isBefore(window.dateFns.parseISO(t.due), new Date())).length;
                }

                return `
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; box-shadow: var(--shadow-sm);">
                        <div style="font-size:0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 16px; min-height: 40px;">${phase}</div>
                        <div style="display:flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px;">
                            <span style="color: var(--text-muted); font-weight:500;">Total: <span style="color: var(--text-main);">${pTotal}</span></span>
                            <span style="color:var(--badge-text-red); font-weight:600;">Overdue: ${pOverdue}</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: var(--badge-border-gray); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${pct}%; background: #0d9488; border-radius: 4px;"></div>
                        </div>
                        <div style="text-align: right; font-size: 0.75rem; font-weight: 600; color: #0d9488; margin-top: 6px;">${pct}% Completed</div>
                    </div>
                `;
            }).join('');

            return `
                <div style="padding: 24px; background: var(--bg-body); border-radius: 0 0 8px 8px;">
                    <div style="margin-bottom: 24px;">
                        <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Global Overall Status</h2>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="flex: 1; height: 16px; background: var(--badge-border-gray); border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-sm);">
                                <div style="height: 100%; width: ${percentFormat}%; background: linear-gradient(90deg, #3b82f6, #0ea5e9); border-radius: 8px; transition: width 0.5s ease;"></div>
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: var(--badge-text-blue);">${percentFormat}%</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        ${grids}
                    </div>
                </div>
            `;
        }

        function renderTdGanttChart(tasks) {
            let startOfTimeline = new Date('2026-01-01');
            let endOfTimeline = new Date('2026-12-31');
            let totalDays = 365;

            if (window.dateFns) {
                let dates = tasks.flatMap(t => [t.start, t.due]).map(d => window.dateFns.parseISO(d));
                if (dates.length > 0) {
                    startOfTimeline = window.dateFns.startOfMonth(window.dateFns.min(dates));
                    endOfTimeline = window.dateFns.endOfMonth(window.dateFns.max(dates));
                    totalDays = window.dateFns.differenceInDays(endOfTimeline, startOfTimeline);
                }
            }

            let monthsHtml = '';
            if (window.dateFns) {
                let curr = startOfTimeline;
                while (window.dateFns.isBefore(curr, endOfTimeline)) {
                    let next = window.dateFns.addMonths(curr, 1);
                    let daysInMonth = window.dateFns.differenceInDays(next, curr);
                    let widthPct = (daysInMonth / totalDays) * 100;
                    monthsHtml += `<div style="flex-basis: ${widthPct}%; text-align: left; padding-left: 8px; border-left: 1px solid var(--badge-border-gray); font-family: monospace;">${window.dateFns.format(curr, 'MMM yyyy')}</div>`;
                    curr = next;
                }
            } else {
                monthsHtml = `<div style="flex: 1; padding-left: 8px; border-left: 1px solid var(--badge-border-gray);">Timeline Range</div>`;
            }

            let rowsHtml = tasks.map(t => {
                let leftPct = 0;
                let widthPct = 20;
                
                if (window.dateFns) {
                     let tStart = window.dateFns.parseISO(t.start);
                     let tDue = window.dateFns.parseISO(t.due);
                     let daysOffset = window.dateFns.differenceInDays(tStart, startOfTimeline);
                     let daysWidth = Math.max(1, window.dateFns.differenceInDays(tDue, tStart));
                     leftPct = Math.max(0, (daysOffset / totalDays) * 100);
                     widthPct = Math.max(0.5, (daysWidth / totalDays) * 100);
                     if (leftPct + widthPct > 100) widthPct = 100 - leftPct;
                }

                let color = '#94a3b8'; // GRAY
                if (t.status === 'COMPLETED') color = '#22c55e'; // GREEN
                if (t.status === 'ONGOING') color = '#3b82f6'; // BLUE

                return `
                    <div style="display: flex; align-items: center; border-bottom: 1px solid var(--badge-bg-gray); padding: 12px 0;">
                        <div style="width: 25%; min-width: 250px; font-size: 0.8rem; font-weight: 600; color: var(--text-main); padding-right: 16px; border-right: 1px solid var(--badge-border-gray); display: flex; align-items: center; gap: 8px;">
                            <span style="color: #0d9488; font-family: monospace;">${t.wbs}</span>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.name}">${t.name}</span>
                        </div>
                        <div style="width: 75%; position: relative; height: 32px; background: transparent;">
                            <div onclick="tdSelectTask('${t.wbs}')" style="cursor:pointer; position: absolute; left: ${leftPct}%; width: ${widthPct}%; height: 24px; top: 4px; background: ${color}; border-radius: 4px; display: flex; align-items: center; padding: 0 8px; overflow: hidden; font-size: 0.65rem; color: #fff; font-weight: 600; text-shadow: 0 1px 1px rgba(0,0,0,0.2);">
                                ${t.status}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div style="padding: 24px; background: var(--bg-surface); border-radius: 0 0 8px 8px; overflow-x: auto;">
                    <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 24px; color: var(--text-main);">Project Timeline (Gantt)</h2>
                    <div style="min-width: 900px;">
                        <div style="display: flex; margin-bottom: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); border-bottom: 2px solid var(--badge-border-gray); padding-bottom: 8px;">
                            <div style="width: 25%; min-width: 250px; text-transform: uppercase;">Task / WBS</div>
                            <div style="width: 75%; display: flex; text-transform: uppercase;">
                                ${monthsHtml}
                            </div>
                        </div>
                        ${rowsHtml || '<div style="padding: 24px; text-align: center; color: #94a3b8; font-weight: 600;">No tasks map to timeline</div>'}
                    </div>
                </div>
            `;
        }

        window.renderTaskDashboardView = function() {
            currentView = 'task_dashboard';
            updateSubNavVisibility();
            
            let filteredTasks = tdGetFilteredTasks();

            let phases = getUnique(mockTasks, 'phase');
            if (!phases.includes('COMPETITIVE SELECTION PROCESS')) {
                phases.unshift('COMPETITIVE SELECTION PROCESS');
            }
            if (phases.includes('POST-DEVELOPMENT PHASE')) {
                let pIndex = phases.indexOf('POST-DEVELOPMENT PHASE');
                if (!phases.includes('OTHERS')) {
                    phases.splice(pIndex + 1, 0, 'OTHERS');
                }
            } else if (!phases.includes('OTHERS')) {
                phases.push('OTHERS');
            }

            window.tdPhasesListForOverview = phases;

            let depts = getUnique(mockTasks, 'dept');
            let persons = getUnique(mockTasks, 'owner');
            let statuses = ['All', 'NOT STARTED', 'ONGOING', 'COMPLETED', 'NOT APPLICABLE', 'DELAYED'];

            const phaseOptions = phases.map(p => `<option ${tdFilterPhase === p ? 'selected' : ''}>${p}</option>`).join('');
            const deptOptions = depts.map(p => `<option ${tdFilterDept === p ? 'selected' : ''}>${p}</option>`).join('');
            const personOptions = persons.map(p => `<option ${tdFilterPerson === p ? 'selected' : ''}>${p}</option>`).join('');
            const statusOptions = statuses.map(p => `<option ${tdFilterStatus === p ? 'selected' : ''}>${p}</option>`).join('');

            let tTotal = filteredTasks.length;
            let tComp = filteredTasks.filter(t => t.status === 'COMPLETED').length;
            let tInProg = filteredTasks.filter(t => t.status === 'ONGOING').length;
            let tOverdue = 0;
            if (window.dateFns) {
                 tOverdue = filteredTasks.filter(t => t.status !== 'COMPLETED' && window.dateFns.isBefore(window.dateFns.parseISO(t.due), new Date())).length;
            }

            let projectNameStr = 'Selected Project';
            if (window.currentProjectId && typeof projects !== 'undefined') {
               const pFound = projects.find(p => p.id === window.currentProjectId);
               if (pFound) projectNameStr = pFound.title;
            }

            

            let tabContent = '';
            
            if (tdActiveTab === 'wbs') {
                tdShowWbsSequence = true;
                tabContent = `
                <div style="background: var(--bg-surface); border-radius: 0 0 8px 8px; overflow: hidden;">
                    <div style="display: flex; justify-content: flex-end; align-items: center; padding: 16px 24px; border-bottom: ${tdShowWbsSequence ? '1px solid var(--badge-border-blue)' : 'none'};  background: var(--bg-body);">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            
                            <div onclick="const e = document.getElementById('wbs-preview-container-js') || document.getElementById('wbs-preview-container-script') || document.getElementById('wbs-preview-container-index'); if(e){ if(!document.fullscreenElement) { e.requestFullscreen().then(()=>{ e.style.height = '100vh'; e.style.overflow = 'auto'; }); } else { document.exitFullscreen(); } }" style="color: #0d9488; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;" title="Full Screen">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                                Full Screen
                            </div>
        
                            
                        </div>
                    </div>
                    
                    <div id="wbs-preview-container-js" style="padding: 0; background: var(--badge-bg-gray); display: flex; justify-content: center; height: 500px; width: 100%; border-top: 1px solid var(--badge-border-blue);"></div>

                </div>
            `;
            }
            if (tdActiveTab === 'gantt') tabContent = renderTdGanttChart(filteredTasks);
            
            


            

            

            let modalHtml = '';
            if (tdSelectedTask) {
                modalHtml = `
                    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="tdSelectedTask = null; renderTaskDashboardView();">
                        <div style="background: var(--bg-surface); width: 600px; max-width: 95vw; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                            <div style="padding: 24px; border-bottom: 1px solid var(--badge-border-gray); display: flex; justify-content: space-between; align-items: flex-start; background: var(--bg-body);">
                                <div>
                                    <div style="display: inline-block; background: var(--text-main); color: #fff; font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; font-family: monospace;">${tdSelectedTask.wbs}</div>
                                    <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0;">${tdSelectedTask.name}</h2>
                                    <div style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600; margin-top: 8px;">${tdSelectedTask.phase}</div>
                                </div>
                                <button onclick="tdSelectedTask = null; renderTaskDashboardView();" style="background: var(--badge-bg-gray); border: none; font-size: 1.25rem; font-weight: bold; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: background 0.2s;">&times;</button>
                            </div>
                            <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                                <div>
                                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">Status</div>
                                    <div style="display: inline-block; font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 12px; background: ${tdSelectedTask.status === 'COMPLETED' ? 'var(--badge-bg-green)' : tdSelectedTask.status === 'ONGOING' ? 'var(--badge-bg-blue)' : 'var(--badge-bg-gray)'}; color: ${tdSelectedTask.status === 'COMPLETED' ? 'var(--badge-text-green)' : tdSelectedTask.status === 'ONGOING' ? 'var(--badge-text-blue)' : 'var(--badge-text-gray)'};">${tdSelectedTask.status}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">Personnel</div>
                                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text-main); font-size: 0.95rem;">
                                        <div style="width: 28px; height: 28px; background: var(--badge-border-gray); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: var(--text-muted);">${tdSelectedTask.owner.charAt(0)}</div>
                                        ${tdSelectedTask.owner}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">Department</div>
                                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${tdSelectedTask.dept}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">Timeline</div>
                                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${tdSelectedTask.start} <span style="color:var(--badge-border-blue); margin:0 6px;">→</span> ${tdSelectedTask.due}</div>
                                </div>
                            </div>
                            <div style="padding: 24px; border-top: 1px solid var(--badge-bg-gray); background: var(--bg-body);">
                                <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 12px;">Requirements</div>
                                <ul style="list-style-type: disc; padding-left: 20px; font-size: 0.9rem; font-weight: 500; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px; margin: 0;">
                                    <li>Approved Application Form</li>
                                    <li>Valid ID of Authorized Representative</li>
                                    <li>Processing Fee Receipt</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }

            // KANBAN + DEADLINES LOGIC
            window.latestFilteredTasks = filteredTasks;
            let kbTodoTasks = filteredTasks.filter(t => t.status === 'NOT STARTED' || t.status === 'DELAYED');
            let kbInProgressTasks = filteredTasks.filter(t => t.status === 'ONGOING');
            let kbCompletedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');
            
            // For Upcoming Deadlines
            let activeTasks = [...filteredTasks];
            if (window.dateFns) {
                activeTasks.sort((a,b) => window.dateFns.parseISO(a.due) - window.dateFns.parseISO(b.due));
            }
            let upcomingDeadlinesTasks = activeTasks.slice(0, 5);
            
            let overallPct = tTotal > 0 ? Math.round((tComp / tTotal) * 100) : 0;
            
            let kanbanDeadlineHtml = `
                
<style>
    .progress-board-container:fullscreen {
        height: 100vh !important;
        margin-top: 0 !important;
        border-radius: 0 !important;
        background: var(--bg-surface) !important;
        overflow-y: auto !important;
    }
    .progress-board-container:-webkit-full-screen {
        height: 100vh !important;
        margin-top: 0 !important;
        border-radius: 0 !important;
        background: var(--bg-surface) !important;
        overflow-y: auto !important;
    }
</style>

<div id="progress-board-fullscreen" class="progress-board-container" style="margin-top: 24px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface); box-shadow: var(--shadow-sm); overflow-y: auto; overflow-x: hidden; height: 550px; display: flex; flex-direction: column;">
                    <!-- COLLAPSED HEADER / SUMMARY -->
                    <div style="padding: 16px 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; background: var(--bg-body); border-bottom: 1px solid var(--border-color); position: sticky; top: -1px; z-index: 100;">
                        <div style="display: flex; align-items: center; gap: 12px; font-weight: 700; color: var(--text-main);">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                            <span style="font-size: 1.1rem; font-weight: 800;">Progress Board</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 16px; font-size: 0.85rem; font-weight: 600;">
                            <div style="display: flex; gap: 12px; color: var(--text-muted); align-items: center;">
                                <span><strong style="color: var(--text-main);">${tTotal}</strong> Total</span>
                                <span style="color: #3b82f6;"><strong>${tInProg}</strong> ONGOING</span>
                                <span style="color: #10b981;"><strong>${tComp}</strong> Completed</span>
                                <span style="color: #ef4444;"><strong>${tOverdue}</strong> Overdue</span>
                                <span style="color: #f59e0b;"><strong>${upcomingDeadlinesTasks.length}</strong> Upcoming</span>
                            </div>
                            <div style="width: 1px; height: 24px; background: var(--border-color);"></div>
                            <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: #0f766e; color: white; cursor: pointer; font-weight: 500;" onclick="event.stopPropagation(); const e = document.getElementById('progress-board-fullscreen'); if(e){ if(!document.fullscreenElement) { e.requestFullscreen().catch(err => console.log(err)); } else { document.exitFullscreen(); } }"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg> Full Screen</button>
                        </div>
                    </div>
                    
                    <!-- PREVIEW SECTION (Always visible) -->
                    <div style="padding: 20px 24px; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Progress Summary</div>
                        
                        <div style="display: flex; align-items: center; gap: 32px; flex-wrap: wrap;">
                            <!-- OVERALL PROGRESS BAR -->
                            <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                                    <span>Overall Completion</span>
                                    <span style="color: #10b981; font-weight: 800;">${overallPct}%</span>
                                </div>
                                <div style="width: 100%; height: 10px; background: var(--bg-body); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
                                    <div style="width: ${overallPct}%; height: 100%; background: linear-gradient(90deg, #34d399 0%, #10b981 100%); border-radius: 5px; transition: width 0.5s ease-in-out;"></div>
                                </div>
                            </div>
                            
                            <!-- STATUS CARDS -->
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <div style="padding: 12px 20px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 8px; display: flex; flex-direction: column; gap: 6px; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total</span>
                                    <span style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); line-height: 1;">${tTotal}</span>
                                </div>
                                <div style="padding: 12px 20px; background: rgba(59,130,246,0.04); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; display: flex; flex-direction: column; gap: 6px; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.75rem; color: #3b82f6; font-weight: 700; text-transform: uppercase;">Ongoing</span>
                                    <span style="font-size: 1.3rem; font-weight: 800; color: #1e3a8a; line-height: 1;">${tInProg}</span>
                                </div>
                                <div style="padding: 12px 20px; background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; display: flex; flex-direction: column; gap: 6px; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.75rem; color: #10b981; font-weight: 700; text-transform: uppercase;">Completed</span>
                                    <span style="font-size: 1.3rem; font-weight: 800; color: #064e3b; line-height: 1;">${tComp}</span>
                                </div>
                                <div style="padding: 12px 20px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; display: flex; flex-direction: column; gap: 6px; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.75rem; color: #ef4444; font-weight: 700; text-transform: uppercase;">Overdue</span>
                                    <span style="font-size: 1.3rem; font-weight: 800; color: #7f1d1d; line-height: 1;">${tOverdue}</span>
                                </div>
                                <div style="padding: 12px 20px; background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; display: flex; flex-direction: column; gap: 6px; min-width: 100px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700; text-transform: uppercase;">Upcoming</span>
                                    <span style="font-size: 1.3rem; font-weight: 800; color: #78350f; line-height: 1;">${upcomingDeadlinesTasks.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    
<style>
    .kanban-grid-preview {
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 16px; 
        height: 320px; /* Minimized view */
    }
    :fullscreen .kanban-grid-preview {
        height: auto !important;
        flex: 1 !important;
        min-height: 450px !important;
    }
    :-webkit-full-screen .kanban-grid-preview {
        height: auto !important;
        flex: 1 !important;
        min-height: 450px !important;
    }
    :fullscreen .kanban-expanded-content-class {
        padding: 32px !important;
        background: #f8fafc !important; 
    }
    :-webkit-full-screen .kanban-expanded-content-class {
        padding: 32px !important;
        background: #f8fafc !important; 
    }
</style>

                    <!-- EXPANDED CONTENT -->
                    <div id="kanban-expanded-content" class="kanban-expanded-content-class" style="padding: 24px; display: flex; flex-direction: column; gap: 32px; background: var(--bg-surface); flex: 1;">
                        
                        <!-- KANBAN BOARD -->
                        <div style="display: flex; flex-direction: column; flex: 1;">
                            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                                Task Kanban Board
                            </h3>
                            <div class="kanban-grid-preview">
                                
                                <!-- TODO COLUMN -->
                                <div ondragover="event.preventDefault()" ondrop="tdDropTask(event, 'NOT STARTED')" style="background: var(--bg-body); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color);">
                                    <div style="padding: 12px 16px; border-bottom: 2px solid #94a3b8; font-weight: 700; font-size: 0.85rem; color: #64748b; display: flex; justify-content: space-between;">
                                        <span>TO DO</span>
                                        <span style="background: rgba(100,116,139,0.1); padding: 2px 8px; border-radius: 12px;">${kbTodoTasks.length}</span>
                                    </div>
                                    <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1;">
                                        ${kbTodoTasks.map(t => `
                                            <div draggable="true" ondragstart="tdDragTask(event, \`${t.id}\`)" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; box-shadow: var(--shadow-sm); cursor: grab;">
                                                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">${t.name}</div>
                                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                                                    <span style="color: var(--text-muted);">${t.owner}</span>
                                                    <span style="${t.status==='DELAYED' ? 'color: var(--badge-text-red); font-weight:700;' : 'color: var(--text-muted);'}">${t.due ? new Date(t.due).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No date'}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                        ${kbTodoTasks.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No tasks</div>' : ''}
                                    </div>
                                </div>

                                <!-- ONGOING COLUMN -->
                                <div ondragover="event.preventDefault()" ondrop="tdDropTask(event, 'ONGOING')" style="background: var(--bg-body); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color);">
                                    <div style="padding: 12px 16px; border-bottom: 2px solid #3b82f6; font-weight: 700; font-size: 0.85rem; color: #3b82f6; display: flex; justify-content: space-between;">
                                        <span>ONGOING</span>
                                        <span style="background: rgba(59,130,246,0.1); padding: 2px 8px; border-radius: 12px;">${kbInProgressTasks.length}</span>
                                    </div>
                                    <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1;">
                                        ${kbInProgressTasks.map(t => {
                                            let isOverdue = false;
                                            if (window.dateFns && t.due) {
                                                isOverdue = window.dateFns.isBefore(window.dateFns.parseISO(t.due), new Date());
                                            }
                                            return `
                                            <div draggable="true" ondragstart="tdDragTask(event, \`${t.id}\`)" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; box-shadow: var(--shadow-sm); cursor: grab; border-left: 3px solid ${isOverdue ? '#ef4444' : '#3b82f6'};">
                                                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">${t.name}</div>
                                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                                                    <span style="color: var(--text-muted);">${t.owner}</span>
                                                    <span style="${isOverdue ? 'color: var(--badge-text-red); font-weight:700;' : 'color: var(--text-muted);'}">${t.due ? new Date(t.due).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No date'}</span>
                                                </div>
                                            </div>
                                        `}).join('')}
                                        ${kbInProgressTasks.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No tasks</div>' : ''}
                                    </div>
                                </div>

                                <!-- COMPLETED COLUMN -->
                                <div ondragover="event.preventDefault()" ondrop="tdDropTask(event, 'COMPLETED')" style="background: var(--bg-body); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color);">
                                    <div style="padding: 12px 16px; border-bottom: 2px solid #10b981; font-weight: 700; font-size: 0.85rem; color: #10b981; display: flex; justify-content: space-between;">
                                        <span>COMPLETED</span>
                                        <span style="background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 12px;">${kbCompletedTasks.length}</span>
                                    </div>
                                    <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; opacity: 0.8;">
                                        ${kbCompletedTasks.map(t => `
                                            <div draggable="true" ondragstart="tdDragTask(event, \`${t.id}\`)" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; box-shadow: var(--shadow-sm); cursor: grab; border-left: 3px solid #10b981;">
                                                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-decoration: line-through; margin-bottom: 8px;">${t.name}</div>
                                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                                                    <span style="color: var(--text-muted);">${t.owner}</span>
                                                    <span style="color: #10b981; font-weight:600;">${t.due ? new Date(t.due).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Done'}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                        ${kbCompletedTasks.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px;">No tasks</div>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- DEADLINE TRACKING -->
                        <div>
                            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Deadline Tracking (Upcoming)
                            </h3>
                            <!-- Summary Blocks -->
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px;">
                                <!-- ALL -->
                                <div style="background: var(--bg-surface); border: 1px solid #3b82f6; border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                                    <div style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 8px;">ALL</div>
                                    <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--text-main);">${filteredTasks.length}</div>
                                </div>
                                <!-- OVERDUE -->
                                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--badge-text-red); text-transform: uppercase; margin-bottom: 8px;">OVERDUE</div>
                                    <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--badge-text-red);">${tOverdue}</div>
                                </div>
                                <!-- WARNED -->
                                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                                    <div style="font-size: 0.8rem; font-weight: 700; color: #f97316; text-transform: uppercase; margin-bottom: 8px;">WARNED</div>
                                    <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: #f97316;">${filteredTasks.filter(t => t.priority === 'High' && t.status !== 'COMPLETED').length}</div>
                                </div>
                                <!-- ONGOING -->
                                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                                    <div style="font-size: 0.8rem; font-weight: 700; color: #10b981; text-transform: uppercase; margin-bottom: 8px;">ONGOING</div>
                                    <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: #10b981;">${kbInProgressTasks.length}</div>
                                </div>
                                <!-- RECENT -->
                                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">RECENT</div>
                                    <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--text-muted);">2</div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); overflow: hidden;">
                                ${upcomingDeadlinesTasks.length === 0 ? '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No upcoming active deadlines!</div>' : 
                                  upcomingDeadlinesTasks.map((t, idx) => {
                                     let isOverdue = false;
                                     let isCompleted = t.status === 'COMPLETED';
                                     if (window.dateFns && t.due && !isCompleted) {
                                         isOverdue = window.dateFns.isBefore(window.dateFns.parseISO(t.due), new Date());
                                     }
                                     let badgeBg = isCompleted ? '#10b981' : (isOverdue ? 'var(--badge-text-red)' : '#f59e0b');
                                     let badgeText = '#ffffff';
                                     let statusLabel = isCompleted ? 'COMPLETED' : (isOverdue ? 'OVERDUE' : 'UPCOMING');
                                     if (!isCompleted && !isOverdue) {
                                        // Use yellow badge for upcoming
                                        badgeBg = 'var(--badge-bg-yellow)';
                                        badgeText = '#d97706';
                                     }
                                     
                                     return `
                                     <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: ${idx === upcomingDeadlinesTasks.length - 1 ? 'none' : '1px solid var(--border-color)'}; background: var(--bg-surface);">
                                        <div style="display: flex; gap: 16px; align-items: center;">
                                            <div style="background: ${isCompleted ? '#94a3b8' : (isOverdue ? 'var(--badge-text-red)' : '#f59e0b')}; color: #ffffff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                <div style="font-size: 1.1rem; line-height: 1.1;">${t.due ? parseInt(t.due.split('-')[2]) : '--'}</div>
                                                <div style="font-size: 0.65rem; text-transform: uppercase;">${t.due ? new Date(t.due).toLocaleString('en-US', {month: 'short'}) : '--'}</div>
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">${t.name}</div>
                                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${t.phase} &bull; ${t.owner}</div>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: ${badgeBg}; color: ${badgeText};">
                                                ${statusLabel}
                                            </span>
                                        </div>
                                     </div>
                                 `}).join('')}
                            </div>
                        </div>

                    </div>

                </div>
            `;
                            const html = `
                <div style="padding: 24px; font-family: 'Inter', sans-serif;">

<div style="border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-surface); padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); position: relative; z-index: 10;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; color: var(--text-main);">
                                <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--badge-bg-blue); color: var(--badge-text-blue);">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                                </div>
                                <span style="letter-spacing: -0.02em;">Global Filter Engine</span>
                            </div>
                            <button onclick="tdResetFilters()" style="display: flex; align-items: center; gap: 6px; background: var(--bg-body); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                Reset All
                            </button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Phase</label>
                                <div style="position: relative;">
                                    <select onchange="tdUpdateFilter('phase', this.value)" style="width: 100%; padding: 10px 36px 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-main); font-size: 0.95rem; font-weight: 500; outline: none; appearance: none; cursor: pointer; transition: all 0.2s;">
                                        ${phaseOptions}
                                    </select>
                                    <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Department</label>
                                <div style="position: relative;">
                                    <select onchange="tdUpdateFilter('dept', this.value)" style="width: 100%; padding: 10px 36px 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-main); font-size: 0.95rem; font-weight: 500; outline: none; appearance: none; cursor: pointer; transition: all 0.2s;">
                                        ${deptOptions}
                                    </select>
                                    <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Personnel</label>
                                <div style="position: relative;">
                                    <select onchange="tdUpdateFilter('person', this.value)" style="width: 100%; padding: 10px 36px 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-main); font-size: 0.95rem; font-weight: 500; outline: none; appearance: none; cursor: pointer; transition: all 0.2s;">
                                        ${personOptions}
                                    </select>
                                    <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Status</label>
                                <div style="position: relative;">
                                    <select onchange="tdUpdateFilter('status', this.value)" style="width: 100%; padding: 10px 36px 10px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-main); font-size: 0.95rem; font-weight: 500; outline: none; appearance: none; cursor: pointer; transition: all 0.2s;">
                                        ${statusOptions}
                                    </select>
                                    <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Navigation Tabs & Content -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface); box-shadow: var(--shadow-sm);">
                        <div style="display: flex; border-bottom: 1px solid var(--badge-border-blue); background: var(--bg-body); border-radius: 8px 8px 0 0;">
                            
                            <div onclick="tdSetTab('wbs')" style="padding: 20px 32px; cursor: pointer; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; border-bottom: 3px solid ${tdActiveTab === 'wbs' ? '#0d9488' : 'transparent'}; color: ${tdActiveTab === 'wbs' ? '#0f172a' : 'var(--badge-text-gray)'};">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m9 12 2 2 4-4"/></svg>
                                WBS Sequence
                            </div>
                            <div onclick="tdSetTab('gantt')" style="padding: 20px 32px; cursor: pointer; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; border-bottom: 3px solid ${tdActiveTab === 'gantt' ? '#0d9488' : 'transparent'}; color: ${tdActiveTab === 'gantt' ? 'var(--text-main)' : 'var(--badge-text-gray)'};">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                                Gantt Chart
                            </div>
                        </div>

                        <!-- Tab Content Views -->

            ${tabContent}
                    </div>
                    
                    <div class="kanban-deadline-container">
                        ${kanbanDeadlineHtml}
                    </div>

                </div>
                ${modalHtml}
            `;
            
            contentArea.innerHTML = html;

            if (tdShowWbsSequence && window._mountWbsMapPreview) {
               setTimeout(() => {
                 let projNameStr = 'Selected Project';
                 if (window.currentProjectId && typeof projects !== 'undefined') {
                    const pFound = projects.find(p => p.id === window.currentProjectId);
                    if (pFound) projNameStr = pFound.title;
                 }
                 window._mountWbsMapPreview('wbs-preview-container-js', projNameStr);
               }, 10);
            }
        }

        window.renderKanbanBoardView = function() {
            currentView = 'kanban_board';
            updateSubNavVisibility();
            
            const html = `
                <div class="kanban-container" style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
                    <!-- Global Filters -->
                    <div class="card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; color: var(--text-muted);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                                Global Filters
                            </div>
                            <button style="background: none; border: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; padding: 0;">Reset All</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 16px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Phase</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;">
                                    <option>All</option>
                                    <option>COMPETITIVE SELECTION PROCESS</option>
                                    <option>PRE-DEVELOPMENT PHASE 1</option>
                                    <option>PRE-DEVELOPMENT PHASE 2</option>
                                    <option>PRE-DEVELOPMENT PHASE 3</option>
                                    <option>DEVELOPMENT PHASE</option>
                                    <option>POST-DEVELOPMENT PHASE</option>
                                    <option>OTHERS</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Department</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;"><option>All</option></select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Personnel</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;"><option>All</option></select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Status</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;">
                                    <option>All</option>
                                    <option>NOT YET STARTED</option>
                                    <option>ONGOING</option>
                                    <option>COMPLETED</option>
                                    <option>NOT APPLICABLE</option>
                                </select>
                            </div>
                        </div>
                        <input type="text" placeholder="Search Tasks (Task name, ID, remarks...)" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size: 0.85rem; box-sizing: border-box;">
                    </div>
                    
                    <!-- Kanban Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 1.1rem; color: var(--text-color);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                            Task Kanban Board
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Drag & Drop Coming Soon</div>
                    </div>
                    
                    <!-- Kanban Columns -->
                    <div style="display: flex; gap: 16px; overflow-x: auto; flex: 1; padding-bottom: 8px;">
                        <!-- Not Started -->
                        <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">NOT STARTED</div>
                                <div style="background: var(--bg-main); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;">0</div>
                            </div>
                            <div style="flex: 1; background: var(--bg-body); border-radius: var(--radius-md); min-height: 300px; padding: 8px;">
                                <!-- Empty state or items go here -->
                            </div>
                        </div>
                        
                        <!-- ONGOING -->
                        <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                <div style="font-weight: 600; font-size: 0.85rem; color: var(--badge-text-blue);">ONGOING</div>
                                <div style="background: #eef2ff; color: var(--badge-text-blue); font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;">0</div>
                            </div>
                            <div style="flex: 1; background: var(--bg-body); border-radius: var(--radius-md); min-height: 300px; padding: 8px;"></div>
                        </div>
                        
                        <!-- On Hold -->
                        <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                <div style="font-weight: 600; font-size: 0.85rem; color: var(--badge-text-orange);">NOT APPLICABLE</div>
                                <div style="background: var(--badge-bg-orange); color: var(--badge-text-orange); font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;">0</div>
                            </div>
                            <div style="flex: 1; background: var(--bg-body); border-radius: var(--radius-md); min-height: 300px; padding: 8px;"></div>
                        </div>
                        
                        <!-- Completed -->
                        <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                <div style="font-weight: 600; font-size: 0.85rem; color: var(--badge-text-green);">COMPLETED</div>
                                <div style="background: var(--badge-bg-green); color: var(--badge-text-green); font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;">0</div>
                            </div>
                            <div style="flex: 1; background: var(--bg-body); border-radius: var(--radius-md); min-height: 300px; padding: 8px;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
        };

                
                window.openAddPersonnelModal = function() {
            const modalHtml = `
                <div class="modal-overlay active" id="addPersonnelModal" style="z-index: 100000;">
                    <div class="modal" style="max-width: 500px;">
                        <div class="modal-header">
                            <div>
                                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Add New Personnel</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">Assign a new team member to this project.</div>
                            </div>
                            <button class="close-modal" onclick="document.getElementById('addPersonnelModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="
                                event.preventDefault();
                                const name = document.getElementById('newPersonName').value.toUpperCase();
                                const role = document.getElementById('newPersonRole').value;
                                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                                const grid = document.querySelector('.personnel-grid-target');
                                if (grid) {
                                    grid.insertAdjacentHTML('beforeend', window.generateEmptyPersonnelCard ? window.generateEmptyPersonnelCard(initials, '#ccfbf1', name, role) : generateEmptyPersonnelCard(initials, '#ccfbf1', name, role));
                                }
                                document.getElementById('addPersonnelModal').remove();
                            ">
                                <div class="form-group">
                                    <label>Full Name</label>
                                    <input type="text" id="newPersonName" required placeholder="e.g. John Doe">
                                </div>
                                <div class="form-group">
                                    <label>Role</label>
                                    <input type="text" id="newPersonRole" list="roleOptions" required placeholder="Select or type Role/Title" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; box-sizing: border-box; font-family: 'Inter', sans-serif;">
                                    <datalist id="roleOptions">
                                        <option value="PROJECT MANAGER">
                                        <option value="DEPUTY PROJECT MANAGER">
                                        <option value="PROJECT ENGINEER (CIVIL)">
                                        <option value="PROJECT ENGINEER (ELECTRICAL)">
                                        <option value="PROJECT ENGINEER (MECHANICAL)">
                                        <option value="PROJECT COORDINATOR">
                                        <option value="TECHNICAL COMPLIANCE">
                                        <option value="COMPLIANCE OFFICER, PCO">
                                        <option value="PRE-LICENSING OFFICER (SAFETY OFFICER)">
                                        <option value="POLLUTION CONTROL OFFICER (PCO)">
                                    </datalist>
                                </div>
                                <div class="form-group">
                                    <label>Department</label>
                                    <select id="newPersonDept" required>
                                        <option value="">Select Department</option>
                                        <option value="ENGINEERING DEPT">Engineering Dept</option>
                                        <option value="ADMIN DEPT">Admin Dept</option>
                                        <option value="COMPLIANCE DEPT">Compliance Dept</option>
                                    </select>
                                </div>
                                <div class="form-actions" style="margin-top: 24px;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('addPersonnelModal').remove()">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Add Personnel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };

        window.renderTaskDelegationView = function() {
            currentView = 'task_delegation';
            updateSubNavVisibility();
            
            const html = `
                <div class="delegation-container" style="display: flex; flex-direction: column; gap: 20px; padding: 0; background: var(--bg-main);">
                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Task Delegation & Personnel
                        </div>
                        <button onclick="window.openAddPersonnelModal()" style="background: #0f766e; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                            Add Personnel
                        </button>
                    </div>

                    <!-- Search and Filter Bar -->
                    <div style="display: flex; gap: 12px; align-items: center; border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 8px; background: var(--bg-surface); margin-bottom: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Search personnel or tasks..." style="border: none; background: transparent; flex: 1; outline: none; font-size: 0.9rem; color: var(--text-main);">
                        <div style="width: 1px; height: 24px; background: var(--badge-border-gray);"></div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                        <select style="border: 1px solid var(--border-color); background: var(--bg-surface); padding: 6px 12px; border-radius: 4px; outline: none; color: var(--text-main); font-size: 0.9rem; width: 120px;">
                            <option>All</option>
                        </select>
                    </div>
                    
                    <!-- Global Filters -->
                    <div class="card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; color: var(--text-muted);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                                Global Filters
                            </div>
                            <button style="background: none; border: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; padding: 0;">Reset All</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Phase</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;">
                                    <option>All</option>
                                    <option>COMPETITIVE SELECTION PROCESS</option>
                                    <option>PRE-DEVELOPMENT PHASE 1</option>
                                    <option>PRE-DEVELOPMENT PHASE 2</option>
                                    <option>PRE-DEVELOPMENT PHASE 3</option>
                                    <option>DEVELOPMENT PHASE</option>
                                    <option>POST-DEVELOPMENT PHASE</option>
                                    <option>OTHERS</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Department</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;"><option>All</option></select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Personnel</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;"><option>All</option></select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.75rem; color: var(--text-muted);">Status</label>
                                <select style="padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-main); color: var(--text-color); font-size:0.85rem;">
                                    <option>All</option>
                                    <option>NOT YET STARTED</option>
                                    <option>ONGOING</option>
                                    <option>COMPLETED</option>
                                    <option>NOT APPLICABLE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Personnel Grid -->
                    <div class="personnel-grid-target" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                        ${[
                            { initials: 'JS', name: 'JONATHAN SINGIAN', title: 'PROJECT MANAGER' },
                            { initials: 'ST', name: 'STEVEN TOLEDO', title: 'DEPUTY PROJECT MANAGER' },
                            { initials: 'MB', name: 'MAE ANN BODIONGAN', title: 'TECHNICAL COMPLIANCE' },
                            { initials: 'MP', name: 'MARIANNE PUDA', title: 'RESOURCES COORDINATOR' },
                            { initials: 'JC', name: 'JANNA DE CLARO', title: 'PROJECT COORDINATOR' },
                            { initials: 'MD', name: 'MARK JOSHUA DAMPIL', title: 'PROJECT ENGINEER (CIVIL)' },
                            { initials: 'RB', name: 'RONNEL BARIAS', title: 'PROJECT ENGINEER (ELECTRICAL)' },
                            { initials: 'KE', name: 'KEVIN ESTRADA', title: 'PROJECT ENGINEER (ELECTRICAL)' },
                            { initials: 'ZA', name: 'ZIRACH AROCHA', title: 'PROJECT ENGINEER (SCADA)' },
                            { initials: 'BS', name: 'BRIAN ALLEN SUAN', title: 'PROJECT ENGINEER (MECHANICAL)' },
                            { initials: 'JF', name: 'JONAS FALOGME', title: 'COMPLIANCE OFFICER, PCO' },
                            { initials: 'JT', name: 'JOHN IRISH TOMBOCON', title: 'PRE-LICENSING OFFICER (SAFETY OFFICER)' },
                            { initials: 'FF', name: 'FRANCE IVAR FABITO', title: 'POLLUTION CONTROL OFFICER (PCO)' }
                        ].map((p, i) => generateEmptyPersonnelCard(p.initials, i % 2 === 0 ? '#ccfbf1' : 'var(--badge-bg-green)', p.name, p.title)).join('')}
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
        };

        window.generateEmptyPersonnelCard = generateEmptyPersonnelCard;
        function generateEmptyPersonnelCard(initials, bgColor, name, dept) {
            return `
                <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: var(--bg-surface); box-shadow: var(--shadow-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: ${bgColor}; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; color: #0f766e;">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.05rem; color: var(--text-main);">${name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.05em;">${dept}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px;">WORKLOAD</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 60px; height: 6px; background: var(--badge-bg-gray); border-radius: 3px; overflow: hidden;">
                                    <div style="width: 0%; height: 100%; background: #0f766e;"></div>
                                </div>
                                <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">0%</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; font-size: 0.8rem; font-weight: 600;">
                        <div style="display: flex; align-items: center; gap: 4px; color: #0f766e;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span style="color: var(--text-main);">0 Done</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; color: #3b82f6;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span style="color: var(--text-main);">0 Active</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; color: var(--badge-text-red);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span style="color: var(--text-main);">0 Overdue</span>
                        </div>
                    </div>

                    <div style="border-top: 1px solid var(--badge-bg-gray); padding-top: 16px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 12px;">ASSIGNED TASKS</div>
                        <div style="font-size: 0.85rem; color: #94a3b8; font-style: italic;">
                            No tasks assigned to this personnel.
                        </div>
                    </div>

                    <button style="width: 100%; padding: 10px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease;">
                        View Full Profile & History
                    </button>
                </div>
            `;
        }

        window.renderDeadlinesView = function() {
            currentView = 'deadlines';
            updateSubNavVisibility();
            
            const html = `
                <div class="deadlines-container" style="display: flex; flex-direction: column; gap: 24px; padding: 24px; background: var(--bg-body); min-height: calc(100vh - 60px);">
                    
                    <!-- Global Filters -->
                    <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px 24px; display: flex; flex-direction: column; gap: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-weight: 600; font-size: 0.95rem;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                                Global Filters
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.85rem; cursor: pointer; hover:text-decoration: underline;">
                                Reset All
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; color: var(--text-muted);">Phase</label>
                                <select style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-surface); font-size: 0.85rem; color: var(--text-main); outline: none; appearance: auto;">
                                    <option>All</option>
                                    <option>Competitive Selection Process</option>
                                    <option>Pre-Development</option>
                                    <option>Development Phase</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; color: var(--text-muted);">Department</label>
                                <select style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-surface); font-size: 0.85rem; color: var(--text-main); outline: none; appearance: auto;">
                                    <option>All</option>
                                    <option>Engineering</option>
                                    <option>Procurement</option>
                                    <option>Permitting</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; color: var(--text-muted);">Personnel</label>
                                <select style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-surface); font-size: 0.85rem; color: var(--text-main); outline: none; appearance: auto;">
                                    <option>All</option>
                                    <option>John Doe</option>
                                    <option>Jane Smith</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; color: var(--text-muted);">Status</label>
                                <select style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-surface); font-size: 0.85rem; color: var(--text-main); outline: none; appearance: auto;">
                                    <option>All</option>
                                    <option>Overdue</option>
                                    <option>Warned</option>
                                    <option>ONGOING</option>
                                    <option>Completed</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <input type="text" placeholder="Search Tasks (Task name, ID, remarks...)" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; outline: none; background: #fdfdfd; color: var(--text-main); box-sizing: border-box;">
                        </div>
                    </div>

                    <!-- Summary Blocks -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                        <!-- ALL -->
                        <div style="background: var(--bg-surface); border: 2px solid #3b82f6; border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 8px;">ALL</div>
                            <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--text-main);">11</div>
                        </div>
                        <!-- OVERDUE -->
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 700; color: var(--badge-text-red); text-transform: uppercase; margin-bottom: 8px;">OVERDUE</div>
                            <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--badge-text-red);">2</div>
                        </div>
                        <!-- WARNED -->
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #f97316; text-transform: uppercase; margin-bottom: 8px;">WARNED</div>
                            <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: #f97316;">2</div>
                        </div>
                        <!-- ONGOING -->
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #10b981; text-transform: uppercase; margin-bottom: 8px;">ONGOING</div>
                            <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: #10b981;">4</div>
                        </div>
                        <!-- RECENT -->
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">RECENT</div>
                            <div style="font-size: 24px; line-height: 28px; font-weight: 700; color: var(--text-muted);">2</div>
                        </div>
                    </div>

                    <!-- Upcoming Deadlines List container -->
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden;">
                        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); font-size: 1.15rem; font-weight: 700; color: var(--text-main);">
                            Upcoming Deadlines
                        </div>

                        <!-- List Items -->
                        <div style="display: flex; flex-direction: column;">
                            
                            <!-- Item 1 (OVERDUE) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: var(--badge-text-red); color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(239,68,68,0.2);">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">9</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Sep</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">DENR - ONLINE REGISTRATION</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: var(--badge-text-red); color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">OVERDUE</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Item 2 (COMPLETED) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #94a3b8; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">10</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Oct</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">LOT ACQUISITION</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">COMPLETED</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Item 3 (COMPLETED) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #94a3b8; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">10</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Oct</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">TECHNICAL STUDIES</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">COMPLETED</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Item 4 (COMPLETED) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #94a3b8; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">10</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Oct</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">ENGINEERING DESIGNS</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">COMPLETED</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Item 5 (COMPLETED) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #94a3b8; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">10</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Oct</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">WATER CONNECTION</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">COMPLETED</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Item 6 (COMPLETED) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #94a3b8; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">10</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Oct</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">TIELCO - TEMPORARY ELECTRICAL PERMIT</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Competitive Selection Process</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">COMPLETED</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Item 7 (ONGOING) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: none;">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="background: #f59e0b; color: #fff; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(245,158,11,0.2);">
                                        <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.1;">1</div>
                                        <div style="font-size: 0.7rem; font-weight: 600;">Jan</div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-weight: 600; font-size: 1rem; color: var(--text-main);">BRGY: RESOLUTION</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">Pre-Development Phase 2</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 32px;">
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">System</div>
                                    <div style="background: #0d9488; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; width: 90px; text-align: center;">ONGOING</div>
                                    <button style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-body); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                                        OPTIONS
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            `;
            
            contentArea.innerHTML = html;
        };

        window.renderEmailReportsView = function() { console.warn('[Legacy] Attempted to call removed renderer: renderEmailReportsView'); };

        window.wbsTasks = [
            { wbs: '1.1', name: 'DENR - ONLINE REGISTRATION', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.2', name: 'LOT ACQUISITION', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.3', name: 'TECHNICAL STUDIES', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.4', name: 'ENGINEERING DESIGNS', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.5', name: 'WATER CONNECTION', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.6', name: 'BANK FINANCING', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '1.7', name: 'TIELCO - TEMPORARY ELECTRICAL PERMIT', owner: 'System', date: '2022-10-11', status: 'COMPLETED' },
            { wbs: '3.1', name: 'BRGY. RESOLUTION', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.2', name: 'SB RESOLUTION NO OBJECTION', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.3', name: 'SB RESOLUTION RECLASSIFICATION', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.4', name: 'BARANGAY CERTIFICATE', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.5', name: 'PHILIPPINE COCONUT AUTHORITY (PCA) - PERMIT TO CUT COCONUT TREE', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.6', name: 'DOLE - CONSTRUCTION SAFETY AND HEALTH PROGRAM', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.7', name: 'DAR CERTIFICATION', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.8', name: 'MPDC - ZONING CERTIFICATE', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.9', name: 'NCIP - CERTIFICATE OF NON-OVERLAP', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.10', name: 'MPDC - LOCATIONAL CLEARANCE', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.11', name: 'BFP - FIRE SAFETY EVALUATION CLEARANCE FOR BUILDING PERMIT', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.12', name: 'OBO - FENCING PERMIT', owner: 'System', date: '2025-09-01', status: 'ONGOING' },
            { wbs: '3.13', name: 'DENR - ECC / CNC', owner: 'System', date: '2026-01-31', status: 'NOT YET STARTED' },
            { wbs: '3.14', name: 'MAYOR\'S PERMIT FOR BUILDING PERMIT', owner: 'System', date: '2026-01-31', status: 'NOT YET STARTED' },
            { wbs: '3.15', name: 'OBO - BUILDING PERMIT', owner: 'System', date: '2026-01-31', status: 'NOT YET STARTED' },
            { wbs: '3.16', name: 'OBO - EXCAVATION AND GROUND PREPARATION PERMIT', owner: 'System', date: '2026-01-31', status: 'NOT YET STARTED' },
            { wbs: '4.1', name: 'NWRB - WATER PERMIT', owner: 'System', date: '2026-02-01', status: 'NOT YET STARTED' },
            { wbs: '4.2', name: 'PROJECT AGREEMENTS', owner: 'System', date: '2026-02-01', status: 'NOT YET STARTED' },
            { wbs: '5.1', name: 'PROCUREMENT AND CONSTRUCTION', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.2', name: 'DOE - COC/ COE', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.3', name: 'MUNICIPAL HEALTH OFFICE - SANITARY CERTIFICATE FOR DISCHARGE PERMIT', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.4', name: 'MPDC - LOCATIONAL CLEARANCE FOR OCCUPANCY PERMIT', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.5', name: 'BFP - FIRE SAFETY INSPECTION CLEARANCE FOR OCCUPANCY PERMIT', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.6', name: 'MAYOR\'S PERMIT FOR OCCUPANCY PERMIT', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' },
            { wbs: '5.7', name: 'BFP - FIRE SAFETY INSPECTION CLEARANCE FOR BUSINESS PERMIT', owner: 'System', date: '2026-03-01', status: 'NOT YET STARTED' }
        ];

        function getWbsStatusBadge(status) {
            switch (status) {
                case 'COMPLETED': return `<span style="background: var(--badge-bg-green); border: 1px solid var(--badge-border-green); color: var(--badge-text-green); padding: 2px 8px; border-radius: 9999px; font-size: 0.70rem; font-weight: 700; letter-spacing: 0.5px;">COMPLETED</span>`;
                case 'ONGOING': return `<span style="background: #e0e7ff; border: 1px solid #c7d2fe; color: #4f46e5; padding: 2px 8px; border-radius: 9999px; font-size: 0.70rem; font-weight: 700; letter-spacing: 0.5px;">ONGOING</span>`;
                default: return `<span style="background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-muted); padding: 2px 8px; border-radius: 9999px; font-size: 0.70rem; font-weight: 700; letter-spacing: 0.5px;">NOT YET STARTED</span>`;
            }
        }

        let currentWbsTab = "checklist"; // checklist, gantt, calendar

        let currentWbsCalendarView = 'month'; // 'day', 'month'
        let currentWbsCalendarYear = 2026;

        window.setWbsCalendarView = function(view) {
            currentWbsCalendarView = view;
            renderWbsChecklistViewRefresh();
        };

        window.updateWbsCalendarYear = function(year) {
            currentWbsCalendarYear = year;
            renderWbsChecklistViewRefresh();
        };
        
        window.openWbsTaskModal = function() {
            const m = document.getElementById('wbsTaskModal');
            if (m) m.style.display = 'flex';
        };
        window.closeWbsTaskModal = function() {
            const m = document.getElementById('wbsTaskModal');
            if (m) m.style.display = 'none';
        };

        window.setWbsTab = function(tab) {
            currentWbsTab = tab;
            renderWbsChecklistViewRefresh();
        };

        window.renderWbsChecklistView = function() { console.warn('[Legacy] Attempted to call removed renderer: renderWbsChecklistView'); };

        window.renderWbsChecklistViewRefresh = function() { console.warn('[Legacy] Attempted to call removed renderer: renderWbsChecklistViewRefresh'); };


        // RENDER WBS SEQUENCE VIEW (Extracted independently)
        window.renderWbsSequenceView = function() { console.warn('[Legacy] Attempted to call removed renderer: renderWbsSequenceView'); };

        // Render Single Project (Task List)
        window.renderProjectView = function(projectId) {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            
            currentView = 'project_detail';
            currentProjectId = projectId;
            updateSubNavVisibility();
            
            let html = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h1>${project.title} - Tasks</h1>
                    <button class="btn btn-primary" onclick="openModal()">+ New Task</button>
                </div>
                <div class="task-list">
            `;
            
            if (project.tasks.length === 0) {
                html += `<div style="padding: 24px; color: var(--text-muted);">No tasks yet.</div>`;
            } else {
                project.tasks.forEach(t => {
                    const priorityClass = `priority-${t.priority.toLowerCase()}`;
                    html += `
                        <div class="task-item ${t.completed ? 'completed' : ''}">
                            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${project.id}, ${t.id})">
                            <div class="task-content">
                                <div class="task-title">${t.title}</div>
                                <div class="task-meta">
                                    <span>Assignee: ${t.assignee}</span>
                                    <span class="task-priority ${priorityClass}">
                                        Priority: ${t.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            
            html += `</div>`;
            contentArea.innerHTML = html;
        }

        // Toggle Task Completion
        window.toggleTask = function(projectId, taskId) {
            const project = projects.find(p => p.id === projectId);
            const task = project.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                // Update progress
                if (project.tasks.length > 0) {
                    const completedTasks = project.tasks.filter(t => t.completed).length;
                    project.progress = Math.round((completedTasks / project.tasks.length) * 100);
                    if (project.progress === 100) project.status = 'Completed';
                    else if (project.progress > 0) project.status = 'Active';
                    else project.status = 'Planning';
                }
                
                renderProjectView(projectId);
            }
        }

        window.renderTasksView = function(tab = 'kanban') {
            currentView = 'tasks';
            currentProjectId = null;
            updateSubNavVisibility();
            
            // Gather all tasks from all projects for the global view
            let allTasks = [];
            projects.forEach(p => {
                p.tasks.forEach(t => {
                    allTasks.push({...t, projectName: p.title});
                });
            });

            const todoTasks = allTasks.filter(t => !t.completed && t.priority !== 'High');
            const inProgressTasks = allTasks.filter(t => !t.completed && t.priority === 'High'); // Just for demo distribution
            const reviewTasks = [];
            const completedTasks = allTasks.filter(t => t.completed);

            let html = `
                <div class="view-header">
                    <div>
                        <h1>Tasks</h1>
                        <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Track work items and execution</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display: flex; gap: 16px; font-size: 0.85rem; font-weight: 600; margin-right: 16px;">
                            <span>${allTasks.length} <span style="color:var(--text-muted)">Total Tasks</span></span>
                            <span style="color: #0052cc">${todoTasks.length} <span style="color:var(--text-muted)">To Do</span></span>
                            <span style="color: #ff9900">${inProgressTasks.length} <span style="color:var(--text-muted)">ONGOING</span></span>
                            <span style="color: #9933ff">${reviewTasks.length} <span style="color:var(--text-muted)">Review</span></span>
                            <span style="color: #00b300">${completedTasks.length} <span style="color:var(--text-muted)">Completed</span></span>
                        </div>
                        <button class="btn btn-primary">+ New Task</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px; display: flex; gap: 8px;">
                    <button class="btn btn-secondary" style="background: var(--bg-surface); ${tab === 'kanban' ? 'border-color: var(--primary); color: var(--primary);' : ''}" onclick="renderTasksView('kanban')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> Kanban</button>
                    <button class="btn btn-secondary" style="background: var(--bg-surface); ${tab === 'list' ? 'border-color: var(--primary); color: var(--primary);' : ''}" onclick="renderTasksView('list')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> List</button>
                    <button class="btn btn-secondary" style="background: var(--bg-surface); ${tab === 'timeline' ? 'border-color: var(--primary); color: var(--primary);' : ''}" onclick="renderTasksView('timeline')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Timeline</button>
                </div>
            `;

            if (tab === 'kanban') {
                html += `
                <div class="kanban-board">
                    <div class="kanban-column todo" ondragover="allowDrop(event)" ondrop="dropTask(event, 'Planning')">
                        <div class="kanban-header">
                            <span>To Do</span>
                            <span class="kanban-count">${todoTasks.length}</span>
                        </div>
                        <div class="kanban-body">
                            ${todoTasks.map(t => `
                                <div class="kanban-card" draggable="true" ondragstart="dragTask(event, ${t.id})">
                                    <div class="kanban-card-title">${t.title}</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span class="kanban-badge medium">${t.priority}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${t.projectName}</span>
                                    </div>
                                </div>
                            `).join('')}
                            ${todoTasks.length === 0 ? '<div class="kanban-empty">Drop tasks here</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="kanban-column in-progress" ondragover="allowDrop(event)" ondrop="dropTask(event, 'Active')">
                        <div class="kanban-header">
                            <span>ONGOING</span>
                            <span class="kanban-count">${inProgressTasks.length}</span>
                        </div>
                        <div class="kanban-body">
                            ${inProgressTasks.map(t => `
                                <div class="kanban-card" draggable="true" ondragstart="dragTask(event, ${t.id})">
                                    <div class="kanban-card-title">${t.title}</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span class="kanban-badge medium" style="color: #ff3333; background: rgba(255,51,51,0.1); border-color: rgba(255,51,51,0.2)">${t.priority}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${t.projectName}</span>
                                    </div>
                                </div>
                            `).join('')}
                            ${inProgressTasks.length === 0 ? '<div class="kanban-empty">Drop tasks here</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="kanban-column review" ondragover="allowDrop(event)" ondrop="dropTask(event, 'Review')">
                        <div class="kanban-header">
                            <span>Review</span>
                            <span class="kanban-count">${reviewTasks.length}</span>
                        </div>
                        <div class="kanban-body">
                            ${reviewTasks.length === 0 ? '<div class="kanban-empty">Drop tasks here</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="kanban-column completed" ondragover="allowDrop(event)" ondrop="dropTask(event, 'Completed')">
                        <div class="kanban-header">
                            <span>Completed</span>
                            <span class="kanban-count">${completedTasks.length}</span>
                        </div>
                        <div class="kanban-body">
                            ${completedTasks.map(t => `
                                <div class="kanban-card" draggable="true" ondragstart="dragTask(event, ${t.id})" style="opacity: 0.7">
                                    <div class="kanban-card-title" style="text-decoration: line-through; color: var(--text-muted)">${t.title}</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span class="kanban-badge" style="background: rgba(0,179,0,0.1); color: #00b300; border: 1px solid rgba(0,179,0,0.2)">Done</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">${t.projectName}</span>
                                    </div>
                                </div>
                            `).join('')}
                            ${completedTasks.length === 0 ? '<div class="kanban-empty">Drop tasks here</div>' : ''}
                        </div>
                    </div>
                </div>
                `;
            } else if (tab === 'list') {
                html += `
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                            <thead style="background: var(--bg-body);">
                                <tr>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Task Name</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Project</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Status</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allTasks.map(t => `
                                    <tr>
                                        <td style="padding: 12px 16px; font-weight: 500; border-bottom: 1px solid var(--border-color);">${t.title}</td>
                                        <td style="padding: 12px 16px; color: var(--text-muted); font-size: 0.9rem; border-bottom: 1px solid var(--border-color);">${t.projectName}</td>
                                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span class="kanban-badge" style="${t.completed ? 'background: rgba(0,179,0,0.1); color: #00b300; border: 1px solid rgba(0,179,0,0.2);' : 'background: rgba(0,82,204,0.1); color: #0052cc; border: 1px solid rgba(0,82,204,0.2);'}">${t.completed ? 'Done' : 'Active'}</span></td>
                                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span class="kanban-badge medium" style="${t.priority === 'High' ? 'color: #ff3333; background: rgba(255,51,51,0.1); border-color: rgba(255,51,51,0.2)' : ''}">${t.priority}</span></td>
                                    </tr>
                                `).join('')}
                                ${allTasks.length === 0 ? '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-muted);">No tasks found.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                `;
            } else if (tab === 'timeline') {
                html += `
                <div style="background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color); padding: 24px; height: calc(100vh - 280px); overflow-y: auto;">
                    <div style="color: var(--text-muted); margin-bottom: 24px; font-size: 0.9rem;">Timeline View (Gantt Chart representation)</div>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${allTasks.map((t, i) => `
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="width: 250px; font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${t.title}
                                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${t.projectName}</div>
                                </div>
                                <div style="flex: 1; background: var(--bg-body); height: 28px; border-radius: 14px; position: relative; border: 1px solid var(--border-color);">
                                    <div style="position: absolute; left: ${Math.random() * 30}%; width: ${20 + Math.random() * 40}%; height: 100%; background: ${t.completed ? '#00b300' : 'var(--primary)'}; border-radius: 14px; opacity: 0.8; display: flex; align-items: center; padding: 0 12px; color: white; font-size: 0.75rem; font-weight: 600;">
                                        ${t.completed ? 'Completed' : 'Scheduled'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            }
            
            contentArea.innerHTML = html;
        }

        window.renderCalendarView = function() { console.warn('[Legacy] Attempted to call removed renderer: renderCalendarView'); };

        window.changeCalendarMonth = function(delta) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
            renderCalendarView('month');
        }

        window.changeCalendarDay = function(delta) {
            selectedCalendarDate.setDate(selectedCalendarDate.getDate() + delta);
            currentCalendarDate = new Date(selectedCalendarDate);
            renderCalendarView('day');
        }

        window.selectCalendarDate = function(year, month, day) {
            selectedCalendarDate = new Date(year, month, day);
            renderCalendarView('month');
        }

        // --- Request View & PRS Logic ---
        window.prsRecords = window.prsRecords || [];
        let prsRecords = window.prsRecords;
        window.manilaRecords = window.manilaRecords || [];
        let manilaRecords = window.manilaRecords;
        
        window.boqBudgets = window.boqBudgets || {};
        let boqBudgets = window.boqBudgets;
        let currentBoqTab = 'All'; // All, Paid, Unpaid
        let boqSearchQuery = '';
        let boqExpandedParents = {}; // { 'B2': true, ... }

        
        // --- Project Schedule Logic ---
        window.projectSchedules = window.projectSchedules || {};
        let projectSchedules = window.projectSchedules;
        let currentScheduleTab = 'baseline'; // baseline, actual, gantt
        let scheduleSearchQuery = '';
        let scheduleExpandedParents = {};

        
        window.renderProjectScheduleView = function() {
            const perfId = 'renderProjectScheduleView-' + Date.now();
            console.time(perfId);
            try {
                if (currentProjectId) updateProjectScheduleStats(currentProjectId);
                if (!currentProjectId) {
                    console.timeEnd(perfId);
                    return;
                }
                currentView = 'project-schedule';
                updateSubNavVisibility();

            if (!projectSchedules[currentProjectId]) {
                projectSchedules[currentProjectId] = {};
            }
            const scheduleData = projectSchedules[currentProjectId];
            const projectBudgets = boqBudgets[currentProjectId] || {};

            const parentNames = {
                'B2': 'Permitting',
                'B3': 'Feasibility Study',
                'B4': 'Water, Electrical, and Internet Connection',
                'B5': 'Special Tools, Supplies, and PPE',
                'B6': 'Administrative Expenses',
                'C1': 'Logistics',
                'C2': 'General Works',
                'C3': 'Diesel Power Plant',
                'C4': 'Substation and Transmission Line',
                'C5': 'SCADA System',
                'C6': 'Testing and Commissioning',
                'D1': 'General Works',
                'D2': 'Diesel Power Plant',
                'D3': 'Substation and Transmission Line',
                'D4': 'SCADA System',
                'D5': 'Testing and Commissioning'
            };

            const tree = {
                'A': { title: 'BIDDING', color: '#3b82f6', items: [] },
                'B': { title: 'PRE-DEVELOPMENT WORKS & OTHER PROJECT EXPENSES', color: '#a855f7', items: [] },
                'C': { title: 'PROCUREMENT', color: '#f59e0b', items: [] },
                'D': { title: 'CONSTRUCTION', color: '#22c55e', items: [] }
            };

            const itemsByParent = {};
            let totalProjectBudget = 0;

            let customProjectScheduleTasks = window.customProjectScheduleTasks || {};
            let combinedOptionsForSched1 = [...subtaskChargingOptions, ...(customProjectScheduleTasks[currentProjectId] || [])];
            combinedOptionsForSched1.sort((a, b) => {
                let pA = a.split(' - ')[0].match(/^([A-D])([0-9.]+)$/);
                let pB = b.split(' - ')[0].match(/^([A-D])([0-9.]+)$/);
                if (!pA || !pB) return a.localeCompare(b);
                if (pA[1] !== pB[1]) return pA[1].localeCompare(pB[1]);
                let partsA = pA[2].split('.').map(Number);
                let partsB = pB[2].split('.').map(Number);
                for(let i=0; i<Math.max(partsA.length, partsB.length); i++) {
                    let nA = partsA[i] || 0;
                    let nB = partsB[i] || 0;
                    if (nA !== nB) return nA - nB;
                }
                return 0;
            });
            combinedOptionsForSched1.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
                if (match) {
                    const category = match[1];
                    const code = match[1] + match[2];
                    let name = match[3].trim();
                    name = name.replace(/\s*\(PROCUREMENT\)$/i, '').replace(/\s*\(CONSTRUCTION\)$/i, '');

                    const budget = projectBudgets[code] || 0;
                    totalProjectBudget += budget;

                    if (!scheduleData[code]) {
                        scheduleData[code] = {
                            duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                            actualStart: '', actualEnd: '', actualQty: '', targetQty: ''
                        };
                    }

                    const item = {
                        code: code,
                        name: name,
                        budget: budget,
                        data: scheduleData[code]
                    };

                    if (code.includes('.')) {
                        const parentCode = code.split('.')[0];
                        if (!scheduleData[parentCode]) {
                            scheduleData[parentCode] = {
                                duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                                actualStart: '', actualEnd: '', actualQty: '', targetQty: ''
                            };
                        }
                        if (!itemsByParent[parentCode]) {
                            itemsByParent[parentCode] = {
                                code: parentCode,
                                name: parentNames[parentCode] || parentCode,
                                isParent: true,
                                expanded: scheduleExpandedParents[parentCode] !== false,
                                subItems: [],
                                budget: 0,
                                data: scheduleData[parentCode]
                            };
                            tree[category].items.push(itemsByParent[parentCode]);
                        }
                        itemsByParent[parentCode].subItems.push(item);
                        itemsByParent[parentCode].budget += item.budget;
                    } else {
                        tree[category].items.push(item);
                    }
                }
            });

            // Calculate totals from Manila and Local records
            const mnlRecords = manilaRecords.filter(r => r.projectId === currentProjectId);
            const lclRecords = localRecords.filter(r => r.projectId === currentProjectId);
            const allRecords = [...mnlRecords, ...lclRecords];

            let totalActualExpense = 0;
            
            allRecords.forEach(record => {
                if (!record.subtaskCharging) return;
                const match = record.subtaskCharging.match(/^([A-D][0-9.]+)/);
                if (match) {
                    const amount = parseFloat(record.actualAmount) || parseFloat(record.totalCost) || 0;
                    totalActualExpense += amount;
                }
            });



            let minTargetStart = null;
            let maxTargetEnd = null;
            
            let allCodes = [];
            Object.values(tree).forEach(cat => {
                cat.items.forEach(node => {
                    allCodes.push(node.code);
                    if (node.isParent && node.subItems) {
                        node.subItems.forEach(sub => {
                            allCodes.push(sub.code);
                        });
                    }
                });
            });
            // Update the top level max/min from precomputed data
            allCodes.forEach(code => {
                if(!code.includes('.')) {
                    const d = projectSchedules[currentProjectId][code] || {};
                    if(d.targetStart && (!minTargetStart || new Date(d.targetStart) < minTargetStart)) minTargetStart = new Date(d.targetStart);
                    if(d.targetEnd && (!maxTargetEnd || new Date(d.targetEnd) > maxTargetEnd)) maxTargetEnd = new Date(d.targetEnd);
                }
            });

            // Sort children
            Object.values(tree).forEach(cat => {
                cat.items.forEach(node => {
                    if(node.isParent && node.subItems) {
                        node.subItems.sort((a,b) => {
                            let pA = a.code.split('.').map(Number);
                            let pB = b.code.split('.').map(Number);
                            for(let i=0; i<Math.max(pA.length, pB.length); i++) {
                                let nA = pA[i] || 0;
                                let nB = pB[i] || 0;
                                if(nA !== nB) return nA-nB;
                            }
                            return 0;
                        });
                    }
                });
            });

            const formatDate = (date) => {
                if (!date) return '—';
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            };

            const overallProgressPct = projectSchedules[currentProjectId] ? (projectSchedules[currentProjectId]._overallProgressPct || 0) : 0;
            const targetProgressPct = projectSchedules[currentProjectId] ? (projectSchedules[currentProjectId]._targetProgressPct || 0) : 0;
            const variancePct = overallProgressPct - targetProgressPct;
            const varianceColor = variancePct < 0 ? 'var(--badge-text-red)' : (variancePct > 0 ? 'var(--badge-text-green)' : 'var(--text-muted)');
            const varianceLabel = `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%`;
            
            const renderStatusBadge = (status) => {
                switch(status) {
                    case 'Completed': return '<span style="background: var(--badge-bg-green); color: var(--badge-text-green); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Completed</span>';
                    case 'Overdue': return '<span style="background: #fee2e2; color: var(--badge-text-red); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Overdue</span>';
                    case 'In Progress': return '<span style="background: var(--badge-bg-blue); color: #0284c7; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">In Progress</span>';
                    default: return '<span style="background: var(--badge-bg-gray); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Not Started</span>';
                }
            };

            let tableHtml = '';

            if (currentScheduleTab === 'baseline' || currentScheduleTab === 'actual') {
                const isBaseline = currentScheduleTab === 'baseline';
                tableHtml = `
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: #1e293b; color: white;">
                            <tr>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">ITEM NO.</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">DESCRIPTION / SCOPE OF WORK</th>
                                ${isBaseline ? `
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">DURATION (DAYS)</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">TARGET START</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">TARGET END</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">TOTAL QTY</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: right;">WEIGHT (%)</th>
                                ` : `
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">ACTUAL START</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">ACTUAL END</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">ACTUAL QTY</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">TARGET QTY</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: right;">ACTUAL %</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: right;">TARGET %</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: right;">VARIANCE</th>
                                `}
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">STATUS</th>
                                ${isBaseline ? `<th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600;">REMARKS</th>` : ''}
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; text-align: center;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                        const renderRow = (item, isSub = false) => {
                    if (scheduleSearchQuery) {
                        const q = scheduleSearchQuery.toLowerCase();
                        if (!item.code.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) {
                            if (item.isParent) {
                                const hasMatch = item.subItems.some(sub => sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q));
                                if (!hasMatch) return '';
                                item.expanded = true;
                            } else {
                                return '';
                            }
                        }
                    }

                    if (item.isParent) {
                        let subHtml = '';
                        if (item.expanded) {
                            subHtml = item.subItems.map(sub => renderRow(sub, true)).join('');
                        } else {
                            if (scheduleSearchQuery) {
                                const hasVisibleSub = item.subItems.some(sub => {
                                    const q = scheduleSearchQuery.toLowerCase();
                                    return sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q);
                                });
                                if (!hasVisibleSub) return '';
                            }
                        }

                        if (!subHtml && scheduleSearchQuery && !item.expanded) {
                            // Already auto-expanded
                        } else if (!subHtml && scheduleSearchQuery) {
                            return '';
                        }

                        const parentWeight = totalProjectBudget > 0 ? ((item.budget / totalProjectBudget) * 100).toFixed(2) + '%' : '—';

                        const pTargetPct = item.data?.targetQty ? '100.0%' : '0.0%';
                        let pProgNum = Number(item.data?.computedProgress);
                        pProgNum = isNaN(pProgNum) ? 0 : pProgNum;
                        console.log('[RENDER]', item.code, {
                           renderedProgress: item.data?.computedProgress
                        });
                        const pActualPct = pProgNum.toFixed(1) + '%';
                        const pVariance = (pProgNum - parseFloat(pTargetPct)).toFixed(1) + '%';
                        const pVarianceColor = parseFloat(pVariance) < 0 ? 'var(--badge-text-red)' : (parseFloat(pVariance) > 0 ? 'var(--badge-text-green)' : 'var(--text-muted)');
                        
                        let pDepth = item.code.split('.').length;
                        let pPadLeft = isSub ? (16 + (pDepth - 1) * 24) : 16;

                        return `
                            <tr style="background: var(--bg-body); border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="toggleScheduleParent('${item.code}')">
                                <td style="padding: 12px 16px 12px ${pPadLeft}px !important; font-size: 0.85rem; font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: ${item.expanded ? 'rotate(90deg)' : 'rotate(0deg)'}; transition: transform 0.2s;"><polyline points="9 18 15 12 9 6"/></svg>
                                        <button onclick="event.stopPropagation(); window.openAddSubtaskModal('${item.code}')" style="background:none; border:none; color:var(--primary-color); cursor:pointer; padding:2px; display:inline-flex;" title="Add Task Under"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                                        ${item.code}
                                    </div>
                                </td>
                                <td style="padding: 12px 16px 12px ${pPadLeft}px !important; font-size: 0.85rem; font-weight: 600;">
                                    ${item.name}
                                </td>
                                ${isBaseline ? `
                                <td style="padding: 12px 16px; text-align: center;">${item.data?.duration || '—'}</td>
                                <td style="padding: 12px 16px;">${item.data?.targetStart || '—'}</td>
                                <td style="padding: 12px 16px;">${item.data?.targetEnd || '—'}</td>
                                <td style="padding: 12px 16px; text-align: center;">${item.data?.targetQty || '—'}</td>
                                <td style="padding: 12px 16px; font-size: 0.85rem; font-weight: 600; text-align: right;">${parentWeight}</td>
                                ` : `
                                <td style="padding: 12px 16px;">${item.data?.actualStart || '—'}</td>
                                <td style="padding: 12px 16px;">${item.data?.actualEnd || '—'}</td>
                                <td style="padding: 12px 16px; text-align: center;">${JSON.stringify(item.data?.actualQty)}</td>
                                <td style="padding: 12px 16px; text-align: center;">${JSON.stringify(item.data?.targetQty)}</td>
                                <td style="padding: 12px 16px; text-align: right;">${pActualPct}</td>
                                <td style="padding: 12px 16px; text-align: right;">${pTargetPct}</td>
                                <td style="padding: 12px 16px; text-align: right; color: ${pVarianceColor};">${pVariance}</td>
                                `}
                                <td style="padding: 12px 16px; text-align: center;">${item.data?.status ? renderStatusBadge(item.data.status) : '—'}</td>
                                ${isBaseline ? `<td style="padding: 12px 16px;">${item.data?.remarks || ''}</td>` : ''}
                                <td style="padding: 12px 16px;"></td>
                            </tr>
                            ${subHtml}
                        `;
                    }

                    const weight = totalProjectBudget > 0 ? ((item.budget / totalProjectBudget) * 100).toFixed(2) + '%' : '—';
                    
                    const targetPct = item.data.targetQty ? '100.0%' : '0.0%';
                    
                    const parseQty = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        const cleaned = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
                        return Number(cleaned) || 0;
                    };
                    const tSafe = Math.max(0, parseQty(item.data.targetQty));
                    const aSafe = Math.max(0, parseQty(item.data.actualQty));
                    
                    let aProgNum = 0;
                    if (tSafe > 0) {
                        aProgNum = (aSafe / tSafe) * 100;
                    } else {
                        aProgNum = Number(item.data.computedProgress);
                    }
                    aProgNum = isNaN(aProgNum) ? 0 : Math.max(0, Math.min(100, aProgNum));
                    
                    console.log('[RENDER]', item.code, {
                       renderedProgress: item.data?.computedProgress
                    });
                    const actualPct = aProgNum.toFixed(1) + '%';
                    const variance = (aProgNum - parseFloat(targetPct)).toFixed(1) + '%';
                    const varianceColor = parseFloat(variance) < 0 ? 'var(--badge-text-red)' : (parseFloat(variance) > 0 ? 'var(--badge-text-green)' : 'var(--text-muted)');
                    
                    let depth = item.code.split('.').length;
                    let padLeft = isSub ? (16 + (depth - 1) * 24) : 16;

                    return `
                        <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-surface);">
                            <td style="padding: 12px 16px 12px ${padLeft}px !important; font-size: 0.85rem; color: var(--text-muted);">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <button onclick="event.stopPropagation(); window.openAddSubtaskModal('${item.code}')" style="background:none; border:none; color:var(--primary-color); cursor:pointer; padding:2px; display:inline-flex;" title="Add Task Under"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                                    ${item.code}
                                </div>
                            </td>
                            <td style="padding: 12px 16px 12px ${padLeft}px !important; font-size: 0.85rem;">${item.name}</td>
                            ${isBaseline ? `
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${item.data.duration || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem;">${item.data.targetStart || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem;">${item.data.targetEnd || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${item.data.targetQty || item.data.qty || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right;">${weight}</td>
                            ` : `
                            <td style="padding: 12px 16px; font-size: 0.85rem;">${item.data.actualStart || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem;">${item.data.actualEnd || '—'}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${JSON.stringify(item.data.actualQty)}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${JSON.stringify(item.data.targetQty)}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right;">${actualPct}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right;">${targetPct}</td>
                            <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right; color: ${varianceColor};">${variance}</td>
                            `}
                            <td style="padding: 12px 16px; text-align: center;">${renderStatusBadge(item.data.status)}</td>
                            ${isBaseline ? `<td style="padding: 12px 16px; font-size: 0.85rem;">${item.data.remarks || ''}</td>` : ''}
                            <td style="padding: 12px 16px; text-align: center;">
                                <button onclick="editScheduleItem('${item.code}')" style="background: none; border: none; cursor: pointer; color: var(--text-muted);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                            </td>
                        </tr>
                    `;
                };

                Object.values(tree).forEach(cat => {
                    if (cat.items.length === 0) return;
                    
                    const colSpan = isBaseline ? 10 : 11;
                    
                    tableHtml += `
                        <tr style="background: ${cat.color}15; border-bottom: 2px solid ${cat.color}30;">
                            <td colspan="${colSpan}" style="padding: 12px 16px; font-weight: 700; color: ${cat.color};">
                                ${cat.title}
                            </td>
                        </tr>
                    `;

                    cat.items.forEach(item => {
                        tableHtml += renderRow(item);
                    });
                });

                tableHtml += `</tbody></table>`;
            } else if (currentScheduleTab === 'gantt') {
                let gMin = null;
                let gMax = null;
                const checkDate = (dStr) => {
                    if(!dStr) return;
                    const d = new Date(dStr);
                    if(isNaN(d.getTime())) return;
                    if(!gMin || d < gMin) gMin = d;
                    if(!gMax || d > gMax) gMax = d;
                };
                Object.values(tree).forEach(cat => {
                    const walk = (item) => {
                       checkDate(item.data?.targetStart);
                       checkDate(item.data?.targetEnd);
                       checkDate(item.data?.actualStart);
                       checkDate(item.data?.actualEnd);
                       if (item.subItems) item.subItems.forEach(walk);
                    };
                    cat.items.forEach(walk);
                });

                if (!gMin || !gMax) {
                    tableHtml = `
                        <div style="padding: 24px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-body);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; color: #94a3b8;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                            <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Gantt Chart View</h3>
                            <p style="font-size: 0.9rem;">No dates available. Please set Target or Actual dates on tasks to generate the Gantt chart.</p>
                        </div>
                    `;
                } else {
                    window.ganttViewMode = window.ganttViewMode || 'monthly';
                    
                    let msDiff = gMax.getTime() - gMin.getTime();
                    let dDiff = msDiff / (1000 * 60 * 60 * 24);
                    
                    let minDays = 1;
                    if (window.ganttViewMode === 'daily') minDays = 15; // 15 days * 40px = 600px
                    else if (window.ganttViewMode === 'weekly') minDays = 70; // 10 weeks * 60px = 600px
                    else minDays = 180; // 6 months * 100px = 600px
                    
                    if (dDiff < minDays) {
                        gMax = new Date(gMin.getTime() + (minDays * 24 * 60 * 60 * 1000));
                    }
                    
                    const totalMs = gMax.getTime() - gMin.getTime();
                    const totalDays = Math.max(1, totalMs / (1000 * 60 * 60 * 24));
                    
                    let totalWidth = 600;
                    if (window.ganttViewMode === 'daily') {
                        totalWidth = totalDays * 40;
                    } else if (window.ganttViewMode === 'weekly') {
                        totalWidth = (totalDays / 7) * 60;
                    } else { // monthly
                        totalWidth = (totalDays / 30) * 100;
                    }
                    // ensure minimum width to fill space
                    totalWidth = Math.max(600, totalWidth);

                    let dateHeaders = '';
                    let gridLines = '';

                    if (window.ganttViewMode === 'daily') {
                        let current = new Date(gMin.getTime());
                        current.setHours(0,0,0,0);
                        let end = new Date(gMax.getTime());
                        end.setHours(23,59,59,999);
                        while(current <= end) {
                            let offsetDays = (current.getTime() - gMin.getTime()) / (1000 * 60 * 60 * 24);
                            let pct = (offsetDays / totalDays) * 100;
                            let dStr = current.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).replace(',', '');
                            dateHeaders += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; border-left: 1px solid var(--border-color); display: flex; align-items: flex-end; padding-bottom: 4px; padding-left: 4px; font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: visible;">${dStr}</div>`;
                            gridLines += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; width: 1px; background: var(--border-color); opacity: 0.5; z-index: 0;"></div>`;
                            current.setDate(current.getDate() + 1);
                        }
                    } else if (window.ganttViewMode === 'weekly') {
                        let current = new Date(gMin.getTime());
                        current.setHours(0,0,0,0);
                        current.setDate(current.getDate() - current.getDay()); // Rewind to Sunday
                        let end = new Date(gMax.getTime());
                        end.setHours(23,59,59,999);
                        while(current <= end || current.getTime() < gMax.getTime() + 7*24*60*60*1000) {
                            let offsetDays = (current.getTime() - gMin.getTime()) / (1000 * 60 * 60 * 24);
                            let pct = (offsetDays / totalDays) * 100;
                            if (pct > 110) break;
                            let dStr = current.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).replace(',', '');
                            dateHeaders += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; border-left: 1px solid var(--border-color); display: flex; align-items: flex-end; padding-bottom: 4px; padding-left: 4px; font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: visible;">${dStr}</div>`;
                            gridLines += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; width: 1px; background: var(--border-color); opacity: 0.5; z-index: 0;"></div>`;
                            current.setDate(current.getDate() + 7);
                        }
                    } else { // monthly
                        let current = new Date(gMin.getTime());
                        current.setHours(0,0,0,0);
                        current.setDate(1); 
                        let end = new Date(gMax.getTime());
                        end.setHours(23,59,59,999);
                        while(current <= end || current.getTime() < gMax.getTime() + 31*24*60*60*1000) {
                            let offsetDays = (current.getTime() - gMin.getTime()) / (1000 * 60 * 60 * 24);
                            let pct = (offsetDays / totalDays) * 100;
                            if (pct > 110) break;
                            let dStr = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            dateHeaders += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; border-left: 1px solid var(--border-color); display: flex; align-items: flex-end; padding-bottom: 4px; padding-left: 4px; font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: visible;">${dStr}</div>`;
                            gridLines += `<div style="position: absolute; left: ${pct}%; top: 0; bottom: 0; width: 1px; background: var(--border-color); opacity: 0.5; z-index: 0;"></div>`;
                            current.setMonth(current.getMonth() + 1);
                        }
                    }
                    
                    const getStyle = (sStr, eStr, color) => {
                        if(!sStr || !eStr) return '';
                        const sD = new Date(sStr);
                        const eD = new Date(eStr);
                        if(isNaN(sD.getTime()) || isNaN(eD.getTime())) return '';
                        let offset = sD.getTime() - gMin.getTime();
                        let dur = eD.getTime() - sD.getTime();
                        let pctLeft = (offset / totalMs) * 100;
                        let pctWidth = (dur / totalMs) * 100;
                        return `left: ${pctLeft}%; width: ${Math.max(0.5, pctWidth)}%; background-color: ${color};`;
                    };

                    let ganttRows = '';
                    const renderGanttItem = (item, isSub=false) => {
                        let tStyle = getStyle(item.data?.targetStart, item.data?.targetEnd, '#3b82f6');
                        let aStyle = getStyle(item.data?.actualStart, item.data?.actualEnd, '#22c55e');
                        let depth = item.code.split('.').length;
                        let paddingL = isSub ? (16 + (depth - 1) * 24) : 16;
                        let fw = item.isParent ? '600' : '400';

                        let hasVisibleChild = false;
                        if (scheduleSearchQuery) {
                            const q = scheduleSearchQuery.toLowerCase();
                            if (!item.code.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) {
                                if (item.isParent && item.subItems) {
                                    hasVisibleChild = item.subItems.some(sub => sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q));
                                    if (!hasVisibleChild) return;
                                } else {
                                    return;
                                }
                            }
                        }

                        ganttRows += `
                        <div style="display: flex; border-bottom: 1px solid var(--border-color); height: 48px; position: relative; width: max-content; min-width: 100%;">
                            <div style="flex: 0 0 320px; padding: 0 16px 0 ${paddingL}px !important; display: flex; align-items: center; font-size: 0.85rem; border-right: 1px solid var(--border-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: ${fw}; background: var(--bg-surface); z-index: 5; position: sticky; left: 0;">
                                ${item.code} - ${item.name}
                            </div>
                            <div style="min-width: ${totalWidth}px; width: ${totalWidth}px; flex-shrink: 0; position: relative; background: var(--bg-body); z-index: 1;">
                                ${gridLines}
                                ${tStyle ? `<div style="position: absolute; ${tStyle} top: 10px; height: 10px; border-radius: 4px; opacity: 0.6; z-index: 2;" title="Target: ${item.data.targetStart} to ${item.data.targetEnd}"></div>` : ''}
                                ${aStyle ? `<div style="position: absolute; ${aStyle} top: 24px; height: 10px; border-radius: 4px; z-index: 2;" title="Actual: ${item.data.actualStart} to ${item.data.actualEnd}"></div>` : ''}
                            </div>
                        </div>
                        `;
                        
                        if (item.isParent && item.expanded && item.subItems) {
                            item.subItems.forEach(sub => renderGanttItem(sub, true));
                        }
                    };

                    Object.values(tree).forEach(cat => {
                        if (cat.items.length === 0) return;
                        ganttRows += `
                        <div style="display: flex; border-bottom: 1px solid var(--border-color); height: 36px; background: ${cat.color}15; position: relative; width: max-content; min-width: 100%;">
                            <div style="flex: 0 0 320px; padding: 0 16px; display: flex; align-items: center; font-size: 0.85rem; font-weight: 700; color: ${cat.color}; border-right: 1px solid var(--border-color); background: var(--bg-surface); z-index: 5; position: sticky; left: 0;">
                                ${cat.title}
                            </div>
                            <div style="min-width: ${totalWidth}px; width: ${totalWidth}px; flex-shrink: 0; background: var(--bg-body); position: relative;">
                                ${gridLines}
                            </div>
                        </div>
                        `;
                        cat.items.forEach(item => renderGanttItem(item));
                    });

                    tableHtml = `
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; align-items: center;">
                        <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">Zoom: </span>
                        <button class="btn ${window.ganttViewMode === 'daily' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ganttViewMode='daily'; renderProjectScheduleView()" style="padding: 6px 12px; font-size: 0.85rem;">Daily</button>
                        <button class="btn ${window.ganttViewMode === 'weekly' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ganttViewMode='weekly'; renderProjectScheduleView()" style="padding: 6px 12px; font-size: 0.85rem;">Weekly</button>
                        <button class="btn ${window.ganttViewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}" onclick="window.ganttViewMode='monthly'; renderProjectScheduleView()" style="padding: 6px 12px; font-size: 0.85rem;">Monthly</button>
                        
                        <div style="margin-left: auto; display: flex; gap: 16px;">
                            <span style="display:flex; align-items:center; gap:4px; font-size: 0.85rem; color: var(--text-muted);"><span style="width:12px;height:12px;background:#3b82f6;opacity:0.6;border-radius:2px;"></span> Target Timeline</span>
                            <span style="display:flex; align-items:center; gap:4px; font-size: 0.85rem; color: var(--text-muted);"><span style="width:12px;height:12px;background:#22c55e;border-radius:2px;"></span> Actual Progress</span>
                        </div>
                    </div>
                    <div data-report-preserve="true" class="project-schedule-gantt-report" style="background: var(--bg-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); overflow: hidden; display: flex; flex-direction: column;">
                        <div style="overflow-x: auto; overflow-y: hidden; background: var(--badge-bg-gray);">
                            <div style="display: flex; border-bottom: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--text-main); height: 40px; width: max-content; min-width: 100%;">
                                <div style="flex: 0 0 320px; padding: 0 16px; text-align: left; border-right: 1px solid var(--border-color); background: var(--badge-bg-gray); z-index: 5; position: sticky; left: 0; display: flex; align-items: center;">TASK</div>
                                <div style="min-width: ${totalWidth}px; width: ${totalWidth}px; flex-shrink: 0; position: relative;">
                                    ${dateHeaders}
                                </div>
                            </div>
                            <div style="overflow: hidden; max-height: 550px;">
                                ${ganttRows}
                            </div>
                        </div>
                    </div>
                    `;
                }
            }

            contentArea.innerHTML = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Project Schedule</h1>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Track baseline schedule, actual accomplishments, and Gantt chart</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="background: #eff6ff; border: 1px solid #bfdbfe; display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; color: #1d4ed8; font-weight: 600; margin-bottom: 4px;">Actual Progress</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${overallProgressPct.toFixed(1)}%</div>
                            <div style="height: 8px; background: #dbeafe; border-radius: 4px; overflow: hidden; margin-top: 8px;">
                                <div style="height: 100%; width: ${Math.max(0, Math.min(100, overallProgressPct))}%; background: #3b82f6; border-radius: 4px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card" style="background: #f5f3ff; border: 1px solid #ddd6fe; display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; color: #6d28d9; font-weight: 600; margin-bottom: 4px;">Target Progress</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #4c1d95;">${targetProgressPct.toFixed(1)}%</div>
                            <div style="height: 8px; background: #ede9fe; border-radius: 4px; overflow: hidden; margin-top: 8px;">
                                <div style="height: 100%; width: ${Math.max(0, Math.min(100, targetProgressPct))}%; background: #8b5cf6; border-radius: 4px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card" style="background: ${variancePct < 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${variancePct < 0 ? '#fecaca' : '#bbf7d0'}; display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: ${variancePct < 0 ? '#ef4444' : '#22c55e'}; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M7 14l4-4 4 4 5-6"></path></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: ${variancePct < 0 ? '#b91c1c' : '#15803d'}; font-weight: 600; margin-bottom: 4px;">Variance</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: ${variancePct < 0 ? '#7f1d1d' : '#14532d'};">${varianceLabel}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                        <input type="text" id="scheduleSearchInput" class="form-control" placeholder="Search tasks..." value="${scheduleSearchQuery}" onkeyup="scheduleSearchQuery = this.value; renderProjectScheduleView()" style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
                        <button class="btn ${currentScheduleTab === 'baseline' ? 'btn-primary' : ''}" onclick="currentScheduleTab = 'baseline'; renderProjectScheduleView()" style="border-radius: 0; border: none; ${currentScheduleTab === 'baseline' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">Schedule (Baseline)</button>
                        <button class="btn ${currentScheduleTab === 'actual' ? 'btn-primary' : ''}" onclick="currentScheduleTab = 'actual'; renderProjectScheduleView()" style="border-radius: 0; border: none; ${currentScheduleTab === 'actual' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">Accomplishment (Actual)</button>
                        <button class="btn ${currentScheduleTab === 'gantt' ? 'btn-primary' : ''}" onclick="currentScheduleTab = 'gantt'; renderProjectScheduleView()" style="border-radius: 0; border: none; ${currentScheduleTab === 'gantt' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">Gantt Chart</button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="expandAllSchedule()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="6 9 12 15 18 9"/></svg> Expand All</button>
                        <button class="btn btn-secondary" onclick="collapseAllSchedule()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="18 15 12 9 6 15"/></svg> Collapse All</button>
                    </div>
                </div>

                <div class="card" style="padding: 0; overflow-x: auto;">
                    ${tableHtml}
                </div>
            `;
            
            // Focus search input and put cursor at end
            const input = document.getElementById('scheduleSearchInput');
            if (input) {
                if (document.activeElement && document.activeElement.id === 'scheduleSearchInput') {
                    input.focus({ preventScroll: true });
                    const val = input.value;
                    input.value = '';
                    input.value = val;
                }
            }
            } catch (err) {
                console.error('[ProjectSchedule] Failed to render view:', err);
                if (contentArea) contentArea.innerHTML = '<div style="padding: 20px; color: var(--badge-text-red);">Error rendering schedule. Please check the console.</div>';
            } finally {
                console.timeEnd(perfId);
            }
        };

        window.toggleScheduleParent = function(code) {
            scheduleExpandedParents[code] = scheduleExpandedParents[code] === false ? true : false;
            renderProjectScheduleView();
        };

        window.expandAllSchedule = function() {
            Object.keys(scheduleExpandedParents).forEach(k => scheduleExpandedParents[k] = true);
            // Also set true for those not in the object yet
            subtaskChargingOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)/);
                if (match) {
                    const parentCode = match[1] + match[2].split('.')[0];
                    scheduleExpandedParents[parentCode] = true;
                    scheduleExpandedParents[match[1]] = true;
                }
            });
            renderProjectScheduleView();
        };

        window.collapseAllSchedule = function() {
            Object.keys(scheduleExpandedParents).forEach(k => scheduleExpandedParents[k] = false);
            subtaskChargingOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)/);
                if (match) {
                    const parentCode = match[1] + match[2].split('.')[0];
                    scheduleExpandedParents[parentCode] = false;
                    scheduleExpandedParents[match[1]] = false;
                }
            });
            renderProjectScheduleView();
        };

        window.openAddSubtaskModal = function(parentCode) {
            if (!window.legacyGuardAdd('project-schedule')) return;
            const modalHtml = `
                <div class="modal-overlay active" id="addSubtaskModal">
                    <div class="modal" style="max-width: 500px;">
                        <div class="modal-header">
                            <h2>Add Task Under ${parentCode}</h2>
                            <button class="close-modal" onclick="document.getElementById('addSubtaskModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="event.preventDefault(); window.saveNewSubtask('${parentCode}')">
                                <div class="form-group" style="margin-bottom: 24px;">
                                    <label style="display:block; margin-bottom: 8px; font-weight: 600;">Task Description / Scope of Work</label>
                                    <input type="text" id="newSubtaskName" class="form-control" placeholder="e.g. Gather signatures" required style="width: 100%; padding: 8px;">
                                </div>
                                <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('addSubtaskModal').remove()" style="padding: 8px 16px; border-radius: 4px; border: 1px solid #ccc; background: var(--bg-surface); cursor: pointer;">Cancel</button>
                                    <button type="submit" class="btn btn-primary" style="padding: 8px 16px; border-radius: 4px; border: none; background: var(--badge-text-blue); color: white; cursor: pointer;">Add Task</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Auto focus
            setTimeout(() => {
                const input = document.getElementById('newSubtaskName');
                if (input) input.focus();
            }, 100);
        };

        window.saveNewSubtask = function(parentCode) {
            if (!window.legacyGuardAdd('project-schedule')) return;
            const name = document.getElementById('newSubtaskName').value.trim();
            if(!name) return;
            
            if(!window.customProjectScheduleTasks) window.customProjectScheduleTasks = {};
            if(!window.customProjectScheduleTasks[currentProjectId]) {
                window.customProjectScheduleTasks[currentProjectId] = [];
            }
            
            // Generate the next code
            let combinedOptions = [...subtaskChargingOptions, ...window.customProjectScheduleTasks[currentProjectId]];
            let maxChildNum = 0;
            // Matches parentCode.X, where X is a number
            let regex = new RegExp('^' + parentCode.replace(/\./g, '\\.') + '\\.(\\d+)$');
            combinedOptions.forEach(opt => {
                let codeMatch = opt.match(/^([A-D][0-9.]+)/);
                if (codeMatch) {
                    let c = codeMatch[1];
                    let m = c.match(regex);
                    if (m) {
                        let num = parseInt(m[1], 10);
                        if (num > maxChildNum) maxChildNum = num;
                    }
                }
            });
            
            let newCode = parentCode + '.' + (maxChildNum + 1);
            let newOption = newCode + ' - ' + name;
            
            window.customProjectScheduleTasks[currentProjectId].push(newOption);
            
            if(!projectSchedules[currentProjectId]) projectSchedules[currentProjectId] = {};
            projectSchedules[currentProjectId][newCode] = {
                duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                actualStart: '', actualEnd: '', actualQty: '', targetQty: ''
            };
            
            document.getElementById('addSubtaskModal').remove();
            renderProjectScheduleView();
        };

        window.deleteScheduleItem = function(code) {
            const existingScheduleRow = window.projectSchedules?.[currentProjectId]?.[code] || {};
            if (!window.legacyGuardDelete('project-schedule', existingScheduleRow)) return;
            customConfirm('Are you sure you want to delete ' + code + ' and all of its subtasks?', () => {
                if (window.customProjectScheduleTasks && window.customProjectScheduleTasks[currentProjectId]) {
                    window.customProjectScheduleTasks[currentProjectId] = window.customProjectScheduleTasks[currentProjectId].filter(opt => {
                        const optCode = opt.split(' - ')[0];
                        return !(optCode === code || optCode.startsWith(code + '.'));
                    });
                }
                if (projectSchedules[currentProjectId]) {
                    Object.keys(projectSchedules[currentProjectId]).forEach(k => {
                        if (k === code || k.startsWith(code + '.')) {
                            delete projectSchedules[currentProjectId][k];
                        }
                    });
                }
                if (boqBudgets[currentProjectId]) {
                    Object.keys(boqBudgets[currentProjectId]).forEach(k => {
                        if (k === code || k.startsWith(code + '.')) {
                            delete boqBudgets[currentProjectId][k];
                        }
                    });
                }
                const p = document.getElementById('editScheduleModal');
                if (p) p.remove();
                renderProjectScheduleView();
            });
        };

        window.updateDurationFromDates = function() {
            const start = document.getElementById('schedTargetStart').value;
            const end = document.getElementById('schedTargetEnd').value;
            if (start && end) {
                const d1 = new Date(start);
                const d2 = new Date(end);
                const diffTime = d2.getTime() - d1.getTime();
                if (diffTime >= 0) {
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    document.getElementById('schedDuration').value = diffDays;
                } else {
                    document.getElementById('schedDuration').value = 0;
                }
            }
        };

        window.updateAutoProgress = function() {
            const targetEl = document.getElementById('schedTargetQty');
            const actualEl = document.getElementById('schedActualQty');
            const progEl = document.getElementById('schedProgress');
            const statusEl = document.getElementById('schedStatusBadgeSpan');

            if (targetEl && actualEl && progEl) {
                const isParentTask = progEl.hasAttribute('data-is-parent');

                const target = parseFloat(targetEl.value);
                const actual = parseFloat(actualEl.value);
                const hasActual = actualEl.value.trim() !== '';

                if (!isNaN(target) && target > 0 && hasActual) {
                    const prog = !isNaN(actual) ? (actual / target) * 100 : 0;
                    const cleanProg = Math.min(100, Math.max(0, prog));
                    progEl.value = cleanProg.toFixed(2).replace(/\.00$/, '');
                    progEl.readOnly = true;
                    progEl.style.backgroundColor = 'var(--bg-body)';
                    progEl.style.cursor = 'not-allowed';

                    if (statusEl) {
                        if (!isNaN(actual) && actual >= target) {
                           statusEl.innerText = 'Completed';
                        } else if (!isNaN(actual) && actual > 0) {
                           statusEl.innerText = 'In Progress';
                        } else {
                           statusEl.innerText = 'Not Started'; 
                        }
                    }
                } else {
                    if (!isParentTask) {
                        progEl.readOnly = false;
                        progEl.style.backgroundColor = '';
                        progEl.style.cursor = '';
                    }
                    
                    if (statusEl) {
                        const manualProg = parseFloat(progEl.value);
                        if (!isNaN(manualProg)) {
                            if (manualProg >= 100) statusEl.innerText = 'Completed';
                            else if (manualProg > 0) statusEl.innerText = 'In Progress';
                            else statusEl.innerText = 'Not Started';
                        } else {
                            statusEl.innerText = 'Not Started';
                        }
                    }
                }
            }
        };

        window.editScheduleItem = function(code) {
            const existingScheduleRow = window.projectSchedules?.[currentProjectId]?.[code] || {};
            if (!window.legacyGuardEdit('project-schedule', existingScheduleRow)) return;
            const data = projectSchedules[currentProjectId][code];
            if (!data) return;
            const currentBudget = (boqBudgets[currentProjectId] && boqBudgets[currentProjectId][code]) || 0;

            let isCustomTask = false;
            let taskName = '';
            if (window.customProjectScheduleTasks && window.customProjectScheduleTasks[currentProjectId]) {
                const opt = window.customProjectScheduleTasks[currentProjectId].find(o => o.startsWith(code + ' - '));
                if (opt) {
                    isCustomTask = true;
                    taskName = opt.split(' - ')[1] || '';
                }
            }

            // Determine if the item is a parent task
            let isParentTask = false;
            let customTasks = window.customProjectScheduleTasks || {};
            let combinedOptions = [...(window.subtaskChargingOptions||[]), ...(customTasks[currentProjectId] || [])];
            combinedOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
                if (match) {
                    const optCode = match[1] + match[2];
                    if (optCode.startsWith(code + '.') && optCode !== code) {
                        isParentTask = true;
                    }
                }
            });

            const roStyle = isParentTask ? 'background-color: var(--bg-body); cursor: not-allowed; opacity: 0.8;' : '';
            const roAttr = isParentTask ? 'readonly' : '';
            const roTitle = isParentTask ? ' title="Auto-calculated from subtasks"' : '';

            const modalHtml = `
                <div class="modal-overlay active" id="editScheduleModal">
                    <div class="modal" style="max-width: 600px;">
                        <div class="modal-header">
                            <h2>Edit Schedule: ${code}</h2>
                            <button class="close-modal" onclick="document.getElementById('editScheduleModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="event.preventDefault(); saveScheduleItem('${code}')">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                                    ${isCustomTask ? `
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Task Description (Custom Task)</label>
                                        <input type="text" id="schedTaskName" class="form-control" value="${taskName}" required>
                                    </div>
                
                                    ` : ''}
                                    <div class="form-group">
                                        <label>Budget (₱)</label>
                                        <input type="number" id="schedBudget" class="form-control" value="${currentBudget}">
                                    </div>
                                    <div class="form-group" style="display: flex; flex-direction: column; justify-content: center;">
                                        <label>Auto Status</label>
                                        <div style="margin-top: 8px;">
                                            <span id="schedStatusBadgeSpan" style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-main); padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">${data.status || 'Not Started'}</span>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Target Start</label>
                                        <input type="date" id="schedTargetStart" class="form-control" value="${data.targetStart || ''}" onchange="window.updateDurationFromDates()">
                                    </div>
                                    <div class="form-group">
                                        <label>Target End</label>
                                        <input type="date" id="schedTargetEnd" class="form-control" value="${data.targetEnd || ''}" onchange="window.updateDurationFromDates()">
                                    </div>
                                    <div class="form-group">
                                        <label>Duration (Days)</label>
                                        <input type="number" id="schedDuration" class="form-control" value="${data.duration || ''}" readonly style="background-color: var(--bg-body); cursor: not-allowed; opacity: 0.8;">
                                    </div>
                                    <div class="form-group">
                                        <label>Calculated Progress (%) ${isParentTask ? '(Auto)' : ''}</label>
                                        <input type="number" id="schedProgress" class="form-control" value="${data.computedProgress !== undefined ? data.computedProgress : (data.computedProgress !== undefined ? data.computedProgress : '')}" min="0" max="100" placeholder="Used only if no quantities are available." oninput="window.updateAutoProgress()" ${roAttr} style="${roStyle}" ${roTitle} ${isParentTask ? 'data-is-parent="true"' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label>Target Qty ${isParentTask ? '(Auto)' : ''}</label>
                                        <input type="number" id="schedTargetQty" class="form-control" value="${data.targetQty || ''}" oninput="window.updateAutoProgress()" ${roAttr} style="${roStyle}" ${roTitle} ${isParentTask ? 'data-is-parent="true"' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label>Actual Qty ${isParentTask ? '(Auto)' : ''}</label>
                                        <input type="number" id="schedActualQty" class="form-control" value="${data.actualQty || ''}" oninput="window.updateAutoProgress()" ${roAttr} style="${roStyle}" ${roTitle} ${isParentTask ? 'data-is-parent="true"' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label>Actual Start ${isParentTask ? '(Auto)' : ''}</label>
                                        <input type="date" id="schedActualStart" class="form-control" value="${data.actualStart || ''}" ${roAttr} style="${roStyle}" ${roTitle}>
                                    </div>
                                    <div class="form-group">
                                        <label>Actual End ${isParentTask ? '(Auto)' : ''}</label>
                                        <input type="date" id="schedActualEnd" class="form-control" value="${data.actualEnd || ''}" ${roAttr} style="${roStyle}" ${roTitle}>
                                    </div>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Remarks</label>
                                        <textarea id="schedRemarks" class="form-control" rows="2">${data.remarks || ''}</textarea>
                                    </div>
                                </div>
                                <div class="form-actions" style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        ${isCustomTask ? `
                                        <button type="button" class="btn" onclick="deleteScheduleItem('${code}')" style="background:var(--danger-color); color:white; border:none; padding:8px 16px; border-radius:var(--radius-md); font-weight:500;">Delete Task</button>
                    
                                    ` : ''}
</div>
                                    <div style="display: flex; gap: 8px;">
                                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('editScheduleModal').remove()">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            window.updateDurationFromDates();
            window.updateAutoProgress();
        };

        window.saveScheduleItem = function(code) {
            const data = projectSchedules[currentProjectId][code];
            if (data) {
                if (!boqBudgets[currentProjectId]) {
                    boqBudgets[currentProjectId] = {};
                }
                boqBudgets[currentProjectId][code] = parseFloat(document.getElementById('schedBudget').value) || 0;
                
                let isCustomTask = false;
                if (window.customProjectScheduleTasks && window.customProjectScheduleTasks[currentProjectId]) {
                    const idx = window.customProjectScheduleTasks[currentProjectId].findIndex(o => o.startsWith(code + ' - '));
                    if (idx !== -1) {
                        isCustomTask = true;
                        const taskNameInput = document.getElementById('schedTaskName');
                        if (taskNameInput) {
                            window.customProjectScheduleTasks[currentProjectId][idx] = code + ' - ' + taskNameInput.value.trim();
                        }
                    }
                }

                data.duration = document.getElementById('schedDuration').value;
                
                const progVal = document.getElementById('schedProgress') ? document.getElementById('schedProgress').value : '';
                data.computedProgress = progVal === '' ? '' : parseFloat(progVal);

                data.targetStart = document.getElementById('schedTargetStart').value;
                data.targetEnd = document.getElementById('schedTargetEnd').value;
                data.actualStart = document.getElementById('schedActualStart').value;
                data.actualEnd = document.getElementById('schedActualEnd').value;
                data.targetQty = document.getElementById('schedTargetQty').value;
                data.actualQty = document.getElementById('schedActualQty').value;
                data.remarks = document.getElementById('schedRemarks').value;

                document.getElementById('editScheduleModal').remove();
                
                // Force sync update stats before rendering
                updateProjectScheduleStats(currentProjectId);
                renderProjectScheduleView();
            }
        };
        // ==========================================
        // ACTIVITY HISTORY MODULE
        // ==========================================
        let projectActivityHistory = {}; 

        function getProjectTasks(projectId) {
            let customProjectScheduleTasks = window.customProjectScheduleTasks || {};
            let combinedOptions = [...subtaskChargingOptions, ...(customProjectScheduleTasks[projectId] || [])];
            
            combinedOptions.sort((a, b) => {
                let pA = a.split(' - ')[0].match(/^([A-D])([0-9.]+)$/);
                let pB = b.split(' - ')[0].match(/^([A-D])([0-9.]+)$/);
                if (!pA || !pB) return a.localeCompare(b);
                if (pA[1] !== pB[1]) return pA[1].localeCompare(pB[1]);
                let partsA = pA[2].split('.').map(Number);
                let partsB = pB[2].split('.').map(Number);
                for(let i=0; i<Math.max(partsA.length, partsB.length); i++) {
                    let nA = partsA[i] || 0;
                    let nB = partsB[i] || 0;
                    if (nA !== nB) return nA - nB;
                }
                return 0;
            });

            const sched = projectSchedules[projectId] || {};
            let tasks = [];
            combinedOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
                if (match) {
                    const code = match[1] + match[2];
                    let name = match[3].trim();
                    name = name.replace(/\s*\(PROCUREMENT\)$/i, '').replace(/\s*\(CONSTRUCTION\)$/i, '');
                    tasks.push({
                        code,
                        name,
                        fullLabel: opt,
                        data: sched[code] || {}
                    });
                }
            });

            // Filter out tasks that have subtasks (keep only leaf tasks)
            tasks = tasks.filter(t => {
                const hasSubtask = tasks.some(other => other.code.startsWith(t.code + '.') && other.code !== t.code);
                return !hasSubtask;
            });

            return tasks;
        }

        window.getOrCreateWeeks = function getOrCreateWeeks(projectId) {
            if (!projectActivityHistory[projectId]) {
                projectActivityHistory[projectId] = { weeks: [], reports: [], sitePhotos: [] };
            }
            if (!projectActivityHistory[projectId].sitePhotos) {
                projectActivityHistory[projectId].sitePhotos = [];
            }
            
            let tasks = getProjectTasks(projectId);
            let minDate = null;
            let maxDate = null;
            tasks.forEach(t => {
                const s = t.data.actualStart;
                const e = t.data.actualEnd || s;
                if (s) {
                    let parts = s.split('-');
                    let d = new Date(parts[0], parts[1]-1, parts[2], 12, 0, 0, 0);
                    if (!minDate || d < minDate) minDate = d;
                }
                if (e) {
                    let parts = e.split('-');
                    let d = new Date(parts[0], parts[1]-1, parts[2], 12, 0, 0, 0);
                    if (!maxDate || d > maxDate) maxDate = d;
                }
            });
            
            let existingWeeks = projectActivityHistory[projectId].weeks || [];

            if (!minDate) {
                projectActivityHistory[projectId].weeks = [];
                return projectActivityHistory[projectId];
            }
            
            if (!maxDate || maxDate < new Date()) {
                maxDate = new Date();
                maxDate.setHours(12,0,0,0);
            }

            let current = new Date(minDate);
            current.setHours(0,0,0,0);
            current.setDate(current.getDate() - current.getDay()); // Sunday
            
            let end = new Date(maxDate);
            end.setHours(23,59,59,999);
            
            let newWeeks = [];
            let weekNum = 1;
            while(current <= end || weekNum === 1) {
                let weekEnd = new Date(current);
                weekEnd.setDate(current.getDate() + 6);
                
                
                let sYr = current.getFullYear();
                let sMo = String(current.getMonth()+1).padStart(2, '0');
                let sDa = String(current.getDate()).padStart(2, '0');
                let sStr = `${sYr}-${sMo}-${sDa}`;
                
                let eYr = weekEnd.getFullYear();
                let eMo = String(weekEnd.getMonth()+1).padStart(2, '0');
                let eDa = String(weekEnd.getDate()).padStart(2, '0');
                let eStr = `${eYr}-${eMo}-${eDa}`;
    
                
                let existing = existingWeeks.find(w => w.startDate === sStr);
                
                if (existing) {
                    existing.weekNum = weekNum;
                    newWeeks.push(existing);
                } else {
                    newWeeks.push({
                        id: 'week_' + Date.now() + '_' + weekNum,
                        weekNum: weekNum,
                        startDate: sStr,
                        endDate: eStr,
                    });
                }
                
                current.setDate(current.getDate() + 7);
                weekNum++;
            }
            
            projectActivityHistory[projectId].weeks = newWeeks;
            return projectActivityHistory[projectId];
        }

        let currentActivityHistoryTab = 'overall';

        function getMainSubtask(code) {
            let parts = code.split('.');
            if (parts.length > 2) {
                return parts[0] + '.' + parts[1];
            } else if (parts.length === 2) {
                let exists = subtaskChargingOptions.some(opt => opt.startsWith(code + ' -'));
                if (exists) return code;
                
                let parentExists = subtaskChargingOptions.some(opt => opt.startsWith(parts[0] + ' -'));
                if (parentExists) return parts[0];
                return code;
            }
            return code;
        }

        window.openOverallActivityPhotoModal = function(mainCode) {
            const hist = getOrCreateWeeks(currentProjectId);
            let rep = hist.reports.find(r => r.weekId === 'overall' && r.taskId === mainCode);
            if (!rep) {
                rep = { id: 'r'+Math.floor(Math.random()*10000), weekId: 'overall', taskId: mainCode, remarks: '', photos: [] };
                hist.reports.push(rep);
            }
            
            const elId = 'actOverallFileInput_' + mainCode;
            let el = document.getElementById(elId);
            if (!el) {
                el = document.createElement('input');
                el.type = 'file';
                el.id = elId;
                el.multiple = true;
                el.accept = 'image/*';
                el.style.display = 'none';
                el.onchange = function(e) {
                    const files = e.target.files;
                    if(!files || files.length === 0) return;
                    for (let i=0; i<files.length; i++) {
                        const file = files[i];
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            rep.photos.push({
                                id: 'p'+Math.floor(Math.random()*10000),
                                url: event.target.result,
                                tag: 'Progress',
                                caption: '',
                                timestamp: new Date().toLocaleString()
                            });
                            renderActivityHistoryView();
                        };
                        reader.readAsDataURL(file);
                    }
                    el.value = '';
                };
                document.body.appendChild(el);
            }
            el.click();
        };


        window.renderActivityHistoryView = function() {
            if (currentProjectId) updateProjectScheduleStats(currentProjectId);
            if (!currentProjectId) return;
            currentView = 'activity-history';
            updateSubNavVisibility();
            
            const hist = getOrCreateWeeks(currentProjectId);
            
            let tabsHtml = `
                <div style="display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                    <button class="btn ${currentActivityHistoryTab === 'overall' ? '' : 'btn-secondary'}" 
                            style="${currentActivityHistoryTab === 'overall' ? 'border-bottom: 2px solid #3b82f6; border-bottom-left-radius: 0; border-bottom-right-radius: 0; color: #3b82f6; font-weight: 600; background: transparent; padding: 8px 16px;' : 'border: none; background: transparent; color: var(--text-muted); padding: 8px 16px;'}" 
                            onclick="currentActivityHistoryTab = 'overall'; renderActivityHistoryView();">Overall Activity View</button>
                    <button class="btn ${currentActivityHistoryTab === 'weekly' ? '' : 'btn-secondary'}" 
                            style="${currentActivityHistoryTab === 'weekly' ? 'border-bottom: 2px solid #3b82f6; border-bottom-left-radius: 0; border-bottom-right-radius: 0; color: #3b82f6; font-weight: 600; background: transparent; padding: 8px 16px;' : 'border: none; background: transparent; color: var(--text-muted); padding: 8px 16px;'}" 
                            onclick="currentActivityHistoryTab = 'weekly'; renderActivityHistoryView();">Weekly Activity View</button>
                </div>
            `;

            let mainContentHtml = '';

            if (currentActivityHistoryTab === 'weekly') {
                let weeksHtml = '';
                // Only list weeks for the current project
                hist.weeks.forEach(w => {
                    const s = new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const e = new Date(w.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    const reportsCount = hist.reports.filter(r => r.weekId === w.id).length;
                    const photosCount = hist.reports.filter(r => r.weekId === w.id).reduce((sum, r) => sum + (r.photos ? r.photos.length : 0), 0);

                    weeksHtml += `
                        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #3b82f6;" onclick="window.currentActivityWeekId='${w.id}'; window.renderActivityWeekDetailView('${w.id}'); return false;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                            <div style="display: flex; gap: 24px; align-items: center;">
                                <div style="background: #eff6ff; color: #1d4ed8; padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 1.1rem; text-align: center; min-width: 80px;">
                                    <div style="font-size: 0.7rem; text-transform: uppercase; margin-bottom: 4px; color: #3b82f6;">Week</div>
                                    ${w.weekNum}
                                </div>
                                <div>
                                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px; color: var(--text-main);">${s} - ${e}</h3>
                                    <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted);">
                                        <span style="display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> ${reportsCount} Task Updates</span>
                                        <span style="display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ${photosCount} Photos</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-secondary">View Week &rarr;</button>
                            </div>
                        </div>
                    `;
                });

                if(hist.weeks.length === 0) {
                     weeksHtml = `
                        <div style="padding: 48px 24px; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">
                            <p style="color: var(--text-muted); margin-bottom: 16px;">No activities to track yet. Set up Project Schedule to auto-generate weekly timeline.</p>
                        </div>
                     `;
                }

                if (!weeksHtml) {
                    weeksHtml = `
                        <div style="text-align: center; padding: 48px; background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border-color);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 16px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <h3 style="font-size: 1.2rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">No Activity Recorded Yet</h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 400px; margin: 0 auto; line-height: 1.5;">To generate the First Week, please navigate to the Project Schedule menu and input 'Actual Start' dates for your activities.</p>
                        </div>
                    `;
                }
                mainContentHtml = `
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${weeksHtml}
                    </div>
                `;
            } else {
                // OVERALL ACTIVITY VIEW
                const allTasks = getProjectTasks(currentProjectId);
                const sched = projectSchedules[currentProjectId] || {};
                
                let mainSubtasks = {}; 
                
                allTasks.forEach(t => {
                    let mainCode = getMainSubtask(t.code);
                    if (!mainSubtasks[mainCode]) {
                        mainSubtasks[mainCode] = {
                            code: mainCode,
                            name: '', 
                            children: [],
                            actualStart: null,
                            targetEnd: null,
                            totalTargetQty: 0,
                            totalActualQty: 0,
                            hasStarted: false,
                            photos: [],
                            lastStatus: 'Not Started'
                        };
                        
                        let mainOpt = subtaskChargingOptions.find(opt => opt.startsWith(mainCode + ' -'));
                        if (mainOpt) {
                            mainSubtasks[mainCode].name = mainOpt.split(' - ')[1].trim();
                        } else {
                            mainSubtasks[mainCode].name = 'Subtask ' + mainCode;
                        }
                    }
                    
                    let mc = mainSubtasks[mainCode];
                    mc.children.push(t);
                    if (t.data.status === 'Ongoing' || t.data.status === 'Completed' || t.data.status === 'Delayed') {
                        mc.hasStarted = true;
                    }
                    if (t.data.actualStart || t.data.targetStart) {
                        mc.hasStarted = true;
                    }
                    if (parseFloat(t.data.actualQty) > 0) {
                        mc.hasStarted = true;
                    }
                    
                    if (t.data.targetQty) mc.totalTargetQty += parseFloat(t.data.targetQty);
                    if (t.data.actualQty) mc.totalActualQty += parseFloat(t.data.actualQty);
                    
                    let ts = t.data.actualStart || t.data.targetStart;
                    if (ts) {
                        let d = new Date(ts);
                        if (!mc.actualStart || d < mc.actualStart) mc.actualStart = d;
                    }
                    let te = t.data.targetEnd;
                    if (te) {
                        let d = new Date(te);
                        if (!mc.targetEnd || d > mc.targetEnd) mc.targetEnd = d;
                    }
                    
                    if (t.data.status && t.data.status !== 'Not Started') {
                        mc.lastStatus = t.data.status;
                    }
                });
                
                hist.reports.forEach(r => {
                    let mainCode = getMainSubtask(r.taskId);
                    if (mainSubtasks[mainCode]) {
                        if (r.weekId !== 'overall') {
                            mainSubtasks[mainCode].hasStarted = true;
                        } else {
                            mainSubtasks[mainCode].hasStarted = true;
                            if (r.photos) {
                                mainSubtasks[mainCode].photos.push(...r.photos);
                            }
                        }
                    }
                });
                
                
                let startedMainTasks = Object.values(mainSubtasks).filter(m => m.hasStarted);
                
                let cardsHtml = '';
                if (startedMainTasks.length === 0) {
                    cardsHtml = `
                        <div style="padding: 48px 24px; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">
                            <p style="color: var(--text-muted); margin-bottom: 16px;">No activities have started yet.</p>
                        </div>
                    `;
                } else {
                    startedMainTasks.forEach(m => {
                        let sd = m.actualStart ? m.actualStart.toLocaleDateString() : '--';
                        let ed = m.targetEnd ? m.targetEnd.toLocaleDateString() : '--';
                        
                        // Grab computed stats directly from the schedule if available
                        let parentSched = sched[m.code] || {};
                        let progressValue = parentSched.computedProgress !== undefined ? Math.round(parentSched.computedProgress) : 0;
                        let lastStatus = parentSched.status || m.lastStatus;
                        
                        let badgeColor = '#94a3b8';
                        if(lastStatus === 'In Progress' || lastStatus === 'Ongoing' || lastStatus === 'ONGOING') badgeColor = '#3b82f6';
                        if(lastStatus === 'Completed') badgeColor = '#22c55e';
                        if(lastStatus === 'Delayed' || lastStatus === 'Overdue') badgeColor = 'var(--badge-text-red)';
                        
                        let bgImage = '';
                        let hasPhotos = m.photos && m.photos.length > 0;
                        let textStyle = hasPhotos ? 'color: #ffffff;' : 'color: var(--text-main);';
                        let mutedStyle = hasPhotos ? 'color: rgba(255,255,255,0.8);' : 'color: var(--text-muted);';
                        let overlayHtml = '';
                        if (hasPhotos) {
                            let coverPhoto = m.photos[m.photos.length - 1]; // latest photo
                            bgImage = `background-image: url('${coverPhoto.url}'); background-size: cover; background-position: center;`;
                            overlayHtml = `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 100%); z-index: 1;"></div>`;
                        } else {
                            bgImage = 'background-color: var(--bg-surface);';
                        }
                        
                        let btnStyle = hasPhotos 
                            ? "background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #ffffff; backdrop-filter: blur(8px);" 
                            : "background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main);";
                            
                        let btnHoverBg = hasPhotos ? "rgba(255,255,255,0.25)" : "var(--border-color)";
                        let btnNormalBg = hasPhotos ? "rgba(255,255,255,0.15)" : "var(--bg-body)";
                        
                        let progressBgStyle = hasPhotos ? "background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px);" : "background-color: var(--border-color);";
                        
                        let photosPreviewHtml = '';
                        
                        cardsHtml += `
                            <div style="padding: 24px; display: flex; flex-direction: column; position: relative; border-radius: 12px; overflow: hidden; ${bgImage} min-height: 240px; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--border-color);">
                                ${overlayHtml}
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; position:relative; z-index: 2;">
                                    <div>
                                        <div style="font-size: 0.75rem; text-transform: uppercase; color: #3b82f6; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em; ${hasPhotos ? 'text-shadow: 0 1px 3px rgba(0,0,0,0.5);' : ''}">${m.code} &bull; ${({'A': 'Bidding', 'B': 'Pre-Development', 'C': 'Procurement', 'D': 'Construction'}[m.code.charAt(0)] || 'Category')}</div>
                                        <h3 style="font-size: 1.15rem; font-weight: 800; ${textStyle} margin: 0; ${hasPhotos ? 'text-shadow: 0 1px 3px rgba(0,0,0,0.5);' : ''}">${m.name}</h3>
                                    </div>
                                    <span style="font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 12px; background: ${badgeColor}; color: #fff; ${hasPhotos ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.3);' : ''}">${typeof lastStatus === 'string' ? lastStatus.toUpperCase() : 'UNKNOWN'}</span>
                                </div>
                                
                                <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; position:relative; z-index: 2;">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-size: 0.7rem; text-transform: uppercase; ${mutedStyle} mb-1">Target Start / End</span>
                                        <span style="font-size: 0.85rem; font-weight: 500; ${textStyle}">${m.targetStart ? m.targetStart.toLocaleDateString() : '--'} &mdash; ${m.targetEnd ? m.targetEnd.toLocaleDateString() : '--'}</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-size: 0.7rem; text-transform: uppercase; ${mutedStyle} mb-1">Actual Start</span>
                                        <span style="font-size: 0.85rem; font-weight: 500; ${textStyle}">${sd}</span>
                                    </div>
                                </div>
                                
                                <div style="margin-top: auto; position:relative; z-index: 2;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; ${mutedStyle} margin-bottom: 8px;">
                                        <span>Overall Progress</span>
                                        <span>${progressValue}%</span>
                                    </div>
                                    <div style="width: 100%; height: 8px; ${progressBgStyle} border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${progressValue}%; height: 100%; background-color: ${progressValue === 100 ? '#22c55e' : '#3b82f6'}; border-radius: 4px; transition: width 0.3s; ${hasPhotos ? 'box-shadow: 0 0 8px rgba(59,130,246,0.8);' : ''}"></div>
                                    </div>
                                </div>
                                
                                ${photosPreviewHtml}
                                
                                <div style="padding-top: 16px; display: flex; justify-content: flex-end; position:relative; z-index: 2;">
                                    <button class="btn" style="font-size: 0.8rem; padding: 6px 12px; ${btnStyle} display: flex; align-items: center;" onclick="event.stopPropagation(); openOverallActivityPhotoModal('${m.code}')" onmouseover="this.style.background='${btnHoverBg}'" onmouseout="this.style.background='${btnNormalBg}'">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        Upload Photos
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }
                
                mainContentHtml = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">
                        ${cardsHtml}
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="view-header" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 style="font-size: 1.5rem; font-weight: 700;">Activity History</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">View overall subtask progress and weekly task updates for this project.</p>
                        </div>
                    </div>
                </div>
                ${tabsHtml}
                ${mainContentHtml}
            `;
        };

        window.renderSitePhotosHistoryView = function() {
            if (!currentProjectId) return;
            currentView = 'site-photos';
            updateSubNavVisibility();
            
            const hist = getOrCreateWeeks(currentProjectId);
            
            let weeksHtml = '';
            hist.weeks.forEach(w => {
                const s = new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const e = new Date(w.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                const sitePhotosCount = hist.sitePhotos.filter(r => r.weekId === w.id).length;

                weeksHtml += `
                    <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border-left: 4px solid #3b82f6;" onclick="renderSitePhotosWeekDetailView('${w.id}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                        <div style="display: flex; gap: 24px; align-items: center;">
                            <div style="background: #eff6ff; color: #1d4ed8; padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 1.1rem; text-align: center; min-width: 80px;">
                                <div style="font-size: 0.7rem; text-transform: uppercase; margin-bottom: 4px; color: #3b82f6;">Week</div>
                                ${w.weekNum}
                            </div>
                            <div>
                                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px; color: var(--text-main);">${s} - ${e}</h3>
                                <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted);">
                                    <span style="display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ${sitePhotosCount} Site Photos</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-secondary">View Photos &rarr;</button>
                        </div>
                    </div>
                `;
            });

            if(hist.weeks.length === 0) {
                 weeksHtml = `
                    <div style="padding: 48px 24px; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-muted); margin-bottom: 16px;">No activities to track yet. Set up Project Schedule to auto-generate weekly timeline.</p>
                    </div>
                 `;
            }

            contentArea.innerHTML = `
                <div class="view-header" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 style="font-size: 1.5rem; font-weight: 700;">Site Photos</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">View and upload general site photos by week.</p>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${weeksHtml}
                </div>
            `;
        };

        window.renderSitePhotosWeekDetailView = function(weekId) {
            if (!currentProjectId) return;
            currentView = 'site-photos-detail';
            updateSubNavVisibility();
            
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            if(!week) return;

            const isFinalized = !!week.finalized;
            const s = new Date(week.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const e = new Date(week.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            let sitePhotos = hist.sitePhotos.filter(p => p.weekId === weekId);
            
            let photosHtml = '';
            if(sitePhotos.length === 0) {
                photosHtml = `
                    <div style="padding: 48px 24px; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">
                        <p style="color: var(--text-muted); margin-bottom: 16px;">No site photos uploaded for this week.</p>
                    </div>
                `;
            } else {
                photosHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">`;
                sitePhotos.forEach((p, idx) => {
                    photosHtml += `
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; position: relative;">
                        <img src="${p.url}" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
                        ${!isFinalized ? `<button type="button" class="icon-btn" onclick="deleteSitePhoto('${weekId}', '${p.id}')" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; padding: 4px; border:none; cursor: pointer;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>` : ''}
                        <div style="padding: 12px; background: var(--bg-body);">
                            <input type="text" ${isFinalized ? 'disabled' : ''} placeholder="Add caption..." value="${p.caption}" style="width: 100%; font-size: 0.8rem; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color);" onchange="updateSitePhotoCaption('${weekId}', '${p.id}', this.value)" />
                        </div>
                    </div>
                    `;
                });
                photosHtml += `</div>`;
            }

            contentArea.innerHTML = `
                <div class="view-header" style="margin-bottom: 24px;">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                        <a href="#" onclick="renderSitePhotosHistoryView(); return false;" style="color: #3b82f6; text-decoration: none; font-size: 0.85rem; font-weight: 600;">Site Photos</a>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">/</span>
                        <span style="color: var(--text-main); font-size: 0.85rem; font-weight: 600;">Week ${week.weekNum}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div>
                                <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">Week ${week.weekNum} Site Photos</h1>
                                <p style="color: var(--text-muted); font-size: 0.9rem;">${s} - ${e}</p>
                            </div>
                            ${isFinalized ? '<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 600;">Finalized</span>' : ''}
                        </div>
                        <div class="action-btn-group" style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" onclick="printSitePhotosReport('${weekId}')" style="display: flex; align-items: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                                Print Report
                            </button>
                            ${!isFinalized ? `<button class="btn btn-primary" onclick="triggerSiteFileUpload('${weekId}')">Upload Photos</button>` : ''}
                        </div>
                    </div>
                </div>
                <input type="file" id="siteFileInput" multiple accept="image/*" style="display:none;" onchange="handleSiteFileSelect(event, '${weekId}')" />
                ${photosHtml}
            `;
        };

        window.triggerSiteFileUpload = function(weekId) {
            const el = document.getElementById('siteFileInput');
            if (el) el.click();
        };

        window.handleSiteFileSelect = function(e, weekId) {
            const files = e.target.files;
            if(!files || files.length === 0) return;
            const hist = getOrCreateWeeks(currentProjectId);
            if (!hist.sitePhotos) hist.sitePhotos = [];
            for (let i=0; i<files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = function(event) {
                    hist.sitePhotos.push({
                        id: 'sp'+Math.floor(Math.random()*100000),
                        weekId: weekId,
                        url: event.target.result,
                        caption: '',
                        timestamp: new Date().toLocaleString()
                    });
                    renderSitePhotosWeekDetailView(weekId);
                };
                reader.readAsDataURL(file);
            }
        };

        window.deleteSitePhoto = function(weekId, photoId) {
            const hist = getOrCreateWeeks(currentProjectId);
            hist.sitePhotos = hist.sitePhotos.filter(p => !(p.weekId === weekId && p.id === photoId));
            renderSitePhotosWeekDetailView(weekId);
        };

        window.updateSitePhotoCaption = function(weekId, photoId, val) {
            const hist = getOrCreateWeeks(currentProjectId);
            let p = hist.sitePhotos.find(p => p.weekId === weekId && p.id === photoId);
            if(p) p.caption = val;
        };

        window.renderActivityWeekDetailView = function(weekId) {
            if (!currentProjectId) return;

            window.currentActivityWeekId = weekId;

            // Keep React on Activity History.
            // The week detail is only an inner view, not a separate main page.
            currentView = 'activity-history';
            updateSubNavVisibility();
            
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            if(!week) return;

            let weeklyTasks;
            if (week.finalized && week.snapshot) {
                weeklyTasks = week.snapshot;
            } else {
                const wxStart = new Date(week.startDate);
                wxStart.setHours(0, 0, 0, 0);
                const wxEnd = new Date(week.endDate);
                wxEnd.setHours(23, 59, 59, 999);
                const allTasks = getProjectTasks(currentProjectId);

                const parseScheduleDate = (value) => {
                    if (!value) return null;
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        date.setHours(12, 0, 0, 0);
                        return date;
                    }
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
                    }
                    return null;
                };

                weeklyTasks = allTasks.filter(t => {
                    const taskStart = parseScheduleDate(t.data.targetStart || t.data.actualStart);
                    const taskEnd = parseScheduleDate(t.data.targetEnd || t.data.actualEnd || t.data.targetStart || t.data.actualStart);
                    if (!taskStart || !taskEnd) return false;
                    return taskStart <= wxEnd && taskEnd >= wxStart;
                });
            }
            
            let tasksHtml = '';
            weeklyTasks.forEach((t, i) => {
                let existingReport = hist.reports.find(r => r.weekId === week.id && r.taskId === t.code);
                let photoCount = existingReport && existingReport.photos ? existingReport.photos.length : 0;
                let statusBadge = t.data.status || 'Not Started';
                let progressValue = t.data.computedProgress !== undefined ? Math.round(t.data.computedProgress) : 0;

                let badgeColor = '#94a3b8';
                if(statusBadge === 'Ongoing' || statusBadge === 'ONGOING') badgeColor = '#3b82f6';
                if(statusBadge === 'Completed') badgeColor = '#22c55e';
                if(statusBadge === 'Delayed') badgeColor = 'var(--badge-text-red)';

                tasksHtml += `
                    <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-surface);">
                        <td style="padding: 16px; font-weight: 600; font-size: 0.85rem;">${t.code}</td>
                        <td style="padding: 16px; font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${t.name}</td>
                        <td style="padding: 16px; font-size: 0.85rem; color: var(--text-muted);">
                           <div style="font-size: 0.75rem;">${t.data.targetStart || '--'} to ${t.data.targetEnd || '--'}</div>
                        </td>
                        <td style="padding: 16px; font-size: 0.85rem;">
                            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; background: ${badgeColor}15; color: ${badgeColor}; font-weight: 600; border: 1px solid ${badgeColor}40;">${statusBadge}</span>
                        </td>
                        <td style="padding: 16px; font-weight: 600; font-size: 0.85rem; color: var(--text-main);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span>${progressValue}%</span>
                            </div>
                            <div style="width: 100%; height: 6px; background-color: var(--badge-border-gray); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${progressValue}%; height: 100%; background-color: ${progressValue === 100 ? '#22c55e' : '#3b82f6'}; border-radius: 4px;"></div>
                            </div>
                        </td>
                        <td style="padding: 16px; font-size: 0.85rem;">
                            ${photoCount > 0 ? `<span style="color: #3b82f6; font-weight: 600; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display:inline-flex; align-items:center; border: 1px solid #bfdbfe;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>${photoCount} Photos</span>` : `<span style="color: var(--text-muted);">None</span>`}
                        </td>
                        <td style="padding: 16px; font-size: 0.85rem; text-align: right;">
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openActivityPhotoModal('${week.id}', '${t.code}')">${week.finalized ? 'View Pictures' : 'Upload Pictures'}</button>
                        </td>
                    </tr>
                `;
            });

            if (weeklyTasks.length === 0) {
                tasksHtml = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">No scheduled tasks overlapping this week.</td></tr>`;
            }

            const headerRange = new Date(week.startDate).toLocaleDateString() + ' - ' + new Date(week.endDate).toLocaleDateString();

            contentArea.innerHTML = `
                <div class="view-header" style="margin-bottom: 24px;">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                        <a href="#" onclick="renderActivityHistoryView(); return false;" style="color: #3b82f6; text-decoration: none; font-size: 0.85rem; font-weight: 600;">Activity History</a>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">/</span>
                        <span style="color: var(--text-main); font-size: 0.85rem; font-weight: 600;">Week ${week.weekNum}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div>
                                <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">Week ${week.weekNum} Activity Report</h1>
                                <p style="color: var(--text-muted); font-size: 0.9rem;">${headerRange}</p>
                            </div>
                            ${week.finalized ? '<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 600;">Finalized</span>' : ''}
                        </div>
                        <div class="action-btn-group" style="display: flex; gap: 8px;">
                            ${week.finalized ? 
                                `<button class="btn btn-secondary" onclick="printActivityReport('${week.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>Print Report</button>` : 
                                `<button class="btn btn-primary" onclick="finalizeActivityReport('${week.id}')">Finalize Weekly Report</button>`
                            }
                        </div>
                    </div>
                </div>

                <div class="card" style="padding: 0; overflow-x: auto; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: var(--badge-bg-gray); border-bottom: 1px solid var(--border-color);">
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">ID</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">Task Name</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">Schedule Ref.</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">Status</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">Progress</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase;">Evidence</th>
                                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: var(--text-main); text-transform: uppercase; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tasksHtml}
                        </tbody>
                    </table>
                </div>
            `;
        };

        let currentActivityUploadData = { weekId: null, taskId: null };

        window.openActivityPhotoModal = function(weekId, taskId) {
            currentActivityUploadData = { weekId, taskId };
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            
            let t = getProjectTasks(currentProjectId).find(t => t.code === taskId);
            if (week && week.finalized && week.snapshot) {
                const tSnap = week.snapshot.find(st => st.code === taskId);
                if (tSnap) t = tSnap;
            }
            
            let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
            if (!rep) {
                rep = { id: 'r'+Math.floor(Math.random()*10000), weekId, taskId, status: t.data.status || 'Ongoing', progress: 0, remarks: '', photos: [] };
                hist.reports.push(rep);
            }

            document.getElementById('actUploadTitle').textContent = `Week ${week.weekNum} - ${t.code}`;
            document.getElementById('actTaskName').textContent = t.name;
            
            let pStatus = t.data.status || 'Not Started';
            let pProgressPct = t.data.computedProgress !== undefined ? t.data.computedProgress / 100 : 0;

            
            document.getElementById('actStatus').value = pStatus;
            document.getElementById('actProgress').value = Math.round(pProgressPct * 100);
            
            const remarksEl = document.getElementById('actRemarks');
            remarksEl.value = rep.remarks || '';
            remarksEl.disabled = !!week.finalized;
            
            const addPhotosBtn = document.getElementById('actAddPhotosBtn');
            if (addPhotosBtn) addPhotosBtn.style.display = week.finalized ? 'none' : 'flex';
            
            const saveBtn = document.getElementById('actSaveBtn');
            if (saveBtn) saveBtn.style.display = week.finalized ? 'none' : 'block';
            
            const cancelBtn = document.getElementById('actCancelBtn');
            if (cancelBtn) cancelBtn.textContent = week.finalized ? 'Close' : 'Cancel';

            renderActivityPhotosGrid();
            document.getElementById('activityUploadModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closeActivityPhotoModal = function() {
            document.getElementById('activityUploadModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.saveActivityUpdate = function(e) {
            e.preventDefault();
            const { weekId, taskId } = currentActivityUploadData;
            const hist = getOrCreateWeeks(currentProjectId);
            let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
            
            if (!rep) {
                rep = { weekId, taskId, photos: [] };
                hist.reports.push(rep);
            }
            
            // Status and progress are derived from schedule data, no longer stored in activity records
            rep.remarks = document.getElementById('actRemarks').value;
            
            closeActivityPhotoModal();
            renderActivityWeekDetailView(weekId);
        };

        window.triggerActivityFileUpload = function() {
            const el = document.getElementById('actFileInput');
            el.value = '';
            el.click();
        };

        window.handleActivityFileSelect = function(e) {
            const files = e.target.files;
            if(!files || files.length === 0) return;
            const { weekId, taskId } = currentActivityUploadData;
            const hist = getOrCreateWeeks(currentProjectId);
            let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
            
            if (!rep) {
                rep = { weekId, taskId, photos: [] };
                hist.reports.push(rep);
            }
            if (!rep.photos) rep.photos = [];

            for (let i=0; i<files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = function(event) {
                    rep.photos.push({
                        id: 'p'+Math.floor(Math.random()*10000),
                        url: event.target.result,
                        tag: 'Progress',
                        caption: '',
                        timestamp: new Date().toLocaleString()
                    });
                    renderActivityPhotosGrid();
                };
                reader.readAsDataURL(file);
            }
        };

        window.renderActivityPhotosGrid = function() {
            const { weekId, taskId } = currentActivityUploadData;
            const hist = getOrCreateWeeks(currentProjectId);
            let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
            
            const grid = document.getElementById('actPhotosContainer');
            if(!rep || !rep.photos || rep.photos.length === 0) {
                grid.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); grid-column: 1/-1; padding: 16px; text-align: center; border: 1px dashed var(--border-color); border-radius: 6px;">No photos uploaded for this week yet.</div>`;
                return;
            }

            const week = hist.weeks.find(w => w.id === weekId);
            const isFinalized = week && week.finalized;

            let html = '';
            rep.photos.forEach((p, idx) => {
                html += `
                <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; position: relative;">
                    <img src="${p.url}" style="width: 100%; height: 140px; object-fit: cover; display: block;" />
                    ${!isFinalized ? `<button type="button" class="icon-btn" onclick="deleteActivityPhoto(${idx})" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; padding: 4px; border:none; cursor: pointer;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>` : ''}
                    <div style="padding: 12px; background: var(--bg-body);">
                        <select ${isFinalized ? 'disabled' : ''} style="width: 100%; margin-bottom: 8px; font-size: 0.8rem; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color);" onchange="updateActivityPhoto(${idx}, 'tag', this.value)">
                            <option value="Progress" ${p.tag==='Progress'?'selected':''}>Progress</option>
                            <option value="Before" ${p.tag==='Before'?'selected':''}>Before</option>
                            <option value="After" ${p.tag==='After'?'selected':''}>After</option>
                        </select>
                        <input type="text" ${isFinalized ? 'disabled' : ''} placeholder="Add caption..." value="${p.caption}" style="width: 100%; font-size: 0.8rem; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color);" onchange="updateActivityPhoto(${idx}, 'caption', this.value)" />
                    </div>
                </div>
                `;
            });
            grid.innerHTML = html;
        };

        window.deleteActivityPhoto = function(idx) {
            const { weekId, taskId } = currentActivityUploadData;
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            if (week && week.finalized) return;
            customConfirm('Delete this photo?', () => {
                let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
                
                if (rep && rep.photos) {
                    rep.photos.splice(idx, 1);
                    renderActivityPhotosGrid();
                }
            });
        };

        window.updateActivityPhoto = function(idx, field, value) {
            const { weekId, taskId } = currentActivityUploadData;
            const hist = getOrCreateWeeks(currentProjectId);
            let rep = hist.reports.find(r => r.weekId === weekId && r.taskId === taskId);
            
            if (rep && rep.photos && rep.photos[idx]) {
                rep.photos[idx][field] = value;
            }
        };

        window.printSitePhotosReport = function(weekId) {
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            if(!week) return;

            const headerRange = new Date(week.startDate).toLocaleDateString() + ' - ' + new Date(week.endDate).toLocaleDateString();
            const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const project = projects.find(p => p.id === currentProjectId);
            const projectTitle = project ? project.title : 'Project Name';
            
            let sitePhotos = hist.sitePhotos ? hist.sitePhotos.filter(p => p.weekId === weekId) : [];

            let printWin = window.open('', '_blank');
            let doc = printWin.document;
            
            let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Site Photos Report - Week ${week.weekNum}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: var(--text-main); background: var(--bg-surface); }
                    .report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0b1f5d; padding-bottom: 10px; margin-bottom: 20px; }
                    .report-header-left h1 { font-size: 28px; color: #0b1f5d; margin: 0 0 6px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
                    .report-header-left p { margin: 0; color: #0b1f5d; font-weight: 700; font-size: 14px; }
                    .report-header-right p { margin: 0; font-size: 13px; font-weight: 700; color: #333; }
                    
                    .section-banner { background-color: #0b1f5d; color: white; padding: 6px 12px; font-weight: bold; font-size: 14px; margin-bottom: 16px; text-transform: uppercase; page-break-after: avoid; }

                    .photos { display: flex; flex-wrap: wrap; gap: 16px; padding: 0 10px; }
                    .photo-item { width: calc(33.33% - 11px); page-break-inside: avoid; margin-bottom: 24px; }
                    .photo-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); display: block; }
                    .photo-caption { font-size: 12px; color: var(--text-muted); margin-top: 8px; text-align: center; }

                    .signatures-container { display: flex; justify-content: space-between; margin-top: 24px; padding: 10px 20px; font-family: "Times New Roman", serif; page-break-inside: avoid; }
                    .sig-block { width: 45%; }
                    .sig-title { font-weight: bold; font-size: 14px; margin-bottom: 40px; }
                    .sig-input { border: none; border-bottom: 1px solid transparent; font-weight: bold; font-size: 14px; font-family: inherit; width: 100%; text-align: center; outline: none; padding: 4px; background: transparent; }
                    .sig-input:hover, .sig-input:focus { border-bottom-color: var(--badge-border-blue); background: var(--bg-body); }
                    .sig-line { border-top: 1px solid #000; margin-top: 2px; }
                    .sig-desc { text-align: center; font-size: 12px; font-style: italic; margin-top: 6px; }
                    
                    .print-btn { position: fixed; top: 20px; right: 20px; background: #0b1f5d; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 4px; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
                    .print-btn:hover { background: var(--primary); }

                    @media print {
                        @page { size: portrait; }
                        body { padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-btn { display: none !important; }
                        .sig-input:hover, .sig-input:focus { border-bottom-color: transparent !important; background: transparent !important; }
                        ::placeholder { color: transparent !important; }
                        [contenteditable]:empty::before { content: ""; }
                    }
                    [contenteditable="true"]:empty:before {
                        content: attr(data-placeholder);
                        color: #94a3b8;
                        pointer-events: none;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">Print Document</button>
                <div class="report-header">
                    <div class="report-header-left">
                        <h1>${projectTitle} - Site Photos Report</h1>
                        <p>Week ${week.weekNum} (${headerRange})</p>
                    </div>
                    <div class="report-header-right">
                        <p>Report Date: ${reportDate}</p>
                    </div>
                </div>

                <div class="section-banner" style="page-break-after: avoid;">SITE PHOTOS</div>
            `;

            if (sitePhotos.length > 0) {
                html += `<div class="photos">`;
                sitePhotos.forEach(p => {
                    html += `
                        <div class="photo-item">
                            <img src="${p.url}" />
                            <div class="photo-caption">
                                <span style="color: var(--text-muted);font-size:12px;">${p.caption ? p.caption : 'No caption provided'}</span>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
            } else {
                html += `<div style="padding: 20px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-muted); margin-bottom: 40px;">No site photos recorded for this week.</div>`;
            }

            html += `
            </body>
            </html>
            `;

            doc.open();
            doc.write(html);
            doc.close();
        };

        window.finalizeActivityReport = function(weekId) {
            customConfirm('Are you sure you want to finalize this week\'s report? This action cannot be undone and will lock all edits and photo uploads for this week.', () => {
                const hist = getOrCreateWeeks(currentProjectId);
                const week = hist.weeks.find(w => w.id === weekId);
                if(week) {
                    const wxStart = new Date(week.startDate);
                    const wxEnd = new Date(week.endDate);
                    const allTasks = getProjectTasks(currentProjectId);
                    let weeklyTasks = allTasks.filter(t => {
                        const start = t.data.targetStart || t.data.actualStart;
                        const end = t.data.targetEnd || t.data.actualEnd || start;
                        if(!start || !end) return false;
                        const ts = new Date(start);
                        const te = new Date(end);
                        return (ts <= wxEnd && te >= wxStart);
                    });
                    
                    week.snapshot = JSON.parse(JSON.stringify(weeklyTasks));
                    week.finalized = true;
                    renderActivityWeekDetailView(weekId);
                }
            });
        };

        window.printActivityReport = function(weekId) {
            const hist = getOrCreateWeeks(currentProjectId);
            const week = hist.weeks.find(w => w.id === weekId);
            if(!week) return;

            let weeklyTasks;
            if (week.finalized && week.snapshot) {
                weeklyTasks = week.snapshot;
            } else {
                const wxStart = new Date(week.startDate);
                const wxEnd = new Date(week.endDate);
                const allTasks = getProjectTasks(currentProjectId);
                weeklyTasks = allTasks.filter(t => {
                    const start = t.data.targetStart || t.data.actualStart;
                    const end = t.data.targetEnd || t.data.actualEnd || start;
                    if(!start || !end) return false;
                    const ts = new Date(start);
                    const te = new Date(end);
                    return (ts <= wxEnd && te >= wxStart);
                });
            }

            const headerRange = new Date(week.startDate).toLocaleDateString() + ' - ' + new Date(week.endDate).toLocaleDateString();
            const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const project = projects.find(p => p.id === currentProjectId);
            const projectTitle = project ? project.title : 'Project Name';

            let printWin = window.open('', '_blank');
            let doc = printWin.document;
            
            let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Weekly Report - Week ${week.weekNum}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: var(--text-main); background: var(--bg-surface); }
                    .report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0b1f5d; padding-bottom: 10px; margin-bottom: 20px; }
                    .report-header-left h1 { font-size: 28px; color: #0b1f5d; margin: 0 0 6px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
                    .report-header-left p { margin: 0; color: #0b1f5d; font-weight: 700; font-size: 14px; }
                    .report-header-right p { margin: 0; font-size: 13px; font-weight: 700; color: #333; }
                    
                    .section-banner { background-color: #0b1f5d; color: white; padding: 6px 12px; font-weight: bold; font-size: 14px; margin-bottom: 16px; text-transform: uppercase; page-break-after: avoid; }

                    .task-card { display: flex; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 16px; overflow: hidden; page-break-inside: avoid; }
                    .task-icon { width: 140px; display: flex; justify-content: center; align-items: center; border-right: 1px solid var(--badge-border-blue); background-color: var(--bg-body); }
                    
                    .task-icon.bg-blue { background-color: #f0f9ff; }
                    .task-icon.bg-green { background-color: var(--badge-bg-green); }
                    .task-icon.bg-orange { background-color: var(--badge-bg-orange); }

                    .task-content { flex: 1; padding: 20px; position: relative; }
                    .task-title { font-size: 16px; font-weight: bold; color: var(--text-main); margin: 0 0 12px 0; }
                    .task-badges { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
                    
                    .badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .badge.blue { background-color: #bfdbfe; color: var(--primary); }
                    .badge.green { background-color: #2e7d32; color: #ffffff; }
                    .badge.orange { background-color: #fcd34d; color: #92400e; }
                    
                    .pct { font-size: 14px; font-weight: bold; }
                    .pct.blue { color: var(--badge-text-blue); }
                    .pct.green { color: var(--badge-text-green); }
                    .pct.orange { color: var(--badge-text-orange); }

                    .task-remarks { font-size: 14px; color: var(--text-main); margin: 0; line-height: 1.5; }
                    .task-date { position: absolute; bottom: 16px; right: 20px; font-size: 12px; color: var(--text-muted); }

                    .photos { display: flex; flex-wrap: wrap; gap: 16px; padding: 0 10px; }
                    .photo-item { width: calc(33.33% - 11px); page-break-inside: avoid; margin-bottom: 24px; }
                    .photo-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); display: block; }
                    .photo-caption { font-size: 12px; color: var(--text-muted); margin-top: 8px; text-align: center; }

                    .signatures-container { display: flex; justify-content: space-between; margin-top: 24px; padding: 10px 20px; font-family: "Times New Roman", serif; page-break-inside: avoid; }
                    .sig-block { width: 45%; }
                    .sig-title { font-weight: bold; font-size: 14px; margin-bottom: 40px; }
                    .sig-input { border: none; border-bottom: 1px solid transparent; font-weight: bold; font-size: 14px; font-family: inherit; width: 100%; text-align: center; outline: none; padding: 4px; background: transparent; }
                    .sig-input:hover, .sig-input:focus { border-bottom-color: var(--badge-border-blue); background: var(--bg-body); }
                    .sig-line { border-top: 1px solid #000; margin-top: 2px; }
                    .sig-desc { text-align: center; font-size: 12px; font-style: italic; margin-top: 6px; }
                    
                    .print-btn { position: fixed; top: 20px; right: 20px; background: #0b1f5d; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 4px; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
                    .print-btn:hover { background: var(--primary); }

                    @media print {
                        @page { size: portrait; }
                        body { padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-btn { display: none !important; }
                        .sig-input:hover, .sig-input:focus { border-bottom-color: transparent !important; background: transparent !important; }
                        ::placeholder { color: transparent !important; }
                        [contenteditable]:empty::before { content: ""; }
                    }
                    [contenteditable="true"]:empty:before {
                        content: attr(data-placeholder);
                        color: #94a3b8;
                        pointer-events: none;
                        display: block; /* For Firefox */
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">Print Document</button>
                <div class="report-header">
                    <div class="report-header-left">
                        <h1>${projectTitle} - Weekly Report</h1>
                        <p>Week ${week.weekNum} (${headerRange})</p>
                    </div>
                    <div class="report-header-right">
                        <p>Report Date: ${reportDate}</p>
                    </div>
                </div>

                <div class="section-banner">DETAILED TASK</div>
            `;

            let allPhotos = [];

            weeklyTasks.forEach(t => {
                let rep = hist.reports.find(r => r.weekId === week.id && r.taskId === t.code);
                let statusBadge = t.data.status || 'Not Started';
                let progressValue = t.data.computedProgress !== undefined ? Math.round(t.data.computedProgress) : 0;

                let themeColor = 'blue';
                let iconSvg = '';
                
                if (statusBadge === 'Completed') {
                    themeColor = 'green';
                    iconSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2 2 4-4"></path></svg>`;
                } else if (statusBadge === 'Ongoing' || statusBadge === 'ONGOING') {
                    statusBadge = 'ONGOING'; // normalize
                    themeColor = 'blue';
                    iconSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
                } else {
                    // Pending / Delayed / Not Started
                    statusBadge = statusBadge === 'Not Started' ? 'Pending' : statusBadge;
                    themeColor = 'orange';
                    iconSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="3"></circle><line x1="12" y1="11" x2="12" y2="14"></line></svg>`;
                }

                html += `
                <div class="task-card">
                    <div class="task-icon bg-${themeColor}">
                        ${iconSvg}
                    </div>
                    <div class="task-content">
                        <h3 class="task-title">${t.code} &nbsp;&nbsp; ${t.name}</h3>
                        <div class="task-badges">
                            <span class="badge ${themeColor}">${statusBadge}</span>
                            <span class="pct ${themeColor}">${progressValue}%</span>
                        </div>
                        <p class="task-remarks">${rep && rep.remarks ? rep.remarks : ''}</p>
                        <div class="task-date">${reportDate}</div>
                    </div>
                </div>`; // End task-content, task-card

                if (rep && rep.photos && rep.photos.length > 0) {
                    rep.photos.forEach(p => {
                        allPhotos.push({ ...p, taskCode: t.code, taskName: t.name });
                    });
                }
            });

            if (weeklyTasks.length === 0) {
                html += `<div style="padding: 20px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-muted);">No scheduled tasks overlapping this week.</div>`;
            }

            if (allPhotos.length > 0) {
                html += `
                    <div style="margin-top: 40px; page-break-inside: auto;">
                        <div class="section-banner" style="page-break-after: avoid;">PHOTOS</div>
                        <div class="photos">
                `;
                allPhotos.forEach(p => {
                    html += `
                        <div class="photo-item">
                            <img src="${p.url}" />
                            <div class="photo-caption">
                                <strong>${p.taskCode}</strong><br/>
                                <span style="color: var(--text-muted);font-size:10px;">${p.tag}${p.caption ? ' - ' + p.caption : ''}</span>
                            </div>
                        </div>
                    `;
                });
                html += `</div></div>`;
            }

            // ADD SIGNATORIES SECTION
            html += `
                <div class="section-banner" style="margin-top: 40px; margin-bottom: 0;">SIGNATURES</div>
                <div class="signatures-container">
                    <div class="sig-block">
                        <div class="sig-title">PREPARED BY:</div>
                        <div contenteditable="true" class="sig-input" data-placeholder="[Enter Name / Designation]">JERRON COSTALES / CIVIL ENGINEER</div>
                        <div class="sig-line"></div>
                        <div class="sig-desc">Signature over printed name, designation and date</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-title">NOTED BY:</div>
                        <div contenteditable="true" class="sig-input" data-placeholder="[Enter Name / Designation]">STEVEN JAY TOLEDO / DPM</div>
                        <div class="sig-line"></div>
                        <div class="sig-desc">Signature over printed name, designation and date</div>
                    </div>
                </div>
            `;

            html += `
            </body>
            <script>
                // Clear the default example text on first focus
                document.querySelectorAll('.sig-input').forEach(el => {
                    el.addEventListener('focus', function() {
                        if (this.innerText === 'JERRON COSTALES / CIVIL ENGINEER' || this.innerText === 'STEVEN JAY TOLEDO / DPM') {
                            this.innerText = '';
                        }
                    });
                });
            <\/script>
            </html>
            `;

            doc.open();
            doc.write(html);
            doc.close();
        };

        window.renderBoqChargingView = function() {
            if (!currentProjectId) return;
            currentView = 'boq-charging';
            updateSubNavVisibility();
            
            if (!boqBudgets[currentProjectId]) {
                boqBudgets[currentProjectId] = {};
            }
            const projectBudgets = boqBudgets[currentProjectId];

            // Calculate totals from Manila and Local records
            const mnlRecords = manilaRecords.filter(r => r.projectId === currentProjectId);
            const lclRecords = localRecords.filter(r => r.projectId === currentProjectId);
            const allRecords = [...mnlRecords, ...lclRecords];

            const totalsByCode = {};
            
            allRecords.forEach(record => {
                if (!record.subtaskCharging) return;
                const match = record.subtaskCharging.match(/^([A-D][0-9.]+)/);
                if (match) {
                    const code = match[1];
                    if (!totalsByCode[code]) {
                        totalsByCode[code] = { paid: 0, unpaid: 0 };
                    }
                    const amount = parseFloat(record.actualAmount) || parseFloat(record.totalCost) || 0;
                    if (record.paymentStatus === 'Paid') {
                        totalsByCode[code].paid += amount;
                    } else {
                        totalsByCode[code].unpaid += amount;
                    }
                }
            });

            const parentNames = {
                'B2': 'Permitting',
                'B3': 'Feasibility Study',
                'B4': 'Water, Electrical, and Internet Connection',
                'B5': 'Special Tools, Supplies, and PPE',
                'B6': 'Administrative Expenses',
                'C1': 'Logistics',
                'C2': 'General Works',
                'C3': 'Diesel Power Plant',
                'C4': 'Substation and Transmission Line',
                'C5': 'SCADA System',
                'C6': 'Testing and Commissioning',
                'D1': 'General Works',
                'D2': 'Diesel Power Plant',
                'D3': 'Substation and Transmission Line',
                'D4': 'SCADA System',
                'D5': 'Testing and Commissioning'
            };

            const tree = {
                'A': { title: 'BIDDING', color: '#3b82f6', items: [] },
                'B': { title: 'PRE-DEVELOPMENT WORKS & OTHER PROJECT EXPENSES', color: '#a855f7', items: [] },
                'C': { title: 'PROCUREMENT', color: '#f59e0b', items: [] },
                'D': { title: 'CONSTRUCTION', color: '#22c55e', items: [] }
            };

            const itemsByParent = {};

            subtaskChargingOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
                if (match) {
                    const category = match[1];
                    const code = match[1] + match[2];
                    let name = match[3].trim();
                    
                    // Clean up name (remove trailing procurement/construction if any)
                    name = name.replace(/\s*\(PROCUREMENT\)$/i, '').replace(/\s*\(CONSTRUCTION\)$/i, '');

                    const item = {
                        code: code,
                        name: name,
                        budget: projectBudgets[code] || 0,
                        paid: totalsByCode[code] ? totalsByCode[code].paid : 0,
                        unpaid: totalsByCode[code] ? totalsByCode[code].unpaid : 0
                    };
                    item.total = item.paid + item.unpaid;
                    item.remaining = item.budget - item.total;

                    if (code.includes('.')) {
                        const parentCode = code.split('.')[0];
                        if (!itemsByParent[parentCode]) {
                            itemsByParent[parentCode] = {
                                code: parentCode,
                                name: parentNames[parentCode] || parentCode,
                                isParent: true,
                                expanded: boqExpandedParents[parentCode] !== false, // default true
                                subItems: [],
                                budget: 0,
                                paid: 0,
                                unpaid: 0,
                                total: 0,
                                remaining: 0
                            };
                            tree[category].items.push(itemsByParent[parentCode]);
                        }
                        itemsByParent[parentCode].subItems.push(item);
                        itemsByParent[parentCode].budget += item.budget;
                        itemsByParent[parentCode].paid += item.paid;
                        itemsByParent[parentCode].unpaid += item.unpaid;
                        itemsByParent[parentCode].total += item.total;
                        itemsByParent[parentCode].remaining += item.remaining;
                    } else {
                        tree[category].items.push(item);
                    }
                }
            });

            let grandBudget = 0;
            let grandPaid = 0;
            let grandUnpaid = 0;

            Object.values(tree).forEach(cat => {
                cat.budget = 0;
                cat.paid = 0;
                cat.unpaid = 0;
                cat.items.forEach(item => {
                    cat.budget += item.budget;
                    cat.paid += item.paid;
                    cat.unpaid += item.unpaid;
                });
                cat.total = cat.paid + cat.unpaid;
                cat.remaining = cat.budget - cat.total;

                grandBudget += cat.budget;
                grandPaid += cat.paid;
                grandUnpaid += cat.unpaid;
            });

            let grandTotal = grandPaid + grandUnpaid;
            let grandRemaining = grandBudget - grandTotal;

            const formatCurrency = (val) => '₱' + val.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

            let html = `
                <div class="view-header" style="margin-bottom: 24px;">
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">BOQ Charging Monitoring</h1>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Track all charging allocations across materials, bulk, and replenishment</div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="background: #eff6ff; border: 1px solid #bfdbfe; display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #1d4ed8; font-weight: 600; margin-bottom: 4px;">Allotted Budget</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${formatCurrency(grandBudget)}</div>
                        </div>
                    </div>
                    <div class="card" style="background: var(--badge-bg-green); border: 1px solid var(--badge-border-green); display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #22c55e; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #15803d; font-weight: 600; margin-bottom: 4px;">Total Paid</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #14532d;">${formatCurrency(grandPaid)}</div>
                        </div>
                    </div>
                    <div class="card" style="background: #fef2f2; border: 1px solid var(--badge-bg-red); display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--badge-text-red); color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #b91c1c; font-weight: 600; margin-bottom: 4px;">Total Unpaid</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #7f1d1d;">${formatCurrency(grandUnpaid)}</div>
                        </div>
                    </div>
                    <div class="card" style="background: var(--bg-body); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--badge-text-gray); color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; margin-bottom: 4px;">Grand Total</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-main);">${formatCurrency(grandTotal)}</div>
                        </div>
                    </div>
                    <div class="card" style="background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; gap: 16px; padding: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: #14b8a6; color: white; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #0f766e; font-weight: 600; margin-bottom: 4px;">Remaining</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #115e59;">${formatCurrency(grandRemaining)}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input type="text" id="boqSearchInput" placeholder="Search charging code or name..." value="${boqSearchQuery}" onkeyup="boqSearchQuery = this.value; renderBoqChargingView()" style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem;">
                    </div>
                    <div style="display: flex; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
                        <button class="btn ${currentBoqTab === 'All' ? 'btn-primary' : ''}" onclick="currentBoqTab = 'All'; renderBoqChargingView()" style="border-radius: 0; border: none; ${currentBoqTab === 'All' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">All</button>
                        <button class="btn ${currentBoqTab === 'Paid' ? 'btn-primary' : ''}" onclick="currentBoqTab = 'Paid'; renderBoqChargingView()" style="border-radius: 0; border: none; ${currentBoqTab === 'Paid' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">Paid</button>
                        <button class="btn ${currentBoqTab === 'Unpaid' ? 'btn-primary' : ''}" onclick="currentBoqTab = 'Unpaid'; renderBoqChargingView()" style="border-radius: 0; border: none; ${currentBoqTab === 'Unpaid' ? 'background: var(--bg-body); color: var(--text-main); box-shadow: var(--shadow-sm);' : 'background: transparent; color: var(--text-muted);'}">Unpaid</button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="expandAllBoq()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="6 9 12 15 18 9"/></svg> Expand All</button>
                        <button class="btn btn-secondary" onclick="collapseAllBoq()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="18 15 12 9 6 15"/></svg> Collapse All</button>
                    </div>
                </div>
            `;

            const renderRow = (item, isSub = false) => {
                // Apply filters
                if (currentBoqTab === 'Paid' && item.paid === 0) return '';
                if (currentBoqTab === 'Unpaid' && item.unpaid === 0) return '';
                if (boqSearchQuery) {
                    const q = boqSearchQuery.toLowerCase();
                    if (!item.code.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) {
                        // If it's a parent, check if any subitem matches
                        if (item.isParent) {
                            const hasMatch = item.subItems.some(sub => sub.code.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q));
                            if (!hasMatch) return '';
                            item.expanded = true; // Auto-expand when searching
                        } else {
                            return '';
                        }
                    }
                }

                if (item.isParent) {
                    let subHtml = '';
                    if (item.expanded) {
                        subHtml = item.subItems.map(sub => renderRow(sub, true)).join('');
                    } else {
                        // We still need to check if it should be hidden when searching
                        const hasVisibleSub = item.subItems.some(sub => {
                            if (currentBoqTab === 'Paid' && sub.paid === 0) return false;
                            if (currentBoqTab === 'Unpaid' && sub.unpaid === 0) return false;
                            return true;
                        });
                        if (!hasVisibleSub && !boqSearchQuery) {
                            return ''; // If no subitems match the tab filter, hide the parent too
                        }
                    }
                    
                    if (!subHtml && boqSearchQuery && !item.expanded) {
                        // Already auto-expanded above if searching
                    } else if (!subHtml && boqSearchQuery) {
                        return ''; // Hide empty parents when searching
                    }
                    
                    return `
                        <tr style="background: var(--bg-surface); border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="toggleBoqParent('${item.code}')">
                            <td style="padding: 12px 16px 12px ${isSub ? 40 : 16}px !important; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: ${item.expanded ? 'rotate(90deg)' : 'rotate(0deg)'}; transition: transform 0.2s;"><path d="m9 18 6-6-6-6"/></svg>
                                ${item.code}
                            </td>
                            <td style="padding: 12px 16px; font-weight: 500;">${item.name}</td>
                            <td style="padding: 12px 16px; text-align: right; color: #3b82f6; font-weight: 600;">${formatCurrency(item.budget)}</td>
                            <td style="padding: 12px 16px; text-align: right; color: #22c55e; font-weight: 500;">${formatCurrency(item.paid)}</td>
                            <td style="padding: 12px 16px; text-align: right; color: var(--badge-text-red); font-weight: 500;">${formatCurrency(item.unpaid)}</td>
                            <td style="padding: 12px 16px; text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
                            <td style="padding: 12px 16px; text-align: right; color: #14b8a6; font-weight: 600;">${formatCurrency(item.remaining)}</td>
                            <td style="padding: 12px 16px; text-align: center;"></td>
                        </tr>
                        ${subHtml}
                    `;
                }

                return `
                    <tr style="border-bottom: 1px solid var(--border-color); ${isSub ? 'background: var(--bg-body);' : ''}">
                        <td style="padding: 12px 16px 12px ${isSub ? 40 : 16}px !important; color: #3b82f6; font-weight: 500;">${item.code}</td>
                        <td style="padding: 12px 16px 12px ${isSub ? 40 : 16}px !important; font-size: 0.85rem;">${item.name}</td>
                        <td style="padding: 12px 16px; text-align: right; color: #3b82f6; font-weight: 600;">${formatCurrency(item.budget)}</td>
                        <td style="padding: 12px 16px; text-align: right; color: #22c55e; font-weight: 500;">${formatCurrency(item.paid)}</td>
                        <td style="padding: 12px 16px; text-align: right; color: var(--badge-text-red); font-weight: 500;">${formatCurrency(item.unpaid)}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
                        <td style="padding: 12px 16px; text-align: right; color: #14b8a6; font-weight: 600;">${formatCurrency(item.remaining)}</td>
                        <td style="padding: 12px 16px; text-align: center;">
                            <button onclick="editBoqBudget('${item.code}', '${item.name}', ${item.budget})" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                        </td>
                    </tr>
                `;
            };

            Object.values(tree).forEach(cat => {
                let catHtml = cat.items.map(item => renderRow(item)).join('');
                if (!catHtml || catHtml.trim() === '') return; // Skip empty categories

                html += `
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
                        <div style="background: ${cat.color}; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600;">
                            <div>${cat.title}</div>
                            <div style="display: flex; gap: 16px; font-size: 0.75rem;">
                                <span>Allotted: ${formatCurrency(cat.budget)}</span>
                                <span>Paid: ${formatCurrency(cat.paid)}</span>
                                <span>Unpaid: ${formatCurrency(cat.unpaid)}</span>
                                <span>Remaining: ${formatCurrency(cat.remaining)}</span>
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                                <thead style="background: var(--bg-body);">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); width: 10%;">CODE</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); width: 30%;">CHARGING</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right; width: 12%;">ALLOTTED BUDGET</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right; width: 12%;">TOTAL PAID</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right; width: 12%;">TOTAL UNPAID</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right; width: 12%;">TOTAL</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right; width: 12%;">REMAINING BUDGET</th>
                                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: center; width: 5%;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            const scrollY = window.scrollY;
            contentArea.innerHTML = html;
            
            // Focus search input and put cursor at end
            const input = document.getElementById('boqSearchInput');
            if (input) {
                // Only focus if it was already focused to avoid jumping, or use preventScroll
                if (document.activeElement && document.activeElement.id === 'boqSearchInput') {
                    input.focus({ preventScroll: true });
                    const val = input.value;
                    input.value = '';
                    input.value = val;
                }
            }
            window.scrollTo(0, scrollY);
        };

        window.toggleBoqParent = function(code) {
            boqExpandedParents[code] = boqExpandedParents[code] === false ? true : false;
            renderBoqChargingView();
        };

        window.expandAllBoq = function() {
            Object.keys(boqExpandedParents).forEach(k => boqExpandedParents[k] = true);
            subtaskChargingOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)/);
                if (match) {
                    const parentCode = match[1] + match[2].split('.')[0];
                    boqExpandedParents[parentCode] = true;
                    boqExpandedParents[match[1]] = true;
                }
            });
            renderBoqChargingView();
        };

        window.collapseAllBoq = function() {
            Object.keys(boqExpandedParents).forEach(k => boqExpandedParents[k] = false);
            subtaskChargingOptions.forEach(opt => {
                const match = opt.match(/^([A-D])([0-9.]+)/);
                if (match) {
                    const parentCode = match[1] + match[2].split('.')[0];
                    boqExpandedParents[parentCode] = false;
                    boqExpandedParents[match[1]] = false;
                }
            });
            renderBoqChargingView();
        };

        window.editBoqBudget = function(code, name, currentBudget) {
            const boqRowForAccess = window.boqBudgetRows?.[window.currentProjectId || currentProjectId]?.[code] || {};
            if (!window.legacyGuardEdit('boq-charging', boqRowForAccess)) return;
            const modalHtml = `
                <div class="modal-overlay active" id="editBoqBudgetModal">
                    <div class="modal" style="max-width: 400px;">
                        <div class="modal-header">
                            <h2>Edit Allotted Budget</h2>
                            <button class="close-modal" onclick="document.getElementById('editBoqBudgetModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="event.preventDefault(); saveBoqBudget('${code}')">
                                <div class="form-group">
                                    <label>${code} - ${name}</label>
                                    <input type="number" id="newBoqBudget" class="form-control" value="${currentBudget}" step="0.01" min="0" required>
                                </div>
                                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editBoqBudgetModal').remove()">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            setTimeout(() => document.getElementById('newBoqBudget').focus(), 100);
        };

        window.saveBoqBudget = function(code) {
            const newBudget = document.getElementById('newBoqBudget').value;
            const parsed = parseFloat(newBudget);
            if (!isNaN(parsed) && parsed >= 0) {
                if (!boqBudgets[currentProjectId]) {
                    boqBudgets[currentProjectId] = {};
                }
                boqBudgets[currentProjectId][code] = parsed;
                document.getElementById('editBoqBudgetModal').remove();
                renderBoqChargingView();
            }
        };

        let currentManilaTab = 'procurement';
        let editingManilaId = null;

        window.localRecords = window.localRecords || [];
        let localRecords = window.localRecords;
        let currentLocalTab = 'procurement';
        let editingLocalId = null;

        window.materialsMasterlist = window.materialsMasterlist || [];
        let materialsMasterlist = window.materialsMasterlist;

        let materialsTransactions = [];

        let currentMaterialsTab = 'dashboard';

        window.fuelRecords = window.fuelRecords || [];
        let fuelRecords = window.fuelRecords;
        


        let prsCounters = {
            'Civil': 25001,
            'Mechanical': 25201,
            'Electrical': 25301,
            'SCADA': 25401,
            'Safety': 25451,
            'Admin': 25501,
            'Accounting': 25701,
            'Logistics': 25801
        };

        let editingPrsId = null;

        window.renderProcurementDashboard = function() {
            currentView = 'procurement-dashboard';
            updateSubNavVisibility();
            
            // Calculate summaries
            const totalPrs = prsRecords.length;
            const pendingPrs = prsRecords.filter(r => r.status === 'Pending').length;
            
            const totalManila = manilaRecords.length;
            const manilaDelivered = manilaRecords.filter(r => r.procurementStatus === 'Delivered').length;
            
            const totalLocal = localRecords.length;
            const localDelivered = localRecords.filter(r => r.procurementStatus === 'Delivered').length;
            
            const totalMaterials = typeof materialsMasterlist !== 'undefined' ? materialsMasterlist.length : 0;
            const lowStockMaterials = typeof materialsMasterlist !== 'undefined' ? materialsMasterlist.filter(m => m.currentStock <= m.minStock).length : 0;
            
            const totalFuel = typeof fuelRecords !== 'undefined' ? fuelRecords.length : 0;
            
            let html = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700;">Procurement Dashboard</h1>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">Centralized overview of all procurement activities</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <!-- Request Summary -->
                    <div class="card" style="padding: 20px; cursor: pointer;" onclick="renderRequestView()">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Requests (PRS)</h3>
                            <div style="background: var(--badge-bg-blue); color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">View All</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 4px;">${totalPrs}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Total Requests</div>
                    </div>

                    <!-- Manila Summary -->
                    <div class="card" style="padding: 20px; cursor: pointer;" onclick="renderManilaView()">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Manila Procurement</h3>
                            <div style="background: #fef08a; color: #a16207; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">View All</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 4px;">${totalManila}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${manilaDelivered} Delivered</div>
                    </div>

                    <!-- Local Summary -->
                    <div class="card" style="padding: 20px; cursor: pointer;" onclick="renderLocalView()">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Local Procurement</h3>
                            <div style="background: var(--badge-bg-green); color: var(--badge-text-green); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">View All</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 4px;">${totalLocal}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${localDelivered} Delivered</div>
                    </div>

                    <!-- Materials Summary -->
                    <div class="card" style="padding: 20px; cursor: pointer;" onclick="renderMaterialsView()">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Materials Inventory</h3>
                            <div style="background: #f3e8ff; color: #9333ea; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">View All</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 4px;">${totalMaterials}</div>
                        <div style="font-size: 0.85rem; color: ${lowStockMaterials > 0 ? 'var(--badge-text-orange)' : 'var(--text-muted)'};">${lowStockMaterials} Low Stock Items</div>
                    </div>

                    <!-- Fuel Summary -->
                    <div class="card" style="padding: 20px; cursor: pointer;" onclick="renderFuelView()">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Fuel Records</h3>
                            <div style="background: #ffedd5; color: var(--badge-text-orange); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">View All</div>
                        </div>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 4px;">${totalFuel}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Total Transactions</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <!-- Recent PRS -->
                    <div class="card" style="padding: 20px;">
                        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Recent Requests</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${prsRecords.slice(-5).reverse().map(r => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.9rem;">${r.prsNo}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${r.description || 'No description'}</div>
                                    </div>
                                    <div style="font-size: 0.85rem; font-weight: 600;">₱${(r.projectedAmount || 0).toLocaleString()}</div>
                                </div>
                            `).join('') || '<div style="color: var(--text-muted); font-size: 0.85rem;">No recent requests found.</div>'}
                        </div>
                    </div>
                    
                    <!-- Recent Procurement (Manila + Local) -->
                    <div class="card" style="padding: 20px;">
                        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Recent Procurements</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${[...manilaRecords, ...localRecords].sort((a, b) => b.id - a.id).slice(0, 5).map(r => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.9rem;">${r.prsNo || r.repleNo || 'Standalone'} <span style="font-size: 0.7rem; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${r.process}</span></div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${r.item || 'No item description'}</div>
                                    </div>
                                    <div style="font-size: 0.85rem; font-weight: 600;">
                                        <span style="color: ${r.procurementStatus === 'Delivered' ? 'var(--badge-text-green)' : 'var(--badge-text-orange)'};">${r.procurementStatus || 'Pending'}</span>
                                    </div>
                                </div>
                            `).join('') || '<div style="color: var(--text-muted); font-size: 0.85rem;">No recent procurements found.</div>'}
                        </div>
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
        }

        window.renderRequestView = function() {
            currentView = 'request';
            updateSubNavVisibility();
            
            const projectRecords = prsRecords.filter(r => r.projectId === currentProjectId);
            const totalRequest = projectRecords.length;
            const totalProjected = projectRecords.reduce((sum, r) => sum + r.projectedAmount, 0);
            const totalActual = projectRecords.reduce((sum, r) => sum + r.actualAmount, 0);
            const formatCurrency = (val) => '₱' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            let html = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700;">Request</h1>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">Manage procurement requests</div>
                    </div>
                </div>

                <div class="kpi-grid" style="margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div class="kpi-card" style="padding: 12px; min-height: auto;">
                        <div class="kpi-card-header" style="margin-bottom: 8px;">
                            <div class="kpi-label" style="font-size: 0.75rem;">Total Request</div>
                            <div class="kpi-icon blue" style="width: 28px; height: 28px; padding: 6px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value" id="kpiTotalRequest" style="font-size: 1.25rem;">${totalRequest}</div>
                    </div>
                    <div class="kpi-card" style="padding: 12px; min-height: auto;">
                        <div class="kpi-card-header" style="margin-bottom: 8px;">
                            <div class="kpi-label" style="font-size: 0.75rem;">Total Projected Amount</div>
                            <div class="kpi-icon yellow" style="width: 28px; height: 28px; padding: 6px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value" id="kpiTotalProjected" style="font-size: 1.25rem;">${formatCurrency(totalProjected)}</div>
                    </div>
                    <div class="kpi-card" style="padding: 12px; min-height: auto;">
                        <div class="kpi-card-header" style="margin-bottom: 8px;">
                            <div class="kpi-label" style="font-size: 0.75rem;">Total Actual Amount</div>
                            <div class="kpi-icon green" style="width: 28px; height: 28px; padding: 6px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                        </div>
                        <div class="kpi-value" id="kpiTotalActual" style="font-size: 1.25rem;">${formatCurrency(totalActual)}</div>
                    </div>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
                    <div style="flex: 1; position: relative;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="prsSearchInput" oninput="renderPrsTable()" placeholder="Search PRS no. or requestor..." style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                    </div>
                    <select id="prsDesignationFilter" onchange="renderPrsTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                        <option value="">All Designations</option>
                        <option value="Civil">Civil</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                        <option value="SCADA">SCADA</option>
                        <option value="Safety">Safety</option>
                        <option value="Admin">Admin</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Logistics">Logistics</option>
                    </select>
                    <select id="prsTransactionFilter" onchange="renderPrsTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                        <option value="">All Transactions</option>
                        <option value="MNL-MNL">MNL-MNL</option>
                        <option value="MNL-LCL">MNL-LCL</option>
                        <option value="LCL-LCL">LCL-LCL</option>
                        <option value="LCL-MNL">LCL-MNL</option>
                    </select>
                    <button class="btn btn-primary" onclick="openPrsModal()" style="background: var(--badge-text-blue); color: white; border: none;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New PRS</button>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                            <thead style="background: var(--bg-body);">
                                <tr>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Type</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Transaction</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Requestor Designation</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS No.</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Subtask Charging</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Description</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS Date</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Target Date</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Projected Amount</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Actual Amount</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="prsTableBody">
                                <!-- PRS records will go here -->
                            </tbody>
                        </table>
                    </div>
                    <div style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted); background: var(--bg-surface);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>Rows per page:</span>
                            <select id="prsRowsPerPage" onchange="changePrsRowsPerPage()" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-body); color: var(--text-main);">
                                <option value="5">5</option>
                                <option value="10" selected>10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <span id="prsPaginationInfo">Page 1 of 1</span>
                            <div style="display: flex; gap: 8px;">
                                <button id="prsPrevBtn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="changePrsPage(-1)">&lt; Prev</button>
                                <button id="prsNextBtn" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="changePrsPage(1)">Next &gt;</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            renderPrsTable();
        }

        window.openPrsModal = () => {
            if (!window.legacyGuardAdd('request')) return;
            const modalOverlay = document.getElementById('newPrsModal');
            if(modalOverlay) {
                modalOverlay.classList.add('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.add('active');
                generatePrsNo();
            }
        };
        
        window.closePrsModal = () => {
            const modalOverlay = document.getElementById('newPrsModal');
            if(modalOverlay) {
                modalOverlay.classList.remove('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.remove('active');
                document.getElementById('newPrsForm').reset();
            }
        };

        window.generatePrsNo = function() {
            const designation = document.getElementById('prsDesignation').value;
            const counter = prsCounters[designation];
            document.getElementById('prsNo').value = `STEC-ALC-${counter}`;
        };

        let prsCurrentPage = 1;
        let prsRowsPerPageValue = 10;

        window.changePrsRowsPerPage = function() {
            const select = document.getElementById('prsRowsPerPage');
            if (select) {
                prsRowsPerPageValue = select.value === 'all' ? 'all' : parseInt(select.value, 10);
                prsCurrentPage = 1;
                renderPrsTable();
            }
        };

        window.changePrsPage = function(dir) {
            prsCurrentPage += dir;
            renderPrsTable();
        };

        window.renderPrsTable = function() {
            const tbody = document.getElementById('prsTableBody');
            if (!tbody) return;
            
            const searchInput = document.getElementById('prsSearchInput');
            const designationFilter = document.getElementById('prsDesignationFilter');
            const transactionFilter = document.getElementById('prsTransactionFilter');
            
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const designationVal = designationFilter ? designationFilter.value : '';
            const transactionVal = transactionFilter ? transactionFilter.value : '';
            
            let projectRecords = prsRecords.filter(r => r.projectId === currentProjectId);
            
            if (searchTerm) {
                projectRecords = projectRecords.filter(r => 
                    r.prsNo.toLowerCase().includes(searchTerm) || 
                    r.designation.toLowerCase().includes(searchTerm) ||
                    r.description.toLowerCase().includes(searchTerm)
                );
            }
            if (designationVal) {
                projectRecords = projectRecords.filter(r => r.designation === designationVal);
            }
            if (transactionVal) {
                projectRecords = projectRecords.filter(r => r.transaction === transactionVal);
            }
            
            // Update KPIs
            const kpiTotalRequest = document.getElementById('kpiTotalRequest');
            const kpiTotalProjected = document.getElementById('kpiTotalProjected');
            const kpiTotalActual = document.getElementById('kpiTotalActual');
            const formatCurrency = (val) => '₱' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            if (kpiTotalRequest) kpiTotalRequest.textContent = projectRecords.length;
            if (kpiTotalProjected) kpiTotalProjected.textContent = formatCurrency(projectRecords.reduce((sum, r) => sum + r.projectedAmount, 0));
            if (kpiTotalActual) kpiTotalActual.textContent = formatCurrency(projectRecords.reduce((sum, r) => sum + r.actualAmount, 0));
            
            if (projectRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="padding: 24px 16px; text-align: center; color: var(--text-muted);">No records to display.</td></tr>`;
                
                const paginationInfo = document.getElementById('prsPaginationInfo');
                const prevBtn = document.getElementById('prsPrevBtn');
                const nextBtn = document.getElementById('prsNextBtn');
                if (paginationInfo) paginationInfo.textContent = 'No records';
                if (prevBtn) prevBtn.disabled = true;
                if (nextBtn) nextBtn.disabled = true;
                
                return;
            }
            
            // Pagination logic
            let totalPages = 1;
            let paginatedRecords = projectRecords;
            
            if (prsRowsPerPageValue !== 'all') {
                totalPages = Math.ceil(projectRecords.length / prsRowsPerPageValue) || 1;
                if (prsCurrentPage > totalPages) prsCurrentPage = totalPages;
                if (prsCurrentPage < 1) prsCurrentPage = 1;
                
                const startIndex = (prsCurrentPage - 1) * prsRowsPerPageValue;
                paginatedRecords = projectRecords.slice(startIndex, startIndex + prsRowsPerPageValue);
            }
            
            // Update pagination UI
            const paginationInfo = document.getElementById('prsPaginationInfo');
            const prevBtn = document.getElementById('prsPrevBtn');
            const nextBtn = document.getElementById('prsNextBtn');
            
            if (paginationInfo) {
                if (prsRowsPerPageValue === 'all') {
                    paginationInfo.textContent = `Showing all ${projectRecords.length} records`;
                } else {
                    const start = (prsCurrentPage - 1) * prsRowsPerPageValue + 1;
                    const end = Math.min(prsCurrentPage * prsRowsPerPageValue, projectRecords.length);
                    paginationInfo.textContent = `${start}-${end} of ${projectRecords.length}`;
                }
            }
            
            if (prevBtn) prevBtn.disabled = prsCurrentPage <= 1;
            if (nextBtn) nextBtn.disabled = prsCurrentPage >= totalPages || prsRowsPerPageValue === 'all';
            
            let html = '';
            paginatedRecords.forEach(record => {
                html += `
                    <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.02)'" onmouseout="this.style.backgroundColor='transparent'">
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.type}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.transaction}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.designation}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${record.prsNo}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.activityCharging}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${record.description}">${record.description}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.prsDate}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.targetDate}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.projectedAmount.toFixed(2)}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">${record.actualAmount.toFixed(2)}</td>
                        <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color);">
                            <div style="display: flex; gap: 8px;">
                                <button class="icon-btn" onclick="editPrsRecord(${record.id})" style="padding: 6px; color: var(--text-muted); background: var(--bg-body); border-radius: 6px;" title="Edit" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg></button>
                                <button class="icon-btn" onclick="deletePrsRecord(${record.id})" style="padding: 6px; color: var(--text-muted); background: var(--bg-body); border-radius: 6px;" title="Delete" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        };

        window.editPrsRecord = function(id) {
    const accessRecord = (window.prsRecords || prsRecords || []).find(r => String(r.id) === String(id));
    if (!window.legacyGuardEdit('request', accessRecord)) return;
            openPrsModal(id);
        };

        window.deletePrsRecord = function(id) {
            customConfirm('Are you sure you want to delete this PRS record?', () => {
                prsRecords = prsRecords.filter(r => r.id !== id);
                window.prsRecords = prsRecords;
                manilaRecords = manilaRecords.filter(m => m.prsId !== id);
                window.manilaRecords = manilaRecords;
                localRecords = localRecords.filter(m => m.prsId !== id);
                window.localRecords = localRecords;
                renderRequestView(); // Re-render the whole view to update KPIs
            });
        };

        window.openPrsModal = (id = null) => {
            const existingPrsForAccess = id ? (window.prsRecords || prsRecords || []).find(r => String(r.id) === String(id)) : null;
            if (id ? !window.legacyGuardEdit('request', existingPrsForAccess) : !window.legacyGuardAdd('request')) return;
            editingPrsId = id;
            const modalOverlay = document.getElementById('newPrsModal');
            if(modalOverlay) {
                modalOverlay.classList.add('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.add('active');
                
                if (id) {
                    const record = prsRecords.find(r => r.id === id);
                    if (record) {
                        document.getElementById('prsType').value = record.type;
                        document.getElementById('prsDate').value = record.prsDate;
                        document.getElementById('prsTransaction').value = record.transaction;
                        document.getElementById('prsDesignation').value = record.designation;
                        document.getElementById('prsNo').value = record.prsNo;
                        document.getElementById('prsTargetDate').value = record.targetDate;
                        document.getElementById('prsActivityCharging').value = record.activityCharging;
                        document.getElementById('prsDescription').value = record.description;
                        document.getElementById('prsProjectedAmount').value = record.projectedAmount;
                        document.getElementById('prsActualAmount').value = record.actualAmount;
                    }
                } else {
                    document.getElementById('newPrsForm').reset();
                    // Set default dates
                    const today = new Date().toISOString().split('T')[0];
                    const prsDateInput = document.getElementById('prsDate');
                    if (prsDateInput) prsDateInput.value = today;
                    generatePrsNo();
                }
            }
        };

        // Event Listeners for PRS Modal
        document.addEventListener('DOMContentLoaded', () => {
            const prsForm = document.getElementById('newPrsForm');
            if (prsForm) {
                prsForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const designation = document.getElementById('prsDesignation').value;
                    const prsNo = document.getElementById('prsNo').value;
                    
                    if (editingPrsId) {
                        const recordIndex = prsRecords.findIndex(r => r.id === editingPrsId);
                        if (recordIndex !== -1) {
                            prsRecords[recordIndex] = {
                                ...prsRecords[recordIndex],
                                type: document.getElementById('prsType').value,
                                prsDate: document.getElementById('prsDate').value,
                                transaction: document.getElementById('prsTransaction').value,
                                designation: designation,
                                prsNo: prsNo,
                                targetDate: document.getElementById('prsTargetDate').value,
                                activityCharging: document.getElementById('prsActivityCharging').value,
                                description: document.getElementById('prsDescription').value,
                                projectedAmount: parseFloat(document.getElementById('prsProjectedAmount').value) || 0,
                                actualAmount: parseFloat(document.getElementById('prsActualAmount').value) || 0
                            };
                            
                            // Handle Manila record auto-creation/deletion
                            const isManila = prsRecords[recordIndex].transaction === 'MNL-MNL' || prsRecords[recordIndex].transaction === 'LCL-MNL';
                            const existingManilaIndex = manilaRecords.findIndex(m => m.prsId === editingPrsId);
                            
                            if (isManila && existingManilaIndex === -1) {
                                createManilaRecord(editingPrsId);
                            } else if (!isManila && existingManilaIndex !== -1) {
                                manilaRecords.splice(existingManilaIndex, 1);
                            }

                            // Handle Local record auto-creation/deletion
                            const isLocal = prsRecords[recordIndex].transaction === 'LCL-LCL' || prsRecords[recordIndex].transaction === 'MNL-LCL';
                            const existingLocalIndex = localRecords.findIndex(m => m.prsId === editingPrsId);
                            
                            if (!isLocal && existingLocalIndex !== -1) {
                                localRecords.splice(existingLocalIndex, 1);
                            }
                        }
                    } else {
                        const newRecord = {
                            id: Date.now(),
                            projectId: currentProjectId,
                            type: document.getElementById('prsType').value,
                            prsDate: document.getElementById('prsDate').value,
                            transaction: document.getElementById('prsTransaction').value,
                            designation: designation,
                            prsNo: prsNo,
                            targetDate: document.getElementById('prsTargetDate').value,
                            activityCharging: document.getElementById('prsActivityCharging').value,
                            description: document.getElementById('prsDescription').value,
                            projectedAmount: parseFloat(document.getElementById('prsProjectedAmount').value) || 0,
                            actualAmount: parseFloat(document.getElementById('prsActualAmount').value) || 0
                        };
                        
                        prsRecords.unshift(newRecord); // Add to beginning
                        prsCounters[designation]++; // Increment counter for next time
                        
                        // Auto-create Manila record
                        if (newRecord.transaction === 'MNL-MNL' || newRecord.transaction === 'LCL-MNL') {
                            createManilaRecord(newRecord.id);
                        }
                    }
                    
                    closePrsModal();
                    if (currentView === 'request') {
                        renderRequestView(); // Re-render the whole view to update KPIs and table
                    }
                });
            }
            
            const closeBtn = document.getElementById('closePrsModalBtn');
            if (closeBtn) closeBtn.addEventListener('click', closePrsModal);
            
            const cancelBtn = document.getElementById('cancelPrsModalBtn');
            if (cancelBtn) cancelBtn.addEventListener('click', closePrsModal);
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const prsDateInput = document.getElementById('prsDate');
            if (prsDateInput) prsDateInput.value = today;

            const manilaForm = document.getElementById('manilaForm');
            if (manilaForm) {
                manilaForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const isStandalone = document.getElementById('manilaStandaloneToggle').checked;
                    const prsIdValue = document.getElementById('manilaPrsSelect').value;
                    const selectedPrsId = isStandalone ? null : (prsIdValue ? parseInt(prsIdValue, 10) : null);

                    if (editingManilaId) {
                        const recordIndex = manilaRecords.findIndex(r => r.id === editingManilaId);
                        if (recordIndex !== -1) {
                            manilaRecords[recordIndex] = {
                                ...manilaRecords[recordIndex],
                                prsId: selectedPrsId,
                                process: document.getElementById('manilaProcess').value,
                                purchase: document.getElementById('manilaPurchase').value,
                                fund: document.getElementById('manilaFund').value,
                                designation: document.getElementById('manilaDesignation').value,
                                prsNo: isStandalone ? '' : document.getElementById('manilaPrsNo').value,
                                prsDate: isStandalone ? '' : document.getElementById('manilaPrsDate').value,
                                item: document.getElementById('manilaItem').value,
                                targetDate: document.getElementById('manilaTargetDate').value,
                                subtaskCharging: document.getElementById('manilaSubtaskCharging').value,
                                workItemNo: document.getElementById('manilaWorkItemNo').value,
                                poNo: document.getElementById('manilaPoNo').value,
                                supplier: document.getElementById('manilaSupplier').value,
                                dateDelivered: document.getElementById('manilaDateDelivered').value,
                                daysDelayed: parseInt(document.getElementById('manilaDaysDelayed').value) || 0,
                                procurementStatus: document.getElementById('manilaProcurementStatus').value,
                                currentDepartment: document.getElementById('manilaCurrentDept').value,
                                totalCost: parseFloat(document.getElementById('manilaTotalCost').value) || 0,
                                vatType: document.getElementById('manilaVatType').value,
                                vatAmount: parseFloat(document.getElementById('manilaVatAmount').value) || 0,
                                netOfVat: parseFloat(document.getElementById('manilaNetOfVat').value) || 0,
                                paymentTermsPercent: parseFloat(document.getElementById('manilaPaymentTermsPercent').value) || 0,
                                paymentTerms: document.getElementById('manilaPaymentTerms').value,
                                ewt: parseFloat(document.getElementById('manilaEwt').value) || 0,
                                actualAmount: parseFloat(document.getElementById('manilaActualAmount').value) || 0,
                                paymentNeededDate: document.getElementById('manilaPaymentNeededDate').value,
                                checkInventory: document.getElementById('manilaCheckInventory').value,
                                paymentReleased: document.getElementById('manilaPaymentReleased').value,
                                paymentMonth: document.getElementById('manilaMonth').value,
                                paymentStatus: document.getElementById('manilaPaymentStatus').value,
                                remarks: document.getElementById('manilaRemarks').value
                            };
                        }
                    } else {
                        const newRecord = {
                            id: Date.now(),
                            projectId: currentProjectId,
                            prsId: selectedPrsId,
                            process: document.getElementById('manilaProcess').value,
                            purchase: document.getElementById('manilaPurchase').value,
                            fund: document.getElementById('manilaFund').value,
                            designation: document.getElementById('manilaDesignation').value,
                            prsNo: isStandalone ? '' : document.getElementById('manilaPrsNo').value,
                            prsDate: isStandalone ? '' : document.getElementById('manilaPrsDate').value,
                            item: document.getElementById('manilaItem').value,
                            targetDate: document.getElementById('manilaTargetDate').value,
                            subtaskCharging: document.getElementById('manilaSubtaskCharging').value,
                            workItemNo: document.getElementById('manilaWorkItemNo').value,
                            poNo: document.getElementById('manilaPoNo').value,
                            supplier: document.getElementById('manilaSupplier').value,
                            dateDelivered: document.getElementById('manilaDateDelivered').value,
                            daysDelayed: parseInt(document.getElementById('manilaDaysDelayed').value) || 0,
                            procurementStatus: document.getElementById('manilaProcurementStatus').value,
                            currentDepartment: document.getElementById('manilaCurrentDept').value,
                            totalCost: parseFloat(document.getElementById('manilaTotalCost').value) || 0,
                            vatType: document.getElementById('manilaVatType').value,
                            vatAmount: parseFloat(document.getElementById('manilaVatAmount').value) || 0,
                            netOfVat: parseFloat(document.getElementById('manilaNetOfVat').value) || 0,
                            paymentTermsPercent: parseFloat(document.getElementById('manilaPaymentTermsPercent').value) || 0,
                            paymentTerms: document.getElementById('manilaPaymentTerms').value,
                            ewt: parseFloat(document.getElementById('manilaEwt').value) || 0,
                            actualAmount: parseFloat(document.getElementById('manilaActualAmount').value) || 0,
                            paymentNeededDate: document.getElementById('manilaPaymentNeededDate').value,
                            checkInventory: document.getElementById('manilaCheckInventory').value,
                            paymentReleased: document.getElementById('manilaPaymentReleased').value,
                            paymentMonth: document.getElementById('manilaMonth').value,
                            paymentStatus: document.getElementById('manilaPaymentStatus').value,
                            remarks: document.getElementById('manilaRemarks').value
                        };
                        manilaRecords.push(newRecord);
                    }
                    window.manilaRecords = manilaRecords;
                    
                    closeManilaModal();
                    if (currentView === 'manila') {
                        renderManilaTable();
                    }
                });
            }
        });

        // Kanban Drag and Drop
        
        function createManilaRecord(prsId) {
            const prs = prsRecords.find(p => p.id === prsId);
            const matchedSubtask = prs ? subtaskChargingOptions.find(opt => opt.includes(prs.activityCharging)) : '';
            
            const newManilaRecord = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                projectId: currentProjectId,
                prsId: prsId,
                subtaskCharging: matchedSubtask || '',
                workItemNo: '',
                poNo: '',
                supplier: '',
                dateDelivered: '',
                daysDelayed: 0,
                procurementStatus: 'Pending',
                currentDepartment: '',
                totalCost: 0,
                vatType: 'Non-VAT',
                vatAmount: 0,
                netOfVat: 0,
                paymentTermsPercent: 100,
                paymentTerms: '',
                ewt: 0,
                actualAmount: 0,
                paymentNeededDate: '',
                checkInventory: '',
                paymentReleased: '',
                paymentMonth: '',
                paymentStatus: 'Unpaid',
                remarks: ''
            };
            manilaRecords.push(newManilaRecord);
        }

        // --- Manila View Logic ---
        window.renderManilaView = function() {
            if (!currentProjectId) return;
            currentView = 'manila';
            updateSubNavVisibility();
            
            let html = `
                <div class="module-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700;">Manila Procurement</h1>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">Track MNL-MNL and LCL-MNL procurement transactions</div>
                    </div>
                    <button class="btn btn-primary" onclick="openManilaModal()" style="background: var(--badge-text-blue); color: white; border: none;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Manila Record</button>
                </div>

                <div style="background: rgba(0, 82, 204, 0.05); border: 1px solid rgba(0, 82, 204, 0.2); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; display: flex; gap: 12px;">
                    <div style="color: var(--primary);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                    <div>
                        <div style="font-weight: 600; color: var(--primary); font-size: 0.9rem; margin-bottom: 4px;">Flexible Entry</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Manila records can be linked to an existing MNL-MNL or LCL-MNL request, or created as standalone transactions.</div>
                    </div>
                </div>

                <!-- Controls -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; max-width: 400px; position: relative;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="manilaSearchInput" oninput="renderManilaTable()" placeholder="Search PRS, item, supplier, PO..." style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                    </div>
                    
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display: flex; background: var(--bg-body); border-radius: var(--radius-md); padding: 4px; border: 1px solid var(--border-color);">
                            <button id="manilaTabProcurement" onclick="setManilaTab('procurement')" style="padding: 6px 16px; border: none; background: ${currentManilaTab === 'procurement' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentManilaTab === 'procurement' ? 'var(--text-main)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.85rem; font-weight: ${currentManilaTab === 'procurement' ? '600' : '500'}; cursor: pointer; box-shadow: var(--shadow-sm)' : 'none'};">Procurement</button>
                            <button id="manilaTabBudget" onclick="setManilaTab('budget')" style="padding: 6px 16px; border: none; background: ${currentManilaTab === 'budget' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentManilaTab === 'budget' ? 'var(--text-main)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.85rem; font-weight: ${currentManilaTab === 'budget' ? '600' : '500'}; cursor: pointer; box-shadow: var(--shadow-sm)' : 'none'};">Budget</button>
                        </div>
                        
                        <select id="manilaDesignationFilter" onchange="renderManilaTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                            <option value="">All Designations</option>
                            <option value="Civil">Civil</option>
                            <option value="Mechanical">Mechanical</option>
                            <option value="Electrical">Electrical</option>
                            <option value="SCADA">SCADA</option>
                            <option value="Safety">Safety</option>
                            <option value="Admin">Admin</option>
                            <option value="Accounting">Accounting</option>
                            <option value="Logistics">Logistics</option>
                        </select>

                        <select id="manilaStatusFilter" onchange="renderManilaTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="ONGOING">ONGOING</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                        </select>

                        <select id="manilaRowsPerPage" onchange="changeManilaRowsPerPage()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>

                <!-- Table -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                            <thead id="manilaTableHeader" style="background: var(--bg-body);">
                                <!-- Headers will be injected based on tab -->
                            </thead>
                            <tbody id="manilaTableBody">
                                <!-- Records will go here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pagination -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; margin-bottom: 24px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem;" id="manilaPaginationInfo">Showing 0 records</div>
                    <div style="display: flex; gap: 8px;">
                        <button id="manilaPrevBtn" onclick="changeManilaPage(-1)" class="btn btn-secondary" disabled>Previous</button>
                        <button id="manilaNextBtn" onclick="changeManilaPage(1)" class="btn btn-secondary" disabled>Next</button>
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
            renderManilaTable();
        };

        window.setManilaTab = function(tab) {
            currentManilaTab = tab;
            renderManilaView();
        };

        window.deleteManilaRecord = function(id) {
            const existingManilaForAccess = (window.manilaRecords || manilaRecords || []).find(r => String(r.id) === String(id));
            if (!window.legacyGuardDelete('manila', existingManilaForAccess)) return;
            customConfirm('Are you sure you want to delete this Manila record?', () => {
                manilaRecords = manilaRecords.filter(m => m.id !== id);
                window.manilaRecords = manilaRecords;
                renderManilaTable();
            });
        };

        let manilaCurrentPage = 1;
        let manilaRowsPerPageValue = 10;

        window.changeManilaRowsPerPage = function() {
            const select = document.getElementById('manilaRowsPerPage');
            if (select) {
                manilaRowsPerPageValue = select.value === 'all' ? 'all' : parseInt(select.value, 10);
                manilaCurrentPage = 1;
                renderManilaTable();
            }
        };

        window.changeManilaPage = function(dir) {
            manilaCurrentPage += dir;
            renderManilaTable();
        };

        window.renderManilaTable = function() {
            const thead = document.getElementById('manilaTableHeader');
            const tbody = document.getElementById('manilaTableBody');
            if (!thead || !tbody) return;

            const searchInput = document.getElementById('manilaSearchInput');
            const statusFilter = document.getElementById('manilaStatusFilter');
            const designationFilter = document.getElementById('manilaDesignationFilter');
            
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const statusVal = statusFilter ? statusFilter.value : '';
            const designationVal = designationFilter ? designationFilter.value : '';

            // Filter records
            let records = manilaRecords.filter(m => m.projectId === currentProjectId);
            
            if (searchTerm) {
                records = records.filter(m => {
                    const prs = prsRecords.find(p => p.id === m.prsId);
                    return ((prs?.prsNo || m.prsNo || '').toLowerCase().includes(searchTerm)) ||
                           ((prs?.description || m.item || '').toLowerCase().includes(searchTerm)) ||
                           (m.supplier || '').toLowerCase().includes(searchTerm) ||
                           (m.poNo || '').toLowerCase().includes(searchTerm);
                });
            }
            
            if (statusVal) {
                if (currentManilaTab === 'procurement') {
                    records = records.filter(m => m.procurementStatus === statusVal);
                } else {
                    records = records.filter(m => m.paymentStatus === statusVal);
                }
            }

            if (designationVal) {
                records = records.filter(m => {
                    const prs = prsRecords.find(p => p.id === m.prsId);
                    return (prs?.designation || m.designation || '') === designationVal;
                });
            }

            // Pagination logic
            let paginatedRecords = records;
            let totalPages = 1;
            
            if (manilaRowsPerPageValue !== 'all') {
                totalPages = Math.ceil(records.length / manilaRowsPerPageValue) || 1;
                if (manilaCurrentPage > totalPages) manilaCurrentPage = totalPages;
                if (manilaCurrentPage < 1) manilaCurrentPage = 1;
                
                const startIndex = (manilaCurrentPage - 1) * manilaRowsPerPageValue;
                paginatedRecords = records.slice(startIndex, startIndex + manilaRowsPerPageValue);
            }
            
            // Update pagination UI
            const paginationInfo = document.getElementById('manilaPaginationInfo');
            const prevBtn = document.getElementById('manilaPrevBtn');
            const nextBtn = document.getElementById('manilaNextBtn');
            
            if (paginationInfo) {
                if (manilaRowsPerPageValue === 'all') {
                    paginationInfo.textContent = `Showing all ${records.length} records`;
                } else {
                    const start = (manilaCurrentPage - 1) * manilaRowsPerPageValue + 1;
                    const end = Math.min(manilaCurrentPage * manilaRowsPerPageValue, records.length);
                    paginationInfo.textContent = `${start}-${end} of ${records.length}`;
                }
            }
            
            if (prevBtn) prevBtn.disabled = manilaCurrentPage <= 1;
            if (nextBtn) nextBtn.disabled = manilaCurrentPage >= totalPages || manilaRowsPerPageValue === 'all';

            // Render Headers
            if (currentManilaTab === 'procurement') {
                thead.innerHTML = `
                    <tr>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PROCESS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DESIGNATION</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS NO.</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ITEM/PARTICULARS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS DATE</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">SUBTASK CHARGING</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PO NO.</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">SUPPLIER</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TARGET DATE</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DATE DELIVERED</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DAYS DELAYED</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">STATUS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DEPT.</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMARKS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);"></th>
                    </tr>
                `;
            } else {
                thead.innerHTML = `
                    <tr>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PROCESS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DESIGNATION</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS NO.</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TOTAL COST</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">VAT</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">VAT AMT</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TERMS %</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">NET OF VAT</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT TERMS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">EWT</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ACTUAL AMT</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">NEEDED DATE</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CHECK INV.</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">RELEASED</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">MONTH</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">STATUS</th>
                        <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);"></th>
                    </tr>
                `;
            }

            // Render Body
            if (paginatedRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="20" style="padding: 24px; text-align: center; color: var(--text-muted);">No records found.</td></tr>`;
                return;
            }

            tbody.innerHTML = paginatedRecords.map(m => {
                const prs = prsRecords.find(p => p.id === m.prsId) || {};
                const process = prs.transaction || m.process || '-';
                const designation = prs.designation || m.designation || '-';
                const prsNo = prs.prsNo || m.prsNo || 'Standalone';
                const item = prs.description || m.item || '-';
                const prsDate = prs.prsDate || m.prsDate || '-';
                const targetDate = prs.targetDate || m.targetDate || '-';
                
                let rowHtml = `<tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-body)'" onmouseout="this.style.backgroundColor='transparent'">`;
                
                // Common columns
                rowHtml += `
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--primary); font-weight: 500;">${process}</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span style="background: var(--bg-body); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--border-color);">${designation}</span></td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--primary); font-weight: 500;">${prsNo}</td>
                `;

                if (currentManilaTab === 'procurement') {
                    rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item}">${item}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${prsDate}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.subtaskCharging}">${m.subtaskCharging || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.poNo || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.supplier || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${targetDate}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.dateDelivered || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.daysDelayed}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: ${m.procurementStatus === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : m.procurementStatus === 'ONGOING' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${m.procurementStatus === 'Delivered' ? 'var(--success)' : m.procurementStatus === 'ONGOING' ? 'var(--primary)' : 'var(--warning)'}; border: 1px solid ${m.procurementStatus === 'Delivered' ? 'rgba(16, 185, 129, 0.2)' : m.procurementStatus === 'ONGOING' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'};">${m.procurementStatus}</span></td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.currentDepartment || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${m.remarks}">${m.remarks || '-'}</td>
                    `;
                } else {
                    rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 500;">₱${m.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.vatType}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">₱${m.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentTermsPercent}%</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">₱${m.netOfVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentTerms || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.ewt == 0 ? 'No EWT' : (m.ewt * 100) + '%'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--success);">₱${m.actualAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentNeededDate || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.checkInventory || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentReleased || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentMonth || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: ${m.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${m.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--danger)'}; border: 1px solid ${m.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">${m.paymentStatus}</span></td>
                    `;
                }

                rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button class="btn btn-secondary" onclick="openManilaModal(${m.id})" style="padding: 4px 8px; font-size: 0.8rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                <button class="btn btn-secondary" onclick="deleteManilaRecord(${m.id})" style="padding: 4px 8px; font-size: 0.8rem; color: var(--danger);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                            </div>
                        </td>
                    </tr>
                `;
                return rowHtml;
            }).join('');
        };

        window.openManilaModal = function(id = null) {
            const existingManilaForAccess = id ? (window.manilaRecords || manilaRecords || []).find(r => String(r.id) === String(id)) : null;
            if (id ? !window.legacyGuardEdit('manila', existingManilaForAccess) : !window.legacyGuardAdd('manila')) return;
            editingManilaId = id;
            const modalOverlay = document.getElementById('manilaModal');
            if(modalOverlay) {
                modalOverlay.classList.add('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.add('active');
                
                // Populate PRS Select
                const prsSelect = document.getElementById('manilaPrsSelect');
                if (prsSelect) {
                    prsSelect.innerHTML = '<option value="">Select existing PRS (MNL-MNL or LCL-MNL only)</option>';
                    const eligiblePrs = prsRecords.filter(p => {
                        if (p.projectId !== currentProjectId) return false;
                        if (p.transaction !== 'MNL-MNL' && p.transaction !== 'LCL-MNL') return false;
                        // If editing, allow the current PRS. If new, only allow PRS without a Manila record.
                        if (id) {
                            const currentRecord = manilaRecords.find(m => m.id === id);
                            if (currentRecord && currentRecord.prsId === p.id) return true;
                        }
                        return !manilaRecords.some(m => m.prsId === p.id);
                    });
                    eligiblePrs.forEach(p => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = `${p.prsNo} - ${p.description.substring(0, 30)}...`;
                        prsSelect.appendChild(option);
                    });
                }
                
                // Populate Subtask Charging options
                const subtaskSelect = document.getElementById('manilaSubtaskCharging');
                if (subtaskSelect && subtaskSelect.options.length <= 1) {
                    subtaskChargingOptions.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        subtaskSelect.appendChild(option);
                    });
                }

                if (id) {
                    const record = manilaRecords.find(r => r.id === id);
                    if (record) {
                        document.getElementById('manilaStandaloneToggle').checked = !record.prsId;
                        toggleManilaStandalone();

                        if (record.prsId) {
                            document.getElementById('manilaPrsSelect').value = record.prsId;
                            handleManilaPrsChange(); // Auto-fill linked request details
                        } else {
                            document.getElementById('manilaProcess').value = record.process || 'MNL-MNL';
                            document.getElementById('manilaPurchase').value = record.purchase || '';
                            document.getElementById('manilaFund').value = record.fund || '';
                            document.getElementById('manilaDesignation').value = record.designation || '';
                            document.getElementById('manilaPrsNo').value = record.prsNo || '';
                            document.getElementById('manilaPrsDate').value = record.prsDate || '';
                            document.getElementById('manilaItem').value = record.item || '';
                            document.getElementById('manilaTargetDate').value = record.targetDate || '';
                        }
                        
                        document.getElementById('manilaSubtaskCharging').value = record.subtaskCharging;
                        document.getElementById('manilaWorkItemNo').value = record.workItemNo;
                        document.getElementById('manilaPoNo').value = record.poNo;
                        document.getElementById('manilaSupplier').value = record.supplier;
                        document.getElementById('manilaDateDelivered').value = record.dateDelivered;
                        document.getElementById('manilaDaysDelayed').value = record.daysDelayed;
                        document.getElementById('manilaProcurementStatus').value = record.procurementStatus;
                        document.getElementById('manilaCurrentDept').value = record.currentDepartment;
                        document.getElementById('manilaTotalCost').value = record.totalCost;
                        document.getElementById('manilaVatType').value = record.vatType;
                        document.getElementById('manilaPaymentTermsPercent').value = record.paymentTermsPercent;
                        document.getElementById('manilaPaymentTerms').value = record.paymentTerms;
                        document.getElementById('manilaEwt').value = record.ewt;
                        document.getElementById('manilaPaymentNeededDate').value = record.paymentNeededDate;
                        document.getElementById('manilaCheckInventory').value = record.checkInventory;
                        document.getElementById('manilaPaymentReleased').value = record.paymentReleased;
                        document.getElementById('manilaMonth').value = record.paymentMonth;
                        document.getElementById('manilaPaymentStatus').value = record.paymentStatus;
                        document.getElementById('manilaRemarks').value = record.remarks;
                        
                        calculateManilaBudget(); // Recalculate
                    }
                } else {
                    document.getElementById('manilaForm').reset();
                    document.getElementById('manilaStandaloneToggle').checked = false;
                    toggleManilaStandalone();
                    document.getElementById('manilaPaymentTermsPercent').value = 100;
                    handleManilaPrsChange(); // Clear request details
                }
            }
        };

        window.closeManilaModal = function() {
            const modalOverlay = document.getElementById('manilaModal');
            if(modalOverlay) {
                modalOverlay.classList.remove('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.remove('active');
            }
            editingManilaId = null;
        };

        window.toggleManilaStandalone = function() {
            const toggle = document.getElementById('manilaStandaloneToggle');
            const prsGroup = document.getElementById('manilaPrsSelectGroup');
            const prsSelect = document.getElementById('manilaPrsSelect');
            if (!toggle || !prsGroup || !prsSelect) return;

            const isStandalone = toggle.checked;
            const editableIds = [
                'manilaProcess', 'manilaPurchase', 'manilaFund', 'manilaDesignation',
                'manilaPrsNo', 'manilaPrsDate', 'manilaItem', 'manilaTargetDate'
            ];

            prsGroup.style.display = isStandalone ? 'none' : 'block';
            if (isStandalone) {
                prsSelect.removeAttribute('required');
                prsSelect.value = '';
                editableIds.forEach(id => {
                    const field = document.getElementById(id);
                    if (field) {
                        field.readOnly = false;
                        field.style.background = 'var(--bg-body)';
                    }
                });
                handleManilaPrsChange();
                const processField = document.getElementById('manilaProcess');
                if (processField && !processField.value) processField.value = 'MNL-MNL';
            } else {
                prsSelect.setAttribute('required', 'required');
                editableIds.forEach(id => {
                    const field = document.getElementById(id);
                    if (field) {
                        field.readOnly = true;
                        field.style.background = 'var(--bg-surface)';
                    }
                });
            }
        };

        window.handleManilaPrsChange = function() {
            const prsId = document.getElementById('manilaPrsSelect').value;
            if (prsId) {
                const prs = prsRecords.find(p => p.id == prsId);
                if (prs) {
                    document.getElementById('manilaProcess').value = prs.transaction;
                    document.getElementById('manilaPurchase').value = prs.type;
                    document.getElementById('manilaFund').value = prs.activityCharging;
                    document.getElementById('manilaDesignation').value = prs.designation;
                    document.getElementById('manilaPrsNo').value = prs.prsNo;
                    document.getElementById('manilaPrsDate').value = prs.prsDate;
                    document.getElementById('manilaItem').value = prs.description;
                    document.getElementById('manilaTargetDate').value = prs.targetDate;
                    
                    // Link subtask charging
                    const matchedSubtask = subtaskChargingOptions.find(opt => opt.includes(prs.activityCharging));
                    if (matchedSubtask) {
                        document.getElementById('manilaSubtaskCharging').value = matchedSubtask;
                    }
                    
                    calculateManilaDaysDelayed();
                }
            } else {
                const isStandalone = document.getElementById('manilaStandaloneToggle')?.checked;
                document.getElementById('manilaProcess').value = isStandalone ? 'MNL-MNL' : '';
                document.getElementById('manilaPurchase').value = '';
                document.getElementById('manilaFund').value = '';
                document.getElementById('manilaDesignation').value = '';
                document.getElementById('manilaPrsNo').value = '';
                document.getElementById('manilaPrsDate').value = '';
                document.getElementById('manilaItem').value = '';
                document.getElementById('manilaTargetDate').value = '';
                document.getElementById('manilaSubtaskCharging').value = '';
                document.getElementById('manilaDaysDelayed').value = 0;
            }
        };

        window.calculateManilaDaysDelayed = function() {
            const targetDateStr = document.getElementById('manilaTargetDate').value;
            const deliveredDateStr = document.getElementById('manilaDateDelivered').value;
            
            if (targetDateStr && deliveredDateStr) {
                const target = new Date(targetDateStr);
                const delivered = new Date(deliveredDateStr);
                const diffTime = delivered - target;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                document.getElementById('manilaDaysDelayed').value = diffDays > 0 ? diffDays : 0;
            } else {
                document.getElementById('manilaDaysDelayed').value = 0;
            }
        };

        window.calculateManilaBudget = function() {
            const totalCost = parseFloat(document.getElementById('manilaTotalCost').value) || 0;
            const vatType = document.getElementById('manilaVatType').value;
            const termsPercent = parseFloat(document.getElementById('manilaPaymentTermsPercent').value) || 0;
            const ewtRate = parseFloat(document.getElementById('manilaEwt').value) || 0;
            
            let vatAmount = 0;
            let netOfVat = totalCost;
            
            if (vatType === 'VAT') {
                netOfVat = totalCost / 1.12;
                vatAmount = totalCost - netOfVat;
            }
            
            document.getElementById('manilaVatAmount').value = vatAmount.toFixed(2);
            document.getElementById('manilaNetOfVat').value = netOfVat.toFixed(2);
            
            const ewtAmount = netOfVat * ewtRate;
            const actualAmount = (totalCost * (termsPercent / 100)) - ewtAmount;
            
            document.getElementById('manilaActualAmount').value = actualAmount.toFixed(2);
        };

        window.updateManilaMonth = function() {
            const releasedDateStr = document.getElementById('manilaPaymentReleased').value;
            if (releasedDateStr) {
                const date = new Date(releasedDateStr);
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                document.getElementById('manilaMonth').value = monthNames[date.getMonth()] + " - " + date.getFullYear();
            } else {
                document.getElementById('manilaMonth').value = '';
            }
        };

        // --- Local (Replenishment) View Logic ---
        window.renderLocalView = function() {
            if (!currentProjectId) return;
            currentView = 'local';
            updateSubNavVisibility();
            
            let html = `
                <div class="module-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700;">Local Procurement</h1>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">Track LCL-LCL and MNL-LCL procurement transactions</div>
                    </div>
                    <button class="btn btn-primary" onclick="openLocalModal()" style="background: var(--badge-text-blue); color: white; border: none;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Local Record</button>
                </div>

                <div style="background: rgba(0, 82, 204, 0.05); border: 1px solid rgba(0, 82, 204, 0.2); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; display: flex; gap: 12px;">
                    <div style="color: var(--primary);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg></div>
                    <div>
                        <div style="font-weight: 600; color: var(--primary); font-size: 0.9rem; margin-bottom: 4px;">Flexible Entry</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Replenishments can be linked to existing PRS or created as standalone entries for independent transactions.</div>
                    </div>
                </div>

                <!-- Controls -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; max-width: 400px; position: relative;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="localSearchInput" oninput="renderLocalTable()" placeholder="Search REPLE no., item, supplier, charging..." style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                    </div>
                    
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="display: flex; background: var(--bg-body); border-radius: var(--radius-md); padding: 4px; border: 1px solid var(--border-color);">
                            <button id="localTabProcurement" onclick="setLocalTab('procurement')" style="padding: 6px 16px; border: none; background: ${currentLocalTab === 'procurement' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentLocalTab === 'procurement' ? 'var(--text-main)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.85rem; font-weight: ${currentLocalTab === 'procurement' ? '600' : '500'}; cursor: pointer; box-shadow: var(--shadow-sm)' : 'none'};">Procurement</button>
                            <button id="localTabSupplies" onclick="setLocalTab('supplies')" style="padding: 6px 16px; border: none; background: ${currentLocalTab === 'supplies' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentLocalTab === 'supplies' ? 'var(--text-main)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.85rem; font-weight: ${currentLocalTab === 'supplies' ? '600' : '500'}; cursor: pointer; box-shadow: var(--shadow-sm)' : 'none'};">Supplies</button>
                            <button id="localTabBudget" onclick="setLocalTab('budget')" style="padding: 6px 16px; border: none; background: ${currentLocalTab === 'budget' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentLocalTab === 'budget' ? 'var(--text-main)' : 'var(--text-muted)'}; border-radius: 4px; font-size: 0.85rem; font-weight: ${currentLocalTab === 'budget' ? '600' : '500'}; cursor: pointer; box-shadow: var(--shadow-sm)' : 'none'};">Budget</button>
                        </div>
                        
                        <select id="localCategoryFilter" onchange="renderLocalTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                            <option value="">All Categories</option>
                            <option value="Admin Expense">Admin Expense</option>
                            <option value="Materials Expense">Materials Expense</option>
                            <option value="Manpower Expense">Manpower Expense</option>
                        </select>

                        <select id="localStatusFilter" onchange="renderLocalTable()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main); min-width: 150px;">
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="ONGOING">ONGOING</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                        </select>

                        <select id="localRowsPerPage" onchange="changeLocalRowsPerPage()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                            <option value="5">5</option>
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>

                <!-- Table -->
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                            <thead id="localTableHeader" style="background: var(--bg-body);">
                                <!-- Headers will be injected based on tab -->
                            </thead>
                            <tbody id="localTableBody">
                                <!-- Records will go here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pagination -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; margin-bottom: 24px;">
                    <div style="color: var(--text-muted); font-size: 0.85rem;" id="localPaginationInfo">Showing 0 records</div>
                    <div style="display: flex; gap: 8px;">
                        <button id="localPrevBtn" onclick="changeLocalPage(-1)" class="btn btn-secondary" disabled>Previous</button>
                        <button id="localNextBtn" onclick="changeLocalPage(1)" class="btn btn-secondary" disabled>Next</button>
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
            renderLocalTable();
        };

        window.setLocalTab = function(tab) {
            currentLocalTab = tab;
            renderLocalView();
        };

        window.deleteLocalRecord = function(id) {
            const existingLocalForAccess = (window.localRecords || localRecords || []).find(r => String(r.id) === String(id));
            if (!window.legacyGuardDelete('local', existingLocalForAccess)) return;
            customConfirm('Are you sure you want to delete this Replenishment record?', () => {
                localRecords = localRecords.filter(m => m.id !== id);
                window.localRecords = localRecords;
                renderLocalTable();
            });
        };

        let localCurrentPage = 1;
        let localRowsPerPageValue = 10;

        window.changeLocalRowsPerPage = function() {
            const select = document.getElementById('localRowsPerPage');
            if (select) {
                localRowsPerPageValue = select.value === 'all' ? 'all' : parseInt(select.value, 10);
                localCurrentPage = 1;
                renderLocalTable();
            }
        };

        window.changeLocalPage = function(dir) {
            localCurrentPage += dir;
            renderLocalTable();
        };

        window.renderLocalTable = function() {
            const thead = document.getElementById('localTableHeader');
            const tbody = document.getElementById('localTableBody');
            if (!thead || !tbody) return;

            const searchInput = document.getElementById('localSearchInput');
            const statusFilter = document.getElementById('localStatusFilter');
            const categoryFilter = document.getElementById('localCategoryFilter');
            
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const statusVal = statusFilter ? statusFilter.value : '';
            const categoryVal = categoryFilter ? categoryFilter.value : '';

            // Filter records
            let records = localRecords.filter(m => m.projectId === currentProjectId);
            
            if (searchTerm) {
                records = records.filter(m => {
                    const prs = m.prsId ? prsRecords.find(p => p.id === m.prsId) : null;
                    return (prs && prs.prsNo.toLowerCase().includes(searchTerm)) ||
                           (m.repleNo && m.repleNo.toLowerCase().includes(searchTerm)) ||
                           (m.item && m.item.toLowerCase().includes(searchTerm)) ||
                           (m.supplier && m.supplier.toLowerCase().includes(searchTerm)) ||
                           (m.poNo && m.poNo.toLowerCase().includes(searchTerm));
                });
            }
            
            if (statusVal) {
                if (currentLocalTab === 'procurement' || currentLocalTab === 'supplies') {
                    records = records.filter(m => m.procurementStatus === statusVal);
                } else {
                    records = records.filter(m => m.paymentStatus === statusVal);
                }
            }

            if (categoryVal) {
                records = records.filter(m => m.repleCategory === categoryVal);
            }

            // Pagination logic
            let paginatedRecords = records;
            let totalPages = 1;
            
            if (localRowsPerPageValue !== 'all') {
                totalPages = Math.ceil(records.length / localRowsPerPageValue) || 1;
                if (localCurrentPage > totalPages) localCurrentPage = totalPages;
                if (localCurrentPage < 1) localCurrentPage = 1;
                
                const startIndex = (localCurrentPage - 1) * localRowsPerPageValue;
                paginatedRecords = records.slice(startIndex, startIndex + localRowsPerPageValue);
            }
            
            // Update pagination UI
            const paginationInfo = document.getElementById('localPaginationInfo');
            const prevBtn = document.getElementById('localPrevBtn');
            const nextBtn = document.getElementById('localNextBtn');
            
            if (paginationInfo) {
                if (localRowsPerPageValue === 'all') {
                    paginationInfo.textContent = `Showing all ${records.length} records`;
                } else {
                    const start = (localCurrentPage - 1) * localRowsPerPageValue + 1;
                    const end = Math.min(localCurrentPage * localRowsPerPageValue, records.length);
                    paginationInfo.textContent = `${start}-${end} of ${records.length}`;
                }
            }
            
            if (prevBtn) prevBtn.disabled = localCurrentPage <= 1;
            if (nextBtn) nextBtn.disabled = localCurrentPage >= totalPages || localRowsPerPageValue === 'all';

            // Render Headers
            if (currentLocalTab === 'procurement') {
                thead.innerHTML = `
                    <tr>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PROCESS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CATEGORY</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REPLE NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ITEM/PARTICULARS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CHARGING CAT.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">BOQ CHARGING</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">NOTE</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">SUBTASK</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">WORK ITEM</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">STATUS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;"></th>
                    </tr>
                `;
            } else if (currentLocalTab === 'supplies') {
                thead.innerHTML = `
                    <tr>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PROCESS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CATEGORY</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REPLE NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PO NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">SUPPLIER</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TARGET DATE</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DELIVERED</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DELAYED</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">STATUS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DEPT.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMARKS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;"></th>
                    </tr>
                `;
            } else {
                thead.innerHTML = `
                    <tr>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PROCESS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CATEGORY</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REPLE NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PRS NO.</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TOTAL COST</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">VAT</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">VAT AMT</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TERMS %</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">EWT</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ACTUAL AMT</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">NEEDED DATE</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">MONTH</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">STATUS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CONCERNS</th>
                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;"></th>
                    </tr>
                `;
            }

            // Render Body
            tbody.innerHTML = '';
            if (paginatedRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="15" style="padding: 24px; text-align: center; color: var(--text-muted);">No replenishment records found.</td></tr>`;
                return;
            }

            paginatedRecords.forEach(m => {
                const prs = m.prsId ? prsRecords.find(p => p.id === m.prsId) : null;
                const prsNo = prs ? prs.prsNo : '-';
                
                let statusBadge = '';
                if (currentLocalTab === 'procurement' || currentLocalTab === 'supplies') {
                    if (m.procurementStatus === 'Delivered') statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Delivered</span>`;
                    else if (m.procurementStatus === 'ONGOING') statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">ONGOING</span>`;
                    else statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(100, 116, 139, 0.1); color: var(--text-muted); border: 1px solid rgba(100, 116, 139, 0.2);">Pending</span>`;
                } else {
                    if (m.paymentStatus === 'Paid') statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Paid</span>`;
                    else statusBadge = `<span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">Unpaid</span>`;
                }

                const ewtLabels = {0: 'No EWT', 1: 'Goods (1%)', 2: 'Services (2%)'};
                const ewtLabel = ewtLabels[m.ewt] || 'No EWT';

                let rowHtml = `<tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span style="color: var(--primary); font-weight: 500; background: rgba(0, 82, 204, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${m.process}</span></td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span style="color: var(--badge-text-orange); font-weight: 500; background: rgba(245, 158, 11, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${m.repleCategory}</span></td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600;">${m.repleNo || '-'}</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--primary);">${prsNo}</td>
                `;

                if (currentLocalTab === 'procurement') {
                    const chargingCat = m.chargingNoteCode ? m.chargingNoteCode.split(' - ')[0] : '-';
                    rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.item || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${chargingCat}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.boqCharging || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${chargingCat}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.subtaskCharging || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.workItemNo || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
                    `;
                } else if (currentLocalTab === 'supplies') {
                    rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.poNo || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.supplier || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.targetDate ? new Date(m.targetDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-') : '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.dateDelivered ? new Date(m.dateDelivered).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-') : '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.daysDelayed}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.currentDepartment || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.concerns || '-'}</td>
                    `;
                } else {
                    rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 500;">₱${m.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.vatType}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">₱${m.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentTermsPercent}%</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${ewtLabel}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--success);">₱${m.actualAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentNeededDate ? new Date(m.paymentNeededDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g, '-') : '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.paymentMonth || '-'}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${statusBadge}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${m.concerns || '-'}</td>
                    `;
                }

                rowHtml += `
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button class="btn btn-secondary" onclick="openLocalModal(${m.id})" style="padding: 4px 8px; font-size: 0.8rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                <button class="btn btn-secondary" onclick="deleteLocalRecord(${m.id})" style="padding: 4px 8px; font-size: 0.8rem; color: var(--danger);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                            </div>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += rowHtml;
            });
        };

        window.openLocalModal = function(id = null) {
            const existingLocalForAccess = id ? (window.localRecords || localRecords || []).find(r => String(r.id) === String(id)) : null;
            if (id ? !window.legacyGuardEdit('local', existingLocalForAccess) : !window.legacyGuardAdd('local')) return;
            editingLocalId = id;
            const modalOverlay = document.getElementById('localModal');
            if(modalOverlay) {
                modalOverlay.classList.add('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.add('active');
                
                // Populate Charging Note Code Select
                const chargingSelect = document.getElementById('localChargingNoteCode');
                if (chargingSelect && chargingSelect.options.length <= 1) {
                    subtaskChargingOptions.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        chargingSelect.appendChild(option);
                    });
                }

                // Populate PRS Select
                const prsSelect = document.getElementById('localPrsSelect');
                if (prsSelect) {
                    prsSelect.innerHTML = '<option value="">Select existing PRS (LCL-LCL or MNL-LCL)</option>';
                    const eligiblePrs = prsRecords.filter(p => {
                        if (p.projectId !== currentProjectId) return false;
                        if (p.transaction !== 'LCL-LCL' && p.transaction !== 'MNL-LCL') return false;
                        // If editing, allow the current PRS. If new, only allow PRS without a Local record.
                        if (id) {
                            const currentRecord = localRecords.find(m => m.id === id);
                            if (currentRecord && currentRecord.prsId === p.id) return true;
                        }
                        return !localRecords.some(m => m.prsId === p.id);
                    });
                    eligiblePrs.forEach(p => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = `${p.prsNo} - ${p.description.substring(0, 30)}...`;
                        prsSelect.appendChild(option);
                    });
                }

                if (id) {
                    const record = localRecords.find(r => r.id === id);
                    if (record) {
                        document.getElementById('localStandaloneToggle').checked = !record.prsId;
                        toggleLocalStandalone();

                        if (record.prsId) {
                            document.getElementById('localPrsSelect').value = record.prsId;
                            handleLocalPrsChange(); // Auto-fill PRS details
                        }

                        document.getElementById('localProcess').value = record.process;
                        document.getElementById('localRepleCategory').value = record.repleCategory;
                        document.getElementById('localRepleNo').value = record.repleNo;
                        document.getElementById('localItem').value = record.item;
                        document.getElementById('localChargingNoteCode').value = record.chargingNoteCode;
                        document.getElementById('localChargingCategory').value = record.chargingCategory;
                        document.getElementById('localBoqCharging').value = record.boqCharging;
                        document.getElementById('localSubtaskCharging').value = record.subtaskCharging;
                        document.getElementById('localWorkItemNo').value = record.workItemNo;
                        document.getElementById('localStartDate').value = record.startDate;
                        document.getElementById('localEndDate').value = record.endDate;
                        
                        document.getElementById('localPoNo').value = record.poNo;
                        document.getElementById('localSupplier').value = record.supplier;
                        document.getElementById('localTargetDate').value = record.targetDate;
                        document.getElementById('localDateDelivered').value = record.dateDelivered;
                        document.getElementById('localDaysDelayed').value = record.daysDelayed;
                        document.getElementById('localProcurementStatus').value = record.procurementStatus;
                        document.getElementById('localCurrentDept').value = record.currentDepartment;
                        
                        document.getElementById('localTotalCost').value = record.totalCost;
                        document.getElementById('localVatType').value = record.vatType;
                        document.getElementById('localPaymentTermsPercent').value = record.paymentTermsPercent;
                        document.getElementById('localPaymentTerms').value = record.paymentTerms;
                        document.getElementById('localEwt').value = record.ewt;
                        document.getElementById('localPaymentNeededDate').value = record.paymentNeededDate;
                        document.getElementById('localPaymentReleased').value = record.paymentReleased;
                        document.getElementById('localMonth').value = record.paymentMonth;
                        document.getElementById('localPaymentStatus').value = record.paymentStatus;
                        document.getElementById('localConcerns').value = record.concerns;
                        
                        calculateLocalBudget();
                    }
                } else {
                    document.getElementById('localForm').reset();
                    document.getElementById('localStandaloneToggle').checked = false;
                    toggleLocalStandalone();
                    document.getElementById('localPaymentTermsPercent').value = 100;
                    handleLocalPrsChange(); // Clear PRS details
                }
            }
        };

        window.closeLocalModal = function() {
            const modalOverlay = document.getElementById('localModal');
            if(modalOverlay) {
                modalOverlay.classList.remove('active');
                const modal = modalOverlay.querySelector('.modal');
                if (modal) modal.classList.remove('active');
            }
            editingLocalId = null;
        };

        window.toggleLocalStandalone = function() {
            const isStandalone = document.getElementById('localStandaloneToggle').checked;
            const prsGroup = document.getElementById('localPrsSelectGroup');
            const prsSelect = document.getElementById('localPrsSelect');
            
            if (isStandalone) {
                prsGroup.style.display = 'none';
                prsSelect.removeAttribute('required');
                prsSelect.value = '';
                handleLocalPrsChange(); // Clear linked fields
            } else {
                prsGroup.style.display = 'block';
                prsSelect.setAttribute('required', 'required');
            }
        };

        window.handleLocalPrsChange = function() {
            const prsId = document.getElementById('localPrsSelect').value;
            const suppliesSection = document.getElementById('localSuppliesSection');
            
            if (prsId) {
                const prs = prsRecords.find(p => p.id == prsId);
                if (prs) {
                    document.getElementById('localProcess').value = prs.transaction;
                    document.getElementById('localPrsNo').value = prs.prsNo;
                    document.getElementById('localItem').value = prs.description;
                    document.getElementById('localTargetDate').value = prs.targetDate;
                    
                    const matchedSubtask = subtaskChargingOptions.find(opt => opt.includes(prs.activityCharging));
                    if (matchedSubtask) {
                        document.getElementById('localChargingNoteCode').value = matchedSubtask;
                        const parts = matchedSubtask.split(' - ');
                        if (parts.length > 1) {
                            document.getElementById('localChargingCategory').value = parts[0];
                            document.getElementById('localBoqCharging').value = parts[1];
                        }
                        document.getElementById('localSubtaskCharging').value = matchedSubtask;
                    }

                    calculateLocalDaysDelayed();
                }
                if (suppliesSection) suppliesSection.style.display = 'block';
            } else {
                document.getElementById('localPrsNo').value = '';
                if (!document.getElementById('localStandaloneToggle').checked) {
                    document.getElementById('localProcess').value = 'LCL-LCL';
                    document.getElementById('localItem').value = '';
                    document.getElementById('localTargetDate').value = '';
                    document.getElementById('localChargingNoteCode').value = '';
                    document.getElementById('localChargingCategory').value = '';
                    document.getElementById('localBoqCharging').value = '';
                    document.getElementById('localSubtaskCharging').value = '';
                    document.getElementById('localDaysDelayed').value = 0;
                }
                if (suppliesSection) suppliesSection.style.display = 'none';
            }
        };

        document.getElementById('localChargingNoteCode').addEventListener('change', function() {
            const val = this.value;
            if (val) {
                const parts = val.split(' - ');
                document.getElementById('localChargingCategory').value = parts[0];
                document.getElementById('localBoqCharging').value = parts[1] || '';
                document.getElementById('localSubtaskCharging').value = val;
            } else {
                document.getElementById('localChargingCategory').value = '';
                document.getElementById('localBoqCharging').value = '';
                document.getElementById('localSubtaskCharging').value = '';
            }
        });

        window.calculateLocalDaysDelayed = function() {
            const targetDateStr = document.getElementById('localTargetDate').value;
            const deliveredDateStr = document.getElementById('localDateDelivered').value;
            
            if (targetDateStr && deliveredDateStr) {
                const target = new Date(targetDateStr);
                const delivered = new Date(deliveredDateStr);
                const diffTime = delivered - target;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                document.getElementById('localDaysDelayed').value = diffDays > 0 ? diffDays : 0;
            } else {
                document.getElementById('localDaysDelayed').value = 0;
            }
        };

        window.calculateLocalBudget = function() {
            const totalCost = parseFloat(document.getElementById('localTotalCost').value) || 0;
            const vatType = document.getElementById('localVatType').value;
            const paymentTermsPercent = parseFloat(document.getElementById('localPaymentTermsPercent').value) || 0;
            const ewtRate = parseFloat(document.getElementById('localEwt').value) || 0;

            let vatAmount = 0;
            let netOfVat = totalCost;

            if (vatType === 'VAT') {
                netOfVat = totalCost / 1.12;
                vatAmount = totalCost - netOfVat;
            }

            const termsAmount = totalCost * (paymentTermsPercent / 100);
            const ewtAmount = netOfVat * (ewtRate / 100);
            const actualAmount = termsAmount - ewtAmount;

            document.getElementById('localVatAmount').value = vatAmount.toFixed(2);
            document.getElementById('localNetOfVat').value = netOfVat.toFixed(2);
            document.getElementById('localActualAmount').value = actualAmount.toFixed(2);
        };

        window.updateLocalMonth = function() {
            const releasedDateStr = document.getElementById('localPaymentReleased').value;
            if (releasedDateStr) {
                const date = new Date(releasedDateStr);
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                document.getElementById('localMonth').value = monthNames[date.getMonth()] + " - " + date.getFullYear();
            } else {
                document.getElementById('localMonth').value = '';
            }
        };

        const localForm = document.getElementById('localForm');
        if (localForm) {
            localForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const existingLocalForAccess = editingLocalId ? (window.localRecords || localRecords || []).find(r => String(r.id) === String(editingLocalId)) : null;
                if (editingLocalId ? !window.legacyGuardEdit('local', existingLocalForAccess) : !window.legacyGuardAdd('local')) return;
                
                const isStandalone = document.getElementById('localStandaloneToggle').checked;
                const prsIdVal = document.getElementById('localPrsSelect').value;
                const prsId = isStandalone ? null : (prsIdVal ? parseInt(prsIdVal) : null);

                const recordData = {
                    projectId: currentProjectId,
                    prsId: prsId,
                    process: document.getElementById('localProcess').value,
                    repleCategory: document.getElementById('localRepleCategory').value,
                    repleNo: document.getElementById('localRepleNo').value,
                    item: document.getElementById('localItem').value,
                    chargingNoteCode: document.getElementById('localChargingNoteCode').value,
                    chargingCategory: document.getElementById('localChargingCategory').value,
                    boqCharging: document.getElementById('localBoqCharging').value,
                    subtaskCharging: document.getElementById('localSubtaskCharging').value,
                    workItemNo: document.getElementById('localWorkItemNo').value,
                    startDate: document.getElementById('localStartDate').value,
                    endDate: document.getElementById('localEndDate').value,
                    
                    poNo: document.getElementById('localPoNo').value,
                    supplier: document.getElementById('localSupplier').value,
                    targetDate: document.getElementById('localTargetDate').value,
                    dateDelivered: document.getElementById('localDateDelivered').value,
                    daysDelayed: parseInt(document.getElementById('localDaysDelayed').value) || 0,
                    procurementStatus: document.getElementById('localProcurementStatus').value,
                    currentDepartment: document.getElementById('localCurrentDept').value,
                    
                    totalCost: parseFloat(document.getElementById('localTotalCost').value) || 0,
                    vatType: document.getElementById('localVatType').value,
                    vatAmount: parseFloat(document.getElementById('localVatAmount').value) || 0,
                    netOfVat: parseFloat(document.getElementById('localNetOfVat').value) || 0,
                    paymentTermsPercent: parseFloat(document.getElementById('localPaymentTermsPercent').value) || 0,
                    paymentTerms: document.getElementById('localPaymentTerms').value,
                    ewt: parseFloat(document.getElementById('localEwt').value) || 0,
                    actualAmount: parseFloat(document.getElementById('localActualAmount').value) || 0,
                    paymentNeededDate: document.getElementById('localPaymentNeededDate').value,
                    paymentReleased: document.getElementById('localPaymentReleased').value,
                    paymentMonth: document.getElementById('localMonth').value,
                    paymentStatus: document.getElementById('localPaymentStatus').value,
                    concerns: document.getElementById('localConcerns').value
                };

                if (editingLocalId) {
                    const recordIndex = localRecords.findIndex(r => r.id === editingLocalId);
                    if (recordIndex !== -1) {
                        localRecords[recordIndex] = {
                            ...localRecords[recordIndex],
                            ...recordData
                        };
                    }
                } else {
                    localRecords.push({
                        id: Date.now(),
                        ...recordData
                    });
                }

                closeLocalModal();
                if (currentView === 'local') {
                    renderLocalTable();
                }
            });
        }

        window.createLocalRecord = function(prsId) {
            const prs = prsRecords.find(p => p.id === prsId);
            if (!prs) return;

            const matchedSubtask = subtaskChargingOptions.find(opt => opt.includes(prs.activityCharging));
            const chargingCat = matchedSubtask ? matchedSubtask.split(' - ')[0] : '';
            const boqCharging = matchedSubtask ? matchedSubtask.split(' - ')[1] : '';

            const newLocalRecord = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                projectId: currentProjectId,
                prsId: prsId,
                process: prs.transaction,
                repleCategory: 'Admin Expense',
                repleNo: '',
                item: prs.description,
                chargingNoteCode: matchedSubtask || '',
                chargingCategory: chargingCat,
                boqCharging: boqCharging,
                subtaskCharging: matchedSubtask || '',
                workItemNo: '',
                startDate: '',
                endDate: '',
                poNo: '',
                supplier: '',
                targetDate: prs.targetDate,
                dateDelivered: '',
                daysDelayed: 0,
                procurementStatus: 'Pending',
                currentDepartment: '',
                totalCost: 0,
                vatType: 'Non-VAT',
                vatAmount: 0,
                netOfVat: 0,
                paymentTermsPercent: 100,
                paymentTerms: 'Full Payment (100%)',
                ewt: 0,
                actualAmount: 0,
                paymentNeededDate: '',
                paymentReleased: '',
                paymentMonth: '',
                paymentStatus: 'Unpaid',
                concerns: ''
            };
            localRecords.push(newLocalRecord);
        }

        window.renderExpenseOverview = function() {
            if (!currentProjectId) return;
            currentView = 'expense-overview';
            updateSubNavVisibility();
            
            contentArea.innerHTML = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Expense Overview</h1>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Track procurement expenses across Manila and Local</div>
                    </div>
                </div>

                <!-- Budget Summary -->
                <div class="card" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 1rem; font-weight: 600;">Budget Summary (Month - Year)</h3>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Month</span>
                            <select id="expenseMonthFilter" onchange="renderExpenseDashboard()" style="padding: 6px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem;">
                                <option value="all">All Months</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <!-- Summary Table -->
                        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                                    <thead style="background: var(--bg-body);">
                                        <tr>
                                            <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">MONTH - YEAR</th>
                                            <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;">PAID</th>
                                            <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;">UNPAID</th>
                                            <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: right;">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody id="expenseSummaryTableBody">
                                        <!-- Populated by JS -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Chart -->
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; justify-content: center;" id="expenseChartContainer">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>

                <!-- Manila Procurement Table -->
                <div class="card" style="margin-bottom: 24px;">
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px;">Manila Procurement (Materials)</h3>
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                                <thead style="background: var(--bg-body);">
                                    <tr>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ITEM</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">SUPPLIER</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT DATE</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">MONTH</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ACTUAL AMOUNT</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT TERMS</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CHARGING</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT STATUS</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody id="expenseManilaTableBody">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Local Procurement Table -->
                <div class="card">
                    <div style="margin-bottom: 16px;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 4px;">Local Procurement (Replenishment)</h3>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">Grouped by Reple No + Reple Category per Month/Status</div>
                    </div>
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                                <thead style="background: var(--bg-body);">
                                    <tr>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REPLE NO</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REPLE CATEGORY</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT DATE</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">MONTH</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">ACTUAL AMOUNT</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT TERMS</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">CHARGING</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">PAYMENT STATUS</th>
                                        <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody id="expenseLocalTableBody">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            populateExpenseMonthFilter();
            renderExpenseDashboard();
        };


        // --- Look Ahead Logic ---
        let lookAheadForecasts = [];
        let currentForecastId = null;
        let forecastLineItems = [];
        let forecastExpenseLogs = [];

        window.renderLookAheadView = function() {
            if (!currentProjectId) return;
            currentView = 'look-ahead';
            updateSubNavVisibility();
            
            if (currentForecastId) {
                renderForecastDetail(currentForecastId);
            } else {
                renderForecastList();
            }
        };

        window.renderForecastList = function() {
            const projectForecasts = lookAheadForecasts.filter(f => f.projectId === currentProjectId).sort((a, b) => b.id - a.id);
            
            const getStatusBadge = (status) => {
                switch(status) {
                    case 'Draft': return '<span style="background: var(--badge-bg-gray); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Draft</span>';
                    case 'Submitted': return '<span style="background: var(--badge-bg-orange); color: var(--badge-text-orange); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Submitted</span>';
                    case 'Approved': return '<span style="background: var(--badge-bg-green); color: var(--badge-text-green); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Approved</span>';
                    case 'Archived': return '<span style="background: #f3e8ff; color: #9333ea; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Archived</span>';
                    default: return '';
                }
            };

            let listHtml = projectForecasts.map(f => `
                <div class="card" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s;" onclick="viewForecast(${f.id})" onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-main);">${f.period}</div>
                            ${getStatusBadge(f.status)}
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${f.version}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Created on ${f.dateCreated} by ${f.createdBy || 'User'}</div>
                    </div>
                    <div style="display: flex; gap: 24px; text-align: right;">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Starting Balance</div>
                            <div style="font-weight: 600; color: #3b82f6;">₱${f.startingBalance.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Cash Remaining</div>
                            <div style="font-weight: 600; color: ${f.cashRemaining < 0 ? 'var(--badge-text-red)' : '#22c55e'};">₱${f.cashRemaining.toLocaleString('en-PH', {minimumFractionDigits: 2})}</div>
                        </div>
                        <div style="display: flex; align-items: center; color: var(--text-muted);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                    </div>
                </div>
            `).join('');

            if (projectForecasts.length === 0) {
                listHtml = `
                    <div style="text-align: center; padding: 48px 24px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
                        <div style="width: 48px; height: 48px; background: var(--bg-body); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--text-muted);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                        </div>
                        <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">No Forecasts Yet</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">Create your first weekly cash forecast to start tracking.</p>
                        <button class="btn btn-primary" onclick="openForecastModal()">Create First Forecast</button>
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div style="display: flex; gap: 16px;">
                        <input type="text" class="form-control" placeholder="Search by period, ID, or prep..." style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; width: 300px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
                        <select class="form-control" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
                            <option value="">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Approved">Approved</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" onclick="alert('Export functionality coming soon')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Export</button>
                        <button class="btn btn-primary" onclick="openForecastModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New Forecast</button>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: var(--text-main);">Forecast Archive</h2>
                    ${listHtml}
                </div>
            `;
        };

        window.viewForecast = function(id) {
            currentForecastId = id;
            renderLookAheadView();
        };

        window.backToForecastList = function() {
            currentForecastId = null;
            renderLookAheadView();
        };

        window.updateForecastStatus = function(id, newStatus) {
            const f = lookAheadForecasts.find(x => x.id === id);
            if (f) {
                f.status = newStatus;
                
                const now = new Date().toLocaleString();
                if (newStatus === 'Submitted') {
                    f.signatures.preparedBy = 'Current User (Acct Asst)';
                    f.signatures.preparedAt = now;
                } else if (newStatus === 'Approved') {
                    f.signatures.checkedBy = 'Deputy PM';
                    f.signatures.checkedAt = now;
                    f.signatures.approvedBy = 'Project Manager';
                    f.signatures.approvedAt = now;
                    
                    // Archive others
                    lookAheadForecasts.forEach(other => {
                        if (other.projectId === currentProjectId && other.id !== id && other.status === 'Approved') {
                            other.status = 'Archived';
                        }
                    });
                }
                renderLookAheadView();
            }
        };

        window.inlineEditForecastItem = function(id, itemId, field, value) {
            const f = lookAheadForecasts.find(x => x.id === id);
            if (f && f.status === 'Draft') {
                const item = f.items.find(i => i.id === itemId);
                if (item) {
                    if (['currentWeek', 'week1', 'week2', 'week3', 'week4'].includes(field)) {
                        item[field] = parseFloat(value) || 0;
                    } else {
                        item[field] = value;
                    }
                    // Recalculate cash remaining
                    let totalOutflows = 0;
                    f.items.forEach(i => {
                        totalOutflows += (i.currentWeek || 0) + (i.week1 || 0) + (i.week2 || 0) + (i.week3 || 0) + (i.week4 || 0);
                    });
                    f.cashRemaining = f.startingBalance + f.expectedReplenishments - totalOutflows;
                    renderLookAheadView();
                }
            }
        };

        window.renderForecastDetail = function(id) {
            const f = lookAheadForecasts.find(x => x.id === id);
            if (!f) return backToForecastList();

            const isDraft = f.status === 'Draft';
            const formatCurrency = (val) => '₱' + (val || 0).toLocaleString('en-PH', {minimumFractionDigits: 0, maximumFractionDigits: 0});
            const formatCurrencyDec = (val) => '₱' + (val || 0).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

            // Calculate totals
            let totalOutflows = 0;
            let currentWeekTotal = 0, week1Total = 0, week2Total = 0, week3Total = 0, week4Total = 0;

            f.items.forEach(item => {
                totalOutflows += (item.currentWeek || 0) + (item.week1 || 0) + (item.week2 || 0) + (item.week3 || 0) + (item.week4 || 0);
                currentWeekTotal += (item.currentWeek || 0);
                week1Total += (item.week1 || 0);
                week2Total += (item.week2 || 0);
                week3Total += (item.week3 || 0);
                week4Total += (item.week4 || 0);
            });

            const cashRemaining = f.startingBalance + f.expectedReplenishments - totalOutflows;
            const revolvingFund = f.revolvingFund || 2300000;
            const fundUtilization = (totalOutflows / revolvingFund) * 100;

            // Group items by category
            const categories = ['Manpower Payroll & Allowances', 'Procurement and Admin Expenses', 'Unliquidated & On-Hold Expenses'];
            
            let tableHtml = '';
            categories.forEach(cat => {
                const catItems = f.items.filter(i => i.category === cat);
                
                let catCurrentWeek = 0, catWeek1 = 0, catWeek2 = 0, catWeek3 = 0, catWeek4 = 0;
                catItems.forEach(i => {
                    catCurrentWeek += (i.currentWeek || 0);
                    catWeek1 += (i.week1 || 0);
                    catWeek2 += (i.week2 || 0);
                    catWeek3 += (i.week3 || 0);
                    catWeek4 += (i.week4 || 0);
                });

                tableHtml += `
                    <tr style="background: var(--bg-body); border-bottom: 1px solid var(--border-color);">
                        <td colspan="2" style="padding: 12px 16px; font-weight: 700; color: var(--text-main);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> ${cat}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${catCurrentWeek ? formatCurrency(catCurrentWeek) : '-'}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${catWeek1 ? formatCurrency(catWeek1) : '-'}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${catWeek2 ? formatCurrency(catWeek2) : '-'}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${catWeek3 ? formatCurrency(catWeek3) : '-'}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${catWeek4 ? formatCurrency(catWeek4) : '-'}</td>
                        <td style="padding: 12px 16px;"></td>
                    </tr>
                `;

                if (catItems.length === 0) {
                    tableHtml += `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 12px 16px; color: var(--text-muted); font-size: 0.85rem;">No records</td>
                            <td colspan="7"></td>
                        </tr>
                    `;
                } else {
                    catItems.forEach(item => {
                        const renderCell = (field, val) => {
                            if (isDraft) {
                                return `<input type="number" value="${val || ''}" onchange="inlineEditForecastItem(${f.id}, ${item.id}, '${field}', this.value)" style="width: 100%; text-align: right; border: 1px solid transparent; background: transparent; padding: 4px; border-radius: 4px;" onfocus="this.style.borderColor='var(--primary-color)'; this.style.background='var(--bg-body)';" onblur="this.style.borderColor='transparent'; this.style.background='transparent';">`;
                            }
                            return val ? formatCurrency(val) : '-';
                        };

                        const renderTextCell = (field, val) => {
                            if (isDraft) {
                                return `<input type="text" value="${val || ''}" onchange="inlineEditForecastItem(${f.id}, ${item.id}, '${field}', this.value)" style="width: 100%; border: 1px solid transparent; background: transparent; padding: 4px; border-radius: 4px;" onfocus="this.style.borderColor='var(--primary-color)'; this.style.background='var(--bg-body)';" onblur="this.style.borderColor='transparent'; this.style.background='transparent';">`;
                            }
                            return val || '-';
                        };

                        tableHtml += `
                            <tr style="border-bottom: 1px solid var(--border-color); background: ${cat === 'Procurement and Admin Expenses' ? 'var(--badge-bg-orange)' : 'transparent'};">
                                <td style="padding: 12px 16px; font-size: 0.85rem;">${renderTextCell('description', item.description)}</td>
                                <td style="padding: 12px 16px; font-size: 0.85rem;">${renderTextCell('details', item.details)}</td>
                                <td style="padding: 12px 16px; text-align: right; font-size: 0.85rem;">${renderCell('currentWeek', item.currentWeek)}</td>
                                <td style="padding: 12px 16px; text-align: right; font-size: 0.85rem;">${renderCell('week1', item.week1)}</td>
                                <td style="padding: 12px 16px; text-align: right; font-size: 0.85rem;">${renderCell('week2', item.week2)}</td>
                                <td style="padding: 12px 16px; text-align: right; font-size: 0.85rem;">${renderCell('week3', item.week3)}</td>
                                <td style="padding: 12px 16px; text-align: right; font-size: 0.85rem;">${renderCell('week4', item.week4)}</td>
                                <td style="padding: 12px 16px; font-size: 0.85rem;">${renderTextCell('remarks', item.remarks)}</td>
                            </tr>
                        `;
                    });
                }
            });

            // Summary Row
            tableHtml += `
                <tr style="background: var(--bg-body); border-bottom: 1px solid var(--border-color);">
                    <td colspan="2" style="padding: 12px 16px; font-weight: 800; color: var(--text-main);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> SUMMARY</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800;">${currentWeekTotal ? formatCurrency(currentWeekTotal) : '-'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800;">${week1Total ? formatCurrency(week1Total) : '-'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800;">${week2Total ? formatCurrency(week2Total) : '-'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800;">${week3Total ? formatCurrency(week3Total) : '-'}</td>
                    <td style="padding: 12px 16px; text-align: right; font-weight: 800;">${week4Total ? formatCurrency(week4Total) : '-'}</td>
                    <td style="padding: 12px 16px;"></td>
                </tr>
            `;

            // Detailed Expense Logs HTML
            let expenseLogsHtml = '';
            if (f.expenseLogs && f.expenseLogs.length > 0) {
                expenseLogsHtml = `
                    <div class="card" style="margin-bottom: 24px; padding: 0; overflow-x: auto;">
                        <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="font-size: 1.1rem; font-weight: 800;">Detailed Expense Logs</h3>
                            <div style="display: flex; gap: 8px;">
                                <select class="form-control" style="padding: 4px 8px; font-size: 0.85rem;">
                                    <option>All Categories</option>
                                    <option>Materials</option>
                                    <option>Admin</option>
                                    <option>Freight</option>
                                </select>
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: var(--bg-body);">
                                <tr>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">SUPPLIER / VENDOR</th>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">ITEM DESCRIPTION</th>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right;">AMOUNT (₱)</th>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">DELIVERY STATUS</th>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">PAYMENT STATUS</th>
                                    <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">WEEK ALLOCATED</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${f.expenseLogs.map(log => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 12px 16px; font-size: 0.85rem; font-weight: 600;">${log.supplier}</td>
                                        <td style="padding: 12px 16px; font-size: 0.85rem;">${log.description}</td>
                                        <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right; font-weight: 600;">${formatCurrencyDec(log.amount)}</td>
                                        <td style="padding: 12px 16px; font-size: 0.85rem;">
                                            <span style="padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; background: ${log.deliveryStatus === 'Delivered' ? 'var(--badge-bg-green)' : 'var(--badge-bg-orange)'}; color: ${log.deliveryStatus === 'Delivered' ? 'var(--badge-text-green)' : 'var(--badge-text-orange)'};">${log.deliveryStatus}</span>
                                        </td>
                                        <td style="padding: 12px 16px; font-size: 0.85rem;">
                                            <span style="padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; background: ${log.paymentStatus === 'Paid' ? 'var(--badge-bg-green)' : '#fee2e2'}; color: ${log.paymentStatus === 'Paid' ? 'var(--badge-text-green)' : 'var(--badge-text-red)'};">${log.paymentStatus}</span>
                                        </td>
                                        <td style="padding: 12px 16px; font-size: 0.85rem; color: var(--text-muted);">${log.weekAllocated}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Action Buttons based on status
            let actionButtonsHtml = '';
            if (f.status === 'Draft') {
                actionButtonsHtml = `
                    <button class="btn btn-primary" onclick="updateForecastStatus(${f.id}, 'Submitted')">Submit for Review</button>
                `;
            } else if (f.status === 'Submitted') {
                actionButtonsHtml = `
                    <button class="btn btn-secondary" style="color: var(--badge-text-red); border-color: var(--badge-border-red);" onclick="updateForecastStatus(${f.id}, 'Draft')">Return to Draft</button>
                    <button class="btn btn-primary" onclick="updateForecastStatus(${f.id}, 'Approved')" style="background: var(--badge-text-green);">Approve Forecast</button>
                `;
            } else if (f.status === 'Approved') {
                actionButtonsHtml = `
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--badge-text-green); font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Approved & Active
                    </div>
                    <button class="btn btn-secondary" onclick="openForecastModal(${f.id})">Create Revised Version</button>
                `;
            }

            contentArea.innerHTML = `
                <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-secondary" onclick="backToForecastList()" style="padding: 6px 12px; font-size: 0.85rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m15 18-6-6 6-6"/></svg> Back to Archive</button>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        ${actionButtonsHtml}
                        <button class="btn btn-secondary" style="color: #3b82f6; border-color: #bfdbfe; background: #eff6ff;">Export PDF</button>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${f.period}</h2>
                            <span style="background: ${f.status === 'Draft' ? 'var(--badge-bg-gray)' : f.status === 'Submitted' ? 'var(--badge-bg-orange)' : f.status === 'Approved' ? 'var(--badge-bg-green)' : '#f3e8ff'}; color: ${f.status === 'Draft' ? 'var(--badge-text-gray)' : f.status === 'Submitted' ? 'var(--badge-text-orange)' : f.status === 'Approved' ? 'var(--badge-text-green)' : '#9333ea'}; padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; font-weight: 700;">${f.status}</span>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">${f.version}</span>
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Report ID: ${f.id} | Generated: ${f.dateCreated}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="card" style="padding: 16px; border-top: 4px solid #3b82f6;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Revolving Fund</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${formatCurrencyDec(revolvingFund)}</div>
                    </div>
                    <div class="card" style="padding: 16px; border-top: 4px solid #8b5cf6;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Starting Balance</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${formatCurrencyDec(f.startingBalance)}</div>
                    </div>
                    <div class="card" style="padding: 16px; border-top: 4px solid #f59e0b;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Total Outflows</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${formatCurrencyDec(totalOutflows)}</div>
                        <div style="font-size: 0.75rem; color: ${fundUtilization > 100 ? 'var(--badge-text-red)' : 'var(--text-muted)'}; margin-top: 4px;">${fundUtilization.toFixed(1)}% of Fund</div>
                    </div>
                    <div class="card" style="padding: 16px; border-top: 4px solid #14b8a6;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Expected Inflows</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${formatCurrencyDec(f.expectedReplenishments)}</div>
                    </div>
                    <div class="card" style="padding: 16px; border-top: 4px solid ${cashRemaining < 0 ? 'var(--badge-text-red)' : '#22c55e'};">
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Closing Balance</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: ${cashRemaining < 0 ? 'var(--badge-text-red)' : '#22c55e'};">${formatCurrencyDec(cashRemaining)}</div>
                    </div>
                </div>

                ${isDraft ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; color: var(--primary); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 24px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> <strong>Draft Mode:</strong> You can click directly on the table cells below to edit amounts and descriptions. Changes are saved automatically.</div>` : ''}

                <div class="card" style="margin-bottom: 24px; padding: 0; overflow-x: auto;">
                    <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; font-weight: 800;">Weekly Breakdown</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: var(--bg-body); position: sticky; top: -1px; z-index: 100;">
                            <tr>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); width: 20%;">PARTICULARS</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); width: 15%;">DETAILS</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; width: 10%;">CURRENT WEEK</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; width: 10%;">1ST WEEK</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; width: 10%;">2ND WEEK</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; width: 10%;">3RD WEEK</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; width: 10%;">4TH WEEK</th>
                                <th style="padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); width: 15%;">REMARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableHtml}
                        </tbody>
                    </table>
                </div>

                ${expenseLogsHtml}

                <div class="card" style="margin-bottom: 24px;">
                    <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; text-transform: uppercase;">Approval & Sign-Off</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: ${f.signatures.preparedBy ? '#f8fafc' : 'transparent'};">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">PREPARED BY</div>
                            ${f.signatures.preparedBy ? `
                                <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem; font-family: 'Brush Script MT', cursive;">${f.signatures.preparedBy}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Accounting Assistant</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">${f.signatures.preparedAt}</div>
                            ` : `<div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Pending Submission</div>`}
                        </div>
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: ${f.signatures.checkedBy ? '#f8fafc' : 'transparent'};">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">CHECKED & REVIEWED BY</div>
                            ${f.signatures.checkedBy ? `
                                <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem; font-family: 'Brush Script MT', cursive;">${f.signatures.checkedBy}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Deputy Project Manager</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">${f.signatures.checkedAt}</div>
                            ` : `<div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Pending Approval</div>`}
                        </div>
                        <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; background: ${f.signatures.approvedBy ? 'var(--badge-bg-green)' : 'transparent'};">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">APPROVED BY</div>
                            ${f.signatures.approvedBy ? `
                                <div style="font-weight: 700; color: var(--badge-text-green); font-size: 1.1rem; font-family: 'Brush Script MT', cursive;">${f.signatures.approvedBy}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Project Manager</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">${f.signatures.approvedAt}</div>
                            ` : `<div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Pending Approval</div>`}
                        </div>
                    </div>
                </div>
            `;
        };


        // --- Wizard State ---
        let currentWizardStep = 1;
        let wizardData = {
            projectName: '',
            reportDate: '',
            referenceDate: '',
            dataSource: 'blank',
            cloneId: '',
            revolvingFund: 0,
            startingCashOnHand: 0,
            startingCashOnBank: 0,
            expectedReplenishments: { payroll: 0, procurement: 0, admin: 0 },
            lateFunding: 0,
            allocations: {
                manpower: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                procurement: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                admin: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                unliquidated: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                replenishments: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 }
            },
            procurementItems: [],
            adminItems: [],
            manpowerItems: []
        };

        window.openForecastModal = function(cloneId = null) {
            currentWizardStep = 1;
            
            // Reset data
            wizardData = {
                projectName: projects.find(p => p.id === currentProjectId)?.name || '',
                reportDate: new Date().toISOString().split('T')[0],
                referenceDate: new Date().toISOString().split('T')[0],
                dataSource: cloneId ? 'clone' : 'blank',
                cloneId: cloneId || '',
                revolvingFund: 2300000,
                startingCashOnHand: 0,
                startingCashOnBank: 0,
                expectedReplenishments: { payroll: 0, procurement: 0, admin: 0 },
                lateFunding: 0,
                allocations: {
                    manpower: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                    procurement: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                    admin: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                    unliquidated: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 },
                    replenishments: { current: 0, w1: 0, w2: 0, w3: 0, w4: 0 }
                },
                procurementItems: [],
                adminItems: [],
                manpowerItems: []
            };

            if (cloneId) {
                const source = lookAheadForecasts.find(f => f.id === cloneId);
                if (source) {
                    wizardData.revolvingFund = source.revolvingFund || 2300000;
                    wizardData.startingCashOnHand = source.startingBalance || 0;
                    // Map items back to wizard structure...
                    // For simplicity in this demo, we just set the basic info
                }
            }

            renderWizardStep();
            document.getElementById('forecastModal').classList.add('active');
        };

        window.closeForecastModal = function() {
            document.getElementById('forecastModal').classList.remove('active');
        };

        window.nextWizardStep = function() {
            if (currentWizardStep < 7) {
                currentWizardStep++;
                renderWizardStep();
            }
        };

        window.prevWizardStep = function() {
            if (currentWizardStep > 1) {
                currentWizardStep--;
                renderWizardStep();
            }
        };

        window.updateWizardData = function(field, value, category = null, subfield = null) {
            if (category && subfield) {
                wizardData[category][subfield][field] = parseFloat(value) || 0;
            } else if (category) {
                wizardData[category][field] = parseFloat(value) || 0;
            } else {
                wizardData[field] = value;
            }
            
            if (currentWizardStep === 1 && field === 'referenceDate') {
                renderWizardStep(); // Re-render to update calculated dates
            } else if (currentWizardStep === 3 || currentWizardStep === 5) {
                renderWizardStep(); // Re-render to update calculations
            }
        };

        window.addDetailedItem = function(type) {
            const newItem = { id: Date.now(), description: '', amount: 0, week: 'current', remarks: '' };
            if (type === 'procurement') {
                newItem.supplier = '';
                newItem.deliveryStatus = 'Undelivered';
                newItem.paymentStatus = 'Unpaid';
                wizardData.procurementItems.push(newItem);
            } else if (type === 'admin') {
                newItem.expenseType = '';
                newItem.status = 'Pending';
                wizardData.adminItems.push(newItem);
            }
            renderWizardStep();
        };

        window.removeDetailedItem = function(type, id) {
            if (type === 'procurement') {
                wizardData.procurementItems = wizardData.procurementItems.filter(i => i.id !== id);
            } else if (type === 'admin') {
                wizardData.adminItems = wizardData.adminItems.filter(i => i.id !== id);
            }
            renderWizardStep();
        };

        window.updateDetailedItem = function(type, id, field, value) {
            let items = type === 'procurement' ? wizardData.procurementItems : wizardData.adminItems;
            let item = items.find(i => i.id === id);
            if (item) {
                item[field] = (field === 'amount') ? (parseFloat(value) || 0) : value;
            }
            renderWizardStep();
        };

        window.saveWizardForecast = function(isSubmit = false) {
            // Convert wizard data back to forecast structure
            const totalOutflows = 
                Object.values(wizardData.allocations.manpower).reduce((a,b)=>a+b,0) +
                Object.values(wizardData.allocations.procurement).reduce((a,b)=>a+b,0) +
                Object.values(wizardData.allocations.admin).reduce((a,b)=>a+b,0) +
                Object.values(wizardData.allocations.unliquidated).reduce((a,b)=>a+b,0);
                
            const totalInflows = 
                wizardData.expectedReplenishments.payroll + 
                wizardData.expectedReplenishments.procurement + 
                wizardData.expectedReplenishments.admin + 
                wizardData.lateFunding;

            const items = [];
            
            // Map allocations to items
            const mapAlloc = (catName, alloc) => {
                if (Object.values(alloc).some(v => v > 0)) {
                    items.push({
                        id: Date.now() + Math.random(),
                        category: catName,
                        description: 'Weekly Allocation',
                        details: '',
                        remarks: '',
                        currentWeek: alloc.current,
                        week1: alloc.w1,
                        week2: alloc.w2,
                        week3: alloc.w3,
                        week4: alloc.w4
                    });
                }
            };
            
            mapAlloc('Manpower Payroll & Allowances', wizardData.allocations.manpower);
            mapAlloc('Procurement and Admin Expenses', wizardData.allocations.procurement);
            mapAlloc('Procurement and Admin Expenses', wizardData.allocations.admin);
            mapAlloc('Unliquidated & On-Hold Expenses', wizardData.allocations.unliquidated);

            // Map detailed items to expenseLogs
            const expenseLogs = [];
            wizardData.procurementItems.forEach(i => {
                expenseLogs.push({
                    supplier: i.supplier,
                    description: i.description,
                    amount: i.amount,
                    deliveryStatus: i.deliveryStatus,
                    paymentStatus: i.paymentStatus,
                    weekAllocated: i.week
                });
            });
            wizardData.adminItems.forEach(i => {
                expenseLogs.push({
                    supplier: i.expenseType,
                    description: i.description,
                    amount: i.amount,
                    deliveryStatus: 'N/A',
                    paymentStatus: i.status,
                    weekAllocated: i.week
                });
            });

            const newForecast = {
                id: Date.now(),
                projectId: currentProjectId,
                dateCreated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                period: `FOR ${wizardData.referenceDate}`,
                status: isSubmit ? 'Submitted' : 'Draft',
                version: 'v1.0',
                startingBalance: wizardData.startingCashOnHand + wizardData.startingCashOnBank,
                expectedReplenishments: totalInflows,
                revolvingFund: wizardData.revolvingFund,
                cashRemaining: (wizardData.startingCashOnHand + wizardData.startingCashOnBank) + totalInflows - totalOutflows,
                items: items,
                expenseLogs: expenseLogs,
                signatures: {
                    preparedBy: isSubmit ? 'Current User (Acct Asst)' : null, 
                    preparedAt: isSubmit ? new Date().toLocaleString() : null,
                    checkedBy: null, checkedAt: null,
                    approvedBy: null, approvedAt: null
                }
            };

            lookAheadForecasts.push(newForecast);
            closeForecastModal();
            currentForecastId = newForecast.id;
            renderLookAheadView();
        };

        window.renderWizardStep = function() {
            const body = document.getElementById('wizardBody');
            if (!body) return;

            const formatCurrency = (val) => '₱' + (val || 0).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

            let html = '';
            
            // Progress Stepper
            html += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 24px; position: relative;">
                    <div style="position: absolute; top: 12px; left: 0; right: 0; height: 2px; background: var(--border-color); z-index: 0;"></div>
                    ${[1,2,3,4,5,6,7].map(step => `
                        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentWizardStep >= step ? 'var(--primary-color)' : 'var(--bg-body)'}; border: 2px solid ${currentWizardStep >= step ? 'var(--primary-color)' : 'var(--border-color)'}; color: ${currentWizardStep >= step ? 'var(--bg-surface)' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">${step}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            if (currentWizardStep === 1) {
                // Calculate dates based on referenceDate
                const refDate = new Date(wizardData.referenceDate || new Date());
                const addDays = (date, days) => {
                    const d = new Date(date);
                    d.setDate(d.getDate() + days);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                };

                html += `
                    <h3 style="margin-bottom: 16px;">Step 1: Basic Information & Period Setup</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label>Project Name</label>
                            <input type="text" class="form-control" value="${wizardData.projectName}" oninput="updateWizardData('projectName', this.value)">
                        </div>
                        <div class="form-group">
                            <label>Report Date</label>
                            <input type="date" class="form-control" value="${wizardData.reportDate}" oninput="updateWizardData('reportDate', this.value)">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Reference Date ($U$3 equivalent) - Anchor for formulas</label>
                            <input type="date" class="form-control" value="${wizardData.referenceDate}" oninput="updateWizardData('referenceDate', this.value)">
                        </div>
                    </div>
                    
                    <div class="card" style="background: var(--bg-body); margin-bottom: 24px;">
                        <h4 style="font-size: 0.9rem; margin-bottom: 12px;">Auto-Calculated Periods</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                            <div><strong>Current Week:</strong> FOR ${addDays(refDate, -7)} to ${addDays(refDate, -1)}</div>
                            <div><strong>1st Week:</strong> FOR ${addDays(refDate, 0)} to ${addDays(refDate, 6)}</div>
                            <div><strong>2nd Week:</strong> FOR ${addDays(refDate, 7)} to ${addDays(refDate, 13)}</div>
                            <div><strong>3rd Week:</strong> FOR ${addDays(refDate, 14)} to ${addDays(refDate, 20)}</div>
                            <div><strong>4th Week:</strong> FOR ${addDays(refDate, 21)} to ${addDays(refDate, 27)}</div>
                            <div style="grid-column: span 2; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                                <strong>Release Date:</strong> ${addDays(refDate, 5)} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Replenishment Date:</strong> ${addDays(refDate, 5)}
                            </div>
                        </div>
                    </div>
                `;
            } else if (currentWizardStep === 2) {
                html += `
                    <h3 style="margin-bottom: 16px;">Step 2: Data Source Selection</h3>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <label style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid ${wizardData.dataSource === 'blank' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); cursor: pointer; background: ${wizardData.dataSource === 'blank' ? '#eff6ff' : 'transparent'};">
                            <input type="radio" name="dataSource" value="blank" ${wizardData.dataSource === 'blank' ? 'checked' : ''} onchange="updateWizardData('dataSource', this.value)" style="margin-top: 4px;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">Blank Template</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">Starts with zero values. Uses default revolving fund (₱2,300,000.00).</div>
                            </div>
                        </label>
                        
                        <label style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid ${wizardData.dataSource === 'clone' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); cursor: pointer; background: ${wizardData.dataSource === 'clone' ? '#eff6ff' : 'transparent'};">
                            <input type="radio" name="dataSource" value="clone" ${wizardData.dataSource === 'clone' ? 'checked' : ''} onchange="updateWizardData('dataSource', this.value)" style="margin-top: 4px;">
                            <div style="flex-grow: 1;">
                                <div style="font-weight: 600; margin-bottom: 4px;">Clone Previous Forecast</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Copies all line items, amounts, suppliers, remarks. Resets status to Draft.</div>
                                <select class="form-control" ${wizardData.dataSource !== 'clone' ? 'disabled' : ''} onchange="updateWizardData('cloneId', this.value)">
                                    <option value="">Select forecast to clone...</option>
                                    ${lookAheadForecasts.map(f => `<option value="${f.id}" ${wizardData.cloneId == f.id ? 'selected' : ''}>${f.period} (${f.status})</option>`).join('')}
                                </select>
                            </div>
                        </label>
                        
                        <label style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid ${wizardData.dataSource === 'carry' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); cursor: pointer; background: ${wizardData.dataSource === 'carry' ? '#eff6ff' : 'transparent'};">
                            <input type="radio" name="dataSource" value="carry" ${wizardData.dataSource === 'carry' ? 'checked' : ''} onchange="updateWizardData('dataSource', this.value)" style="margin-top: 4px;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">Carry Forward Unliquidated/On-Hold Only</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">Automatically pulls unliquidated and on-hold expenses from previous closing. Fresh start for new payroll/procurement.</div>
                            </div>
                        </label>
                    </div>
                `;
            } else if (currentWizardStep === 3) {
                const renderAllocRow = (label, key, isAuto = false) => `
                    <tr>
                        <td style="padding: 8px; font-size: 0.85rem; font-weight: 600;">${label}</td>
                        ${['current', 'w1', 'w2', 'w3', 'w4'].map(w => `
                            <td style="padding: 4px;">
                                <input type="number" class="form-control" style="padding: 4px; font-size: 0.8rem; text-align: right;" 
                                    value="${wizardData.allocations[key][w] || ''}" 
                                    ${isAuto ? 'readonly style="background: var(--badge-bg-gray);"' : ''}
                                    oninput="updateWizardData('${w}', this.value, 'allocations', '${key}')">
                            </td>
                        `).join('')}
                    </tr>
                `;

                html += `
                    <h3 style="margin-bottom: 16px;">Step 3: Budget Allocation Inputs</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label>Total Revolving Fund</label>
                            <input type="number" class="form-control" value="${wizardData.revolvingFund}" oninput="updateWizardData('revolvingFund', this.value)">
                        </div>
                        <div class="form-group">
                            <label>Starting Cash on Hand</label>
                            <input type="number" class="form-control" value="${wizardData.startingCashOnHand}" oninput="updateWizardData('startingCashOnHand', this.value)">
                        </div>
                        <div class="form-group">
                            <label>Starting Cash on Bank</label>
                            <input type="number" class="form-control" value="${wizardData.startingCashOnBank}" oninput="updateWizardData('startingCashOnBank', this.value)">
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: var(--bg-body);">
                                <tr>
                                    <th style="padding: 8px; text-align: left; font-size: 0.75rem;">CATEGORY</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.75rem;">CURRENT WEEK</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.75rem;">1ST WEEK</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.75rem;">2ND WEEK</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.75rem;">3RD WEEK</th>
                                    <th style="padding: 8px; text-align: right; font-size: 0.75rem;">4TH WEEK</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderAllocRow('Manpower Payroll', 'manpower')}
                                ${renderAllocRow('Procurement Expenses', 'procurement')}
                                ${renderAllocRow('Admin Expenses', 'admin')}
                                ${renderAllocRow('Unliquidated/On-Hold', 'unliquidated', true)}
                                ${renderAllocRow('Replenishments', 'replenishments')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else if (currentWizardStep === 4) {
                html += `
                    <h3 style="margin-bottom: 16px;">Step 4: Detailed Line Items</h3>
                    
                    <div class="card" style="margin-bottom: 16px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0;">A. PROCUREMENT EXPENSES</h4>
                            <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="addDetailedItem('procurement')">+ Add Item</button>
                        </div>
                        ${wizardData.procurementItems.length === 0 ? '<div style="font-size: 0.85rem; color: var(--text-muted);">No items added.</div>' : ''}
                        ${wizardData.procurementItems.map(item => `
                            <div style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;">
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('procurement', ${item.id}, 'supplier', this.value)">
                                    <option value="">Select Supplier...</option>
                                    <option value="Faderon's Hardware" ${item.supplier === "Faderon's Hardware" ? 'selected' : ''}>Faderon's Hardware</option>
                                    <option value="Chiong Giok" ${item.supplier === "Chiong Giok" ? 'selected' : ''}>Chiong Giok</option>
                                    <option value="De Juan One Stop Shop" ${item.supplier === "De Juan One Stop Shop" ? 'selected' : ''}>De Juan One Stop Shop</option>
                                </select>
                                <input type="text" class="form-control" style="padding: 4px; font-size: 0.8rem;" placeholder="Description" value="${item.description}" oninput="updateDetailedItem('procurement', ${item.id}, 'description', this.value)">
                                <input type="number" class="form-control" style="padding: 4px; font-size: 0.8rem;" placeholder="Amount" value="${item.amount || ''}" oninput="updateDetailedItem('procurement', ${item.id}, 'amount', this.value)">
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('procurement', ${item.id}, 'week', this.value)">
                                    <option value="current" ${item.week === 'current' ? 'selected' : ''}>Current</option>
                                    <option value="w1" ${item.week === 'w1' ? 'selected' : ''}>1st Week</option>
                                    <option value="w2" ${item.week === 'w2' ? 'selected' : ''}>2nd Week</option>
                                </select>
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('procurement', ${item.id}, 'deliveryStatus', this.value)">
                                    <option value="Delivered" ${item.deliveryStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="Undelivered" ${item.deliveryStatus === 'Undelivered' ? 'selected' : ''}>Undelivered</option>
                                    <option value="Partial" ${item.deliveryStatus === 'Partial' ? 'selected' : ''}>Partial</option>
                                </select>
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('procurement', ${item.id}, 'paymentStatus', this.value)">
                                    <option value="Paid & Liquidated" ${item.paymentStatus === 'Paid & Liquidated' ? 'selected' : ''}>Paid</option>
                                    <option value="Unliquidated" ${item.paymentStatus === 'Unliquidated' ? 'selected' : ''}>Unliquidated</option>
                                    <option value="On-Hold" ${item.paymentStatus === 'On-Hold' ? 'selected' : ''}>On-Hold</option>
                                </select>
                                <button type="button" onclick="removeDetailedItem('procurement', ${item.id})" style="background: none; border: none; color: var(--danger); cursor: pointer;">&times;</button>
                            </div>
                        `).join('')}
                    </div>

                    <div class="card" style="margin-bottom: 16px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0;">B. ADMIN EXPENSES</h4>
                            <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="addDetailedItem('admin')">+ Add Item</button>
                        </div>
                        ${wizardData.adminItems.length === 0 ? '<div style="font-size: 0.85rem; color: var(--text-muted);">No items added.</div>' : ''}
                        ${wizardData.adminItems.map(item => `
                            <div style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;">
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('admin', ${item.id}, 'expenseType', this.value)">
                                    <option value="">Select Type...</option>
                                    <option value="Diesel" ${item.expenseType === 'Diesel' ? 'selected' : ''}>Diesel</option>
                                    <option value="Meals & Travel" ${item.expenseType === 'Meals & Travel' ? 'selected' : ''}>Meals & Travel</option>
                                    <option value="Staff House Rental" ${item.expenseType === 'Staff House Rental' ? 'selected' : ''}>Staff House Rental</option>
                                    <option value="Electric Bill" ${item.expenseType === 'Electric Bill' ? 'selected' : ''}>Electric Bill</option>
                                </select>
                                <input type="text" class="form-control" style="padding: 4px; font-size: 0.8rem;" placeholder="Description" value="${item.description}" oninput="updateDetailedItem('admin', ${item.id}, 'description', this.value)">
                                <input type="number" class="form-control" style="padding: 4px; font-size: 0.8rem;" placeholder="Amount" value="${item.amount || ''}" oninput="updateDetailedItem('admin', ${item.id}, 'amount', this.value)">
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('admin', ${item.id}, 'week', this.value)">
                                    <option value="current" ${item.week === 'current' ? 'selected' : ''}>Current</option>
                                    <option value="w1" ${item.week === 'w1' ? 'selected' : ''}>1st Week</option>
                                    <option value="w2" ${item.week === 'w2' ? 'selected' : ''}>2nd Week</option>
                                </select>
                                <select class="form-control" style="padding: 4px; font-size: 0.8rem;" onchange="updateDetailedItem('admin', ${item.id}, 'status', this.value)">
                                    <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Paid" ${item.status === 'Paid' ? 'selected' : ''}>Paid</option>
                                </select>
                                <button type="button" onclick="removeDetailedItem('admin', ${item.id})" style="background: none; border: none; color: var(--danger); cursor: pointer;">&times;</button>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (currentWizardStep === 5) {
                const sumAlloc = (alloc) => Object.values(alloc).reduce((a,b) => a + b, 0);
                const totalManpower = sumAlloc(wizardData.allocations.manpower);
                const totalProcurement = sumAlloc(wizardData.allocations.procurement);
                const totalAdmin = sumAlloc(wizardData.allocations.admin);
                const totalUnliquidated = sumAlloc(wizardData.allocations.unliquidated);
                const totalOutflow = totalManpower + totalProcurement + totalAdmin + totalUnliquidated;

                const totalInflow = wizardData.expectedReplenishments.payroll + 
                                  wizardData.expectedReplenishments.procurement + 
                                  wizardData.expectedReplenishments.admin + 
                                  wizardData.lateFunding;

                const startingTotal = wizardData.startingCashOnHand + wizardData.startingCashOnBank;
                const closingBalance = startingTotal + totalInflow - totalOutflow;
                const remainingFund = wizardData.revolvingFund - totalOutflow;

                html += `
                    <h3 style="margin-bottom: 16px;">Step 5: Cash Flow Summary</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <h4 style="font-size: 0.9rem; margin-bottom: 12px; color: var(--danger);">CASH OUTFLOW (Cash to be Released)</h4>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;"><span>Total Manpower Payroll:</span> <strong>${formatCurrency(totalManpower)}</strong></div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;"><span>Total Procurement:</span> <strong>${formatCurrency(totalProcurement)}</strong></div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;"><span>Total Admin:</span> <strong>${formatCurrency(totalAdmin)}</strong></div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;"><span>Total Unliquidated & On-Hold:</span> <strong>${formatCurrency(totalUnliquidated)}</strong></div>
                            <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); font-weight: bold; font-size: 1rem;"><span>TOTAL OUTFLOW:</span> <span>${formatCurrency(totalOutflow)}</span></div>
                        </div>
                        
                        <div>
                            <h4 style="font-size: 0.9rem; margin-bottom: 12px; color: var(--success);">CASH INFLOWS (Replenishments)</h4>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; align-items: center;">
                                <span>Expected Replenishment - Payroll:</span> 
                                <input type="number" class="form-control" style="width: 120px; padding: 4px; text-align: right;" value="${wizardData.expectedReplenishments.payroll || ''}" oninput="updateWizardData('payroll', this.value, 'expectedReplenishments')">
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; align-items: center;">
                                <span>Expected Replenishment - Procurement:</span> 
                                <input type="number" class="form-control" style="width: 120px; padding: 4px; text-align: right;" value="${wizardData.expectedReplenishments.procurement || ''}" oninput="updateWizardData('procurement', this.value, 'expectedReplenishments')">
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; align-items: center;">
                                <span>Expected Replenishment - Admin:</span> 
                                <input type="number" class="form-control" style="width: 120px; padding: 4px; text-align: right;" value="${wizardData.expectedReplenishments.admin || ''}" oninput="updateWizardData('admin', this.value, 'expectedReplenishments')">
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; align-items: center;">
                                <span>Late Funding Adjustments:</span> 
                                <input type="number" class="form-control" style="width: 120px; padding: 4px; text-align: right;" value="${wizardData.lateFunding || ''}" oninput="updateWizardData('lateFunding', this.value)">
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); font-weight: bold; font-size: 1rem;"><span>TOTAL INFLOW:</span> <span>${formatCurrency(totalInflow)}</span></div>
                        </div>
                    </div>
                    
                    <div class="card" style="margin-top: 24px; background: var(--bg-body);">
                        <h4 style="font-size: 0.9rem; margin-bottom: 12px;">CLOSING BALANCES</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Projected Closing Balance</div>
                                <div style="font-size: 1.25rem; font-weight: bold; color: ${closingBalance < 0 ? 'var(--danger)' : 'var(--success)'};">${formatCurrency(closingBalance)}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Remaining Revolving Fund</div>
                                <div style="font-size: 1.25rem; font-weight: bold;">${formatCurrency(remainingFund)}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (currentWizardStep === 6) {
                const sumAlloc = (alloc) => Object.values(alloc).reduce((a,b) => a + b, 0);
                const totalOutflow = sumAlloc(wizardData.allocations.manpower) + sumAlloc(wizardData.allocations.procurement) + sumAlloc(wizardData.allocations.admin) + sumAlloc(wizardData.allocations.unliquidated);
                const totalInflow = wizardData.expectedReplenishments.payroll + wizardData.expectedReplenishments.procurement + wizardData.expectedReplenishments.admin + wizardData.lateFunding;
                const closingBalance = (wizardData.startingCashOnHand + wizardData.startingCashOnBank) + totalInflow - totalOutflow;

                let warnings = [];
                if (totalOutflow > wizardData.revolvingFund) {
                    warnings.push(`Total weekly expenses (${formatCurrency(totalOutflow)}) exceed revolving fund limit (${formatCurrency(wizardData.revolvingFund)})`);
                }
                if (closingBalance < 0) {
                    warnings.push(`Closing balance is negative (${formatCurrency(closingBalance)})`);
                }
                if (wizardData.dataSource !== 'carry' && sumAlloc(wizardData.allocations.unliquidated) === 0) {
                    warnings.push("Unliquidated expenses from previous period not carried forward");
                }

                html += `
                    <h3 style="margin-bottom: 16px;">Step 6: Validation & Warnings</h3>
                    
                    ${warnings.length > 0 ? `
                        <div style="background: #fef2f2; border: 1px solid var(--badge-bg-red); border-radius: var(--radius-md); padding: 16px;">
                            <h4 style="color: #b91c1c; margin-bottom: 12px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> Please review the following warnings:</h4>
                            <ul style="color: #991b1b; font-size: 0.85rem; margin: 0; padding-left: 20px;">
                                ${warnings.map(w => `<li style="margin-bottom: 4px;">${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : `
                        <div style="background: var(--badge-bg-green); border: 1px solid var(--badge-border-green); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px;">
                            <div style="color: #15803d;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>
                            <div>
                                <h4 style="color: var(--badge-text-green); margin: 0 0 4px 0; font-size: 0.9rem;">All validations passed</h4>
                                <div style="color: #15803d; font-size: 0.85rem;">Your forecast is within limits and balanced.</div>
                            </div>
                        </div>
                    `}
                `;
            } else if (currentWizardStep === 7) {
                html += `
                    <h3 style="margin-bottom: 16px;">Step 7: Approval & Submission</h3>
                    
                    <div class="card" style="background: var(--bg-body); margin-bottom: 24px;">
                        <h4 style="font-size: 0.9rem; margin-bottom: 16px; color: var(--text-muted); text-transform: uppercase;">Prepared By Section</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Name</div>
                                <div style="font-weight: 600;">Current User</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Role</div>
                                <div style="font-weight: 600;">Accounting Assistant - ${wizardData.projectName || 'STEC SANTA FE DPP'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Date</div>
                                <div style="font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            </div>
                        </div>
                        <div style="border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center; background: var(--bg-surface);">
                            <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 8px;">Digital Signature</div>
                            <div style="font-family: 'Brush Script MT', cursive; font-size: 1.5rem; color: var(--primary-color);">Current User</div>
                        </div>
                    </div>
                `;
            }

            // Footer Buttons
            html += `
                <div style="display: flex; justify-content: space-between; margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn btn-secondary" onclick="closeForecastModal()">Cancel</button>
                    <div style="display: flex; gap: 12px;">
                        ${currentWizardStep > 1 ? `<button type="button" class="btn btn-secondary" onclick="prevWizardStep()">Back</button>` : ''}
                        ${currentWizardStep < 7 ? `<button type="button" class="btn btn-primary" onclick="nextWizardStep()">Next Step</button>` : ''}
                        ${currentWizardStep === 7 ? `
                            <button type="button" class="btn btn-secondary" onclick="saveWizardForecast(false)">💾 Save as Draft</button>
                            <button type="button" class="btn btn-primary" onclick="saveWizardForecast(true)">📤 Submit for Review</button>
    
                    ` : ''}
                    </div>
                </div>
            `;

            body.innerHTML = html;
        };

        const initLookAheadModal = () => {
            if (document.getElementById('forecastModal')) return;
            const modalHtml = `
                <div class="modal-overlay" id="forecastModal">
                    <div class="modal" style="max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; padding: 0;">
                        <div class="modal-header" style="flex-shrink: 0; padding: 24px 24px 16px; border-bottom: 1px solid var(--border-color);">
                            <h2>Create New Forecast</h2>
                            <button class="close-modal" onclick="closeForecastModal()">&times;</button>
                        </div>
                        <div class="modal-body" id="wizardBody" style="overflow-y: auto; flex-grow: 1; padding: 24px;">
                            <!-- Wizard content injected here -->
                        </div>
                    </div>
                </div>
            `;
            const container = document.getElementById('legacy-vanilla-modals') || document.body;
            container.insertAdjacentHTML('beforeend', modalHtml);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLookAheadModal);
        } else {
            initLookAheadModal();
        }

        window.populateExpenseMonthFilter = function() {
            const filter = document.getElementById('expenseMonthFilter');
            if (!filter) return;
            
            const months = new Set();
            
            const processRecords = (records) => {
                records.forEach(r => {
                    if (r.projectId === currentProjectId && r.paymentMonth) {
                        months.add(r.paymentMonth);
                    }
                });
            };
            
            processRecords(manilaRecords);
            processRecords(localRecords);
            
            const sortedMonths = Array.from(months).sort((a, b) => {
                // Format is "Month - Year" e.g. "March - 2026"
                const getSortable = (str) => {
                    const parts = str.split(' - ');
                    if (parts.length !== 2) return str;
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const monthIdx = monthNames.indexOf(parts[0]);
                    return `${parts[1]}-${monthIdx.toString().padStart(2, '0')}`;
                };
                return getSortable(b).localeCompare(getSortable(a));
            });
            
            let options = '<option value="all">All Months</option>';
            sortedMonths.forEach(m => {
                options += `<option value="${m}">${m}</option>`;
            });
            
            filter.innerHTML = options;
        };

        window.renderExpenseDashboard = function() {
            const filterMonth = document.getElementById('expenseMonthFilter')?.value || 'all';
            
            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                try {
                    const date = new Date(dateStr);
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    return `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} - ${months[date.getMonth()]} - ${date.getFullYear()}`;
                } catch(e) {
                    return dateStr;
                }
            };
            
            let mnlRecords = manilaRecords.filter(r => r.projectId === currentProjectId);
            let lclRecords = localRecords.filter(r => r.projectId === currentProjectId);
            
            if (filterMonth !== 'all') {
                mnlRecords = mnlRecords.filter(r => r.paymentMonth === filterMonth);
                lclRecords = lclRecords.filter(r => r.paymentMonth === filterMonth);
            }
            
            let totalPaid = 0;
            let totalUnpaid = 0;
            
            const processTotals = (records) => {
                records.forEach(r => {
                    const amount = parseFloat(r.totalCost) || 0;
                    if (r.paymentStatus === 'Paid') {
                        totalPaid += amount;
                    } else {
                        totalUnpaid += amount;
                    }
                });
            };
            
            processTotals(mnlRecords);
            processTotals(lclRecords);
            
            const grandTotal = totalPaid + totalUnpaid;
            
            // Format currency
            const formatCurrency = (val) => '₱' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // Summary Table
            const summaryTableBody = document.getElementById('expenseSummaryTableBody');
            if (summaryTableBody) {
                let summaryHtml = '';
                
                // Group by month
                const monthTotals = {};
                const processMonthTotals = (records) => {
                    records.forEach(r => {
                        const month = r.paymentMonth || 'Unspecified';
                        if (!monthTotals[month]) monthTotals[month] = { paid: 0, unpaid: 0 };
                        const amount = parseFloat(r.totalCost) || 0;
                        if (r.paymentStatus === 'Paid') {
                            monthTotals[month].paid += amount;
                        } else {
                            monthTotals[month].unpaid += amount;
                        }
                    });
                };
                
                processMonthTotals(mnlRecords);
                processMonthTotals(lclRecords);
                
                Object.keys(monthTotals).forEach(month => {
                    const data = monthTotals[month];
                    const total = data.paid + data.unpaid;
                    summaryHtml += `
                        <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${month}</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">${formatCurrency(data.paid)}</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">${formatCurrency(data.unpaid)}</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right; font-weight: 600;">${formatCurrency(total)}</td>
                        </tr>
                    `;
                });
                
                // Add Total row
                summaryHtml += `
                    <tr style="background: var(--bg-surface); font-weight: 700;">
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">TOTAL</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">${formatCurrency(totalPaid)}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">${formatCurrency(totalUnpaid)}</td>
                        <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">${formatCurrency(grandTotal)}</td>
                    </tr>
                `;
                
                summaryTableBody.innerHTML = summaryHtml;
            }
            
            // Chart
            const chartContainer = document.getElementById('expenseChartContainer');
            if (chartContainer) {
                const maxVal = Math.max(totalPaid, totalUnpaid, 1); // Avoid division by zero
                // Round up to nearest nice number for axis
                const axisMax = Math.ceil(maxVal / 2500) * 2500;
                const paidPct = (totalPaid / axisMax) * 100;
                const unpaidPct = (totalUnpaid / axisMax) * 100;
                
                chartContainer.innerHTML = `
                    <div style="position: relative; padding-bottom: 30px; padding-left: 60px; min-height: 200px; display: flex; flex-direction: column; justify-content: center;">
                        <!-- Grid lines -->
                        <div style="position: absolute; top: 0; bottom: 30px; left: 60px; right: 0; display: flex; justify-content: space-between;">
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                            <div style="border-left: 1px solid var(--border-color); height: 100%;"></div>
                        </div>
                        
                        <!-- Bars -->
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; align-items: center; margin-bottom: 40px;">
                                <div style="width: 60px; position: absolute; left: -60px; font-size: 0.85rem; color: var(--text-main); text-align: right; padding-right: 12px;">Paid</div>
                                <div style="flex: 1; height: 40px; position: relative;">
                                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${paidPct}%; background: #3b82f6; transition: width 0.5s ease;"></div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div style="width: 60px; position: absolute; left: -60px; font-size: 0.85rem; color: var(--text-main); text-align: right; padding-right: 12px;">Unpaid</div>
                                <div style="flex: 1; height: 40px; position: relative;">
                                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${unpaidPct}%; background: #3b82f6; transition: width 0.5s ease;"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- X Axis Labels -->
                        <div style="position: absolute; bottom: 0; left: 60px; right: 0; display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
                            <span style="transform: translateX(-50%);">0</span>
                            <span style="transform: translateX(-50%);">${(axisMax / 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span style="transform: translateX(-50%);">${(axisMax * 2 / 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span style="transform: translateX(-50%);">${(axisMax * 3 / 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span style="transform: translateX(-50%);">${(axisMax * 4 / 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span style="transform: translateX(-50%);">${(axisMax * 5 / 6).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span style="transform: translateX(-50%);">${axisMax.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                    </div>
                `;
            }
            
            // Manila Table
            const manilaTableBody = document.getElementById('expenseManilaTableBody');
            if (manilaTableBody) {
                let mnlHtml = '';
                if (mnlRecords.length === 0) {
                    mnlHtml = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: var(--text-muted);">No records found.</td></tr>';
                } else {
                    mnlRecords.forEach(r => {
                        const prs = prsRecords.find(p => p.id === r.prsId);
                        const itemDesc = prs ? prs.description : 'Unknown Item';
                        
                        mnlHtml += `
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${itemDesc}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.supplier || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${formatDate(r.paymentReleased || r.paymentNeededDate)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.paymentMonth || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${formatCurrency(r.actualAmount)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.paymentTerms || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.subtaskCharging || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span class="badge ${r.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${r.paymentStatus}</span></td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.remarks || '-'}</td>
                            </tr>
                        `;
                    });
                }
                manilaTableBody.innerHTML = mnlHtml;
            }
            
            // Local Table
            const localTableBody = document.getElementById('expenseLocalTableBody');
            if (localTableBody) {
                let lclHtml = '';
                if (lclRecords.length === 0) {
                    lclHtml = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: var(--text-muted);">No records found.</td></tr>';
                } else {
                    lclRecords.forEach(r => {
                        lclHtml += `
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.repleNo || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.repleCategory || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${formatDate(r.paymentReleased || r.paymentNeededDate)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.paymentMonth || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${formatCurrency(r.actualAmount)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.paymentTerms || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.subtaskCharging || r.boqCharging || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);"><span class="badge ${r.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${r.paymentStatus}</span></td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${r.concerns || '-'}</td>
                            </tr>
                        `;
                    });
                }
                localTableBody.innerHTML = lclHtml;
            }
        };

        window.setMaterialsTab = function(tab) {
            currentMaterialsTab = tab;
            renderMaterialsView();
        };

        window.updateNewMaterialItemCode = function() {
            const dept = document.getElementById('newMaterialDepartment').value;
            let prefix = 'CIV-MAT-';
            if (dept === 'Electrical') prefix = 'ELE-MAT-';
            else if (dept === 'Mechanical') prefix = 'MEC-MAT-';
            else if (dept === 'SCADA') prefix = 'SCA-MAT-';
            
            const deptItems = materialsMasterlist.filter(item => item.department === dept);
            const nextId = deptItems.length + 1;
            
            document.getElementById('newMaterialItemCode').value = prefix + String(nextId).padStart(4, '0');
        };

        window.openNewMaterialModal = function() {
            if (!window.legacyGuardAdd('materials')) return;
            const deptItems = materialsMasterlist.filter(item => item.department === 'Civil');
            const nextId = deptItems.length + 1;
            const autoItemCode = 'CIV-MAT-' + String(nextId).padStart(4, '0');

            const modalHtml = `
                <div id="newMaterialModal" class="modal-overlay active">
                    <div class="modal" style="max-width: 600px;">
                        <div class="modal-header">
                            <div>
                                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">New Material</h2>
                                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">Add a new item to the active project inventory.</p>
                            </div>
                            <button class="close-modal" onclick="document.getElementById('newMaterialModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="form-label">Item Code</label>
                                    <input type="text" id="newMaterialItemCode" class="form-control" value="${autoItemCode}" readonly style="background-color: var(--bg-body); cursor: not-allowed;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Department</label>
                                    <select class="form-control" id="newMaterialDepartment" onchange="updateNewMaterialItemCode()">
                                        <option value="Civil">Civil</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="SCADA">SCADA</option>
                                    </select>
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label class="form-label">Item Name</label>
                                    <input type="text" class="form-control" placeholder="e.g. Portland Cement Type 1 (40kg.)">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type</label>
                                    <select class="form-control">
                                        <option>Consumable</option>
                                        <option>Non-Consumable</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Unit</label>
                                    <input type="text" class="form-control" placeholder="e.g. kg">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Min Stock</label>
                                    <input type="number" class="form-control" value="0">
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" rows="3" placeholder="Optional details"></textarea>
                                </div>
                            </div>
                            <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                                <button class="btn btn-secondary" onclick="document.getElementById('newMaterialModal').remove()">Cancel</button>
                                <button class="btn btn-primary" onclick="document.getElementById('newMaterialModal').remove()">Save Material</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };

        window.openNewTransactionModal = function() {
            if (!window.legacyGuardAdd('materials_transactions')) return;
            const prsOptions = prsRecords.map(prs => `<option value="${prs.prsNo}" data-charging="${prs.activityCharging}">${prs.prsNo}</option>`).join('');
            const itemOptions = materialsMasterlist.map(item => `<option value="${item.itemCode}">${item.itemCode} - ${item.itemName}</option>`).join('');

            const modalHtml = `
                <div id="newTransactionModal" class="modal-overlay active">
                    <div class="modal" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
                        <div class="modal-header">
                            <div>
                                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">Raw Transaction Entry</h2>
                                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">Record stock movement for the active project inventory.</p>
                            </div>
                            <button class="close-modal" onclick="document.getElementById('newTransactionModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body" style="overflow-y: auto; padding-right: 16px;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Transaction Info</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                                <div class="form-group">
                                    <label class="form-label">Date</label>
                                    <input type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Time</label>
                                    <input type="time" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Transaction Type</label>
                                    <select class="form-control">
                                        <option>IN</option>
                                        <option>OUT</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">MRS / Withdrawal No.</label>
                                    <input type="text" class="form-control" placeholder="Enter MRS / Withdrawal No.">
                                </div>
                            </div>

                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Reference Details</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                                <div class="form-group">
                                    <label class="form-label">PRS No.</label>
                                    <select class="form-control" id="transPrsNo" onchange="document.getElementById('transCharging').value = this.options[this.selectedIndex].getAttribute('data-charging') || ''">
                                        <option value="">Select PRS...</option>
                                        ${prsOptions}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Charging</label>
                                    <input type="text" class="form-control" id="transCharging" placeholder="Auto-filled from PRS" readonly style="background-color: var(--bg-body); cursor: not-allowed;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Actual Charging</label>
                                    <input type="text" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Accountability No.</label>
                                    <input type="text" class="form-control" placeholder="Enter Accountability No.">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">PO No.</label>
                                    <input type="text" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">PO Qty</label>
                                    <input type="number" class="form-control" value="0">
                                </div>
                            </div>

                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Item Details</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group" style="grid-column: span 2;">
                                    <label class="form-label">Item</label>
                                    <select class="form-control">
                                        <option value="">Select Material...</option>
                                        ${itemOptions}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Quantity</label>
                                    <input type="number" class="form-control" value="1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Type</label>
                                    <select class="form-control">
                                        <option>Select item first</option>
                                        <option>Consumable</option>
                                        <option>Non-Consumable</option>
                                    </select>
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label class="form-label">Remarks</label>
                                    <textarea class="form-control" rows="2" placeholder="Optional notes on transaction details"></textarea>
                                </div>
                            </div>
                        </div>
                        <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; background: var(--bg-surface); border-radius: 0 0 var(--radius-lg) var(--radius-lg);">
                            <button class="btn btn-secondary" onclick="document.getElementById('newTransactionModal').remove()">Cancel</button>
                            <button class="btn btn-primary" onclick="document.getElementById('newTransactionModal').remove()">Record Transaction</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };

        window.renderMaterialsView = function() {
            currentView = 'materials';
            updateSubNavVisibility();

            let contentHtml = '';

            if (currentMaterialsTab === 'dashboard') {
                const totalItems = materialsMasterlist.length;
                const lowStockItems = materialsMasterlist.filter(m => m.currentStock <= m.minStock);
                const fullyStockedItems = materialsMasterlist.filter(m => m.currentStock > m.minStock);
                
                let lowStockHtml = lowStockItems.length > 0 ? lowStockItems.map(m => `
                    <div style="padding: 16px 0; border-bottom: 1px solid var(--border-color);">
                        <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">${m.itemName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${m.itemCode} • ${m.department} • Stock: ${m.currentStock} • Status: <span style="color: var(--badge-text-orange);">Low Stock</span></div>
                    </div>
                `).join('') : '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 16px 0;">No low stock items.</div>';

                let fullyStockedHtml = fullyStockedItems.length > 0 ? fullyStockedItems.map(m => `
                    <div style="padding: 16px 0; border-bottom: 1px solid var(--border-color);">
                        <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">${m.itemName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${m.itemCode} • ${m.department} • Stock: ${m.currentStock} • Status: <span style="color: var(--badge-text-green);">Fully Stocked</span></div>
                    </div>
                `).join('') : '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 16px 0;">No fully-stocked items.</div>';

                let recentTransactionsHtml = materialsTransactions.slice(0, 5).map(t => `
                    <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">${t.itemName}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${t.date} ${t.time} • ${t.transactionType} • Qty: ${t.quantity}</div>
                        </div>
                        <div style="font-weight: 700; color: ${t.transactionType === 'IN' ? 'var(--badge-text-green)' : 'var(--badge-text-orange)'};">
                            ${t.transactionType === 'IN' ? '+' : '-'}${t.quantity}
                        </div>
                    </div>
                `).join('');

                contentHtml = `
                    <div style="margin-bottom: 24px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Inventory overview</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                            <div class="card" style="padding: 20px;">
                                <div style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 8px;">Total Items</div>
                                <div style="font-size: 1.5rem; font-weight: 600;">${totalItems}</div>
                            </div>
                            <div class="card" style="padding: 20px;">
                                <div style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 8px;">Low / Out of Stock</div>
                                <div style="font-size: 1.5rem; font-weight: 600;">${lowStockItems.length}</div>
                            </div>
                            <div class="card" style="padding: 20px;">
                                <div style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 8px;">Fully Stocked</div>
                                <div style="font-size: 1.5rem; font-weight: 600;">${fullyStockedItems.length}</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="card">
                            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">Low Stock / Out of Stock Items</h3>
                            ${lowStockHtml}
                        </div>
                        <div class="card">
                            <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px;">Fully Stocked Items</h3>
                            ${fullyStockedHtml}
                        </div>
                    </div>

                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-size: 1rem; font-weight: 700;">Recent Transactions</h3>
                            <select class="form-control" style="width: auto; padding: 6px 12px;">
                                <option>This Week</option>
                                <option>This Month</option>
                            </select>
                        </div>
                        <div>
                            ${materialsTransactions.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 16px 0;">No recent transactions.</div>' : recentTransactionsHtml}
                        </div>
                    </div>
                `;
            } else if (currentMaterialsTab === 'masterlist') {
                let tableRows = materialsMasterlist.map(m => {
                    const status = m.currentStock <= m.minStock ? '<span style="background: #ffedd5; color: var(--badge-text-orange); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Low Stock</span>' : '<span style="background: var(--badge-bg-green); color: var(--badge-text-green); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Fully Stocked</span>';
                    return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 16px; font-size: 0.85rem;">${m.itemCode}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.itemName}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.department}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.type}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.unit}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.currentStock}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${m.minStock}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${status}</td>
                        </tr>
                    `;
                }).join('');

                contentHtml = `
                    <div class="card" style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
                        <div style="flex: 1; position: relative;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" placeholder="Search code or name..." style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem;">
                        </div>
                        <select class="form-control" style="width: auto;">
                            <option>All Departments</option>
                            <option>Civil</option>
                            <option>Electrical</option>
                        </select>
                        <select class="form-control" style="width: auto;">
                            <option>All Types</option>
                            <option>Consumable</option>
                            <option>Equipment</option>
                        </select>
                        <button class="btn btn-primary" onclick="openNewMaterialModal()">+ New Material</button>
                    </div>
                    <div class="card" style="padding: 0; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: var(--bg-body); border-bottom: 1px solid var(--border-color);">
                                <tr>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Item Code</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Item Name</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Department</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Type</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Unit</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Current Stock</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Min Stock</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `;
            } else if (currentMaterialsTab === 'transactions') {
                let tableRows = materialsTransactions.map(t => {
                    return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 16px; font-size: 0.85rem;">${t.date}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.time}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.mrsNo}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.poQty}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.poNo}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.prsNo}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.charging}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.actualCharging}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.itemCode}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.itemName}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.quantity}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.transactionType}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.accountabilityNo}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.type}</td>
                            <td style="padding: 16px; font-size: 0.85rem;">${t.remarks}</td>
                        </tr>
                    `;
                }).join('');

                contentHtml = `
                    <div class="card" style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
                        <div style="flex: 1; position: relative;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" placeholder="Search item, PO no, PRS no..." style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem;">
                        </div>
                        <select class="form-control" style="width: auto;">
                            <option>All Types</option>
                            <option>IN</option>
                            <option>OUT</option>
                        </select>
                        <button class="btn btn-primary" onclick="openNewTransactionModal()">+ New Transaction</button>
                    </div>
                    <div class="card" style="padding: 0; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: var(--bg-body); border-bottom: 1px solid var(--border-color);">
                                <tr>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Date</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Time</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">MRS/Withdrawal No.</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">PO Qty</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">PO No.</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">PRS No.</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Charging</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Actual Charging</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Item Code</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Item Name</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Quantity</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Transaction Type</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Accountability No.</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Type</th>
                                    <th style="padding: 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            contentArea.innerHTML = `
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Materials</h1>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Manage project inventory and stock movements</div>
                    </div>
                </div>
                <div class="card" style="margin-bottom: 24px; display: flex; gap: 8px; padding: 8px;">
                    <button class="btn" onclick="setMaterialsTab('dashboard')" style="border: none; background: ${currentMaterialsTab === 'dashboard' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentMaterialsTab === 'dashboard' ? 'var(--text-main)' : 'var(--badge-text-gray)'}; font-weight: ${currentMaterialsTab === 'dashboard' ? '700' : '700'}; box-shadow: var(--shadow-sm)' : 'none'}; border-radius: 6px; padding: 8px 16px;">Dashboard</button>
                    <button class="btn" onclick="setMaterialsTab('masterlist')" style="border: none; background: ${currentMaterialsTab === 'masterlist' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentMaterialsTab === 'masterlist' ? 'var(--badge-text-blue)' : 'var(--text-main)'}; font-weight: ${currentMaterialsTab === 'masterlist' ? '700' : '700'}; box-shadow: var(--shadow-sm)' : 'none'}; border-radius: 6px; padding: 8px 16px;">Masterlist</button>
                    <button class="btn" onclick="setMaterialsTab('transactions')" style="border: none; background: ${currentMaterialsTab === 'transactions' ? 'var(--bg-surface)' : 'transparent'}; color: ${currentMaterialsTab === 'transactions' ? 'var(--badge-text-blue)' : 'var(--text-main)'}; font-weight: ${currentMaterialsTab === 'transactions' ? '700' : '700'}; box-shadow: var(--shadow-sm)' : 'none'}; border-radius: 6px; padding: 8px 16px;">Transactions</button>
                </div>
                ${contentHtml}
            `;
        };

        window.renderFuelView = function() {
            currentView = 'fuel';
            updateSubNavVisibility();
            
            contentArea.innerHTML = `
                <div class="module-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Fuel Inventory</h1>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Track fuel consumption and distribution by equipment</div>
                    </div>
                    <button class="btn btn-primary" onclick="openFuelModal()" style="background: #3b82f6; border-color: #3b82f6;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Fuel Record
                    </button>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; gap: 20px; align-items: flex-end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">Start Date</label>
                            <input type="date" id="fuelStartDate" onchange="renderFuelDashboard()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; display: block;">End Date</label>
                            <input type="date" id="fuelEndDate" onchange="renderFuelDashboard()" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9rem; background: var(--bg-body); color: var(--text-main);">
                        </div>
                        <button class="btn btn-secondary" onclick="document.getElementById('fuelStartDate').value=''; document.getElementById('fuelEndDate').value=''; renderFuelDashboard();" style="height: 38px;">Clear Filter</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 20px; color: var(--text-main);">Fuel Distribution by Equipment</h3>
                        <div id="fuelChartContainer" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px;">
                            <!-- Chart will be rendered here -->
                        </div>
                    </div>
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 20px; color: var(--text-main);">Summary</h3>
                        <div id="fuelSummaryContainer" style="display: flex; flex-direction: column; gap: 16px;">
                            <!-- Summary will be rendered here -->
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
                    <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                        <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main);">Fuel Inventory Records</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.85rem; font-family: 'Inter', system-ui, sans-serif;">
                            <thead style="background: var(--bg-body);">
                                <tr>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">NO.</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">DATE</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">QTY. IN</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">QTY. OUT</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMAINING</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">TIME</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">REMARKS</th>
                                    <th style="padding: 14px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="fuelTableBody">
                                <!-- Records will go here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            renderFuelDashboard();
        }

        window.renderFuelDashboard = function() {
            const startDate = document.getElementById('fuelStartDate')?.value;
            const endDate = document.getElementById('fuelEndDate')?.value;
            
            let sortedRecords = fuelRecords.filter(r => r.projectId === currentProjectId).sort((a, b) => {
                const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
                const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
                return dateA - dateB;
            });
            
            let currentRemaining = 0;
            sortedRecords.forEach(record => {
                currentRemaining += (Number(record.qtyIn) || 0) - (Number(record.qtyOut) || 0);
                record.calculatedRemaining = currentRemaining;
            });
            
            let filteredRecords = sortedRecords;
            if (startDate) {
                filteredRecords = filteredRecords.filter(r => r.date >= startDate);
            }
            if (endDate) {
                filteredRecords = filteredRecords.filter(r => r.date <= endDate);
            }
            
            let totalIn = 0;
            let totalOut = 0;
            let equipmentUsage = {};
            
            filteredRecords.forEach(record => {
                totalIn += Number(record.qtyIn) || 0;
                totalOut += Number(record.qtyOut) || 0;
                
                if (record.equipment && record.qtyOut > 0) {
                    equipmentUsage[record.equipment] = (equipmentUsage[record.equipment] || 0) + Number(record.qtyOut);
                }
            });
            
            const finalRemaining = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1].calculatedRemaining : 0;
            
            const summaryContainer = document.getElementById('fuelSummaryContainer');
            if (summaryContainer) {
                summaryContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md);">
                        <span style="font-weight: 500; color: var(--text-main);">Total Qty. IN</span>
                        <span style="font-weight: 700; font-size: 1.1rem; color: #10b981;">${totalIn.toFixed(1)} L</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
                        <span style="font-weight: 500; color: var(--text-main);">Total Qty. OUT</span>
                        <span style="font-weight: 700; font-size: 1.1rem; color: var(--badge-text-red);">${totalOut.toFixed(1)} L</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md);">
                        <span style="font-weight: 500; color: var(--text-main);">Total Remaining Fuel</span>
                        <span style="font-weight: 700; font-size: 1.1rem; color: #10b981;">${finalRemaining.toFixed(1)} L</span>
                    </div>
                `;
            }
            
            const chartContainer = document.getElementById('fuelChartContainer');
            if (chartContainer) {
                if (Object.keys(equipmentUsage).length === 0) {
                    chartContainer.innerHTML = `<div style="color: var(--text-muted);">No equipment usage data available for selected period.</div>`;
                } else {
                    const colors = ['#2dd4bf', '#fbbf24', '#f43f5e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', 'var(--badge-text-red)', '#6366f1'];
                    let totalUsage = Object.values(equipmentUsage).reduce((a, b) => a + b, 0);
                    
                    let conicGradientParts = [];
                    let currentAngle = 0;
                    let legendHtml = '';
                    
                    Object.entries(equipmentUsage).forEach(([eq, qty], index) => {
                        const color = colors[index % colors.length];
                        const percentage = (qty / totalUsage) * 100;
                        const angle = (percentage / 100) * 360;
                        
                        if (index > 0) {
                            conicGradientParts.push(`var(--bg-surface) ${currentAngle}deg ${currentAngle + 2}deg`);
                            currentAngle += 2;
                        }
                        
                        conicGradientParts.push(`${color} ${currentAngle}deg ${currentAngle + angle - (index === 0 ? 2 : 0)}deg`);
                        currentAngle += angle - (index === 0 ? 2 : 0);
                        
                        legendHtml += `
                            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: ${color}; font-weight: 600; text-transform: uppercase;">
                                <div style="width: 12px; height: 12px; background: ${color};"></div>
                                ${eq}
                            </div>
                        `;
                    });
                    
                    chartContainer.innerHTML = `
                        <div style="position: relative; width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(${conicGradientParts.join(', ')}); margin-bottom: 24px;">
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 130px; height: 130px; background: var(--bg-surface); border-radius: 50%;"></div>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 20px;">
                            ${legendHtml}
                        </div>
                    `;
                }
            }
            
            const tableBody = document.getElementById('fuelTableBody');
            if (tableBody) {
                if (filteredRecords.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="8" style="padding: 20px; text-align: center; color: var(--text-muted);">No records found.</td></tr>`;
                } else {
                    tableBody.innerHTML = filteredRecords.map((record, index) => {
                        const dateObj = new Date(record.date);
                        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                        
                        const qtyInDisplay = record.qtyIn > 0 ? `<span style="color: #10b981; font-weight: 500;">${record.qtyIn}</span>` : '<span style="color: #10b981;">-</span>';
                        const qtyOutDisplay = record.qtyOut > 0 ? `<span style="color: var(--badge-text-red); font-weight: 500;">${record.qtyOut}</span>` : '<span style="color: var(--badge-text-red);">-</span>';
                        
                        return `
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${index + 1}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${formattedDate}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${qtyInDisplay}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${qtyOutDisplay}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${record.calculatedRemaining.toFixed(1)}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${record.time || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">${record.remarks || '-'}</td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: right;">
                                    <div class="dropdown" style="display: inline-block;">
                                        <button class="icon-btn" style="width: 28px; height: 28px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
                                        <div class="dropdown-content" style="right: 0; left: auto; min-width: 120px;">
                                            <a href="#" onclick="editFuelRecord(${record.id}); return false;">Edit</a>
                                            <a href="#" onclick="deleteFuelRecord(${record.id}); return false;" style="color: var(--danger-color);">Delete</a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }

        window.openFuelModal = function() {
            if (!window.legacyGuardAdd('fuel')) return;
            document.getElementById('fuelRecordId').value = '';
            document.getElementById('fuelForm').reset();
            populateEquipmentDropdown();
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('fuelDate').value = today;
            
            document.querySelector('#fuelModal .modal-header h2').textContent = 'Add Fuel Record';
            document.querySelector('#fuelModal button[type="submit"]').textContent = 'Add Record';
            
            document.getElementById('fuelModal').classList.add('active');
        }

        window.closeFuelModal = function() {
            document.getElementById('fuelModal').classList.remove('active');
        }

        window.populateEquipmentDropdown = function() {
            const select = document.getElementById('fuelEquipment');
            if (!select) return;
            const currentValue = select.value;
            
            select.innerHTML = '<option value="">Select equipment</option>' + 
                equipmentList.sort().map(eq => `<option value="${eq}">${eq}</option>`).join('');
                
            if (currentValue && equipmentList.includes(currentValue)) {
                select.value = currentValue;
            }
        }

        window.addEquipment = function() {
            const modalHtml = `
                <div class="modal-overlay active" id="addEquipmentModal">
                    <div class="modal" style="max-width: 400px;">
                        <div class="modal-header">
                            <h2>Add New Equipment</h2>
                            <button class="close-modal" onclick="document.getElementById('addEquipmentModal').remove()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="event.preventDefault(); saveNewEquipment()">
                                <div class="form-group">
                                    <label>Equipment Name</label>
                                    <input type="text" id="newEquipmentName" class="form-control" required>
                                </div>
                                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('addEquipmentModal').remove()">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            setTimeout(() => document.getElementById('newEquipmentName').focus(), 100);
        };

        window.saveNewEquipment = function() {
            const newEq = document.getElementById('newEquipmentName').value;
            if (newEq && newEq.trim() !== '') {
                const upperEq = newEq.trim().toUpperCase();
                if (!equipmentList.includes(upperEq)) {
                    equipmentList.push(upperEq);
                    populateEquipmentDropdown();
                }
                
                // Ensure the new option is selected
                const select = document.getElementById('fuelEquipment');
                let optionExists = false;
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value === upperEq) {
                        optionExists = true;
                        break;
                    }
                }
                
                if (!optionExists) {
                    const option = document.createElement('option');
                    option.value = upperEq;
                    option.textContent = upperEq;
                    select.appendChild(option);
                }
                
                select.value = upperEq;
                document.getElementById('fuelRemarks').value = upperEq;
                document.getElementById('addEquipmentModal').remove();
            }
        };

        window.editFuelRecord = function(id) {
            const accessRecord = (window.fuelRecords || fuelRecords || []).find(r => String(r.id) === String(id));
            if (!window.legacyGuardEdit('fuel', accessRecord)) return;
            const record = fuelRecords.find(r => r.id == id);
            if (record) {
                document.getElementById('fuelRecordId').value = record.id;
                document.getElementById('fuelDate').value = record.date;
                document.getElementById('fuelQtyIn').value = record.qtyIn;
                document.getElementById('fuelQtyOut').value = record.qtyOut;
                document.getElementById('fuelTime').value = record.time;
                
                populateEquipmentDropdown();
                document.getElementById('fuelEquipment').value = record.equipment || '';
                document.getElementById('fuelRemarks').value = record.remarks || '';
                
                document.querySelector('#fuelModal .modal-header h2').textContent = 'Edit Fuel Record';
                document.querySelector('#fuelModal button[type="submit"]').textContent = 'Update Record';
                
                document.getElementById('fuelModal').classList.add('active');
            }
        }

        window.deleteFuelRecord = function(id) {
            const accessRecord = (window.fuelRecords || fuelRecords || []).find(r => String(r.id) === String(id));
            if (!window.legacyGuardDelete('fuel', accessRecord)) return;
            customConfirm('Are you sure you want to delete this fuel record?', () => {
                fuelRecords = fuelRecords.filter(r => r.id != id);
                window.fuelRecords = fuelRecords;
                renderFuelDashboard();
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.body.addEventListener('change', function(e) {
                if (e.target && e.target.id === 'fuelEquipment') {
                    if (e.target.value) {
                        document.getElementById('fuelRemarks').value = e.target.value;
                    }
                }
            });

            document.body.addEventListener('submit', function(e) {
                if (e.target && e.target.id === 'fuelForm') {
                    e.preventDefault();
                    const fuelEditIdForAccess = document.getElementById('fuelRecordId')?.value || null;
                    const existingFuelForAccess = fuelEditIdForAccess ? (window.fuelRecords || fuelRecords || []).find(r => String(r.id) === String(fuelEditIdForAccess)) : null;
                    if (fuelEditIdForAccess ? !window.legacyGuardEdit('fuel', existingFuelForAccess) : !window.legacyGuardAdd('fuel')) return;
                    
                    const id = document.getElementById('fuelRecordId').value;
                    const date = document.getElementById('fuelDate').value;
                    const qtyIn = parseFloat(document.getElementById('fuelQtyIn').value) || 0;
                    const qtyOut = parseFloat(document.getElementById('fuelQtyOut').value) || 0;
                    const time = document.getElementById('fuelTime').value;
                    const equipment = document.getElementById('fuelEquipment').value;
                    const remarks = document.getElementById('fuelRemarks').value;
                    
                    if (id) {
                        const recordIndex = fuelRecords.findIndex(r => r.id == id);
                        if (recordIndex !== -1) {
                            fuelRecords[recordIndex] = {
                                ...fuelRecords[recordIndex],
                                date, qtyIn, qtyOut, time, equipment, remarks
                            };
                        }
                    } else {
                        fuelRecords.push({
                            id: Date.now(),
                            projectId: currentProjectId,
                            date, qtyIn, qtyOut, time, equipment, remarks
                        });
                    }
                    
                    closeFuelModal();
                    renderFuelDashboard();
                }
            });
        });

        window.dragTask = function(ev, taskId) {
            ev.dataTransfer.setData("taskId", taskId);
        }

        window.allowDrop = function(ev) {
            ev.preventDefault();
        }

        window.dropTask = function(ev, newStatus) {
            ev.preventDefault();
            const taskId = ev.dataTransfer.getData("taskId");
            
            // Find task and update status
            projects.forEach(p => {
                const task = p.tasks.find(t => t.id == taskId);
                if (task) {
                    if (newStatus === 'Completed') {
                        task.completed = true;
                    } else {
                        task.completed = false;
                        if (newStatus === 'Active') task.priority = 'High';
                        else if (newStatus === 'Planning') task.priority = 'Medium';
                        else if (newStatus === 'Review') task.priority = 'Low';
                    }
                    
                    // Update project progress
                    const completedTasks = p.tasks.filter(t => t.completed).length;
                    p.progress = Math.round((completedTasks / p.tasks.length) * 100);
                    if (p.progress === 100) p.status = 'Completed';
                    else if (p.progress > 0) p.status = 'Active';
                    else p.status = 'Planning';
                }
            });
            
            renderTasksView('kanban');
        }

        // Navigation Highlight
        const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                
                const view = item.getAttribute('data-view');
                
                // Highlight matching items in both desktop and mobile nav
                document.querySelectorAll(`[data-view="${view}"]`).forEach(el => el.classList.add('active'));
                
                if (view === 'dashboard') {
                    console.warn('[Legacy] renderDashboard skipped.');
                } else if (view === 'projects') {
                    renderProjectsView();
                } else if (view === 'tasks') {
                    renderTasksView();
                } else if (view === 'wbs-sequence') {
                    renderWbsSequenceView();
                } else if (view === 'calendar') {
                    renderCalendarView();
                } else if (view === 'request') {
                    renderRequestView();
                } else if (view === 'manila') {
                    renderManilaView();
                } else if (view === 'local') {
                    renderLocalView();
                } else if (view === 'fuel') {
                    renderFuelView();
                } else if (view === 'expense-overview') {
                    renderExpenseOverview();
                } else if (view === 'procurement-dashboard') {
                    renderProcurementDashboard();
                } else if (view === 'payroll-dashboard') {
                    renderPayrollDashboard();
                } else if (view === 'employee') {
                    renderEmployeeView();
                } else if (view === 'attendance') {
                    renderPayrollProcessingView();
                } else {
                    currentView = view;
                    currentProjectId = null;
                    updateSubNavVisibility();
                    contentArea.innerHTML = `<div class="view-header"><h1>${view.charAt(0).toUpperCase() + view.slice(1)}</h1></div><div style="color: var(--text-muted)">This section is under construction.</div>`;
                }
                
                mobileDrawer.classList.remove('open');
            });
        });

        function updateSubNavVisibility() {
            if (currentProjectId) {
                const project = projects.find(p => p.id === currentProjectId);
                if (project) {
                    selectedProjectName.textContent = project.title;
                    breadcrumbProjectName.textContent = project.title;
                    subNavBar.style.display = 'flex';
                    mobileSubNav.style.display = 'block';
                }
            } else {
                selectedProjectName.textContent = 'Select Project';
                subNavBar.style.display = 'none';
                mobileSubNav.style.display = 'none';
            }
            if (window.__syncReactState) {
               window.__syncReactState(currentView, currentProjectId);
            }
        }

        // Initial Render
        console.warn('[Legacy] renderDashboard skipped.');
    

window.tdDragTask = function(event, taskId) {
    event.dataTransfer.setData('text/plain', taskId);
};
window.tdDropTask = function(event, newStatus) {
    event.preventDefault();
    const taskIdStr = event.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    const task = mockTasks.find(t => String(t.id) === taskIdStr);
    if (task) {
        task.status = newStatus;
        if (window.renderTaskDashboardView) window.renderTaskDashboardView();
        if(window.wbsMapInstance && window.wbsMapInstance.updateNodeStatus) {
            window.wbsMapInstance.updateNodeStatus(String(task.id), newStatus);
        }
    }
};


/* Preserve the current page position when records are added or edited in
   the Procurement and Budget modules. */
(function installModuleScrollPreserver() {
    if (window.__moduleScrollPreserverInstalled) return;
    window.__moduleScrollPreserverInstalled = true;

    let restoreToken = 0;

    function getActiveModule() {
        const host = document.querySelector('#contentArea[data-active-module], #reactContainer[data-active-module]');
        const dataModule = String(host?.dataset?.activeModule || '').toLowerCase();
        if (dataModule) return dataModule;

        // Legacy pages use the currentView variable instead of data-active-module.
        try {
            return String(currentView || '').toLowerCase();
        } catch (_) {
            return '';
        }
    }

    function isTargetModule() {
        const moduleName = getActiveModule();
        const targetViews = new Set([
            'procurement-dashboard',
            'request',
            'manila',
            'local',
            'materials',
            'fuel',
            'boq',
            'boq-charging',
            'expense-overview',
            'look-ahead'
        ]);
        return targetViews.has(moduleName) ||
            moduleName.includes('procurement') ||
            moduleName.includes('budget');
    }

    function capturePosition() {
        const legacy = document.getElementById('contentArea');
        const react = document.getElementById('reactContainer');
        return {
            windowX: window.scrollX,
            windowY: window.scrollY,
            legacyTop: legacy?.scrollTop ?? null,
            legacyLeft: legacy?.scrollLeft ?? null,
            reactTop: react?.scrollTop ?? null,
            reactLeft: react?.scrollLeft ?? null
        };
    }

    function applyPosition(position) {
        if (!position) return;
        const legacy = document.getElementById('contentArea');
        const react = document.getElementById('reactContainer');

        if (legacy && position.legacyTop !== null) {
            legacy.scrollTop = position.legacyTop;
            legacy.scrollLeft = position.legacyLeft || 0;
        }
        if (react && position.reactTop !== null) {
            react.scrollTop = position.reactTop;
            react.scrollLeft = position.reactLeft || 0;
        }
        window.scrollTo(position.windowX || 0, position.windowY || 0);
    }

    let pendingPosition = null;

    window.preserveBudgetProcurementScroll = function preserveBudgetProcurementScroll() {
        if (!isTargetModule()) return;
        pendingPosition = capturePosition();
        const position = pendingPosition;
        const token = ++restoreToken;

        // Re-apply after synchronous render, async Supabase reloads, and React/legacy rerenders.
        [0, 16, 50, 100, 180, 300, 500, 800, 1200, 1800, 2600, 3600].forEach(delay => {
            setTimeout(() => {
                if (token !== restoreToken || !position) return;
                requestAnimationFrame(() => applyPosition(position));
            }, delay);
        });
    };

    document.addEventListener('submit', function preserveOnModuleSubmit(event) {
        if (!isTargetModule()) return;
        if (!(event.target instanceof HTMLFormElement)) return;
        window.preserveBudgetProcurementScroll();
    }, true);

    // Capture the table position before opening an edit form. This is more reliable
    // than waiting for submit because some modal flows rerender before submitting.
    document.addEventListener('click', function preserveBeforeEdit(event) {
        if (!isTargetModule()) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const button = target.closest('button, a');
        if (!button) return;
        const text = String(button.getAttribute('title') || button.getAttribute('aria-label') || button.textContent || '').toLowerCase();
        const onclick = String(button.getAttribute('onclick') || '').toLowerCase();
        if (text.includes('edit') || onclick.includes('edit')) {
            pendingPosition = capturePosition();
        }
    }, true);

    // Any content replacement after save/edit should return to the last captured row.
    const observer = new MutationObserver(() => {
        if (!pendingPosition || !isTargetModule()) return;
        const position = pendingPosition;
        requestAnimationFrame(() => applyPosition(position));
    });

    const startObserver = () => {
        const legacy = document.getElementById('contentArea');
        const react = document.getElementById('reactContainer');
        if (legacy) observer.observe(legacy, { childList: true, subtree: false });
        if (react) observer.observe(react, { childList: true, subtree: false });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver, { once: true });
    } else {
        startObserver();
    }
})();
