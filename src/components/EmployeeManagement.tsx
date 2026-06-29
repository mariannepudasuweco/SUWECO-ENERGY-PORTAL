import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Mail, Phone, Building2, X, Users } from 'lucide-react';
import PayrollAuth from './PayrollAuth';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

interface EmployeeManagementProps {
  selectedProjectId?: string | null;
}

export default function EmployeeManagement({ selectedProjectId }: EmployeeManagementProps = {}) {
  const activeProjectId = selectedProjectId || (window as any).currentProjectId || '';
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExistingModalOpen, setIsExistingModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  
  const defaultEmpState = {
    surname: '',
    firstName: '',
    middleName: '',
    gender: 'Male',
    birthdate: '',
    civilStatus: 'Single',
    email: '',
    educationalAttainment: '',
    position: '',
    department: '',
    location: 'Select Location',
    dailyRate: '0',
    level: 'EXEC',
    employeeType: 'Direct',
    taxStatus: 'MWE',
    mealAllowance: 'No',
    mealAllowanceRate: '0',
    loadAllowance: 'No',
    loadAllowanceRate: '0',
    travelAllowance: 'No',
    travelAllowanceRate: '0',
    relocationAllowance: 'No',
    relocationAllowanceRate: '0',
    hireDate: '',
    employmentStatus: 'Regular',
    phone: '',
    status: 'Active',
    sssNumber: '',
    philHealthNumber: '',
    pagIbigNumber: '',
    tinNumber: '',
    statutory: {
      sss: '0',
      philhealth: '0',
      pagibig: '0',
      tax: '0'
    }
  };

  const [newEmp, setNewEmp] = useState(defaultEmpState);

  useEffect(() => {
  loadEmployees();
}, [activeProjectId]);

const loadEmployees = async () => {
  if (!activeProjectId) {
    setEmployees([]);
    return;
  }

  const { data, error } = await supabase
    .from('payroll_employees')
    .select('*')
    .eq('project_id', activeProjectId)
    .order('created_at', { ascending: false });

  console.log('LOAD PAYROLL EMPLOYEES:', data);
  console.log('LOAD PAYROLL EMPLOYEES ERROR:', error);

  if (error) {
    toast.error('Failed to load employees.');
    console.error(error);
    return;
  }

  const mapped = (data || []).map(row => ({
    id: row.id,
    projectId: row.project_id,

    surname: row.surname || '',
    firstName: row.first_name || '',
    middleName: row.middle_name || '',
    gender: row.gender || 'Male',
    birthdate: row.birthdate || '',
    civilStatus: row.civil_status || 'Single',
    email: row.email || '',
    educationalAttainment: row.educational_attainment || '',

    position: row.position || '',
    department: row.department || '',
    location: row.location || 'Select Location',
    dailyRate: Number(row.daily_rate || 0),
    level: row.level || 'EXEC',
    employeeType: row.employee_type || 'Direct',
    taxStatus: row.tax_status || 'MWE',
    employmentStatus: row.employment_status || 'Regular',
    hireDate: row.hire_date || '',
    phone: row.phone || '',
    status: row.status || 'ACTIVE',

    sssNumber: row.sss_number || '',
    philHealthNumber: row.philhealth_number || '',
    pagIbigNumber: row.pagibig_number || '',
    tinNumber: row.tin_number || '',

    statutory: {
      sss: String(row.sss_contribution || 0),
      philhealth: String(row.philhealth_contribution || 0),
      pagibig: String(row.pagibig_contribution || 0),
      tax: String(row.tax_contribution || 0)
    },

    name: `${row.first_name || ''} ${row.surname || ''}`.trim()
  }));

  setEmployees(mapped);
};

  const handleAddEmployee = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log('SAVE EMPLOYEE CLICKED');

  if (!activeProjectId) {
    toast.error('Please select a project first.');
    return;
  }

  const fullName = `${newEmp.firstName} ${newEmp.surname}`.trim();

  const payload = {
    project_id: activeProjectId,

    employee_no: editingId ? undefined : null,
    full_name: fullName,

    surname: newEmp.surname,
    first_name: newEmp.firstName,
    middle_name: newEmp.middleName,
    gender: newEmp.gender,
    birthdate: newEmp.birthdate || null,
    civil_status: newEmp.civilStatus,
    email: newEmp.email,
    educational_attainment: newEmp.educationalAttainment,

    position: newEmp.position,
    department: newEmp.department,
    location: newEmp.location,
    daily_rate: Number(newEmp.dailyRate || 0),
    level: newEmp.level,
    employee_type: newEmp.employeeType,
    employment_type: newEmp.employeeType || newEmp.employmentStatus,
    tax_status: newEmp.taxStatus,
    employment_status: newEmp.employmentStatus,
    hire_date: newEmp.hireDate || null,
    date_hired: newEmp.hireDate || null,
    phone: newEmp.phone,
    contact_no: newEmp.phone,
    status: newEmp.status.toUpperCase(),

    sss_number: newEmp.sssNumber,
    philhealth_number: newEmp.philHealthNumber,
    pagibig_number: newEmp.pagIbigNumber,
    tin_number: newEmp.tinNumber,

    sss_contribution: Number(newEmp.statutory?.sss || 0),
    philhealth_contribution: Number(newEmp.statutory?.philhealth || 0),
    pagibig_contribution: Number(newEmp.statutory?.pagibig || 0),
    tax_contribution: Number(newEmp.statutory?.tax || 0),

    updated_at: new Date().toISOString()
  };

  let result;

  if (editingId) {
    result = await supabase
      .from('payroll_employees')
      .update(payload)
      .eq('id', editingId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('payroll_employees')
      .insert(payload)
      .select()
      .single();
  }

  const { error } = result;

  console.log('SAVE EMPLOYEE ERROR:', error);

  if (error) {
    toast.error('Failed to save employee.');
    console.error(error);
    return;
  }

  toast.success(editingId ? 'Employee updated successfully.' : 'Employee added successfully.');

  await loadEmployees();

  setIsModalOpen(false);
  setEditingId(null);
  setNewEmp(defaultEmpState);
};

  const handleEdit = (emp: any) => {
    setNewEmp({
      ...defaultEmpState,
      ...emp,
      statutory: {
        ...defaultEmpState.statutory,
        ...(emp.statutory || {})
      },
      dailyRate: emp.dailyRate.toString()
    });
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
  if (!deleteId) return;

  const { error } = await supabase
    .from('payroll_employees')
    .delete()
    .eq('id', deleteId);

  console.log('DELETE EMPLOYEE ERROR:', error);

  if (error) {
    toast.error('Failed to delete employee.');
    console.error(error);
    return;
  }

  toast.success('Employee deleted successfully.');
  setDeleteId(null);
  await loadEmployees();
};

  const otherProjectsEmployees = employees.filter(emp => {
    if (!activeProjectId) return false;
    const isAlreadyInProject = employees.some(e => e.name.toLowerCase() === emp.name.toLowerCase() && String(e.projectId) === String(activeProjectId));
    return !isAlreadyInProject;
  });

  const filteredEmployees = employees.filter(emp => {
    // Only display employees matching the current active project
    const matchesProject = !activeProjectId || String(emp.projectId) === String(activeProjectId);
    if (!matchesProject) return false;

    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'All Locations' || emp.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  return (
    <PayrollAuth>
      <div>
        <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Employee Master Record</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage employee information and records</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setNewEmp(defaultEmpState); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Add Employee
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, position, or ID..." 
              style={{ width: '100%', padding: '8px 16px 8px 36px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-body)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          <select 
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-body)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option>All Locations</option>
            <option>Manila</option>
            <option>Local</option>
          </select>
        </div>

        {/* Employee Grid */}
        {filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No employees found.</p>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '16px' }}>Add your first employee</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
            {filteredEmployees.map(emp => (
              <div key={emp.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden', background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', minWidth: 0, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem', flexShrink: 0 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 title={emp.name} style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', lineHeight: 1.3, overflowWrap: 'anywhere' }}>{emp.name}</h3>
                      <p title={emp.position} style={{ margin: '2px 0 0', fontSize: '0.85rem', lineHeight: 1.35, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{emp.position}</p>
                      <span title={String(emp.id)} style={{ display: 'block', width: '100%', maxWidth: '100%', marginTop: '6px', padding: '3px 6px', background: '#eff6ff', color: '#2563eb', fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.35, borderRadius: '4px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {emp.id}
                      </span>
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, maxWidth: '82px', padding: '2px 8px', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.4, textAlign: 'center', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.03em', overflowWrap: 'anywhere' }}>
                    {emp.status}
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> 
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.department}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> 
                    <span>{emp.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> 
                    <span title={emp.email} style={{ minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> 
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{emp.phone}</span>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Rate</p>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>₱{emp.dailyRate.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(emp)} style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Employee Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 30, 66, 0.54)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
            <div className="card" style={{ width: '100%', maxWidth: '1000px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{editingId ? 'Edit Employee' : 'New Employee'}</h2>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', fontSize: '0.85rem', fontWeight: 600, borderRadius: '9999px' }}>
                    {newEmp.status}
                  </span>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <form id="add-employee-form" onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Personal Information */}
                  <section>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Surname</label>
                        <input required type="text" placeholder="Enter surname" value={newEmp.surname} onChange={e => setNewEmp({...newEmp, surname: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>First Name</label>
                        <input required type="text" placeholder="Enter first name" value={newEmp.firstName} onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Middle Name</label>
                        <input type="text" placeholder="Enter middle name" value={newEmp.middleName} onChange={e => setNewEmp({...newEmp, middleName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Gender</label>
                        <select value={newEmp.gender} onChange={e => setNewEmp({...newEmp, gender: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Birthdate</label>
                        <input required type="date" value={newEmp.birthdate} onChange={e => setNewEmp({...newEmp, birthdate: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Civil Status</label>
                        <select value={newEmp.civilStatus} onChange={e => setNewEmp({...newEmp, civilStatus: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Single</option>
                          <option>Married</option>
                          <option>Widowed</option>
                          <option>Divorced</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Email Address</label>
                        <input required type="email" placeholder="employee@company.com" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Educational Attainment</label>
                        <input type="text" placeholder="Enter educational attainment" value={newEmp.educationalAttainment} onChange={e => setNewEmp({...newEmp, educationalAttainment: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                    </div>
                  </section>

                  {/* Employment Details */}
                  <section>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Employment Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Position</label>
                        <input required type="text" placeholder="Job title" value={newEmp.position} onChange={e => setNewEmp({...newEmp, position: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Department</label>
                        <input required type="text" placeholder="Department" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Location</label>
                        <select value={newEmp.location} onChange={e => setNewEmp({...newEmp, location: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Select Location</option>
                          <option>Manila</option>
                          <option>Local</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Daily Rate</label>
                        <input required type="number" step="0.01" value={newEmp.dailyRate} onChange={e => setNewEmp({...newEmp, dailyRate: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Level</label>
                        <select value={newEmp.level} onChange={e => setNewEmp({...newEmp, level: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>EXEC</option>
                          <option>MGR</option>
                          <option>STAFF</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Hire Date</label>
                        <input required type="date" value={newEmp.hireDate} onChange={e => setNewEmp({...newEmp, hireDate: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Employee Type</label>
                        <select value={newEmp.employeeType} onChange={e => setNewEmp({...newEmp, employeeType: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Direct</option>
                          <option>Indirect</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Tax Status</label>
                        <select value={newEmp.taxStatus} onChange={e => setNewEmp({...newEmp, taxStatus: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>MWE</option>
                          <option>NMWE</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Employment Status</label>
                        <select value={newEmp.employmentStatus} onChange={e => setNewEmp({...newEmp, employmentStatus: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Regular</option>
                          <option>Probationary</option>
                          <option>Contractual</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Phone</label>
                        <input required type="text" placeholder="+63 912 345 6789" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Status</label>
                        <select value={newEmp.status} onChange={e => setNewEmp({...newEmp, status: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Government IDs */}
                  <section>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Government IDs</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>SSS Number</label>
                        <input type="text" placeholder="XX-XXXXXXX-X" value={newEmp.sssNumber} onChange={e => setNewEmp({...newEmp, sssNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>PhilHealth Number</label>
                        <input type="text" placeholder="XX-XXXXXXXXX-X" value={newEmp.philHealthNumber} onChange={e => setNewEmp({...newEmp, philHealthNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Pag-IBIG Number</label>
                        <input type="text" placeholder="XXXX-XXXX-XXXX" value={newEmp.pagIbigNumber} onChange={e => setNewEmp({...newEmp, pagIbigNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>TIN Number</label>
                        <input type="text" placeholder="XXX-XXX-XXX-XXX" value={newEmp.tinNumber} onChange={e => setNewEmp({...newEmp, tinNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                    </div>
                  </section>

                  {/* Statutory Deductions */}
                  <section>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Statutory Deductions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>SSS Contribution</label>
                        <input type="number" step="0.01" placeholder="0" value={newEmp.statutory?.sss || '0'} onChange={e => setNewEmp({...newEmp, statutory: { ...newEmp.statutory, sss: e.target.value }})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>PhilHealth Contribution</label>
                        <input type="number" step="0.01" placeholder="0" value={newEmp.statutory?.philhealth || '0'} onChange={e => setNewEmp({...newEmp, statutory: { ...newEmp.statutory, philhealth: e.target.value }})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Pag-IBIG Contribution</label>
                        <input type="number" step="0.01" placeholder="0" value={newEmp.statutory?.pagibig || '0'} onChange={e => setNewEmp({...newEmp, statutory: { ...newEmp.statutory, pagibig: e.target.value }})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                      </div>
                      {newEmp.taxStatus === 'MWE' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>Tax Contribution</label>
                          <input type="number" step="0.01" placeholder="0" value={newEmp.statutory?.tax || '0'} onChange={e => setNewEmp({...newEmp, statutory: { ...newEmp.statutory, tax: e.target.value }})} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                        </div>
                      )}
                    </div>
                  </section>

                </form>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); setNewEmp(defaultEmpState); }} style={{ padding: '10px 24px', fontWeight: 600 }}>Cancel</button>
                <button type="submit" form="add-employee-form" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600, background: 'var(--primary)', color: 'white' }}>{editingId ? 'Update Employee' : 'Save Employee'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 30, 66, 0.54)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Confirm Deletion</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Are you sure you want to delete this employee record? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  type="button"
                  onClick={() => setDeleteId(null)} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontWeight: 600, flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmDelete} 
                  className="btn" 
                  style={{ padding: '8px 16px', fontWeight: 600, flex: 1, background: '#dc2626', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Existing Employee Modal */}
        {isExistingModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 30, 66, 0.54)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Assign Existing Employee</h2>
                <button onClick={() => setIsExistingModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: 'var(--bg-body)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Select an employee from another project to assign (clone) to the current active project with an independent assignment.
                </p>
                {otherProjectsEmployees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No other employees available to assign. All existing employees are already added to this project or none exist.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {otherProjectsEmployees.map(emp => (
                      <div 
                        key={emp.id} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{emp.name}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>Position: {emp.position}</span>
                            <span>•</span>
                            <span>Location: {emp.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsExistingModalOpen(false)} style={{ padding: '8px 16px', fontWeight: 600 }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PayrollAuth>
  );
}
