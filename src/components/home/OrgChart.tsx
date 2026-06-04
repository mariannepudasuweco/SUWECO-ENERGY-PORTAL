import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Users, User, HardHat, Zap, Settings, ShieldCheck, ChevronDown, ChevronUp, Edit2, Check, Lock, X } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role?: string;
}

interface Team {
  id: string;
  name: string;
  icon: React.ReactNode;
  members: Member[];
}

export default function OrgChart() {
  const [manager, setManager] = useState<Member>({ id: 'mgr', name: 'JONATHAN SINGIAN', role: 'PROJECT MANAGER' });
  const [deputy, setDeputy] = useState<Member>({ id: 'dep', name: 'STEVEN TOLEDO', role: 'DEPUTY PROJECT MANAGER' });
  
  const [coordinators, setCoordinators] = useState<Member[]>([
    { id: 'c1', name: 'MAE ANN BODIONGAN', role: 'Technical Compliance' },
    { id: 'c2', name: 'MARIANNE PUDA', role: 'Resources Coordinator' },
    { id: 'c3', name: 'JANNA DE CLARO', role: 'Project Coordinator' },
  ]);

  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'civil',
      name: 'CIVIL TEAM',
      icon: <HardHat className="w-5 h-5" />,
      members: [
        { id: 'ct1', name: 'MARK JOSHUA DAMPIL', role: 'Project Engineer (Civil)' },
        { id: 'ct2', name: 'SHAWN LENARD MACABATA', role: 'Project Engineer (Civil)' },
        { id: 'ct3', name: 'JERRON COSTALES', role: 'Project Engineer (Civil)' },
        { id: 'ct4', name: 'GIBB BELGA', role: 'Surveyor' },
        { id: 'ct5', name: 'JEFFREY MENDOZA', role: 'General Foreman' },
        { id: 'ct6', name: 'MARGARITO ESPINAS', role: 'Foreman (Civil)' },
        { id: 'ct7', name: 'DREG MANGAO', role: 'Leadman (Civil)' },
        { id: 'ct8', name: 'MIGUEL MERANO', role: 'Leadman (Civil)' },
      ],
    },
    {
      id: 'electrical',
      name: 'ELECTRICAL TEAM',
      icon: <Zap className="w-5 h-5" />,
      members: [
        { id: 'et1', name: 'RONNEL BARIAS', role: 'Project Engineer (Electrical)' },
        { id: 'et2', name: 'KEVIN ESTRADA', role: 'Project Engineer (Electrical)' },
        { id: 'et3', name: 'ZIRACH AROCHA', role: 'Project Engineer (SCADA)' },
        { id: 'et4', name: 'RALPH JOHN FABELLO', role: 'Leadman (Electrical)' },
        { id: 'et5', name: 'BERNI GALLOS', role: 'Heavy Equipment Operator' },
        { id: 'et6', name: 'RESTY CONGUEZ', role: 'Leadman (Civil)' },
        { id: 'et7', name: 'SULPICIO MENDOZA', role: 'Leadman (Civil)' },
      ],
    },
    {
      id: 'mechanical',
      name: 'MECHANICAL TEAM',
      icon: <Settings className="w-5 h-5" />,
      members: [
        { id: 'mt1', name: 'BRIAN ALLEN SUAN', role: 'Project Engineer (Mechanical)' },
        { id: 'mt2', name: 'ALBERT LAM-AN', role: 'Foreman (Mechanical)' },
        { id: 'mt3', name: 'ALDRIN MAGTIBAY', role: 'Leadman (Mechanical)' },
        { id: 'mt4', name: 'NARRI VISCA', role: 'Leadman (Mechanical)' },
      ],
    },
    {
      id: 'admin',
      name: 'ADMIN TEAM',
      icon: <Users className="w-5 h-5" />,
      members: [
        { id: 'at1', name: 'ELIOMAR LAYUSAN', role: 'Admin Assistant' },
        { id: 'at2', name: 'JANICA ESPIRITU', role: 'Accounting Assistant' },
        { id: 'at3', name: 'BEATRIZ FAUSTO', role: 'Cashier / Cooperator' },
        { id: 'at4', name: 'ROWENA ESPARAGOZA', role: 'Timekeeper' },
        { id: 'at5', name: 'AVIJOY CASIMERO', role: 'Admin Staff' },
        { id: 'at6', name: 'CHARIZ SALAZAR', role: 'Admin Staff' },
        { id: 'at7', name: 'PINKY MAAMBONG', role: 'Admin Assistant' },
        { id: 'at8', name: 'JB JAMAICA COCHING', role: 'Admin Assistant' },
        { id: 'at9', name: 'ANALYN GALVARO', role: 'Utility' },
        { id: 'at10', name: 'VACANT', role: 'Driver' },
        { id: 'at11', name: 'JULIE MASUNGCA', role: 'Service Driver / Boom Truck Driver' },
      ],
    },
    {
      id: 'safety',
      name: 'SAFETY & SECURITY TEAM',
      icon: <ShieldCheck className="w-5 h-5" />,
      members: [
        { id: 'st1', name: 'PHILLIP FLORENCIO', role: 'Safety Officer / HSE Admin' },
        { id: 'st2', name: 'JONAS FALOGME', role: 'Compliance Officer, PCO' },
        { id: 'st3', name: 'JOHN IRISH TOMBOCON', role: 'Pre-Licensing Officer (Safety Officer)' },
        { id: 'st4', name: 'FRANCE IVAR FABITO', role: 'Pollution Control Officer (PCO)' },
        { id: 'st5', name: 'JOHN PAUL SOLEDAD', role: 'Warehouseman' },
        { id: 'st6', name: 'DEXTER GACU', role: 'Assistant Warehouse' },
        { id: 'st7', name: 'SECURITY OFFICERS', role: 'QHSEA Agency' },
      ],
    },
  ]);

  const updateMemberName = (teamId: string, memberId: string, newName: string) => {
    setTeams(teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members.map(m => m.id === memberId ? { ...m, name: newName } : m)
        };
      }
      return team;
    }));
  };

  const updateMemberRole = (teamId: string, memberId: string, newRole: string) => {
    setTeams(teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members.map(m => m.id === memberId ? { ...m, role: newRole } : m)
        };
      }
      return team;
    }));
  };

  const updateCoordinatorName = (memberId: string, newName: string) => {
    setCoordinators(coordinators.map(c => c.id === memberId ? { ...c, name: newName } : c));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'stec') {
      setIsEditing(true);
      setShowAuthModal(false);
      setPassword('');
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        duration: 0.5, 
        ease: "easeInOut" as any,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { duration: 0.4, ease: "easeInOut" as any }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as any }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full mt-16 overflow-x-auto pb-8 font-inter relative"
    >
      <div className="absolute top-0 right-4 z-50">
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-md transition-colors text-sm font-bold"
          >
            <Check className="w-4 h-4" /> Save Chart
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 bg-[#003da6] hover:bg-[#002870] text-white px-4 py-2 rounded-full shadow-md transition-colors text-sm font-bold"
          >
            <Edit2 className="w-4 h-4" /> Edit Chart
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 bg-[#1b2d48] text-white relative">
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#f5a623]" />
                  </div>
                  <h3 className="font-bold text-lg font-inter">Admin Access</h3>
                </div>
                <p className="text-sm text-white/70">Enter password to edit the organization chart.</p>
              </div>
              <form onSubmit={handleAuthSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#003da6] focus:ring-1 focus:ring-[#003da6] transition-all"
                    placeholder="Enter password"
                    autoFocus
                  />
                  {authError && <p className="text-red-500 text-xs mt-2">{authError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#f5a623] hover:bg-[#e0931d] text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                  Unlock Edit Mode
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-w-[1000px] max-w-6xl mx-auto flex flex-col items-center select-none bg-gray-50 p-8 pt-12 rounded-3xl border border-gray-100">
        
        {/* Top Leadership */}
        <div className="flex flex-col items-center relative w-[320px] mx-auto z-10">
          
          {/* Dashed Bracket for Coordinators */}
          {/* PM center y ~ 44px. DPM center y ~ 168px (88 + 40 + 44). Bracket spans between them on the left side */}
          <div className="absolute top-[44px] left-[calc(-12px)] w-[12px] h-[124px] border-l-[1.5px] border-y-[1.5px] border-dashed border-[#003da6] hidden lg:block -z-10">
            {/* Horizontal connector to Coordinators Box from the middle of the bracket */}
            <div className="absolute top-1/2 right-[100%] w-[32px] border-t-[1.5px] border-dashed border-[#003da6]"></div>
          </div>

          {/* Coordinators Box */}
          <motion.div variants={itemVariants} className="absolute right-[calc(100%+44px)] top-[106px] -translate-y-1/2 hidden lg:block">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 min-w-[260px] relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#003da6]" />
                <h3 className="font-bold text-[#003da6] text-xs uppercase tracking-widest">Coordinators</h3>
              </div>
              <div className="flex flex-col gap-4">
                {coordinators.map(coord => (
                  <div key={coord.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-[#003da6]" />
                    </div>
                    <div className="flex flex-col flex-1">
                      {isEditing ? (
                        <>
                          <input 
                            type="text" 
                            value={coord.name} 
                            onChange={(e) => updateCoordinatorName(coord.id, e.target.value)}
                            className="bg-transparent border-b border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-400 rounded-none px-0 w-full"
                          />
                          <input 
                            type="text" 
                            value={coord.role} 
                            onChange={(e) => setCoordinators(coordinators.map(c => c.id === coord.id ? {...c, role: e.target.value} : c))}
                            className="bg-transparent border-b border-gray-200 text-xs text-gray-500 focus:outline-none focus:border-blue-400 rounded-none px-0 w-full mt-1"
                          />
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold text-gray-800 leading-tight">{coord.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{coord.role}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Project Manager */}
          <motion.div variants={itemVariants} className="bg-[#0b1b36] text-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full flex items-center p-4 relative z-10 h-[88px]">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 border border-white/20 flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col flex-1">
              {isEditing ? (
                <>
                  <input 
                    type="text" 
                    value={manager.name} 
                    onChange={(e) => setManager({...manager, name: e.target.value.toUpperCase()})}
                    className="bg-transparent border-b border-white/20 text-lg font-bold text-white focus:outline-none focus:border-white rounded-none px-0 w-full leading-tight"
                  />
                  <input 
                    type="text" 
                    value={manager.role} 
                    onChange={(e) => setManager({...manager, role: e.target.value.toUpperCase()})}
                    className="bg-transparent border-b border-white/20 text-[11px] font-bold text-[#f5a623] tracking-widest focus:outline-none focus:border-white rounded-none px-0 w-full mt-1"
                  />
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-white leading-tight block">{manager.name}</span>
                  <span className="text-[11px] font-bold text-[#f5a623] tracking-widest mt-1 block">{manager.role}</span>
                </>
              )}
            </div>
          </motion.div>
          
          {/* Vertical Connector */}
          <motion.div variants={itemVariants} className="w-px h-10 bg-[#003da6] relative z-0"></motion.div>

          {/* Deputy Project Manager */}
          <motion.div variants={itemVariants} className="bg-[#003da6] text-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full flex items-center p-4 relative z-10 h-[88px]">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 border border-white/20 flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col flex-1">
              {isEditing ? (
                <>
                  <input 
                    type="text" 
                    value={deputy.name} 
                    onChange={(e) => setDeputy({...deputy, name: e.target.value.toUpperCase()})}
                    className="bg-transparent border-b border-white/20 text-lg font-bold text-white focus:outline-none focus:border-white rounded-none px-0 w-full leading-tight"
                  />
                  <input 
                    type="text" 
                    value={deputy.role} 
                    onChange={(e) => setDeputy({...deputy, role: e.target.value.toUpperCase()})}
                    className="bg-transparent border-b border-white/20 text-[11px] font-bold text-[#f5a623] tracking-widest focus:outline-none focus:border-white rounded-none px-0 w-full mt-1"
                  />
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-white leading-tight block">{deputy.name}</span>
                  <span className="text-[11px] font-bold text-[#f5a623] tracking-widest mt-1 block">{deputy.role}</span>
                </>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="w-px h-10 bg-[#003da6] relative z-0"></motion.div>
        </div>

        {/* Branches */}
        <div className="flex w-full justify-center relative z-0 mt-0">
          <div className="relative flex gap-4 pt-8 w-full justify-center">
            {/* Horizontal Connector Line for branches */}
            <motion.div variants={itemVariants} className="absolute top-0 left-[100px] right-[100px] h-px bg-[#003da6]"></motion.div>
            
            {teams.map((team, index) => (
               <motion.div variants={itemVariants} key={team.id} className="flex flex-col w-[200px] relative z-10">
                 {/* Vertical drop line to team card */}
                 <div className="absolute -top-8 left-1/2 w-px h-8 bg-[#003da6] -z-10"></div>
                 
                 {/* Team card */}
                 <div className="bg-[#003da6] text-white rounded-xl shadow-md p-4 flex items-center gap-3 mb-2 z-10 w-full h-[60px]">
                   <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-[#003da6]">
                     {team.icon}
                   </div>
                   <h3 className="font-bold text-xs uppercase tracking-wide leading-tight flex-1">
                     {team.name}
                   </h3>
                 </div>

                 {/* Members list */}
                 <div className="flex flex-col gap-2">
                   {team.members.map(member => (
                     <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 flex items-start gap-3">
                       <User className="w-5 h-5 text-[#003da6] flex-shrink-0 mt-1" />
                       <div className="flex flex-col w-full">
                         {isEditing ? (
                           <>
                             <input 
                                type="text" 
                                value={member.name} 
                                onChange={(e) => updateMemberName(team.id, member.id, e.target.value)}
                                className="bg-transparent border-b border-gray-200 text-[11px] font-bold text-gray-800 uppercase focus:outline-none focus:border-blue-400 rounded-none px-0 w-full leading-tight"
                              />
                             <input 
                                type="text" 
                                value={member.role || ''} 
                                onChange={(e) => updateMemberRole(team.id, member.id, e.target.value)}
                                className="bg-transparent border-b border-gray-200 text-[10px] text-gray-500 focus:outline-none focus:border-blue-400 rounded-none px-0 w-full mt-1 leading-tight"
                                placeholder="Add role"
                              />
                           </>
                         ) : (
                           <>
                             <span className="text-[11px] font-bold text-gray-800 uppercase leading-tight block">{member.name}</span>
                             {member.role && <span className="text-[10px] text-gray-500 mt-0.5 block leading-tight">{member.role}</span>}
                           </>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </motion.div>
            ))}
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}
