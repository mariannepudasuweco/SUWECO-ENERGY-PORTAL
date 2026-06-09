import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Grip, Link2, Palette, RotateCcw, Save, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

type PayrollOrgChartProps = {
  employees: any[];
  projectId?: string | null;
};

type OrgNode = {
  id: string;
  employeeId: string;
  x: number;
  y: number;
  color: string;
  photoUrl?: string;
};

type OrgConnector = {
  id: string;
  parentEmployeeId: string;
  childEmployeeId: string;
  color?: string;
};

type DragState = {
  employeeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const DEFAULT_NODE_COLOR = '#2563eb';
const DEFAULT_CONNECTOR_COLOR = '#475569';
const CANVAS_HEIGHT = 620;
const CARD_WIDTH = 230;
const CARD_HEIGHT = 118;

const getEmployeeId = (employee: any) => String(employee?.id || employee?.employee_id || employee?.employeeId || '');

const getEmployeeName = (employee: any) => {
  const name = employee?.name || [employee?.first_name || employee?.firstName, employee?.middle_name || employee?.middleName, employee?.surname || employee?.last_name].filter(Boolean).join(' ');
  return String(name || 'Unnamed Employee').trim();
};

const getEmployeePosition = (employee: any) => String(employee?.position || employee?.designation || 'Position not set');
const getEmployeeDepartment = (employee: any) => String(employee?.department || employee?.location || '');

const getLevelRank = (employee: any) => {
  const text = `${employee?.level || ''} ${employee?.position || ''} ${employee?.designation || ''}`.toUpperCase();
  if (text.includes('PRESIDENT') || text.includes('CEO') || text.includes('OWNER') || text.includes('EXEC')) return 0;
  if (text.includes('PROJECT MANAGER') || text.includes('MANAGER') || text.includes('SUPERVISOR') || text.includes('HEAD')) return 1;
  if (text.includes('COORDINATOR') || text.includes('ENGINEER') || text.includes('ADMIN') || text.includes('OFFICER') || text.includes('HR')) return 2;
  return 3;
};

const makeConnectorId = (parentEmployeeId: string, childEmployeeId: string) => `connector-${parentEmployeeId}-${childEmployeeId}`;

const buildDefaultNodes = (employees: any[]): OrgNode[] => {
  const sorted = [...employees].sort((a, b) => {
    const rankDiff = getLevelRank(a) - getLevelRank(b);
    if (rankDiff !== 0) return rankDiff;
    return getEmployeeName(a).localeCompare(getEmployeeName(b));
  });

  const rows = new Map<number, any[]>();
  sorted.forEach((employee) => {
    const rank = getLevelRank(employee);
    rows.set(rank, [...(rows.get(rank) || []), employee]);
  });

  const nodes: OrgNode[] = [];
  Array.from(rows.entries()).forEach(([rank, rowEmployees]) => {
    const rowY = 28 + rank * 145;
    const totalWidth = rowEmployees.length * CARD_WIDTH + Math.max(rowEmployees.length - 1, 0) * 32;
    const startX = Math.max(24, 560 - totalWidth / 2);

    rowEmployees.forEach((employee, index) => {
      const employeeId = getEmployeeId(employee);
      if (!employeeId) return;
      nodes.push({
        id: `node-${employeeId}`,
        employeeId,
        x: startX + index * (CARD_WIDTH + 32),
        y: rowY,
        color: DEFAULT_NODE_COLOR,
        photoUrl: employee?.photo_url || employee?.photoUrl || ''
      });
    });
  });

  return nodes;
};

const buildDefaultConnectors = (nodes: OrgNode[], employees: any[]): OrgConnector[] => {
  const employeesById = new Map(employees.map((employee) => [getEmployeeId(employee), employee]));
  const byRank = new Map<number, OrgNode[]>();

  nodes.forEach((node) => {
    const employee = employeesById.get(node.employeeId);
    const rank = getLevelRank(employee);
    byRank.set(rank, [...(byRank.get(rank) || []), node]);
  });

  const connectors: OrgConnector[] = [];
  const ranks = Array.from(byRank.keys()).sort((a, b) => a - b);

  ranks.forEach((rank, index) => {
    const parents = byRank.get(rank) || [];
    const children = byRank.get(ranks[index + 1]) || [];
    if (!parents.length || !children.length) return;

    const parent = parents[Math.floor(parents.length / 2)];
    children.forEach((child) => {
      connectors.push({
        id: makeConnectorId(parent.employeeId, child.employeeId),
        parentEmployeeId: parent.employeeId,
        childEmployeeId: child.employeeId,
        color: DEFAULT_CONNECTOR_COLOR
      });
    });
  });

  return connectors;
};

const mergeNodesWithEmployees = (savedNodes: OrgNode[], employees: any[]): OrgNode[] => {
  const validEmployeeIds = new Set(employees.map(getEmployeeId).filter(Boolean));
  const defaults = buildDefaultNodes(employees);
  const defaultMap = new Map(defaults.map((node) => [node.employeeId, node]));
  const savedMap = new Map((savedNodes || []).filter((node) => validEmployeeIds.has(String(node.employeeId))).map((node) => [String(node.employeeId), node]));

  return employees
    .map(getEmployeeId)
    .filter(Boolean)
    .map((employeeId) => ({
      ...(defaultMap.get(employeeId) || { id: `node-${employeeId}`, employeeId, x: 24, y: 24, color: DEFAULT_NODE_COLOR }),
      ...(savedMap.get(employeeId) || {})
    }));
};

const mergeConnectorsWithEmployees = (savedConnectors: OrgConnector[], nodes: OrgNode[], employees: any[]): OrgConnector[] => {
  const validEmployeeIds = new Set(employees.map(getEmployeeId).filter(Boolean));
  const cleaned = (savedConnectors || []).filter((connector) => {
    return (
      validEmployeeIds.has(String(connector.parentEmployeeId)) &&
      validEmployeeIds.has(String(connector.childEmployeeId)) &&
      String(connector.parentEmployeeId) !== String(connector.childEmployeeId)
    );
  });

  if (cleaned.length) {
    return cleaned.map((connector) => ({
      id: connector.id || makeConnectorId(String(connector.parentEmployeeId), String(connector.childEmployeeId)),
      parentEmployeeId: String(connector.parentEmployeeId),
      childEmployeeId: String(connector.childEmployeeId),
      color: connector.color || DEFAULT_CONNECTOR_COLOR
    }));
  }

  return buildDefaultConnectors(nodes, employees);
};

export default function PayrollOrgChart({ employees, projectId }: PayrollOrgChartProps) {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [connectors, setConnectors] = useState<OrgConnector[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [connectorParentId, setConnectorParentId] = useState('');
  const [connectorChildId, setConnectorChildId] = useState('');
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const activeEmployees = useMemo(() => {
    return (employees || []).filter((employee) => String(employee?.status || 'ACTIVE').toUpperCase() !== 'INACTIVE');
  }, [employees]);

  const employeesById = useMemo(() => {
    return new Map(activeEmployees.map((employee) => [getEmployeeId(employee), employee]));
  }, [activeEmployees]);

  const nodesByEmployeeId = useMemo(() => {
    return new Map(nodes.map((node) => [node.employeeId, node]));
  }, [nodes]);

  const storageKey = `payroll_org_chart_${projectId || 'default'}`;

  useEffect(() => {
    let cancelled = false;

    const loadLayout = async () => {
      if (!projectId) {
        const defaultNodes = buildDefaultNodes(activeEmployees);
        setNodes(defaultNodes);
        setConnectors(buildDefaultConnectors(defaultNodes, activeEmployees));
        return;
      }

      let savedNodes: OrgNode[] = [];
      let savedConnectors: OrgConnector[] = [];
      const localSaved = window.localStorage.getItem(storageKey);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          savedNodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];
          savedConnectors = Array.isArray(parsed?.connectors) ? parsed.connectors : [];
        } catch {
          savedNodes = [];
          savedConnectors = [];
        }
      }

      try {
        const { data, error } = await supabase
          .from('payroll_org_charts')
          .select('layout')
          .eq('project_id', projectId)
          .maybeSingle();

        if (!error && data?.layout?.nodes && Array.isArray(data.layout.nodes)) {
          savedNodes = data.layout.nodes;
          savedConnectors = Array.isArray(data.layout.connectors) ? data.layout.connectors : [];
          window.localStorage.setItem(storageKey, JSON.stringify(data.layout));
        }
      } catch {
        // Local storage fallback keeps the org chart usable even before the optional Supabase table is added.
      }

      const nextNodes = mergeNodesWithEmployees(savedNodes, activeEmployees);
      const nextConnectors = mergeConnectorsWithEmployees(savedConnectors, nextNodes, activeEmployees);

      if (!cancelled) {
        setNodes(nextNodes);
        setConnectors(nextConnectors);
      }
    };

    loadLayout();
    return () => {
      cancelled = true;
    };
  }, [projectId, storageKey, activeEmployees]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const nextX = Math.min(Math.max(8, dragging.originX + event.clientX - dragging.startX), Math.max(8, bounds.width - CARD_WIDTH - 8));
      const nextY = Math.min(Math.max(8, dragging.originY + event.clientY - dragging.startY), CANVAS_HEIGHT - CARD_HEIGHT - 8);
      setNodes((current) => current.map((node) => node.employeeId === dragging.employeeId ? { ...node, x: nextX, y: nextY } : node));
    };

    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  const handlePhotoChange = (employeeId: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNodes((current) => current.map((node) => node.employeeId === employeeId ? { ...node, photoUrl: String(reader.result || '') } : node));
    };
    reader.readAsDataURL(file);
  };

  const handleAddConnector = () => {
    if (!connectorParentId || !connectorChildId) {
      toast.error('Select both a supervisor and an employee.');
      return;
    }

    if (connectorParentId === connectorChildId) {
      toast.error('An employee cannot report to their own card.');
      return;
    }

    setConnectors((current) => {
      const withoutExistingSupervisorForChild = current.filter((connector) => connector.childEmployeeId !== connectorChildId);
      return [
        ...withoutExistingSupervisorForChild,
        {
          id: makeConnectorId(connectorParentId, connectorChildId),
          parentEmployeeId: connectorParentId,
          childEmployeeId: connectorChildId,
          color: DEFAULT_CONNECTOR_COLOR
        }
      ];
    });

    const parentName = getEmployeeName(employeesById.get(connectorParentId));
    const childName = getEmployeeName(employeesById.get(connectorChildId));
    toast.success(`${childName} now reports to ${parentName}.`);
  };

  const handleRemoveConnector = (connectorId: string) => {
    setConnectors((current) => current.filter((connector) => connector.id !== connectorId));
  };

  const handleSave = async () => {
    const layout = { nodes, connectors, updatedAt: new Date().toISOString() };
    setIsSaving(true);
    window.localStorage.setItem(storageKey, JSON.stringify(layout));

    try {
      if (projectId) {
        const { error } = await supabase
          .from('payroll_org_charts')
          .upsert({ project_id: projectId, layout, updated_at: new Date().toISOString() }, { onConflict: 'project_id' });
        if (error) throw error;
      }
      toast.success('Org chart saved.');
      setIsEditing(false);
    } catch (error) {
      console.warn('Org chart saved locally. Add payroll_org_charts table to save it in Supabase.', error);
      toast.success('Org chart saved on this browser.');
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const resetNodes = buildDefaultNodes(activeEmployees);
    const resetConnectors = buildDefaultConnectors(resetNodes, activeEmployees);
    setNodes(resetNodes);
    setConnectors(resetConnectors);
    window.localStorage.setItem(storageKey, JSON.stringify({ nodes: resetNodes, connectors: resetConnectors, updatedAt: new Date().toISOString() }));
  };

  const connectorLines = useMemo(() => {
    return connectors
      .map((connector) => {
        const parent = nodesByEmployeeId.get(connector.parentEmployeeId);
        const child = nodesByEmployeeId.get(connector.childEmployeeId);
        if (!parent || !child) return null;

        return {
          ...connector,
          x1: parent.x + CARD_WIDTH / 2,
          y1: parent.y + CARD_HEIGHT,
          x2: child.x + CARD_WIDTH / 2,
          y2: child.y,
          color: connector.color || parent.color || DEFAULT_CONNECTOR_COLOR
        };
      })
      .filter(Boolean) as Array<OrgConnector & { x1: number; y1: number; x2: number; y2: number; color: string }>;
  }, [connectors, nodesByEmployeeId]);

  if (!projectId) {
    return (
      <div className="card" style={{ padding: '24px', marginTop: '24px', color: 'var(--text-muted)' }}>
        Select a project to display the payroll org chart.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, marginTop: '24px', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>Project Organization Chart</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
            Employee cards and reporting lines are based on this project's employee records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setIsEditing((value) => !value)} className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            {isEditing ? 'Preview' : 'Edit Chart'}
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <RotateCcw size={15} /> Reset Layout
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Chart'}
          </button>
        </div>
      </div>

      {isEditing && activeEmployees.length > 1 && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 800, fontSize: '0.82rem' }}>
              <Link2 size={16} /> Add reporting connector
            </div>
            <select
              value={connectorParentId}
              onChange={(event) => setConnectorParentId(event.target.value)}
              style={{ minWidth: '220px', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="">Supervisor / Reports To</option>
              {activeEmployees.map((employee) => {
                const employeeId = getEmployeeId(employee);
                return <option key={`parent-${employeeId}`} value={employeeId}>{getEmployeeName(employee)} — {getEmployeePosition(employee)}</option>;
              })}
            </select>
            <span style={{ color: '#64748b', fontWeight: 700 }}>→</span>
            <select
              value={connectorChildId}
              onChange={(event) => setConnectorChildId(event.target.value)}
              style={{ minWidth: '220px', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="">Employee / Direct Report</option>
              {activeEmployees.map((employee) => {
                const employeeId = getEmployeeId(employee);
                return <option key={`child-${employeeId}`} value={employeeId}>{getEmployeeName(employee)} — {getEmployeePosition(employee)}</option>;
              })}
            </select>
            <button type="button" onClick={handleAddConnector} className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Link2 size={15} /> Connect
            </button>
          </div>

          {connectors.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {connectors.map((connector) => {
                const parent = employeesById.get(connector.parentEmployeeId);
                const child = employeesById.get(connector.childEmployeeId);
                if (!parent || !child) return null;

                return (
                  <div key={connector.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 9px', borderRadius: '999px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>{getEmployeeName(parent)} → {getEmployeeName(child)}</span>
                    <button type="button" title="Remove connector" onClick={() => handleRemoveConnector(connector.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeEmployees.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No employees found for this project. Add employees first in Employee Management.
        </div>
      ) : (
        <div ref={canvasRef} style={{ position: 'relative', height: `${CANVAS_HEIGHT}px`, overflow: 'auto', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
          <svg width="100%" height={CANVAS_HEIGHT} style={{ position: 'absolute', inset: 0, minWidth: '1160px', pointerEvents: isEditing ? 'auto' : 'none', zIndex: 1 }}>
            <defs>
              <marker id="payroll-org-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill={DEFAULT_CONNECTOR_COLOR} />
              </marker>
            </defs>

            {connectorLines.map((line) => {
              const path = `M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 42}, ${line.x2} ${line.y2 - 42}, ${line.x2} ${line.y2}`;
              return (
                <g key={line.id}>
                  {isEditing && (
                    <path
                      d={path}
                      stroke="transparent"
                      strokeWidth="14"
                      fill="none"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveConnector(line.id)}
                    />
                  )}
                  <path
                    d={path}
                    stroke={line.color}
                    strokeWidth="2.5"
                    fill="none"
                    markerEnd="url(#payroll-org-arrow)"
                    opacity={0.88}
                  />
                </g>
              );
            })}
          </svg>

          <div style={{ position: 'relative', minWidth: '1160px', height: `${CANVAS_HEIGHT}px`, zIndex: 2 }}>
            {nodes.map((node) => {
              const employee = employeesById.get(node.employeeId);
              if (!employee) return null;
              const name = getEmployeeName(employee);
              const position = getEmployeePosition(employee);
              const department = getEmployeeDepartment(employee);
              const reportsToConnector = connectors.find((connector) => connector.childEmployeeId === node.employeeId);
              const reportsToName = reportsToConnector ? getEmployeeName(employeesById.get(reportsToConnector.parentEmployeeId)) : '';

              return (
                <div
                  key={node.employeeId}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: CARD_WIDTH,
                    minHeight: CARD_HEIGHT,
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: `2px solid ${node.color || DEFAULT_NODE_COLOR}`,
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                    overflow: 'hidden',
                    userSelect: dragging ? 'none' : 'auto'
                  }}
                >
                  <div style={{ height: '10px', background: node.color || DEFAULT_NODE_COLOR }} />
                  <div style={{ padding: '12px', display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '54px', height: '54px', borderRadius: '999px', overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 800 }}>
                      {node.photoUrl ? (
                        <img src={node.photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
                      )}
                      {isEditing && (
                        <label title="Add picture" style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.48)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Camera size={18} />
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => handlePhotoChange(node.employeeId, event.target.files?.[0])} />
                        </label>
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{name}</div>
                      <div style={{ fontSize: '0.78rem', color: node.color || DEFAULT_NODE_COLOR, fontWeight: 700, marginTop: '4px', lineHeight: 1.25 }}>{position}</div>
                      {department && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>{department}</div>}
                      {reportsToName && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '5px' }}>Reports to: {reportsToName}</div>}
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                      <button
                        type="button"
                        title="Drag to move"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDragging({ employeeId: node.employeeId, startX: event.clientX, startY: event.clientY, originX: node.x, originY: node.y });
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#475569', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700 }}
                      >
                        <Grip size={15} /> Move
                      </button>
                      <label title="Change color" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                        <Palette size={15} /> Color
                        <input
                          type="color"
                          value={node.color || DEFAULT_NODE_COLOR}
                          onChange={(event) => setNodes((current) => current.map((item) => item.employeeId === node.employeeId ? { ...item, color: event.target.value } : item))}
                          style={{ width: '24px', height: '24px', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
