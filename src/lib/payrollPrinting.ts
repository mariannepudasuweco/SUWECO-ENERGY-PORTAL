
import { calculateEmployeePayroll, ACTIVITIES, formatCurrency } from './payrollUtils';

export const generatePrintInternalHTML = (type: 'local' | 'manila', data: {
  attendance: any[];
  projectName: string;
  weekStart: string;
  weekEnd: string;
  locationFilter: string;
  selectedEmployees?: string[];
}) => {
  const { attendance, projectName, weekStart, weekEnd, locationFilter, selectedEmployees } = data;
  let printContent = '';

  const isEmployeeActive = (emp: any) => {
    if (selectedEmployees && selectedEmployees.length > 0) {
      return selectedEmployees.includes(emp.id);
    }
    const hasOt = emp.ot && parseFloat(emp.ot) > 0;
    const hasUt = emp.ut && parseFloat(emp.ut) > 0;
    const hasSss = emp.sss && parseFloat(emp.sss) > 0;
    const hasPhilhealth = emp.philhealth && parseFloat(emp.philhealth) > 0;
    const hasPagibig = emp.pagibig && parseFloat(emp.pagibig) > 0;
    const hasTax = emp.tax && parseFloat(emp.tax) > 0;
    const hasAdjustments = emp.adjustments && Object.values(emp.adjustments).some((val: any) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    });
    const hasAdvances = emp.cashAdvances && emp.cashAdvances.length > 0;
    return !!(hasOt || hasUt || hasSss || hasPhilhealth || hasPagibig || hasTax || hasAdjustments || hasAdvances);
  };

  if (type === 'local') {
    const filteredAttendance = attendance
      .filter(emp => locationFilter === 'All' || emp.location === locationFilter)
      .filter(isEmployeeActive);
    const adjFields = [
      { key: 'restDayHours', label: 'RD' },
      { key: 'restDayOtHours', label: 'RD OT' },
      { key: 'restDayNightOtHours', label: 'RD NS OT' },
      { key: 'regularHolidayHours', label: 'RH' },
      { key: 'regularHolidayOtHours', label: 'RH OT' },
      { key: 'specialHolidayHours', label: 'SH' },
      { key: 'specialHolidayOtHours', label: 'SH OT' },
      { key: 'ordinaryNightHours', label: 'NSD' },
      { key: 'specialHolidayNightHours', label: 'SH NSD' }
    ];

    const activeAdjs = adjFields.filter(field => 
      filteredAttendance.some(e => e.adjustments && e.adjustments[field.key] && parseFloat(e.adjustments[field.key]) > 0)
    );

    printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weekly Attendance Sheet</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; width: 100%; margin: 0; padding: 0; }
            h2, h3 { text-align: center; margin: 2px 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 4px; text-align: center; font-size: 9px; color: #000; }
            th { font-weight: bold; color: #1f2937; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .signature-box { width: 200px; text-align: center; border-top: 1px solid #000; padding-top: 5px; }
            .legend { font-size: 10px; line-height: 1.2; }
            .bg-half { background-color: #8bc34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: transparent !important; }
            .bg-absent { background-color: #ff0000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: transparent !important; }
            .bg-whole { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='black' stroke-width='1.5'/%3E%3Cline x1='100%25' y1='0' x2='0' y2='100%25' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") !important; background-size: 100% 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: transparent !important; }
          </style>
        </head>
        <body>
          <h2>Payroll Management System</h2>
          <h3>Weekly Attendance Sheet</h3>
          <div style="text-align: center;">Project: ${projectName || 'N/A'}</div>
          <div style="text-align: center;">Payroll Period: ${weekStart} to ${weekEnd}</div>
          
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Rate</th>
                <th>SUN</th><th>MON</th><th>TUE</th><th>WED</th><th>THU</th><th>FRI</th><th>SAT</th>
                <th>Days</th>
                <th>OT</th>
                <th>UT</th>
                ${activeAdjs.map(f => `<th>${f.label}</th>`).join('')}
                <th>Gross</th>
                <th>SSS</th>
                <th>PHIC</th>
                <th>Pag-IBIG</th>
                <th>Total Ded.</th>
                <th>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAttendance.map((emp, idx) => {
                const daysList = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                const { gross, days: numDays, sssVal, phVal, pagibigVal, totalDeduction, netPay } = calculateEmployeePayroll(emp);
                const adj = emp.adjustments || {};
                
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${emp.id}</td>
                    <td class="text-left">${emp.name}</td>
                    <td>${formatCurrency(emp.rate)}</td>
                    ${daysList.map((_, i) => {
                      const d = emp.days[i] || '-';
                      let cellClass = '';
                      if (d === 'X') cellClass = 'bg-whole';
                      else if (d === '1/2') cellClass = 'bg-half';
                      else if (d === 'A') cellClass = 'bg-absent';
                      return `<td class="${cellClass}" style="width: 20px; height: 16px;">${d === '-' ? '' : d === '1/2' ? '½' : d}</td>`
                    }).join('')}
                    <td>${numDays}</td>
                    <td>${emp.ot || 0}</td>
                    <td>${emp.ut || 0}</td>
                    ${activeAdjs.map(f => `<td>${adj[f.key] || 0}</td>`).join('')}
                    <td>${formatCurrency(gross)}</td>
                    <td>${formatCurrency(sssVal)}</td>
                    <td>${formatCurrency(phVal)}</td>
                    <td>${formatCurrency(pagibigVal)}</td>
                    <td>${formatCurrency(totalDeduction)}</td>
                    <td>${formatCurrency(netPay)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
            <div style="font-size: 10px; line-height: 1.4;">
              <table style="border: none; margin: 0; padding: 0;">
                <tr style="border: none;">
                  <td style="border: none; font-weight: bold; text-align: right; padding: 2px 4px; border: none !important;"></td>
                  <td style="border: none; text-align: right; padding: 2px 4px; border: none !important;">-</td>
                  <td style="border: none; text-align: left; padding: 2px 4px; border: none !important;">Sunday is on per hour basis x 130.00%</td>
                </tr>
                <tr style="border: none;">
                  <td style="border: none; font-weight: bold; text-align: right; padding: 2px 4px; border: none !important;">**</td>
                  <td style="border: none; text-align: right; padding: 2px 4px; border: none !important;">-</td>
                  <td style="border: none; text-align: left; padding: 2px 4px; border: none !important;">includes Sunday work which is x 130.00%</td>
                </tr>
                <tr style="border: none;">
                  <td style="border: none; font-weight: bold; text-align: right; padding: 2px 4px; border: none !important;">***</td>
                  <td style="border: none; text-align: right; padding: 2px 4px; border: none !important;">-</td>
                  <td style="border: none; text-align: left; padding: 2px 4px; border: none !important;">includes Sunday Meal Allowance if at the site</td>
                </tr>
                <tr style="border: none;">
                  <td style="border: none; font-weight: bold; text-align: right; padding: 2px 4px; border: none !important;">Computation of OT</td>
                  <td style="border: none; text-align: right; padding: 2px 4px; border: none !important;">-</td>
                  <td style="border: none; text-align: left; padding: 2px 4px; border: none !important;">(Daily Rate/8.00) x [(OT Hrs x 1.25) + (Sunday Hrs x 1.3)]</td>
                </tr>
              </table>
            </div>

            <div class="legend" style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 14px; border: 1px solid #000; background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='black' stroke-width='1.5'/%3E%3Cline x1='100%25' y1='0' x2='0' y2='100%25' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E&quot;); background-size: 100% 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
                <span style="font-size: 10px; font-weight: normal; color: #000;">- Whole Day</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 14px; border: 1px solid #000; background-color: #8bc34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
                <span style="font-size: 10px; font-weight: normal; color: #000;">- Half Day</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 14px; border: 1px solid #000; background-color: #ff0000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
                <span style="font-size: 10px; font-weight: normal; color: #000;">- Absent</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Prepared by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px; text-transform: uppercase;">MARY ROSE BELGA</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">HR ASSIST./ PAYROLL MASTER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Checked by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">STEVEN JAY TOLEDO</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">DEPUTY PROJECT MANAGER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Approved by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">JONATHAN IAN SINGIAN</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">PROJECT MANAGER</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'manila') {
    const filteredAttendance = attendance
      .filter(emp => locationFilter === 'All' || emp.location === locationFilter)
      .filter(isEmployeeActive);
    const adjFieldsManila = [
      { key: 'ordinaryNightHours', amountKey: 'ordinaryNsdAmount', label1: 'ND - BASIC', label2: 'w/in 8hrs', title: '(0.10 x DBP)' },
      { key: 'ordinaryNightOtHours', amountKey: 'ordinaryNightOtAmount', label1: 'ND - OT', label2: 'work beyond 8hrs', title: '(1.375 x DBP)' },
      { key: 'restDayHours', amountKey: 'restDayAmount', label1: 'REST DAY', label2: 'work w/in 8hrs', title: '(1.30 x DBP)' },
      { key: 'restDayOtHours', amountKey: 'restDayOtAmount', label1: 'REST DAY-OT', label2: 'RD OT > 8', title: '(1.69 x DBP)' },
      { key: 'restDayNightHours', amountKey: 'restDayNsdAmount', label1: 'RD - ND', label2: 'RD ND', title: '(1.43 x DBP)' },
      { key: 'restDayNightOtHours', amountKey: 'restDayNightOtAmount', label1: 'ND-RD OT', label2: 'ID RD > 8 hrs', title: '(1.859 x DBP)' },
      { key: 'specialHolidayHours', amountKey: 'specialHolidayAmount', label1: 'SPL HOL.', label2: 'work w/in 8hrs', title: '(1.30 x DBP)' },
      { key: 'specialHolidayOtHours', amountKey: 'specialHolidayOtAmount', label1: 'SPL HOL-OT', label2: 'SH OT > 8 hrs', title: '(1.69 x DBP)' },
      { key: 'specialHolidayNightHours', amountKey: 'specialHolidayNsdAmount', label1: 'SH - ND', label2: 'SH ND', title: '(1.43 x DBP)' },
      { key: 'specialHolidayNightOtHours', amountKey: 'specialHolidayNightOtAmount', label1: 'ND-SH OT', label2: 'ND SH > 8 hrs', title: '(1.859 x DBP)' },
      { key: 'specialHolidayRestDayHours', amountKey: 'specialHolidayRestDayAmount', label1: 'SH REST DAY', label2: 'w/in 8hrs', title: '(1.50 x DBP)' },
      { key: 'specialHolidayRestDayOtHours', amountKey: 'specialHolidayRestDayOtAmount', label1: 'SH REST DAY-OT', label2: 'OT > 8 hrs', title: '(1.95 x DBP)' },
      { key: 'specialHolidayRestDayNightHours', amountKey: 'specialHolidayRestDayNsdAmount', label1: 'SH RD ND', label2: 'SH RD ND', title: '(1.65 x DBP)' },
      { key: 'specialHolidayRestDayNightOtHours', amountKey: 'specialHolidayRestDayNightOtAmount', label1: 'SH RD ND-OT', label2: 'SH RD ND OT', title: '(2.145 x DBP)' },
      { key: 'regularHolidayNightHours', amountKey: 'regularHolidayNsdAmount', label1: 'REG HOL ND', label2: 'w/in 8hrs', title: '(2.20 x DBP)' },
      { key: 'regularHolidayNightOtHours', amountKey: 'regularHolidayNightOtAmount', label1: 'REG HOL ND-OT', label2: 'LH > 8h', title: '(2.86 x DBP)' },
      { key: 'regularHolidayRestDayHours', amountKey: 'regularHolidayRestDayAmount', label1: 'REG HOL RD', label2: 'w/in 8hrs', title: '(2.60 x DBP)' },
      { key: 'regularHolidayRestDayOtHours', amountKey: 'regularHolidayRestDayOtAmount', label1: 'REG HOL RD-OT', label2: 'OT > 8 hrs', title: '(3.38 x DBP)' },
      { key: 'regularHolidayRestDayNightHours', amountKey: 'regularHolidayRestDayNsdAmount', label1: 'RG HL RD ND', label2: 'RH RD ND', title: '(2.86 x DBP)' },
      { key: 'regularHolidayRestDayNightOtHours', amountKey: 'regularHolidayRestDayNightOtAmount', label1: 'RG HL RD ND-OT', label2: 'RD ND OT', title: '(3.718 x DBP)' },
    ];
    
    const activeAdjsManila = adjFieldsManila.filter(field => 
      filteredAttendance.some(e => e.adjustments && parseFloat(e.adjustments[field.key]) > 0)
    );

    let grandTotalGross = 0;
    let grandTotalSss = 0;
    let grandTotalPhilhealth = 0;
    let grandTotalHdmf = 0;
    let grandTotalNet = 0;
    let grandTotalDays = 0;
    let grandTotalBasic = 0;
    let grandTotalUtHours = 0;
    let grandTotalUtAmount = 0;
    let grandTotalOvertime = 0;
    let grandTotalOtHours = 0;
    let grandTotalOtAmount = 0;
    let grandTotalLhHours = 0;
    let grandTotalLhAmount = 0;
    let grandTotalLhOtHours = 0;
    let grandTotalLhOtAmount = 0;
    let grandTotalDirectNet = 0;
    let grandTotalIndirectNet = 0;

    const grandTotalAdjs: Record<string, { hrs: number, amt: number }> = {};
    activeAdjsManila.forEach(f => { grandTotalAdjs[f.key] = { hrs: 0, amt: 0 }; });

    const recordsHtml = filteredAttendance.map((emp, idx) => {
      const { gross, basic, days: numDays, sssVal, phVal, pagibigVal, totalDeduction, netPay, adjAmounts } = calculateEmployeePayroll(emp);
      const isIndirect = emp.position && (emp.position.toLowerCase().includes('indirect') || emp.position.toLowerCase().includes('admin') || emp.position.toLowerCase().includes('timekeeper') || emp.position.toLowerCase().includes('operator') || emp.position.toLowerCase().includes('warehouse'));
      const hcType = isIndirect ? 'INDIRECT' : 'DIRECT';
      const hourlyRate = typeof emp.rate === 'string' ? parseFloat(emp.rate) / 8 : emp.rate / 8;
      const utHours = parseFloat(emp.ut) || 0;
      const utAmount = utHours * hourlyRate;
      const otHours = parseFloat(emp.ot) || 0;
      const otAmount = otHours * hourlyRate * 1.25;
      const adj = emp.adjustments || {};

      let dynamicAdjsHtml = '';
      activeAdjsManila.forEach(f => {
        const hrs = parseFloat(adj[f.key]) || 0;
        const amt = adjAmounts?.[f.amountKey as keyof typeof adjAmounts] || 0;
        grandTotalAdjs[f.key].hrs += hrs;
        grandTotalAdjs[f.key].amt += amt;
        dynamicAdjsHtml += `<td class="currency">${hrs > 0 ? hrs.toFixed(2) : '-'}</td><td class="currency">${amt > 0 ? amt.toFixed(2) : '-'}</td>`;
      });

      const lhHours = parseFloat(adj.regularHolidayHours) || 0;
      const lhAmount = adjAmounts?.regularHolidayAmount || (lhHours * hourlyRate * 2.0);
      const lhOtHours = parseFloat(adj.regularHolidayOtHours) || 0;
      const lhOtAmount = adjAmounts?.regularHolidayOtAmount || (lhOtHours * hourlyRate * 2.60);
      
      // TOTAL OT TOT is basically all adjustment amounts (which includes OT, LH, rest days, NSD, etc.)
      const totalOvertime = Math.max(0, gross - basic + utAmount);

      grandTotalDays += numDays;
      grandTotalBasic += basic;
      grandTotalGross += gross;
      grandTotalSss += sssVal;
      grandTotalPhilhealth += phVal;
      grandTotalHdmf += pagibigVal;
      grandTotalNet += netPay;
      grandTotalUtHours += utHours;
      grandTotalUtAmount += utAmount;
      grandTotalOvertime += totalOvertime;
      grandTotalOtHours += otHours;
      grandTotalOtAmount += otAmount;
      grandTotalLhHours += lhHours;
      grandTotalLhAmount += lhAmount;
      grandTotalLhOtHours += lhOtHours;
      grandTotalLhOtAmount += lhOtAmount;
      if (hcType === 'DIRECT') grandTotalDirectNet += netPay; else grandTotalIndirectNet += netPay;

      return `
        <tr>
          <td>${idx + 1}</td><td>${hcType}</td><td>${emp.id || ''}</td><td class="text-left">${emp.name || ''}</td><td>${emp.position || ''}</td>
          <td>${emp.taxStatus || (hcType === 'INDIRECT' ? 'MWE' : 'NMWE')}</td><td>STEC - ALC</td><td class="currency">${(typeof emp.rate === 'string' ? parseFloat(emp.rate) : emp.rate).toFixed(2)}</td>
          <td>${numDays}</td><td class="currency">${basic.toFixed(2)}</td><td class="currency">${utHours > 0 ? utHours.toFixed(2) : '-'}</td>
          <td class="currency">${utAmount > 0 ? utAmount.toFixed(2) : '-'}</td>${dynamicAdjsHtml}<td style="color: blue" class="currency">${totalOvertime > 0 ? totalOvertime.toFixed(2) : '-'}</td>
          <td class="currency">${otHours > 0 ? otHours.toFixed(2) : '-'}</td><td class="currency">${otAmount > 0 ? otAmount.toFixed(2) : '-'}</td>
          <td class="currency">${lhHours > 0 ? lhHours.toFixed(2) : '-'}</td><td class="currency">${lhAmount > 0 ? lhAmount.toFixed(2) : '-'}</td>
          <td class="currency">${lhOtHours > 0 ? lhOtHours.toFixed(2) : '-'}</td><td class="currency">${lhOtAmount > 0 ? lhOtAmount.toFixed(2) : '-'}</td>
          <td>-</td><td class="currency">${gross.toFixed(2)}</td><td class="currency">${sssVal > 0 ? sssVal.toFixed(2) : '-'}</td>
          <td class="currency">${phVal > 0 ? phVal.toFixed(2) : '-'}</td><td class="currency">${pagibigVal > 0 ? pagibigVal.toFixed(2) : '-'}</td>
          <td class="currency" style="font-weight: bold;">${netPay.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payroll Register</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Calibri, Arial, sans-serif; font-size: 8px; color: #000; background: #fff; width: 100%; margin: 0; padding: 0; }
            .header-table { width: auto; font-size: 10px; font-weight: bold; line-height: 1.2; margin-bottom: 10px; }
            .header-table td { padding: 1px 4px; border: none; text-align: left;}
            .header-table .highlight { background-color: #ffff00; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1px 20px;}
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { border: 1px solid #000; padding: 4px 2px; text-align: center; font-size: 8px; white-space: nowrap; }
            th { background-color: #fff9c4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #000; font-weight: bold;}
            .text-left { text-align: left; } .currency { text-align: right; padding-right: 4px; }
            .totals-row td { font-weight: bold; border-top: 3px double #000 !important; border-bottom: 3px double #000 !important; }
            .totals-net { color: #d32f2f !important; font-weight: bold; }
            .summary-block { margin-top: 15px; float: right; width: 200px; border-collapse: collapse; margin-bottom: 20px; }
            .summary-block td { padding: 4px 8px; border: 1px solid #000; font-weight: bold; font-size: 9px; }
            .summary-block td:first-child { text-align: left; } .summary-block td:last-child { text-align: right; color: #000; }
            .signature-section { margin-top: 60px; display: flex; justify-content: flex-start; gap: 100px; padding-left: 20px; font-size: 9px; }
            .sig-block { display: flex; flex-direction: column; } .sig-title { margin-bottom: 20px; } .sig-name { font-weight: bold; } .sig-role { font-style: italic; }
          </style>
        </head>
        <body>
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">SUWECO TABLAS ENERGY CORP. ALCANTARA, ROMBLON</div>
          <table class="header-table">
            <tr><td>PAYROLL REGISTER</td><td></td></tr>
            <tr><td>Payout Cut-Off</td><td class="highlight">${weekStart} - ${weekEnd}</td></tr>
            <tr><td>Payout Date</td><td class="highlight">UPCOMING</td></tr>
          </table>
          <table>
            <thead>
              <tr>
                <th rowspan="4">HC</th><th rowspan="4">EMP TYPE</th><th rowspan="4">EMP NO</th><th rowspan="4">NAME</th><th rowspan="4">POSITION</th><th rowspan="4">TAX</th><th rowspan="4">CC</th><th rowspan="4">DR</th><th rowspan="4">DAYS</th><th rowspan="4">WEEKLY</th>
                <th colspan="2" rowspan="2">UT</th>
                ${activeAdjsManila.map(f => `<th colspan="2">${f.label1}</th>`).join('')}
                <th rowspan="2">TOTAL</th>
                <th colspan="2">OT</th><th colspan="2">LH</th><th colspan="2">LH-OT</th>
                <th rowspan="3">ADJ (-)</th><th rowspan="4">GROSS</th>
                <th colspan="3" rowspan="2">PREMIUMS</th><th rowspan="4">NET</th>
              </tr>
              <tr>
                ${activeAdjsManila.map(f => `<th colspan="2">${f.label2 || '-'}</th>`).join('')}
                <th colspan="2">beyond 8h</th><th colspan="2">w/in 8h</th><th colspan="2">LH > 8h</th>
              </tr>
              <tr>
                <th rowspan="2">HRS</th><th rowspan="2">AMT</th>
                ${activeAdjsManila.map(f => `<th colspan="2">${f.title}</th>`).join('')}
                <th rowspan="2">OT TOT</th>
                <th colspan="2">1.25</th><th colspan="2">200%</th><th colspan="2">2.6</th>
                <th rowspan="2">SSS</th><th rowspan="2">PH</th><th rowspan="2">HDMF</th>
              </tr>
              <tr>
                ${activeAdjsManila.map(f => `<th>HRS</th><th>AMT</th>`).join('')}
                <th>HRS</th><th>AMT</th><th>HRS</th><th>AMT</th><th>HRS</th><th>AMT</th><th>BASIC</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHtml}
              <tr class="totals-row">
                <td colspan="8"></td><td>${grandTotalDays.toFixed(2)}</td><td class="currency">${grandTotalBasic.toFixed(2)}</td>
                <td class="currency">${grandTotalUtHours > 0 ? grandTotalUtHours.toFixed(2) : '-'}</td><td class="currency">${grandTotalUtAmount > 0 ? grandTotalUtAmount.toFixed(2) : '-'}</td>
                ${activeAdjsManila.map(f => `<td class="currency">${grandTotalAdjs[f.key].hrs > 0 ? grandTotalAdjs[f.key].hrs.toFixed(2) : '-'}</td><td class="currency">${grandTotalAdjs[f.key].amt > 0 ? grandTotalAdjs[f.key].amt.toFixed(2) : '-'}</td>`).join('')}
                <td class="currency">${grandTotalOvertime > 0 ? grandTotalOvertime.toFixed(2) : '-'}</td><td class="currency">${grandTotalOtHours > 0 ? grandTotalOtHours.toFixed(2) : '-'}</td>
                <td class="currency">${grandTotalOtAmount > 0 ? grandTotalOtAmount.toFixed(2) : '-'}</td><td class="currency">${grandTotalLhHours > 0 ? grandTotalLhHours.toFixed(2) : '-'}</td>
                <td class="currency">${grandTotalLhAmount > 0 ? grandTotalLhAmount.toFixed(2) : '-'}</td><td class="currency">${grandTotalLhOtHours > 0 ? grandTotalLhOtHours.toFixed(2) : '-'}</td>
                <td class="currency">${grandTotalLhOtAmount > 0 ? grandTotalLhOtAmount.toFixed(2) : '-'}</td><td>-</td><td class="currency">${grandTotalGross.toFixed(2)}</td>
                <td class="currency">${grandTotalSss > 0 ? grandTotalSss.toFixed(2) : '-'}</td><td class="currency">${grandTotalPhilhealth > 0 ? grandTotalPhilhealth.toFixed(2) : '-'}</td>
                <td class="currency">${grandTotalHdmf > 0 ? grandTotalHdmf.toFixed(2) : '-'}</td><td class="currency totals-net">${grandTotalNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Prepared by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px; text-transform: uppercase;">MARY ROSE BELGA</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">HR ASSIST./ PAYROLL MASTER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Checked by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">STEVEN JAY TOLEDO</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">DEPUTY PROJECT MANAGER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 10px; font-weight: bold; text-align: left;">Approved by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">JONATHAN IAN SINGIAN</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 10px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">PROJECT MANAGER</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  return printContent;
};

export const generatePrintManpowerInternalHTML = (type: 'matrix' | 'summary', data: {
  attendance: any[];
  allocations: any;
  projectName: string;
  weekStart: string;
  weekEnd: string;
  locationFilter: string;
  selectedEmployees?: string[];
}) => {
  const { attendance, allocations, projectName, weekStart, weekEnd, locationFilter, selectedEmployees } = data;

  const isEmployeeActive = (emp: any) => {
    if (selectedEmployees && selectedEmployees.length > 0) {
      return selectedEmployees.includes(emp.id);
    }
    const hasOt = emp.ot && parseFloat(emp.ot) > 0;
    const hasUt = emp.ut && parseFloat(emp.ut) > 0;
    const hasSss = emp.sss && parseFloat(emp.sss) > 0;
    const hasPhilhealth = emp.philhealth && parseFloat(emp.philhealth) > 0;
    const hasPagibig = emp.pagibig && parseFloat(emp.pagibig) > 0;
    const hasTax = emp.tax && parseFloat(emp.tax) > 0;
    const hasAdjustments = emp.adjustments && Object.values(emp.adjustments).some((val: any) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    });
    const hasAdvances = emp.cashAdvances && emp.cashAdvances.length > 0;
    return !!(hasOt || hasUt || hasSss || hasPhilhealth || hasPagibig || hasTax || hasAdjustments || hasAdvances);
  };
  
  if (type === 'summary') {
    const activityTotals: Record<string, number[]> = {};
    ACTIVITIES.forEach(act => { activityTotals[act.code] = [0, 0, 0, 0, 0, 0, 0]; });
    attendance.filter(isEmployeeActive).forEach(emp => {
      emp.days.forEach((val: string, i: number) => {
        if (val !== 'A') {
          const code = allocations?.[emp.id]?.[i];
          if (code && code !== '-') {
            const cost = emp.rate * (val === 'X' ? 1 : val === '1/2' ? 0.5 : 0);
            if (activityTotals[code]) activityTotals[code][i] += cost;
          }
        }
      });
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Allocation Summary</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 6px 4px; text-align: center; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <h2>Payroll Management System</h2>
          <h3>Allocation Summary per Activity</h3>
          <div style="text-align: center;">Project: ${projectName || 'N/A'} | Period: ${weekStart} to ${weekEnd}</div>
          <table>
            <thead>
              <tr><th>Activity Code</th><th>Title</th><th>SUN</th><th>MON</th><th>TUE</th><th>WED</th><th>THU</th><th>FRI</th><th>SAT</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              ${ACTIVITIES.map(act => {
                const totals = activityTotals[act.code] || [0,0,0,0,0,0,0];
                const sum = totals.reduce((a,b)=>a+b,0);
                if (sum === 0) return '';
                return `<tr>
                  <td>${act.code}</td><td>${act.name}</td>
                  ${totals.map(t => `<td>P ${t.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>`).join('')}
                  <td style="font-weight:bold;">P ${sum.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Prepared by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px; text-transform: uppercase;">MARY ROSE BELGA</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">HR ASSIST./ PAYROLL MASTER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Checked by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">STEVEN JAY TOLEDO</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">DEPUTY PROJECT MANAGER</div>
              </div>
              <div style="width: 30%; text-align: center;">
                <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Approved by:</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">JONATHAN IAN SINGIAN</div>
                <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">PROJECT MANAGER</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Matrix printout based on reference image
  const activeEmps = attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter).filter(isEmployeeActive);
  const grandTotalNetPay = activeEmps.reduce((sum, emp) => sum + calculateEmployeePayroll(emp).netPay, 0);

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Employee Manpower Matrix</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; }
          .header-container { margin-bottom: 20px; font-family: Arial, sans-serif; text-align: left; }
          .company-name { color: #0070c0; font-weight: bold; font-size: 16px; margin-bottom: 4px; }
          .location { font-weight: bold; font-size: 12px; margin-bottom: 15px; }
          .project-name { color: red; font-weight: bold; font-size: 14px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; text-align: center; }
          th, td { border: 1px solid #000; padding: 10px 4px; }
          .no-col { width: 40px; }
          .name-col { width: 250px; text-align: left; padding-left: 8px; }
          .now-col { width: 150px; }
          .day-col { width: 50px; }
          .total-col { width: 100px; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="company-name">SUWECO TABLAS ENERGY CORPORATION</div>
          <div class="location">POBLACION, ALCANTARA, ROMBLON</div>
          <div class="project-name">PROJECT : ${projectName || 'ALCANTARA DIESEL POWER PLANT PROJECT'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" class="no-col">No.</th>
              <th rowspan="2" class="name-col" style="text-align: center; padding-left: 4px;">Name</th>
              <th colspan="7"></th>
              <th rowspan="2" style="color: red; font-weight: bold;" class="total-col">TOTAL (NET PAY)</th>
            </tr>
            <tr>
              <th style="color: red; font-weight: bold;" class="day-col">SUN</th>
              <th style="font-weight: bold;" class="day-col">MON</th>
              <th style="font-weight: bold;" class="day-col">TUE</th>
              <th style="font-weight: bold;" class="day-col">WED</th>
              <th style="font-weight: bold;" class="day-col">THU</th>
              <th style="font-weight: bold;" class="day-col">FRI</th>
              <th style="font-weight: bold;" class="day-col">SAT</th>
            </tr>
          </thead>
          <tbody>
            ${activeEmps.map((emp, idx) => {
              const daysAlloc = [0,1,2,3,4,5,6].map(i => allocations?.[emp.id]?.[i] && allocations?.[emp.id]?.[i] !== '-' ? allocations[emp.id][i] : '');
              const { netPay } = calculateEmployeePayroll(emp);
              return `
                <tr>
                  <td style="font-weight: bold;">${idx + 1}</td>
                  <td class="name-col" style="font-weight: bold;">${emp.name}</td>
                  ${daysAlloc.map(alloc => `<td>${alloc}</td>`).join('')}
                  <td style="font-weight: bold; text-align: right; padding-right: 8px;">₱${netPay.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              `;
            }).join('')}
            <tr>
              <td colspan="9" style="font-weight: bold; text-align: right; padding-right: 8px;">GRAND TOTAL</td>
              <td style="font-weight: bold; text-align: right; padding-right: 8px; color: red;">₱${grandTotalNetPay.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 30%; text-align: center;">
              <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Prepared by:</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px; text-transform: uppercase;">MARY ROSE BELGA</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">HR ASSIST./ PAYROLL MASTER</div>
            </div>
            <div style="width: 30%; text-align: center;">
              <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Checked by:</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">STEVEN JAY TOLEDO</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">DEPUTY PROJECT MANAGER</div>
            </div>
            <div style="width: 30%; text-align: center;">
              <div style="margin-bottom: 30px; font-size: 11px; font-weight: bold; text-align: left;">Approved by:</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; margin-top: 30px; border-bottom: 1px solid #000; display: inline-block; width: 80%; outline: 1px dashed #cbd5e1; outline-offset: 4px;">JONATHAN IAN SINGIAN</div>
              <div contenteditable="true" style="font-weight: bold; font-size: 11px; outline: 1px dashed #cbd5e1; outline-offset: 4px; display: inline-block;">PROJECT MANAGER</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return printContent;
};
