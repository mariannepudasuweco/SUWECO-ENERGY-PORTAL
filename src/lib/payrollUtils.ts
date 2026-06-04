
export const ACTIVITIES = [
  { code: 'M', name: 'MOBILIZATION' },
  { code: 'TF', name: 'TEMPORARY FACILITIES' },
  { code: 'SG', name: 'SITE GRADING' },
  { code: 'RD1', name: 'ROAD DEVELOPMENT 1' },
  { code: 'RD2', name: 'ROAD DEVELOPMENT 2' },
  { code: 'DWS', name: 'DOMESTIC WATER SYSTEM' },
  { code: 'DS', name: 'DRAINAGE SYSTEM' },
  { code: 'SP', name: 'SLOPE PROTECTION' },
  { code: 'CB', name: 'CONTROL BUILDING' },
  { code: 'WWB', name: 'WAREHOUSE AND WORKSHOP BUILDING' },
  { code: 'AAB', name: 'ADMIN AND AMENITIES BUILDING' },
  { code: 'GH', name: 'GUARD HOUSE' },
  { code: 'MRF', name: 'MATERIAL RECOVERY FACILITY' },
  { code: 'LP', name: 'LIGHTNING PROTECTION' },
  { code: 'CHBFG', name: 'CHB FENCE AND GATE' },
  { code: 'CS', name: 'CCTV SYSTEM' },
  { code: 'FW', name: 'FOUNDATION WORKS' },
  { code: 'FS', name: 'FUEL SYSTEM' },
  { code: 'LOS', name: 'LUBE OIL SYSTEM' },
  { code: 'TW', name: 'TRENCH WORKS' },
  { code: 'GSSA', name: 'GENERATOR SET & SKID ASSEMBLY' },
  { code: 'WT', name: 'WIRING AND TERMINATION' },
  { code: 'GS', name: 'GROUNDING SYSTEM' },
  { code: 'TL', name: 'TRANSMISSION LINE' },
  { code: 'TDSF', name: 'TRANSFORMER & DISCONNECT SWITCH FOUNDATION' },
  { code: 'CTMDB', name: 'CABLE TRENCH, MANHOLE AND DUCT BANK' },
  { code: 'TI', name: 'TRANSFORMER INSTALLATION' },
  { code: 'SSP', name: 'SUBSTATION PROTECTION' },
  { code: 'RWT', name: 'REVENUE WIRING AND TERMINATION' },
  { code: 'CWT', name: 'CABLE WIRING AND TERMINATION' },
  { code: 'SFG', name: 'SECLUSION FENCE GATE' },
  { code: 'GSL', name: 'GROUNDING SYSTEM (LABOR)' },
  { code: 'SCADA', name: 'SCADA SYSTEM' },
  { code: 'C', name: 'CONSUMABLES' },
  { code: 'AD', name: 'ADMIN' }
];

export const calculateDays = (days: string[]) => {
  return days.reduce((total, day) => {
    if (day === 'X') return total + 1;
    if (day === '1/2') return total + 0.5;
    return total;
  }, 0);
};

export const calculateEmployeePayroll = (emp: any) => {
  const days = calculateDays(emp.days);
  const baseRate = typeof emp.rate === 'string' ? parseFloat(emp.rate) : (emp.rate || 0);
  const hourlyRate = baseRate / 8;
  const totalWorkedBaseHours = days * 8;
  
  const adj = emp.adjustments || {};
  const getVal = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const ot = getVal(emp.ot);
  const ut = getVal(emp.ut);
  
  const restDayHours = getVal(adj.restDayHours);
  const restDayOtHours = getVal(adj.restDayOtHours);
  const specialHolidayHours = getVal(adj.specialHolidayHours);
  const specialHolidayOtHours = getVal(adj.specialHolidayOtHours);
  const specialHolidayRestDayHours = getVal(adj.specialHolidayRestDayHours);
  const specialHolidayRestDayOtHours = getVal(adj.specialHolidayRestDayOtHours);
  const regularHolidayHours = getVal(adj.regularHolidayHours);
  const regularHolidayOtHours = getVal(adj.regularHolidayOtHours);
  const regularHolidayRestDayHours = getVal(adj.regularHolidayRestDayHours);
  const regularHolidayRestDayOtHours = getVal(adj.regularHolidayRestDayOtHours);

  const ordinaryNightHours = getVal(adj.ordinaryNightHours);
  const restDayNightHours = getVal(adj.restDayNightHours);
  const specialHolidayNightHours = getVal(adj.specialHolidayNightHours);
  const specialHolidayRestDayNightHours = getVal(adj.specialHolidayRestDayNightHours);
  const regularHolidayNightHours = getVal(adj.regularHolidayNightHours);
  const regularHolidayRestDayNightHours = getVal(adj.regularHolidayRestDayNightHours);

  const ordinaryNightOtHours = getVal(adj.ordinaryNightOtHours);
  const restDayNightOtHours = getVal(adj.restDayNightOtHours);
  const specialHolidayNightOtHours = getVal(adj.specialHolidayNightOtHours);
  const specialHolidayRestDayNightOtHours = getVal(adj.specialHolidayRestDayNightOtHours);
  const regularHolidayNightOtHours = getVal(adj.regularHolidayNightOtHours);
  const regularHolidayRestDayNightOtHours = getVal(adj.regularHolidayRestDayNightOtHours);

  const basic = days * baseRate;
  const basicPay = basic;

  // 1. ORDINARY OVERTIME
  const regularOtAmount = ot * hourlyRate * 1.25;

  // 2. REST DAY / SUNDAY
  const restDayAmount = restDayHours * hourlyRate * 1.30;
  const restDayOtAmount = restDayOtHours * hourlyRate * 1.69;

  // 3. SPECIAL NON-WORKING HOLIDAY
  const specialHolidayAmount = specialHolidayHours * hourlyRate * 1.30;
  const specialHolidayOtAmount = specialHolidayOtHours * hourlyRate * 1.69;

  // 4. SPECIAL HOLIDAY + REST DAY
  const specialHolidayRestDayAmount = specialHolidayRestDayHours * hourlyRate * 1.50;
  const specialHolidayRestDayOtAmount = specialHolidayRestDayOtHours * hourlyRate * 1.95;

  // 5. REGULAR HOLIDAY
  const regularHolidayAmount = regularHolidayHours * hourlyRate * 2.00;
  const regularHolidayOtAmount = regularHolidayOtHours * hourlyRate * 2.60;

  // 6. REGULAR HOLIDAY + REST DAY
  const regularHolidayRestDayAmount = regularHolidayRestDayHours * hourlyRate * 2.60;
  const regularHolidayRestDayOtAmount = regularHolidayRestDayOtHours * hourlyRate * 3.38;

  // 7. NIGHT SHIFT DIFFERENTIAL ONLY
  const ordinaryNsdAmount = ordinaryNightHours * hourlyRate * 0.10;
  const restDayNsdAmount = restDayNightHours * hourlyRate * 0.13;
  const specialHolidayNsdAmount = specialHolidayNightHours * hourlyRate * 0.13;
  const specialHolidayRestDayNsdAmount = specialHolidayRestDayNightHours * hourlyRate * 0.15;
  const regularHolidayNsdAmount = regularHolidayNightHours * hourlyRate * 0.20;
  const regularHolidayRestDayNsdAmount = regularHolidayRestDayNightHours * hourlyRate * 0.26;

  // 8. NIGHT OVERTIME
  const ordinaryNightOtAmount = ordinaryNightOtHours * hourlyRate * 1.375;
  const restDayNightOtAmount = restDayNightOtHours * hourlyRate * 1.859;
  const specialHolidayNightOtAmount = specialHolidayNightOtHours * hourlyRate * 1.859;
  const specialHolidayRestDayNightOtAmount = specialHolidayRestDayNightOtHours * hourlyRate * 2.145;
  const regularHolidayNightOtAmount = regularHolidayNightOtHours * hourlyRate * 2.86;
  const regularHolidayRestDayNightOtAmount = regularHolidayRestDayNightOtHours * hourlyRate * 3.718;

  // 9. UNDERTIME / LATE
  const undertimeAmount = ut * hourlyRate;

  // 10. TOTAL ADJUSTMENTS
  const totalAdjustments = 
    regularOtAmount + restDayAmount + restDayOtAmount + specialHolidayAmount + specialHolidayOtAmount +
    specialHolidayRestDayAmount + specialHolidayRestDayOtAmount + regularHolidayAmount + regularHolidayOtAmount +
    regularHolidayRestDayAmount + regularHolidayRestDayOtAmount + ordinaryNsdAmount + restDayNsdAmount +
    specialHolidayNsdAmount + specialHolidayRestDayNsdAmount + regularHolidayNsdAmount + regularHolidayRestDayNsdAmount +
    ordinaryNightOtAmount + restDayNightOtAmount + specialHolidayNightOtAmount + specialHolidayRestDayNightOtAmount +
    regularHolidayNightOtAmount + regularHolidayRestDayNightOtAmount - undertimeAmount;

  // 11. GROSS PAY
  const grossPay = basicPay + totalAdjustments;
  // Round to 2 decimal places
  let gross = Math.round(grossPay * 100) / 100;

  const parseNum = (val: any, defaultVal = 0) => {
    if (val === '' || val == null) return defaultVal;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const sssVal = parseNum(emp.sss, 0);
  const phVal = parseNum(emp.philhealth, 0);
  const pagibigVal = parseNum(emp.pagibig, 0);
  const taxVal = parseNum(emp.tax, 0);

  const advances = Array.isArray(emp.cashAdvances) ? emp.cashAdvances.reduce((sum: number, ca: any) => sum + parseNum(ca.amount), 0) : 0;
  const totalDeduction = sssVal + phVal + pagibigVal + taxVal + advances;
  const netPay = gross - totalDeduction;

  return { 
    gross, 
    basic, 
    days, 
    sssVal, 
    phVal, 
    pagibigVal, 
    taxVal, 
    advances,
    totalDeduction,
    netPay,
    adjAmounts: {
      regularOtAmount,
      restDayAmount,
      restDayOtAmount,
      specialHolidayAmount,
      specialHolidayOtAmount,
      specialHolidayRestDayAmount,
      specialHolidayRestDayOtAmount,
      regularHolidayAmount,
      regularHolidayOtAmount,
      regularHolidayRestDayAmount,
      regularHolidayRestDayOtAmount,
      ordinaryNsdAmount,
      restDayNsdAmount,
      specialHolidayNsdAmount,
      specialHolidayRestDayNsdAmount,
      regularHolidayNsdAmount,
      regularHolidayRestDayNsdAmount,
      ordinaryNightOtAmount,
      restDayNightOtAmount,
      specialHolidayNightOtAmount,
      specialHolidayRestDayNightOtAmount,
      regularHolidayNightOtAmount,
      regularHolidayRestDayNightOtAmount,
      undertimeAmount
    },
    adjHours: {
      ot, ut, restDayHours, restDayOtHours, specialHolidayHours, specialHolidayOtHours, specialHolidayRestDayHours, 
      specialHolidayRestDayOtHours, regularHolidayHours, regularHolidayOtHours, regularHolidayRestDayHours, 
      regularHolidayRestDayOtHours, ordinaryNightHours, restDayNightHours, specialHolidayNightHours, 
      specialHolidayRestDayNightHours, regularHolidayNightHours, regularHolidayRestDayNightHours, ordinaryNightOtHours, 
      restDayNightOtHours, specialHolidayNightOtHours, specialHolidayRestDayNightOtHours, regularHolidayNightOtHours, 
      regularHolidayRestDayNightOtHours
    }
  };
};

export const formatCurrency = (val: any) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return '₱0';
  return `₱${num.toLocaleString()}`;
};
