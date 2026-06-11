import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Grip,
  HardHat,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

type PayrollOrgChartProps = {
  employees: any[];
  projectId?: string | null;
};

type OrgAssignment = {
  id: string;
  employeeId: string;
  description: string;
  photoUrl: string;
};

type OrgConnector = {
  id: string;
  fromSectionId: string;
  toSectionId: string;
};

type OrgSection = {
  id: string;
  title: string;
  accentColor: string;
  x: number;
  y: number;
  width: number;
  maxEmployees?: number;
  assignments: OrgAssignment[];
};

type OrgChartLayout = {
  sections: OrgSection[];
  connectors: OrgConnector[];
  updatedAt?: string;
};

type ConnectorPath = {
  id: string;
  path: string;
};

type DragState = {
  sectionId: string;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
};

const DARK_BLUE = '#061a44';
const BLUE = '#2563eb';
const WHITE = '#ffffff';
const TEXT = '#111827';
const MUTED = '#64748b';
const YELLOW = '#facc15';

const CANVAS_WIDTH = 1700;
const CANVAS_HEIGHT = 900;

const DEFAULT_SECTIONS: Array<Omit<OrgSection, 'assignments'>> = [
  {
    id: 'coordinators',
    title: 'Coordinators',
    accentColor: BLUE,
    x: 40,
    y: 50,
    width: 315,
  },
  {
    id: 'project_manager',
    title: 'Project Manager',
    accentColor: DARK_BLUE,
    x: 470,
    y: 40,
    width: 430,
    maxEmployees: 1,
  },
  {
    id: 'deputy_project_manager',
    title: 'Deputy Project Manager',
    accentColor: BLUE,
    x: 470,
    y: 170,
    width: 430,
    maxEmployees: 1,
  },
  {
    id: 'civil_team',
    title: 'Civil Team',
    accentColor: BLUE,
    x: 40,
    y: 520,
    width: 300,
  },
  {
    id: 'electrical_team',
    title: 'Electrical Team',
    accentColor: BLUE,
    x: 375,
    y: 520,
    width: 300,
  },
  {
    id: 'mechanical_team',
    title: 'Mechanical Team',
    accentColor: BLUE,
    x: 710,
    y: 520,
    width: 300,
  },
  {
    id: 'admin_team',
    title: 'Admin Team',
    accentColor: BLUE,
    x: 1045,
    y: 520,
    width: 300,
  },
  {
    id: 'safety_security_team',
    title: 'Safety & Security Team',
    accentColor: BLUE,
    x: 1380,
    y: 520,
    width: 300,
  },
];

const getEmployeeId = (employee: any) =>
  String(employee?.id || employee?.employee_id || employee?.employeeId || '');

const getEmployeeName = (employee: any) => {
  const name =
    employee?.name ||
    employee?.employee_name ||
    [
      employee?.first_name || employee?.firstName,
      employee?.middle_name || employee?.middleName,
      employee?.surname || employee?.last_name || employee?.lastName,
    ]
      .filter(Boolean)
      .join(' ');

  return String(name || 'Unnamed Employee').trim();
};

const getEmployeePosition = (employee: any) =>
  String(employee?.position || employee?.designation || employee?.job_title || 'Position not set');

const getEmployeePhoto = (employee: any) =>
  String(employee?.photo_url || employee?.photoUrl || employee?.image_url || '');

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const isManagerSection = (sectionId: string) =>
  sectionId === 'project_manager' || sectionId === 'deputy_project_manager';

const isFixedTitleSection = (sectionId: string) =>
  sectionId === 'coordinators' ||
  sectionId === 'civil_team' ||
  sectionId === 'electrical_team' ||
  sectionId === 'mechanical_team' ||
  sectionId === 'admin_team' ||
  sectionId === 'safety_security_team';

const makeAssignmentId = (employeeId: string, sectionId: string) => `${sectionId}-${employeeId}`;

const makeAssignment = (employee: any, sectionId: string): OrgAssignment => {
  const employeeId = getEmployeeId(employee);

  return {
    id: makeAssignmentId(employeeId, sectionId),
    employeeId,
    description: '',
    photoUrl: getEmployeePhoto(employee) || '',
  };
};

const createEmptyLayout = (): OrgChartLayout => ({
  sections: DEFAULT_SECTIONS.map((section) => ({
    ...section,
    assignments: [],
  })),
  connectors: [],
  updatedAt: new Date().toISOString(),
});

const normalizeLayout = (
  savedLayout: Partial<OrgChartLayout> | null | undefined,
  employees: any[]
): OrgChartLayout => {
  const validEmployeeIds = new Set(employees.map(getEmployeeId).filter(Boolean));
  const validSectionIds = new Set(DEFAULT_SECTIONS.map((section) => section.id));
  const savedSections = Array.isArray(savedLayout?.sections) ? savedLayout.sections : [];
  const savedSectionMap = new Map(savedSections.map((section) => [section.id, section]));
  const usedEmployeeIds = new Set<string>();

  const sections = DEFAULT_SECTIONS.map((defaultSection) => {
    const savedSection = savedSectionMap.get(defaultSection.id);
    const savedAssignments = Array.isArray(savedSection?.assignments)
      ? savedSection.assignments
      : [];

    const assignments = savedAssignments
      .filter((assignment) => {
        const employeeId = String(assignment.employeeId);
        if (!validEmployeeIds.has(employeeId)) return false;
        if (usedEmployeeIds.has(employeeId)) return false;
        return true;
      })
      .slice(0, defaultSection.maxEmployees || undefined)
      .map((assignment) => {
        const employeeId = String(assignment.employeeId);
        const employee = employees.find((item) => getEmployeeId(item) === employeeId);

        usedEmployeeIds.add(employeeId);

        return {
          id: assignment.id || makeAssignmentId(employeeId, defaultSection.id),
          employeeId,
          description: assignment.description || '',
          photoUrl: assignment.photoUrl || getEmployeePhoto(employee) || '',
        };
      });

    return {
      ...defaultSection,
      accentColor:
        (savedSection as any)?.accentColor ||
        (savedSection as any)?.boxColor ||
        (savedSection as any)?.headerColor ||
        defaultSection.accentColor,
      x: Number.isFinite((savedSection as any)?.x)
        ? Number((savedSection as any).x)
        : defaultSection.x,
      y: Number.isFinite((savedSection as any)?.y)
        ? Number((savedSection as any).y)
        : defaultSection.y,
      width: Number.isFinite((savedSection as any)?.width)
        ? Number((savedSection as any).width)
        : defaultSection.width,
      assignments,
    };
  });

  const savedConnectors = Array.isArray(savedLayout?.connectors) ? savedLayout.connectors : [];

  const connectors = savedConnectors.filter((connector: any) => {
    const fromSectionId = String(connector.fromSectionId || '');
    const toSectionId = String(connector.toSectionId || '');

    if (!validSectionIds.has(fromSectionId)) return false;
    if (!validSectionIds.has(toSectionId)) return false;
    if (fromSectionId === toSectionId) return false;

    return true;
  });

  return {
    sections,
    connectors,
    updatedAt: savedLayout?.updatedAt || new Date().toISOString(),
  };
};

const getSectionIcon = (sectionId: string, color = BLUE) => {
  if (sectionId === 'coordinators') return <Users size={24} style={{ color }} />;
  if (sectionId === 'civil_team') return <HardHat size={24} style={{ color }} />;
  if (sectionId === 'electrical_team') return <Zap size={24} style={{ color }} />;
  if (sectionId === 'mechanical_team') return <Wrench size={24} style={{ color }} />;
  if (sectionId === 'admin_team') return <Building2 size={24} style={{ color }} />;
  if (sectionId === 'safety_security_team') return <ShieldCheck size={24} style={{ color }} />;

  return <Users size={24} style={{ color }} />;
};

export default function PayrollOrgChart({ employees, projectId }: PayrollOrgChartProps) {
  const chartCanvasRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [layout, setLayout] = useState<OrgChartLayout>(() => createEmptyLayout());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmployeeBySection, setNewEmployeeBySection] = useState<Record<string, string>>({});
  const [fromSectionId, setFromSectionId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [connectorPaths, setConnectorPaths] = useState<ConnectorPath[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const storageKey = `payroll_org_chart_${projectId || 'default'}_movable_section_connectors`;

  const activeEmployees = useMemo(() => {
    return (employees || []).filter(
      (employee) => String(employee?.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'
    );
  }, [employees]);

  const employeesById = useMemo(() => {
    return new Map(activeEmployees.map((employee) => [getEmployeeId(employee), employee]));
  }, [activeEmployees]);

  const sectionsById = useMemo(() => {
    return new Map(layout.sections.map((section) => [section.id, section]));
  }, [layout.sections]);

  const assignedEmployeeIds = useMemo(() => {
    return new Set(
      layout.sections.flatMap((section) =>
        section.assignments.map((assignment) => assignment.employeeId)
      )
    );
  }, [layout.sections]);

  const sectionOptions = useMemo(() => {
    return DEFAULT_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLayout = async () => {
      if (!projectId) {
        setLayout(createEmptyLayout());
        return;
      }

      let savedLayout: Partial<OrgChartLayout> | null = null;

      try {
        const { data, error } = await supabase
          .from('payroll_org_charts')
          .select('layout')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error) throw error;

        if (data?.layout) {
          savedLayout = data.layout as OrgChartLayout;
          window.localStorage.setItem(storageKey, JSON.stringify(savedLayout));
        } else {
          const localSaved = window.localStorage.getItem(storageKey);

          if (localSaved) {
            try {
              savedLayout = JSON.parse(localSaved);
            } catch {
              savedLayout = null;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load org chart from Supabase. Using local cache only.', error);

        const localSaved = window.localStorage.getItem(storageKey);

        if (localSaved) {
          try {
            savedLayout = JSON.parse(localSaved);
          } catch {
            savedLayout = null;
          }
        }
      }

      if (!cancelled) {
        setLayout(normalizeLayout(savedLayout, activeEmployees));
      }
    };

    loadLayout();

    return () => {
      cancelled = true;
    };
  }, [projectId, storageKey, activeEmployees]);

  const availableEmployees = (currentEmployeeId?: string) => {
    return activeEmployees.filter((employee) => {
      const employeeId = getEmployeeId(employee);
      return employeeId === currentEmployeeId || !assignedEmployeeIds.has(employeeId);
    });
  };

  const assignSectionRef = (sectionId: string) => (element: HTMLDivElement | null) => {
    sectionRefs.current[sectionId] = element;
  };

  const computeConnectorPaths = () => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    const nextPaths = layout.connectors
      .map((connector) => {
        const fromElement = sectionRefs.current[connector.fromSectionId];
        const toElement = sectionRefs.current[connector.toSectionId];

        if (!fromElement || !toElement) return null;

        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const fromCenterX = fromRect.left - canvasRect.left + fromRect.width / 2;
        const fromCenterY = fromRect.top - canvasRect.top + fromRect.height / 2;
        const toCenterX = toRect.left - canvasRect.left + toRect.width / 2;
        const toCenterY = toRect.top - canvasRect.top + toRect.height / 2;

        let startX = fromCenterX;
        let startY = fromRect.bottom - canvasRect.top;
        let endX = toCenterX;
        let endY = toRect.top - canvasRect.top;
        let path = '';

        const isCoordinatorConnection =
          connector.fromSectionId === 'coordinators' || connector.toSectionId === 'coordinators';

        if (isCoordinatorConnection) {
          const coordinatorIsFrom = connector.fromSectionId === 'coordinators';

          if (coordinatorIsFrom) {
            startX = fromRect.right - canvasRect.left;
            startY = fromCenterY;

            endX =
              toCenterX >= fromCenterX
                ? toRect.left - canvasRect.left
                : toRect.right - canvasRect.left;
            endY = toCenterY;
          } else {
            startX =
              fromCenterX >= toCenterX
                ? fromRect.left - canvasRect.left
                : fromRect.right - canvasRect.left;
            startY = fromCenterY;

            endX = toRect.right - canvasRect.left;
            endY = toCenterY;
          }

          const middleX = startX + (endX - startX) / 2;

          path = `
            M ${startX} ${startY}
            C ${middleX} ${startY}, ${middleX} ${endY}, ${endX} ${endY}
          `;
        } else {
          const middleY = startY + (endY - startY) / 2;

          path = `
            M ${startX} ${startY}
            C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}
          `;
        }

        return {
          id: connector.id,
          path,
        };
      })
      .filter(Boolean) as ConnectorPath[];

    setConnectorPaths(nextPaths);
  };

  useLayoutEffect(() => {
    const timeout = window.setTimeout(computeConnectorPaths, 50);
    return () => window.clearTimeout(timeout);
  }, [layout.sections, layout.connectors, isEditing]);

  useEffect(() => {
    const handleResize = () => computeConnectorPaths();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [layout.sections, layout.connectors]);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragState.startPointerX;
      const deltaY = event.clientY - dragState.startPointerY;

      setLayout((current) => ({
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== dragState.sectionId) return section;

          const nextX = Math.max(
            0,
            Math.min(CANVAS_WIDTH - section.width, dragState.startX + deltaX)
          );

          const nextY = Math.max(
            0,
            Math.min(CANVAS_HEIGHT - 120, dragState.startY + deltaY)
          );

          return {
            ...section,
            x: nextX,
            y: nextY,
          };
        }),
      }));
    };

    const handlePointerUp = () => {
      setDragState(null);
      setTimeout(computeConnectorPaths, 20);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  const updateSection = (sectionId: string, patch: Partial<OrgSection>) => {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }));
  };

  const updateAssignment = (
    sectionId: string,
    assignmentId: string,
    patch: Partial<OrgAssignment>
  ) => {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          assignments: section.assignments.map((assignment) =>
            assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
          ),
        };
      }),
    }));
  };

  const handleStartDrag = (event: ReactPointerEvent<HTMLElement>, section: OrgSection) => {
    if (!isEditing) return;

    event.preventDefault();
    event.stopPropagation();

    setDragState({
      sectionId: section.id,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: section.x,
      startY: section.y,
    });
  };

  const handleAddEmployee = (section: OrgSection) => {
    const employeeId = newEmployeeBySection[section.id];
    const employee = employeesById.get(employeeId);

    if (!employee) {
      toast.error('Select an employee first.');
      return;
    }

    if (section.maxEmployees && section.assignments.length >= section.maxEmployees) {
      toast.error(`${section.title} can only have one employee.`);
      return;
    }

    setLayout((current) => ({
      ...current,
      sections: current.sections.map((item) => {
        if (item.id !== section.id) return item;

        return {
          ...item,
          assignments: [...item.assignments, makeAssignment(employee, section.id)],
        };
      }),
    }));

    setNewEmployeeBySection((current) => ({ ...current, [section.id]: '' }));
  };

  const handleRemoveEmployee = (sectionId: string, assignmentId: string) => {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          assignments: section.assignments.filter((assignment) => assignment.id !== assignmentId),
        };
      }),
    }));
  };

  const handleMoveEmployee = (sectionId: string, assignmentId: string, direction: 'up' | 'down') => {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const currentIndex = section.assignments.findIndex(
          (assignment) => assignment.id === assignmentId
        );
        const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= section.assignments.length) {
          return section;
        }

        const nextAssignments = [...section.assignments];
        const [removed] = nextAssignments.splice(currentIndex, 1);
        nextAssignments.splice(nextIndex, 0, removed);

        return {
          ...section,
          assignments: nextAssignments,
        };
      }),
    }));
  };

  const handleEmployeeChange = (sectionId: string, assignmentId: string, employeeId: string) => {
    const employee = employeesById.get(employeeId);
    if (!employee) return;

    updateAssignment(sectionId, assignmentId, {
      id: makeAssignmentId(employeeId, sectionId),
      employeeId,
      photoUrl: getEmployeePhoto(employee) || '',
    });
  };

  const handlePhotoUpload = (
    sectionId: string,
    assignmentId: string,
    file?: File | null
  ) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateAssignment(sectionId, assignmentId, {
        photoUrl: String(reader.result || ''),
      });
    };

    reader.readAsDataURL(file);
  };

  const handleAddConnector = () => {
    if (!fromSectionId || !toSectionId) {
      toast.error('Select both From Section and To Section.');
      return;
    }

    if (fromSectionId === toSectionId) {
      toast.error('From Section and To Section cannot be the same.');
      return;
    }

    const exists = layout.connectors.some(
      (connector) =>
        connector.fromSectionId === fromSectionId && connector.toSectionId === toSectionId
    );

    if (exists) {
      toast.error('This connector already exists.');
      return;
    }

    const fromSection = sectionsById.get(fromSectionId);
    const toSection = sectionsById.get(toSectionId);

    const newConnector: OrgConnector = {
      id: `${fromSectionId}-${toSectionId}-${Date.now()}`,
      fromSectionId,
      toSectionId,
    };

    setLayout((current) => ({
      ...current,
      connectors: [...current.connectors, newConnector],
    }));

    setFromSectionId('');
    setToSectionId('');
    toast.success(`${fromSection?.title || 'Section'} connected to ${toSection?.title || 'section'}.`);
  };

  const handleRemoveConnector = (connectorId: string) => {
    setLayout((current) => ({
      ...current,
      connectors: current.connectors.filter((connector) => connector.id !== connectorId),
    }));
  };

  const handleSave = async () => {
    if (!projectId) {
      toast.error('Select a project first.');
      return;
    }

    const nextLayout = {
      ...layout,
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('payroll_org_charts')
        .upsert(
          {
            project_id: projectId,
            layout: nextLayout,
            updated_by: userData?.user?.id || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        );

      if (error) throw error;

      window.localStorage.setItem(storageKey, JSON.stringify(nextLayout));
      setLayout(nextLayout);
      setIsEditing(false);
      toast.success('Org chart saved and shared to all users.');
    } catch (error) {
      console.error('Failed to save org chart to Supabase:', error);
      toast.error('Failed to save org chart to Supabase. Please check table/RLS setup.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset org chart positions, connectors, assignments, colors, descriptions, and profile pictures? Employee records will not be deleted.'
    );

    if (!confirmed) return;

    if (!projectId) {
      toast.error('Select a project first.');
      return;
    }

    const resetLayout = createEmptyLayout();

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('payroll_org_charts')
        .upsert(
          {
            project_id: projectId,
            layout: resetLayout,
            updated_by: userData?.user?.id || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        );

      if (error) throw error;

      setLayout(resetLayout);
      window.localStorage.setItem(storageKey, JSON.stringify(resetLayout));
      toast.success('Org chart reset for all users.');
    } catch (error) {
      console.error('Failed to reset org chart in Supabase:', error);
      toast.error('Failed to reset org chart in Supabase.');
    }
  };

  const renderAvatar = (
    assignment: OrgAssignment,
    employeeName: string,
    accentColor: string,
    size = 38,
    managerStyle = false
  ) => {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '999px',
          background: managerStyle ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
          color: managerStyle ? WHITE : accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          fontWeight: 900,
          fontSize: size >= 50 ? '0.85rem' : '0.7rem',
          border: managerStyle ? '2px solid rgba(255,255,255,0.85)' : '1px solid #dbeafe',
        }}
      >
        {assignment.photoUrl ? (
          <img
            src={assignment.photoUrl}
            alt={employeeName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          getInitials(employeeName) || <UserRound size={managerStyle ? 26 : 18} />
        )}
      </div>
    );
  };

  const renderColorControl = (section: OrgSection) => {
    if (!isEditing) return null;

    return (
      <div
        style={{
          padding: '10px 12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>
          Accent Color
          <input
            type="color"
            value={section.accentColor}
            onChange={(event) => updateSection(section.id, { accentColor: event.target.value })}
            style={{
              width: '100%',
              height: 32,
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              background: WHITE,
              cursor: 'pointer',
              marginTop: 4,
            }}
          />
        </label>
      </div>
    );
  };

  const renderMoveHandle = (section: OrgSection) => {
    if (!isEditing) return null;

    return (
      <button
        type="button"
        onPointerDown={(event) => handleStartDrag(event, section)}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          color: '#334155',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: '0.74rem',
          fontWeight: 900,
          padding: '8px 10px',
        }}
      >
        <Grip size={14} />
        Move Section
      </button>
    );
  };

  const renderAssignmentEditor = (section: OrgSection, assignment: OrgAssignment, index: number) => {
    const employeeOptions = availableEmployees(assignment.employeeId);

    return (
      <div
        key={assignment.id}
        style={{
          padding: 10,
          border: '1px solid #dbe4f0',
          borderRadius: 12,
          background: WHITE,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          color: TEXT,
        }}
      >
        <select
          value={assignment.employeeId}
          onChange={(event) => handleEmployeeChange(section.id, assignment.id, event.target.value)}
          style={{
            width: '100%',
            padding: '7px 8px',
            borderRadius: 9,
            border: '1px solid #cbd5e1',
            fontSize: '0.75rem',
          }}
        >
          {employeeOptions.map((employee) => {
            const employeeId = getEmployeeId(employee);

            return (
              <option key={employeeId} value={employeeId}>
                {getEmployeeName(employee)} | {getEmployeePosition(employee)}
              </option>
            );
          })}
        </select>

        <input
          value={assignment.description}
          onChange={(event) =>
            updateAssignment(section.id, assignment.id, { description: event.target.value })
          }
          placeholder="Additional description"
          style={{
            width: '100%',
            padding: '7px 8px',
            borderRadius: 9,
            border: '1px solid #cbd5e1',
            fontSize: '0.75rem',
          }}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.74rem',
            color: '#1d4ed8',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Upload size={14} />
          Upload / Change Picture
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handlePhotoUpload(section.id, assignment.id, event.target.files?.[0])
            }
            style={{ display: 'none' }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => handleMoveEmployee(section.id, assignment.id, 'up')}
              disabled={index === 0}
              style={{
                border: '1px solid #cbd5e1',
                background: WHITE,
                borderRadius: 8,
                padding: 5,
                cursor: index === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowUp size={14} />
            </button>

            <button
              type="button"
              onClick={() => handleMoveEmployee(section.id, assignment.id, 'down')}
              disabled={index === section.assignments.length - 1}
              style={{
                border: '1px solid #cbd5e1',
                background: WHITE,
                borderRadius: 8,
                padding: 5,
                cursor: index === section.assignments.length - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowDown size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRemoveEmployee(section.id, assignment.id)}
            style={{
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#dc2626',
              borderRadius: 8,
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            <X size={14} /> Remove
          </button>
        </div>
      </div>
    );
  };

  const renderAddEmployee = (section: OrgSection) => {
    if (!isEditing) return null;

    const isFull = Boolean(section.maxEmployees && section.assignments.length >= section.maxEmployees);
    const employeeOptions = availableEmployees();

    if (isFull || employeeOptions.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: 7, paddingTop: 6 }}>
        <select
          value={newEmployeeBySection[section.id] || ''}
          onChange={(event) =>
            setNewEmployeeBySection((current) => ({
              ...current,
              [section.id]: event.target.value,
            }))
          }
          style={{
            flex: 1,
            minWidth: 0,
            padding: '8px 9px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: WHITE,
            fontSize: '0.75rem',
          }}
        >
          <option value="">Select employee</option>

          {employeeOptions.map((employee) => {
            const employeeId = getEmployeeId(employee);

            return (
              <option key={employeeId} value={employeeId}>
                {getEmployeeName(employee)} | {getEmployeePosition(employee)}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          onClick={() => handleAddEmployee(section)}
          style={{
            border: 'none',
            background: section.accentColor,
            color: WHITE,
            borderRadius: 10,
            padding: '0 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  };

  const renderEmployeeRow = (section: OrgSection, assignment: OrgAssignment, index: number) => {
    const employee = employeesById.get(assignment.employeeId);
    const employeeName = getEmployeeName(employee);
    const employeePosition = getEmployeePosition(employee);

    if (isEditing) return renderAssignmentEditor(section, assignment, index);

    return (
      <div
        key={assignment.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 12,
          background: WHITE,
          border: `1px solid ${section.accentColor}22`,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          color: TEXT,
        }}
      >
        {renderAvatar(assignment, employeeName, section.accentColor, 36)}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: '0.78rem',
              lineHeight: 1.15,
              color: TEXT,
            }}
          >
            {employeeName}
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              lineHeight: 1.2,
              color: section.accentColor,
              fontWeight: 800,
              marginTop: 2,
            }}
          >
            {employeePosition}
          </div>

          {assignment.description && (
            <div
              style={{
                fontSize: '0.68rem',
                lineHeight: 1.2,
                color: MUTED,
                marginTop: 2,
              }}
            >
              {assignment.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionCard = (section: OrgSection) => {
    const isManager = isManagerSection(section.id);
    const assignment = section.assignments[0];
    const employee = assignment ? employeesById.get(assignment.employeeId) : null;
    const employeeName = employee ? getEmployeeName(employee) : '';
    const employeePosition = employee ? getEmployeePosition(employee) : '';

    if (isManager) {
      return (
        <div
          ref={assignSectionRef(section.id)}
          style={{
            position: 'absolute',
            left: section.x,
            top: section.y,
            width: section.width,
            zIndex: dragState?.sectionId === section.id ? 5 : 2,
          }}
        >
          {renderMoveHandle(section)}

          <div
            style={{
              background: section.accentColor,
              borderRadius: 14,
              boxShadow: '0 10px 22px rgba(15, 23, 42, 0.20)',
              border: `2px solid ${section.accentColor}`,
              overflow: 'hidden',
            }}
          >
            {assignment && employee ? (
              <div
                style={{
                  padding: '16px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  minHeight: 92,
                }}
              >
                {renderAvatar(assignment, employeeName, section.accentColor, 58, true)}

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: WHITE,
                      fontSize: '1.15rem',
                      fontWeight: 950,
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {employeeName}
                  </div>

                  <div
                    style={{
                      color: YELLOW,
                      fontSize: '0.9rem',
                      fontWeight: 950,
                      marginTop: 5,
                      lineHeight: 1.15,
                      textTransform: 'uppercase',
                    }}
                  >
                    {employeePosition}
                  </div>

                  {assignment.description && (
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: '0.72rem',
                        marginTop: 5,
                        lineHeight: 1.2,
                      }}
                    >
                      {assignment.description}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    border: '1px dashed rgba(255,255,255,0.65)',
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'center',
                    color: WHITE,
                    fontSize: '0.82rem',
                  }}
                >
                  No employee assigned
                </div>
              </div>
            )}

            {isEditing && (
              <div
                style={{
                  background: WHITE,
                  borderTop: '1px solid #e2e8f0',
                  padding: 12,
                }}
              >
                {renderColorControl(section)}

                {assignment ? renderAssignmentEditor(section, assignment, 0) : renderAddEmployee(section)}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={assignSectionRef(section.id)}
        style={{
          position: 'absolute',
          left: section.x,
          top: section.y,
          width: section.width,
          background: WHITE,
          borderRadius: 18,
          border: `2px solid ${section.accentColor}`,
          boxShadow: '0 10px 22px rgba(15, 23, 42, 0.10)',
          overflow: 'hidden',
          zIndex: dragState?.sectionId === section.id ? 5 : 2,
        }}
      >
        <div style={{ height: 8, background: section.accentColor }} />

        {renderMoveHandle(section)}

        {isFixedTitleSection(section.id) && (
          <div
            style={{
              padding: '14px 16px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: section.accentColor,
              fontWeight: 950,
              textTransform: 'uppercase',
            }}
          >
            {getSectionIcon(section.id, section.accentColor)}
            <span>{section.title}</span>
          </div>
        )}

        {renderColorControl(section)}

        <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {section.assignments.length === 0 && (
            <div
              style={{
                padding: 12,
                border: `1px dashed ${section.accentColor}`,
                borderRadius: 10,
                textAlign: 'center',
                color: section.accentColor,
                fontSize: '0.75rem',
              }}
            >
              No employee assigned
            </div>
          )}

          {section.assignments.map((assignmentItem, index) =>
            renderEmployeeRow(section, assignmentItem, index)
          )}

          {renderAddEmployee(section)}
        </div>
      </div>
    );
  };

  const renderConnectorEditor = () => {
    if (!isEditing) return null;

    return (
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          background: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 20px 1fr 130px',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              fontWeight: 900,
              color: TEXT,
            }}
          >
            <Link2 size={15} />
            Add connector
          </div>

          <select
            value={fromSectionId}
            onChange={(event) => setFromSectionId(event.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              padding: '0 12px',
              background: WHITE,
              color: TEXT,
            }}
          >
            <option value="">From Section</option>
            {sectionOptions.map((section) => (
              <option key={`from-${section.id}`} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>

          <div style={{ textAlign: 'center', color: '#475569', fontWeight: 900 }}>→</div>

          <select
            value={toSectionId}
            onChange={(event) => setToSectionId(event.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              padding: '0 12px',
              background: WHITE,
              color: TEXT,
            }}
          >
            <option value="">To Section</option>
            {sectionOptions.map((section) => (
              <option key={`to-${section.id}`} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddConnector}
            style={{
              height: 40,
              borderRadius: 10,
              border: 'none',
              background: '#0b5ed7',
              color: WHITE,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <Plus size={14} />
            Add Line
          </button>
        </div>

        {layout.connectors.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {layout.connectors.map((connector) => {
              const fromSection = sectionsById.get(connector.fromSectionId);
              const toSection = sectionsById.get(connector.toSectionId);

              if (!fromSection || !toSection) return null;

              return (
                <div
                  key={connector.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    borderRadius: 999,
                    border: '1px solid #cbd5e1',
                    background: WHITE,
                    color: TEXT,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                  }}
                >
                  <span>
                    {fromSection.title} → {toSection.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveConnector(connector.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="card" style={{ padding: 24, marginTop: 24, color: 'var(--text-muted)' }}>
        Select a project to display the payroll org chart.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, marginTop: 24, overflow: 'hidden' }}>
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>
              Project Organization Chart
            </h3>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
            Movable org chart boxes with editable section connectors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsEditing((value: boolean) => !value)}
            className="btn btn-secondary"
            style={{ cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <Pencil size={15} /> {isEditing ? 'Preview' : 'Edit Chart'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <RotateCcw size={15} /> Reset Layout
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Chart'}
          </button>
        </div>
      </div>

      {renderConnectorEditor()}

      {activeEmployees.length === 0 ? (
        <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
          No employees found for this project. Add employees first in Employee Management.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: WHITE, padding: '28px' }}>
          <div
            ref={chartCanvasRef}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              position: 'relative',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              borderRadius: 18,
              border: '1px solid #e2e8f0',
            }}
          >
            <svg
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 1,
                overflow: 'visible',
              }}
            >
              <defs>
                <marker
                  id="section-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
                </marker>
              </defs>

              {connectorPaths.map((connector) => (
                <path
                  key={connector.id}
                  d={connector.path}
                  stroke="#64748b"
                  strokeWidth={2.25}
                  fill="none"
                  markerEnd="url(#section-arrow)"
                />
              ))}
            </svg>

            {layout.sections.map((section) => renderSectionCard(section))}
          </div>
        </div>
      )}
    </div>
  );
}