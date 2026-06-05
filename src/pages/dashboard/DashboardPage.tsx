import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Folder, Clock, AlertCircle, CheckCircle2, Search, Filter, CalendarDays, MoreVertical, Building2, Sun, Wind, Droplets, ChevronDown } from 'lucide-react';

export default function DashboardPage() {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
  let isMounted = true;

  async function loadProjectsFromSupabase() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('LOAD PROJECTS DATA:', data);
    console.log('LOAD PROJECTS ERROR:', error);

    if (error) {
      console.error('Failed to load projects:', error);
      return;
    }

    const mappedProjects = (data || []).map((project: any) => ({
      id: project.id,
      title: project.name,
      name: project.name,
      location: project.location || 'No location set',
      type: project.project_type || '',
      status: project.status || 'In Bidding',
      budget: Number(project.total_budget || 0),
      expenses: Number(project.total_expenses || 0),
      progress: Number(project.progress_percent || 0),
      dueDate: project.target_completion_date,
      startDate: project.start_date,
    }));

    console.log('MAPPED PROJECTS:', mappedProjects);

    if (!isMounted) return;

    setProjectsList(mappedProjects);

    // Keep old legacy project selector synced
    (window as any).projects = mappedProjects;
    window.dispatchEvent(new CustomEvent('projectsUpdated'));
  }

  loadProjectsFromSupabase();

  const handleClickOutside = () => setOpenStatusDropdown(null);
  const handleScroll = () => setOpenStatusDropdown(null);

  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScroll, true);

  return () => {
    isMounted = false;
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleScroll, true);
  };
}, []);

  const handleStatusChange = async (
  e: React.MouseEvent,
  projectId: string,
  newStatus: string
) => {
  e.stopPropagation();

  console.log('UPDATING PROJECT STATUS:', {
    projectId,
    newStatus,
  });

  const { data, error } = await supabase
    .from('projects')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  console.log('UPDATE STATUS DATA:', data);
  console.log('UPDATE STATUS ERROR:', error);

  if (error) {
    alert('Failed to update project status. Check console.');
    console.error(error);
    return;
  }

  setProjectsList((prevProjects) =>
    prevProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: newStatus,
          }
        : project
    )
  );

  if ((window as any).projects) {
    (window as any).projects = (window as any).projects.map((project: any) =>
      project.id === projectId
        ? {
            ...project,
            status: newStatus,
          }
        : project
    );

    window.dispatchEvent(new CustomEvent('projectsUpdated'));
  }

  setOpenStatusDropdown(null);
};

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '₱0.00';
    if (val >= 1000000) {
      return `₱${(val / 1000000).toFixed(2)}M`;
    }
    return `₱${val.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Bidding': return 'bg-blue-100 text-blue-700';
      case 'Ongoing': return 'bg-emerald-100 text-emerald-700';
      case 'Awarded': return 'bg-orange-100 text-orange-600';
      case 'On Hold': return 'bg-amber-100 text-amber-600';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'Diesel Power Plant':
      case 'DPP': return 'bg-blue-100 text-blue-700';
      case 'Solar Power Plant':
      case 'SPP': return 'bg-orange-100 text-orange-700';
      case 'Wind Power Plant':
      case 'WIND': return 'bg-purple-100 text-purple-700';
      case 'Hydropower Plant':
      case 'HYDRO': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Diesel Power Plant':
      case 'DPP': return <Building2 className="text-blue-500 w-5 h-5" />;
      case 'Solar Power Plant':
      case 'SPP': return <Sun className="text-orange-500 w-5 h-5" />;
      case 'Wind Power Plant':
      case 'WIND': return <Wind className="text-purple-500 w-5 h-5" />;
      case 'Hydropower Plant':
      case 'HYDRO': return <Droplets className="text-teal-500 w-5 h-5" />;
      default: return <Folder className="text-gray-500 w-5 h-5" />;
    }
  };

  const getTypeIconBg = (type: string) => {
    switch(type) {
      case 'Diesel Power Plant':
      case 'DPP': return 'bg-blue-50';
      case 'Solar Power Plant':
      case 'SPP': return 'bg-orange-50';
      case 'Wind Power Plant':
      case 'WIND': return 'bg-purple-50';
      case 'Hydropower Plant':
      case 'HYDRO': return 'bg-teal-50';
      default: return 'bg-gray-50';
    }
  };
  
  const getDisplayType = (type: string) => {
    switch(type) {
      case 'Diesel Power Plant': return 'DPP';
      case 'Solar Power Plant': return 'SPP';
      case 'Wind Power Plant': return 'WIND';
      case 'Hydropower Plant': return 'HYDRO';
      case 'Hybrid Power Plant': return 'HYBRID';
      default: return type || 'UNK';
    }
  }

  const biddingCount = projectsList.filter(p => p.status === 'In Bidding').length;
  const ongoingCount = projectsList.filter(p => p.status === 'Ongoing').length;
  const completedCount = projectsList.filter(p => p.status === 'Completed').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = projectsList.filter(p => p.status !== 'Completed' && p.dueDate && new Date(p.dueDate) < new Date(todayStr)).length;

  const filteredProjects = projectsList.filter(p => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Bidding') return p.status === 'In Bidding';
    if (activeTab === 'Ongoing') return p.status === 'Ongoing';
    if (activeTab === 'Completed') return p.status === 'Completed';
    if (activeTab === 'On Hold / Cancelled') return ['On Hold', 'Cancelled'].includes(p.status);
    return true;
  });

  return (
    <div className="flex-1 overflow-auto no-scrollbar w-full bg-[#F8FAFC]">
      <div className="p-8 w-full max-w-none flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-[15px]">Manage your projects and track project status</p>
          </div>
          <button 
            className="bg-[#0A26CF] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm text-sm"
            onClick={() => (window as any).openProjectModal?.()}
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Folder size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Projects in Bidding</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{biddingCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Ongoing Projects</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{ongoingCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Overdue Projects</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{overdueCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Completed Projects</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{completedCount}</div>
            </div>
          </div>
        </div>

        {/* Overview Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-wrap gap-4">
            <h2 className="text-[19px] font-bold text-slate-900 tracking-tight">Project Overview</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 w-[240px] text-slate-700 transition-all placeholder-slate-400"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center border-b border-slate-100 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {['All', 'Bidding','Ongoing', 'Completed', 'On Hold / Cancelled'].map(tab => (
                <button 
                  key={tab}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                    activeTab === tab 
                    ? 'bg-[#0A26CF] text-white' 
                    : 'text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar w-full">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-[14px]">
                      No projects found.
                    </td>
                  </tr>
                ) : filteredProjects.map((project) => {
                  const expenses = project.expenses || 0;
                  const budget = project.budget || 0;
                  const remaining = Math.max(0, budget - expenses);
                  const progressPct = project.progress != null ? Math.min(100, Math.max(0, project.progress)) : 0;
                  
                  let dueDays = -1;
                  if (project.dueDate) {
                    const diffTime = new Date(project.dueDate).getTime() - new Date(todayStr).getTime();
                    dueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group bg-white">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${getTypeIconBg(project.type)}`}>
                            {getTypeIcon(project.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-[14px] truncate tracking-tight" title={project.title}>{project.title}</div>
                            <div className="text-[12px] font-medium text-slate-500 truncate mt-0.5" title={project.location || 'No location set'}>{project.location || 'No location set'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-[6px] text-[11px] font-bold tracking-wider ${getTypeStyle(project.type)}`}>
                          {getDisplayType(project.type)}
                        </span>
                      </td>
                      <td className="py-4 px-3 pr-6">
                        <div className="w-full">
                          <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Progress</div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                            <span className={`text-[12px] font-bold w-9 text-right ${progressPct === 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                              {progressPct}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900 text-[13px]">{formatCurrency(budget)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 mb-1.5 font-medium">Total Budget</div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-blue-600 rounded-full w-full"></div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900 text-[13px]">{formatCurrency(expenses)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 mb-1.5 font-medium">Total Expenses</div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-slate-300 rounded-full" style={{ width: `${budget > 0 ? (expenses/budget)*100 : 0}%` }}></div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-emerald-600 text-[13px]">{formatCurrency(remaining)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 mb-1.5 font-medium">Remaining Budget</div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${budget > 0 ? (remaining/budget)*100 : 0}%` }}></div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        {project.dueDate ? (
                          <>
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[13px]">
                              <CalendarDays className="w-4 h-4 text-slate-400" />
                              {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className={`text-[11px] mt-1 font-medium ${dueDays < 0 ? 'text-rose-500' : (dueDays === 0 ? 'text-orange-500' : 'text-slate-500')}`}>
                              {dueDays < 0 ? 'Overdue' : (dueDays === 0 ? 'Due today' : `Due in ${dueDays} days`)}
                            </div>
                          </>
                        ) : (
                          <div className="text-[13px] text-slate-400 italic">No date set</div>
                        )}
                      </td>
                      <td className="py-4 px-3 relative">
                        <button 
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-bold ${getStatusColor(project.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openStatusDropdown === project.id) {
                              setOpenStatusDropdown(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                              setOpenStatusDropdown(project.id);
                            }
                          }}
                        >
                          {project.status || 'Draft'}
                          <ChevronDown size={14} className="ml-0.5 opacity-70" />
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          className="bg-white border border-blue-200/80 text-blue-600 font-bold px-4 py-1.5 rounded-lg text-[12px] hover:bg-blue-50 transition-colors shadow-sm"
                          onClick={() => (window as any).renderProjectView && (window as any).renderProjectView(project.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 flex items-center justify-between text-[12px] font-medium text-slate-500">
            <div>Showing {filteredProjects.length > 0 ? 1 : 0} to {filteredProjects.length} of {filteredProjects.length} projects</div>
            <div className="flex gap-1">
              <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md bg-white text-slate-400 disabled:opacity-40 shadow-sm transition-colors hover:bg-slate-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center border-0 rounded-md bg-[#0A26CF] text-white font-semibold shadow-sm">
                1
              </button>
              <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md bg-white text-slate-400 disabled:opacity-40 shadow-sm transition-colors hover:bg-slate-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Status Dropdown */}
      {openStatusDropdown && (
        <div 
          className="fixed w-36 bg-white border border-slate-200 shadow-lg rounded-lg z-[100] py-1" 
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onClick={e => e.stopPropagation()}
        >
          {['In Bidding', 'Ongoing', 'Completed', 'On Hold', 'Cancelled'].map(status => {
            const project = projectsList.find(p => p.id === openStatusDropdown);
            const isActive = project?.status === status;
            
            return (
              <button
                key={status}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 transition-colors ${isActive ? 'font-bold bg-slate-50 text-blue-600' : 'text-slate-700'}`}
                onClick={(e) => handleStatusChange(e, openStatusDropdown, status)}
              >
                {status}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
