
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Truck, Clock, Filter, CheckCircle, AlertCircle, Loader2, ArrowRight, UserMinus, ShieldCheck, CheckSquare, Square, Building2, X, Users, Plus, Minus, Edit3 } from 'lucide-react';
import { Employee, Department } from '../types';
import { dataService } from '../services/dataService';

interface OutsideWorkProps {
  employees: Employee[];
  departments: Department[];
  onRefresh: () => void;
}

const OutsideWork: React.FC<OutsideWorkProps> = ({ employees, departments, onRefresh }) => {
  const [deptSearch, setDeptSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  
  // Changed selectedEmployees to store a map of ID -> Days
  const [selectedAssignments, setSelectedAssignments] = useState<Map<string, number>>(new Map());
  const [globalDefaultDays, setGlobalDefaultDays] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Extension Modal State
  const [extendingEmployee, setExtendingEmployee] = useState<Employee | null>(null);
  const [extensionDays, setExtensionDays] = useState(1);
  const [isExtending, setIsExtending] = useState(false);

  // Recall Modal State
  const [recallingEmployee, setRecallingEmployee] = useState<Employee | null>(null);
  const [isRecalling, setIsRecalling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const outsideWorkers = useMemo(() => {
    return employees.filter(e => e.outsideWorkUntil && e.outsideWorkUntil > currentTime);
  }, [employees, currentTime]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()));
  }, [departments, deptSearch]);

  const filteredPersonnel = useMemo(() => {
    return employees
      .filter(e => selectedDept === 'ALL' || e.department === selectedDept)
      .filter(e => !e.outsideWorkUntil || e.outsideWorkUntil <= currentTime)
      .filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase()));
  }, [employees, selectedDept, currentTime, employeeSearch]);

  const toggleEmployee = (id: string) => {
    const next = new Map(selectedAssignments);
    if (next.has(id)) next.delete(id);
    else next.set(id, globalDefaultDays);
    setSelectedAssignments(next);
  };

  const updateIndividualDays = (id: string, val: number) => {
    const next = new Map(selectedAssignments);
    if (next.has(id)) {
      next.set(id, Math.max(1, val));
      setSelectedAssignments(next);
    }
  };

  const setAllToGlobal = () => {
    const next = new Map(selectedAssignments);
    next.forEach((_, key) => next.set(key, globalDefaultDays));
    setSelectedAssignments(next);
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.size === filteredPersonnel.length) {
      setSelectedAssignments(new Map());
    } else {
      const next = new Map();
      filteredPersonnel.forEach(e => next.set(e.id, globalDefaultDays));
      setSelectedAssignments(next);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedAssignments.size === 0) return;
    setIsSubmitting(true);
    try {
      const payload = Array.from(selectedAssignments).map(([id, days]) => ({ employeeId: id, days }));
      await dataService.setOutsideWork(payload);
      setSelectedAssignments(new Map());
      setEmployeeSearch('');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Deployment Registration Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRecall = async () => {
    if (!recallingEmployee) return;
    setIsRecalling(true);
    try {
      await dataService.recallEmployeeFromOutsideWork(recallingEmployee.id);
      setRecallingEmployee(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Recall Failed: System Communication Error");
    } finally {
      setIsRecalling(false);
    }
  };

  const handleConfirmExtension = async () => {
    if (!extendingEmployee) return;
    setIsExtending(true);
    try {
      await dataService.extendOutsideWork(extendingEmployee.id, extensionDays);
      setExtendingEmployee(null);
      setExtensionDays(1);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Extension Failed");
    } finally {
      setIsExtending(false);
    }
  };

  const getCountdown = (until: number) => {
    const diff = until - currentTime;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Recall Confirmation Modal */}
      {recallingEmployee && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm">
              <UserMinus size={40} />
            </div>
            <h3 className="text-2xl font-black text-center text-black uppercase tracking-tight mb-2">Recall to Base?</h3>
            <p className="text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-8 leading-relaxed">
              Terminating field assignment for <span className="text-black">{recallingEmployee.name}</span>. 
              Staff will be returned to the <span className="text-red-500">Absent List</span> for today unless they physically Clock In.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRecallingEmployee(null)} 
                disabled={isRecalling}
                className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRecall}
                disabled={isRecalling}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-95 transition-all"
              >
                {isRecalling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Confirm Recall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {extendingEmployee && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 border border-emerald-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm">
              <Edit3 size={40} />
            </div>
            <h3 className="text-2xl font-black text-center text-black uppercase tracking-tight mb-2">Extend Mission</h3>
            <p className="text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-8 leading-relaxed">
              Adding extra days to <span className="text-black">{extendingEmployee.name}</span>'s active field assignment.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
               <button onClick={() => setExtensionDays(d => Math.max(1, d - 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200"><Minus size={18}/></button>
               <div className="flex flex-col items-center">
                  <input 
                    type="number" 
                    value={extensionDays} 
                    onChange={e => setExtensionDays(parseInt(e.target.value) || 1)}
                    className="w-20 text-center text-3xl font-black text-emerald-600 bg-transparent outline-none"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Additional Days</span>
               </div>
               <button onClick={() => setExtensionDays(d => d + 1)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200"><Plus size={18}/></button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setExtendingEmployee(null)} 
                disabled={isExtending}
                className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmExtension}
                disabled={isExtending}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                {isExtending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Apply Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Control Panel */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Truck size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tight">Assignment Registry</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Bulk Deployment & Field Protocol</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100">
             <ShieldCheck size={16} /> Protocol v4.0 Active
          </div>
        </div>

        <div className="p-8 grid lg:grid-cols-3 gap-10">
          
          {/* Step 1: Unit Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">01</div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">Search & Select Unit</h4>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Find Unit / Dept..." 
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-black shadow-sm"
                />
              </div>
              
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <button 
                  onClick={() => { setSelectedDept('ALL'); setSelectedAssignments(new Map()); }}
                  className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between ${selectedDept === 'ALL' ? 'bg-black text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center gap-3"><Building2 size={14} /> All Personnel</div>
                  {selectedDept === 'ALL' && <CheckCircle size={12} />}
                </button>
                {filteredDepartments.map(d => (
                  <button 
                    key={d.id}
                    onClick={() => { setSelectedDept(d.name); setSelectedAssignments(new Map()); }}
                    className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between ${selectedDept === d.name ? 'bg-black text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-3 line-clamp-1"><Building2 size={14} /> {d.name}</div>
                    {selectedDept === d.name && <CheckCircle size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Employee Selection */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">02</div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">Target Selection & Individual Days</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      placeholder="Search Staff Name..." 
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tight outline-none focus:ring-1 focus:ring-black w-full md:w-64"
                    />
                  </div>
                  {filteredPersonnel.length > 0 && (
                    <button 
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-black transition-all shrink-0"
                    >
                      {selectedAssignments.size === filteredPersonnel.length ? <CheckSquare size={16}/> : <Square size={16}/>}
                      {selectedAssignments.size === filteredPersonnel.length ? 'Reset' : 'Bulk'}
                    </button>
                  )}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredPersonnel.map(emp => {
                  const isSelected = selectedAssignments.has(emp.id);
                  const days = selectedAssignments.get(emp.id) || 1;
                  
                  return (
                    <div 
                      key={emp.id}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${isSelected ? 'bg-black text-white border-black shadow-lg scale-[1.01]' : 'bg-white text-slate-900 border-slate-100'}`}
                    >
                       <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                          <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-50 border-slate-200'}`}>
                            {isSelected && <CheckSquare size={14} className="text-white" />}
                          </div>
                          <div className="text-left flex-grow">
                             <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">{emp.name}</p>
                             <p className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>{emp.department}</p>
                          </div>
                       </div>
                       
                       {isSelected && (
                         <div className="flex items-center justify-between pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Custom Days</span>
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                               <button onClick={() => updateIndividualDays(emp.id, days - 1)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus size={10}/></button>
                               <input 
                                 type="number" 
                                 className="w-8 text-center bg-transparent border-none outline-none text-[11px] font-black text-white" 
                                 value={days}
                                 onChange={e => updateIndividualDays(emp.id, parseInt(e.target.value) || 1)}
                               />
                               <button onClick={() => updateIndividualDays(emp.id, days + 1)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus size={10}/></button>
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}
                {filteredPersonnel.length === 0 && (
                  <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black uppercase text-[10px] tracking-[0.3em] italic">
                    Unit registry empty or already deployed
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Step 3: Deployment Logic */}
        <div className="px-8 py-6 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Bulk Assignment Tool</span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-800 p-1 rounded-xl">
                    {[1, 3, 5, 14, 30].map(d => (
                      <button 
                        key={d} 
                        onClick={() => { setGlobalDefaultDays(d); }}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${globalDefaultDays === d ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center bg-slate-800 rounded-xl px-4 py-2 gap-2">
                     <span className="text-[8px] font-black text-slate-500 uppercase">Custom</span>
                     <input 
                       type="number"
                       value={globalDefaultDays}
                       onChange={e => setGlobalDefaultDays(parseInt(e.target.value) || 1)}
                       className="w-10 bg-transparent text-white text-[10px] font-black border-none outline-none text-center"
                     />
                  </div>
                  <button 
                    onClick={setAllToGlobal}
                    disabled={selectedAssignments.size === 0}
                    className="ml-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
                  >
                    Apply to Selected
                  </button>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
             <div className="text-right hidden md:block border-r border-slate-800 pr-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Queue Size</span>
                <span className="text-white font-black text-xl">{selectedAssignments.size} Unit{selectedAssignments.size !== 1 ? 's' : ''}</span>
             </div>
             <button 
              disabled={selectedAssignments.size === 0 || isSubmitting}
              onClick={handleBatchAssign}
              className="flex-grow md:flex-none px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-30 disabled:grayscale hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                Initiate Deployment
             </button>
          </div>
        </div>
      </div>

      {/* Field Monitor */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
               <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight">Active Field Monitor ({outsideWorkers.length})</h4>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Real-time duty logs</p>
            </div>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black text-black uppercase tracking-widest">Subject Identity</th>
              <th className="px-8 py-4 text-[10px] font-black text-black uppercase tracking-widest">Work Unit</th>
              <th className="px-8 py-4 text-[10px] font-black text-black uppercase tracking-widest">Mission status</th>
              <th className="px-8 py-4 text-[10px] font-black text-black uppercase tracking-widest text-right">Operation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {outsideWorkers.map(emp => (
              <tr key={emp.id} className="group hover:bg-emerald-50/10 transition-colors">
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{emp.name}</div>
                  <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active Assignment
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.department}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-[11px] uppercase">
                    <Clock size={14} className="text-emerald-500" />
                    {getCountdown(emp.outsideWorkUntil!)}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => setExtendingEmployee(emp)}
                      className="px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus size={14} /> Extend Mission
                    </button>
                    <button 
                      onClick={() => setRecallingEmployee(emp)}
                      className="px-5 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <UserMinus size={14} /> Recall to Base
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {outsideWorkers.length === 0 && (
          <div className="py-24 text-center text-slate-100 font-black uppercase tracking-[0.5em] italic">
            Deployment list clear
          </div>
        )}
      </div>
    </div>
  );
};

export default OutsideWork;
