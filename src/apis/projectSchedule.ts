import { supabase } from '../lib/supabaseClient';

export type LegacyScheduleTask = {
  id?: string;
  code: string;
  name: string;
  category: string;
  parentCode: string;
  duration: number | string;
  targetStart: string;
  targetEnd: string;
  actualStart: string;
  actualEnd: string;
  targetQty: number | string;
  actualQty: number | string;
  weight: number | string;
  computedProgress: number;
  status: string;
  remarks: string;
  created_by?: string | null;
};

type ProjectScheduleRow = Record<string, unknown> & {
  id?: string;
  project_id?: string;
  task_code?: string;
  task_name?: string;
};

const asText = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const asNumberOrEmpty = (value: unknown): number | '' => {
  if (value === null || value === undefined || value === '') return '';
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : '';
};

const asNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

function mapRow(row: ProjectScheduleRow): LegacyScheduleTask {
  const code = asText(row.task_code).trim();

  return {
    id: row.id ? String(row.id) : undefined,
    code,
    name: asText(row.task_name).trim(),
    category: asText(row.category) || code.charAt(0),
    parentCode:
      asText(row.parent_code) ||
      (code.includes('.') ? code.split('.').slice(0, -1).join('.') : ''),
    duration: asNumberOrEmpty(row.duration),
    targetStart: asText(row.target_start),
    targetEnd: asText(row.target_end),
    actualStart: asText(row.actual_start),
    actualEnd: asText(row.actual_end),
    targetQty: asNumberOrEmpty(row.target_qty),
    actualQty: asNumberOrEmpty(row.actual_qty),
    weight: asNumberOrEmpty(row.weight),
    computedProgress: asNumber(
      row.computed_progress ?? row.progress ?? row.progress_percent
    ),
    status: asText(row.status) || 'Not Started',
    remarks: asText(row.remarks),
    created_by: row.created_by ? String(row.created_by) : null,
  };
}

/**
 * Loads the selected project's schedule from Supabase and copies it into the
 * legacy state used by renderProjectScheduleView().
 */
export async function loadProjectScheduleIntoLegacyState(
  projectId: string
): Promise<LegacyScheduleTask[]> {
  const cleanProjectId = String(projectId || '').trim();
  if (!cleanProjectId || cleanProjectId === 'all') return [];

  const { data, error } = await supabase
    .from('project_schedule_tasks')
    .select('*')
    .eq('project_id', cleanProjectId)
    .order('task_code', { ascending: true });

  if (error) {
    throw new Error(`Unable to load the project schedule: ${error.message}`);
  }

  const tasks = ((data ?? []) as ProjectScheduleRow[])
    .map(mapRow)
    .filter((task) => Boolean(task.code));

  const legacyWindow = window as any;
  legacyWindow.projectSchedules = legacyWindow.projectSchedules || {};
  legacyWindow.customProjectScheduleTasks =
    legacyWindow.customProjectScheduleTasks || {};

  const scheduleObject: Record<string, LegacyScheduleTask> = {};
  const customOptions: string[] = [];
  const builtInOptions: string[] = Array.isArray(
    legacyWindow.subtaskChargingOptions
  )
    ? legacyWindow.subtaskChargingOptions
    : [];

  for (const task of tasks) {
    scheduleObject[task.code] = task;

    const builtInOption = builtInOptions.find((option) =>
      String(option).trim().startsWith(`${task.code} - `)
    );

    // Built-in WBS codes must not be added again as custom options.
    // Their Supabase values are already stored in scheduleObject[task.code].
    // Adding the same code with a different name creates duplicate rows such
    // as B1 and another expandable B1 parent.
    if (!builtInOption) {
      const backendOption = `${task.code} - ${task.name || task.code}`;
      customOptions.push(backendOption);
    }
  }

  legacyWindow.projectSchedules[cleanProjectId] = scheduleObject;
  legacyWindow.customProjectScheduleTasks[cleanProjectId] = [
    ...new Set(customOptions),
  ];
  legacyWindow.__projectScheduleLoadedProjectId = cleanProjectId;

  return tasks;
}

export async function saveProjectScheduleTask(
  projectId: string,
  taskCode: string,
  taskName: string,
  taskData: Partial<LegacyScheduleTask>
): Promise<ProjectScheduleRow> {
  const cleanProjectId = String(projectId || '').trim();
  const cleanTaskCode = String(taskCode || '').trim();

  if (!cleanProjectId || cleanProjectId === 'all') {
    throw new Error('Please select a project first.');
  }
  if (!cleanTaskCode) {
    throw new Error('Task code is required.');
  }

  const payload = {
    project_id: cleanProjectId,
    task_code: cleanTaskCode,
    task_name: String(taskName || taskData.name || cleanTaskCode).trim(),
    category: taskData.category || cleanTaskCode.charAt(0),
    parent_code:
      taskData.parentCode ||
      (cleanTaskCode.includes('.')
        ? cleanTaskCode.split('.').slice(0, -1).join('.')
        : ''),
    duration: Number(taskData.duration || 0),
    target_start: taskData.targetStart || null,
    target_end: taskData.targetEnd || null,
    actual_start: taskData.actualStart || null,
    actual_end: taskData.actualEnd || null,
    target_qty: Number(taskData.targetQty || 0),
    actual_qty: Number(taskData.actualQty || 0),
    weight: Number(taskData.weight || 0),
    computed_progress: Number(taskData.computedProgress || 0),
    status: taskData.status || 'Not Started',
    remarks: taskData.remarks || '',
    updated_at: new Date().toISOString(),
  };

  const existingId = taskData.id;
  const query = existingId
    ? supabase
        .from('project_schedule_tasks')
        .update(payload)
        .eq('id', existingId)
        .eq('project_id', cleanProjectId)
    : supabase.from('project_schedule_tasks').upsert(payload, {
        onConflict: 'project_id,task_code',
      });

  const { data, error } = await query.select('*').single();

  if (error) {
    throw new Error(`Unable to save the project schedule: ${error.message}`);
  }

  return data as ProjectScheduleRow;
}

// Make the same functions available to the legacy JavaScript module.
if (typeof window !== 'undefined') {
  const legacyWindow = window as any;

  legacyWindow.loadProjectScheduleFromSupabase = async (
    requestedProjectId?: string
  ) => {
    const projectId =
      requestedProjectId ||
      legacyWindow.currentProjectId ||
      legacyWindow.__projectScheduleLoadedProjectId;

    if (!projectId) return [];
    return loadProjectScheduleIntoLegacyState(String(projectId));
  };

  legacyWindow.saveProjectScheduleTaskToSupabase = async (
    taskCode: string,
    taskName: string,
    taskData: Partial<LegacyScheduleTask> = {}
  ) => {
    const projectId = legacyWindow.currentProjectId;
    return saveProjectScheduleTask(
      String(projectId || ''),
      taskCode,
      taskName,
      taskData
    );
  };
}
