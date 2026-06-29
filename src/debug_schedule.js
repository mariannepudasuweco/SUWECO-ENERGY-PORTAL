// Minimal Debug File for Project Schedule Actual %
const window = global;

// Mock Data / Setup
let currentProjectId = 'proj1';
let currentView = '';
let subtaskChargingOptions = ['D1.1 - Sample Task'];
let customProjectScheduleTasks = {};
let boqBudgets = {};
let manilaRecords = [];
let localRecords = [];
let scheduleExpandedParents = {};
let scheduleSearchQuery = '';
let currentScheduleTab = 'actual';

window.projectSchedules = {
    proj1: {
        'D1.1': {
            targetStart: '2025-01-01',
            targetEnd: '2025-12-31',
            targetQty: '100',
            actualQty: '33',
            _taskProgress: 33,
            progress: 33,
            status: 'In Progress'
        }
    }
};

window.updateProjectScheduleStats = function(projectId) {
    if (!projectId) {
        console.warn('[ProjectSchedule] Missing projectId in updateProjectScheduleStats.');
        return;
    }
    if (!window.subtaskChargingOptions || !window.subtaskChargingOptions.length) {
        console.warn('[ProjectSchedule] Missing subtaskChargingOptions. Ensure options are loaded before stats calculation.');
    }

    // --- Regression validation utility ---
    window.validateTaskProgress = window.validateTaskProgress || function(task) {
        if (!task) return false;
        let warns = [];
        let pStr = String(task._taskProgress);
        if (pStr === 'NaN' || isNaN(task._taskProgress)) warns.push('NaN progress');
        if (pStr === 'undefined' || task._taskProgress === undefined) warns.push('undefined progress');
        if (task._taskProgress < 0) warns.push('Negative progress');
        if (task._taskProgress > 100) warns.push('Progress exceeding 100%');
        if (warns.length > 0) {
            console.warn(`[ProjectSchedule] Validation failed for task`, task, warns);
        }
        return warns.length === 0;
    };

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
                    actualStart: '', actualEnd: '', actualQty: '', targetQty: '', progress: ''
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
                        actualStart: '', actualEnd: '', actualQty: '', targetQty: '', progress: ''
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

    const today = new Date();
    today.setHours(0,0,0,0);

    let weightedProgress = 0;
    let totalWeight = 0;

    allCodes.forEach(code => {
        let data = sched[code];
        let taskProg = 0;

        if (isLeaf[code]) {
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
            const manualP = Number(data._taskProgress);
            const manualPSafe = (isNaN(manualP) || manualP < 0) ? 0 : manualP;

            if (tSafe > 0) {
                taskProg = (aSafe / tSafe) * 100;
            } else {
                taskProg = manualPSafe;
            }

            taskProg = isNaN(taskProg) ? 0 : Math.max(0, Math.min(100, taskProg));
            data._taskProgress = taskProg;
            data.progress = taskProg;
            window.validateTaskProgress(data);

            const hasStartDate = !!data.actualStart || !!data.targetStart;
            const hasActualQty = aSafe > 0;
            const hasActivity = reportsByTaskId[code];
            const isCompletedByQty = (tSafe > 0 && aSafe >= tSafe);

            if (taskProg >= 100 || isCompletedByQty) {
                data.status = 'Completed';
                data._taskProgress = 100;
                data.progress = 100;
            } else if (data.targetEnd && new Date(data.targetEnd) < today && taskProg < 100) {
                data.status = 'Overdue';
            } else if (hasStartDate || hasActualQty || hasActivity || taskProg > 0) {
                data.status = 'In Progress';
            } else {
                data.status = 'Not Started';
            }
        }
    });
};

window.renderProjectScheduleView = function() {
    if (currentProjectId) updateProjectScheduleStats(currentProjectId);

    if (!window.projectSchedules[currentProjectId]) {
        window.projectSchedules[currentProjectId] = {};
    }
    const scheduleData = window.projectSchedules[currentProjectId];
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

    let combinedOptionsForSched1 = [...subtaskChargingOptions];
    combinedOptionsForSched1.forEach(opt => {
        const match = opt.match(/^([A-D])([0-9.]+)\s*-\s*(.*?)(?:\s*\(.*\))?$/);
        if (match) {
            const category = match[1];
            const code = match[1] + match[2];
            let name = match[3].trim();

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

    let tableHtml = '';

    if (currentScheduleTab === 'baseline' || currentScheduleTab === 'actual') {
        const isBaseline = currentScheduleTab === 'baseline';
        
        const renderRow = (item, isSub = false) => {
            if (item.isParent) {
                let subHtml = '';
                if (item.expanded) {
                    subHtml = item.subItems.map(sub => renderRow(sub, true)).join('');
                }

                const parentWeight = '—';
                const pTargetPct = item.data?.targetQty ? '100.0%' : '0.0%';
                let pProgNum = Number(item.data?._taskProgress);
                pProgNum = isNaN(pProgNum) ? 0 : pProgNum;
                const pActualPct = pProgNum.toFixed(1) + '%';
                const pVariance = '0%';
                const pVarianceColor = 'black';

                return `<tr><td>${item.code}</td><td>${item.name}</td><td>${JSON.stringify(item.data?.actualQty)}</td><td>${JSON.stringify(item.data?.targetQty)}</td><td>${pActualPct}</td></tr>${subHtml}`;
            }

            const weight = '—';
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
                aProgNum = Number(item.data._taskProgress);
            }
            aProgNum = isNaN(aProgNum) ? 0 : Math.max(0, Math.min(100, aProgNum));
            
            const actualPctInline = ((parseFloat(item.data.actualQty) || 0) / Math.max(1, (parseFloat(item.data.targetQty) || 0)) * 100).toFixed(1) + '%';
            
            console.log({
                code: item.code,
                actualQty: item.data.actualQty,
                targetQty: item.data.targetQty,
                computedProgress: actualPctInline,
                renderedProgress: aProgNum.toFixed(1) + '%'
            });
            const actualPct = actualPctInline;
            const variance = '0%';
            const varianceColor = 'black';
            
            let depth = item.code.split('.').length;
            let padLeft = isSub ? (16 + (depth - 1) * 24) : 16;

            return `
                <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-surface);">
                    <td style="padding: 12px 16px 12px ${padLeft}px !important; font-size: 0.85rem; color: var(--text-muted);">${item.code}</td>
                    <td style="padding: 12px 16px 12px ${padLeft}px !important; font-size: 0.85rem;">${item.name}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${JSON.stringify(item.data.actualQty)}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; text-align: center;">${JSON.stringify(item.data.targetQty)}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right;">${actualPct}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right;">${targetPct}</td>
                    <td style="padding: 12px 16px; font-size: 0.85rem; text-align: right; color: ${varianceColor};">${variance}</td>
                </tr>
            `;
        };

        Object.values(tree).forEach(cat => {
            if (cat.items.length === 0) return;
            cat.items.forEach(item => {
                tableHtml += renderRow(item);
            });
        });
    }
    
    return tableHtml;
};

// Test
const html = window.renderProjectScheduleView();
console.log(html);
