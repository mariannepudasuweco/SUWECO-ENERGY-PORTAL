import { pdfRawData } from './pdfSource';

export interface ChecklistItem {
  id: string;
  row: number;
  checked: boolean;
  item_no: string;
  item: string;
  department: string;
  date_started: string;
  due_date: string;
  priority: string;
  date_submitted: string;
  released_date: string;
  status: string;
  remarks: string;
  link: string;
  requirement: string;
  section: string;
  subsection: string;
}

export const originalItems: ChecklistItem[] = pdfRawData
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.startsWith('Phase|'))
  .map((line, idx) => {
    const [phase, category, task, subtask, dept, status, link] = line.split('|');
    return {
      id: `row-${idx + 1}`,
      row: idx + 1,
      checked: status === 'DONE' || status === 'COMPLETED' || status === 'Completed',
      item_no: '',
      item: subtask || task || category,
      department: dept || '',
      date_started: '',
      due_date: '',
      priority: '',
      date_submitted: '',
      released_date: '',
      status: status || 'NOT YET STARTED',
      remarks: '',
      link: link || '',
      requirement: phase || 'Uncategorized',
      section: category || 'General',
      subsection: task || '',
    };
  });
