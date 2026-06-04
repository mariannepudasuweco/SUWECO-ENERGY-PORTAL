const fs = require('fs');

const combinedOptions = [
    'B1 - LAND ACQUISITION',
    'B2 - Permitting',
    'B2.1 - LGU',
    'B2.1.1 - BLGU-Resolution of No Objection'
];

let sched = {
    'B2.1.1': { actualQty: '3', targetQty: '5', progress: '' }
};

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

let codesSet = new Set(allCodes);
allCodes.forEach(code => {
    if (code.includes('.')) {
        let pCode = code.split('.')[0];  // THE BUGGY LINE
        if (!codesSet.has(pCode)) {
            codesSet.add(pCode);
            if(!sched[pCode]) {
                sched[pCode] = {
                    duration: '', targetStart: '', targetEnd: '', qty: '', weight: '', status: 'Not Started',
                    actualStart: '', actualEnd: '', actualQty: '', targetQty: '', progress: ''
                };
            }
        }
    }
});
allCodes = Array.from(codesSet).sort((a,b) => b.length - a.length); 

const childrenMap = {};
const isLeaf = {};
allCodes.forEach(code => { childrenMap[code] = []; isLeaf[code] = true; });
allCodes.forEach(code => {
    if (code.includes('.')) {
        let pCode = code.split('.')[0]; // THE BUGGY LINE
        if (childrenMap[pCode]) {
            childrenMap[pCode].push(code);
            isLeaf[pCode] = false;
        }
    }
});

allCodes.forEach(code => {
    let data = sched[code];
    let taskProg = 0;

    if (isLeaf[code]) {
        if (data.progress !== undefined && data.progress !== '' && (!data.actualQty || parseFloat(data.actualQty) === 0)) {
            taskProg = parseFloat(data.progress) || 0;
        } else if (data.targetQty && parseFloat(data.targetQty) > 0) {
            const t = parseFloat(data.targetQty);
            const a = parseFloat(data.actualQty) || 0;
            taskProg = (a / t) * 100;
        } else if (data.progress !== undefined && data.progress !== '') {
            taskProg = parseFloat(data.progress) || 0;
        }
        data._taskProgress = taskProg;

    } else {
        let sumChildProg = 0;
        let sumTargetQty = 0;
        let sumActualQty = 0;

        childrenMap[code].forEach(cCode => {
            let cData = sched[cCode];
            sumChildProg += cData._taskProgress || 0;
            sumTargetQty += parseFloat(cData.targetQty) || parseFloat(cData.qty) || 0;
            sumActualQty += parseFloat(cData.actualQty) || 0;
        });

        if (sumTargetQty > 0) {
            data._taskProgress = Math.min(100, Math.max(0, (sumActualQty / sumTargetQty) * 100));
        } else {
            data._taskProgress = childrenMap[code].length > 0 ? (sumChildProg / childrenMap[code].length) : 0;
        }
        data.targetQty = sumTargetQty || '';
        data.actualQty = sumActualQty || '';
    }
});

console.log("B2.1.1 _taskProgress:", sched['B2.1.1']._taskProgress);
console.log("B2 targetQty:", sched['B2'].targetQty);
console.log("B2 _taskProgress:", sched['B2']._taskProgress);
