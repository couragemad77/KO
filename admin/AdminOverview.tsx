
import React, { useMemo, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Zap,
  Plus,
  Megaphone,
  Download,
  RefreshCw,
  Truck,
  X,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Employee, AttendanceLog, AttendanceAction, SystemSettings } from '../types';

interface AdminOverviewProps {
  employees: Employee[];
  logs: AttendanceLog[];
  onQuickAction: (action: 'ADD_STAFF' | 'NOTICE' | 'REPORT' | 'SYNC') => void;
  settings: SystemSettings;
}

type ModalMode = 'TOTAL' | 'PRESENT' | 'ABSENT' | 'OUTSIDE' | null;

const AdminOverview: React.FC<AdminOverviewProps> = ({ employees, logs, onQuickAction, settings }) => {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalSearch, setModalSearch] = useState('');

  const stats = useMemo(() => {
    const now = Date.now();
    const today = new Date().setHours(0,0,0,0);
    const todayLogs = logs.filter(l => new Date(l.timestamp).setHours(0,0,0,0) === today);
    
    // Physical or auto-generated logins count as Present
    const presentIds = new Set(todayLogs.filter(l => l.action === AttendanceAction.LOGIN).map(l => l.subjectId));
    
    // Status flag for current Outside Work assignment
    const outsideIds = new Set(employees.filter(e => e.outsideWorkUntil && e.outsideWorkUntil > now).map(e => e.id));

    const total = employees.length;
    const present = presentIds.size;
    const outside = outsideIds.size;
    const absent = Math.max(0, total - present); // Correct logic: Total = Present + Absent

    const presentPct = total > 0 ? (present / total) * 100 : 0;
    const absentPct = total > 0 ? (absent / total) * 100 : 0;
    const outsidePct = total > 0 ? (outside / total) * 100 : 0;

    return { total, present, absent, outside, presentPct, absentPct, outsidePct, presentIds, outsideIds };
  }, [employees, logs]);

  const chartData = useMemo(() => {
    const startH = parseInt(settings.dayStart.split(':')[0]) || 6;
    const endH = parseInt(settings.dayEnd.split(':')[0]) || 18;
    const hoursCount = endH - startH + 1;
    
    const hours = Array.from({ length: hoursCount }, (_, i) => i + startH);
    const today = new Date().setHours(0,0,0,0);
    const todayLogs = logs.filter(l => new Date(l.timestamp).setHours(0,0,0,0) === today && l.action === AttendanceAction.LOGIN);
    
    return hours.map(h => {
      const count = todayLogs.filter(l => {
        const logHour = new Date(l.timestamp).getHours();
        return logHour === h;
      }).length;
      return { hour: `${h}:00`, count };
    });
  }, [logs, settings.dayStart, settings.dayEnd]);

  const modalList = useMemo(() => {
    let list = employees;
    if (modalMode === 'PRESENT') {
      list = employees.filter(e => stats.presentIds.has(e.id));
    } else if (modalMode === 'ABSENT') {
      list = employees.filter(e => !stats.presentIds.has(e.id));
    } else if (modalMode === 'OUTSIDE') {
      list = employees.filter(e => stats.outsideIds.has(e.id));
    } else if (modalMode === 'TOTAL') {
      list = employees;
    }

    if (modalSearch) {
      list = list.filter(e => e.name.toLowerCase().includes(modalSearch.toLowerCase()));
    }
    return list;
  }, [modalMode, employees, stats, modalSearch]);

  const chartHeight = 150;
  const chartWidth = 800;
  const maxCount = Math.max(...chartData.map(d => d.count), 5);
  const strokeDash = 251.3;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <style>{`
        @keyframes bounce-callout {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-callout {
          animation: bounce-callout 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        .bar-gradient {
          fill: url(#barGradient);
        }
      `}</style>

      {modalMode && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">
                  {modalMode === 'TOTAL' ? 'Registry Overview' : modalMode === 'PRESENT' ? 'Currently Logged In' : modalMode === 'OUTSIDE' ? 'Field Duty Staff' : 'Absent Personnel'}
                </h3>
                <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-1">Found {modalList.length} matches</p>
              </div>
              <button onClick={() => { setModalMode(null); setModalSearch(''); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-black">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  autoFocus
                  placeholder="Filter by name..." 
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 md:p-8">
              <div className="grid grid-cols-1 gap-3">
                {modalList.map(emp => {
                  const isPresent = stats.presentIds.has(emp.id);
                  const isOutside = stats.outsideIds.has(emp.id);
                  const status = isPresent ? 'PRESENT' : 'ABSENT';
                  
                  return (
                    <div key={emp.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-black transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-black uppercase text-sm leading-tight">{emp.name}</p>
                          <p className="text-[10px] text-black font-bold uppercase mt-0.5">{emp.department}</p>
                          {isOutside && (
                            <span className="text-[8px] font-black text-orange-600 uppercase tracking-tighter block mt-1">On Field Duty</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 items-center">
        <button onClick={() => onQuickAction('ADD_STAFF')} className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
          <Plus size={16} /> Add Employee
        </button>
        <button onClick={() => onQuickAction('NOTICE')} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-black transition-all">
          <Megaphone size={16} /> Send Announcement
        </button>
        <button onClick={() => onQuickAction('REPORT')} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-black transition-all">
          <Download size={16} /> Download Report
        </button>
        <button onClick={() => onQuickAction('SYNC')} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-black transition-all ml-auto">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => setModalMode('TOTAL')} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all overflow-hidden">
          <div className="flex-grow">
            <span className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">Total Registry</span>
            <span className="text-4xl font-black text-black leading-none">{stats.total}</span>
            <div className="flex items-center gap-1 text-black font-bold text-[9px] uppercase mt-3">
              <Users size={12} className="text-black" /> Full Personnel List
            </div>
          </div>
          <div className="relative w-16 h-16 shrink-0 ml-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={strokeDash} strokeDashoffset={0} className="text-black" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="text-black" size={16} />
            </div>
          </div>
        </div>

        <div onClick={() => setModalMode('PRESENT')} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all overflow-hidden">
          <div className="flex-grow">
            <span className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">Present Today</span>
            <span className="text-4xl font-black text-emerald-600 leading-none">{stats.present}</span>
            <div className="flex items-center gap-1 text-black font-bold text-[9px] uppercase mt-3">
              <ArrowUpRight size={12} className="text-emerald-500" /> {Math.round(stats.presentPct)}% Attendance
            </div>
          </div>
          <div className="relative w-16 h-16 shrink-0 ml-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={strokeDash} 
                strokeDashoffset={strokeDash - (strokeDash * stats.presentPct) / 100} 
                className="text-emerald-500 transition-all duration-1000" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <UserCheck className="text-emerald-500" size={16} />
            </div>
          </div>
        </div>

        <div onClick={() => setModalMode('ABSENT')} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all overflow-hidden">
          <div className="flex-grow">
            <span className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">Absent Today</span>
            <span className="text-4xl font-black text-red-600 leading-none">{stats.absent}</span>
            <div className="flex items-center gap-1 text-black font-bold text-[9px] uppercase mt-3">
              <ArrowDownRight size={12} className="text-red-500" /> {Math.round(stats.absentPct)}% Missing
            </div>
          </div>
          <div className="relative w-16 h-16 shrink-0 ml-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={strokeDash} 
                strokeDashoffset={strokeDash - (strokeDash * stats.absentPct) / 100} 
                className="text-red-500 transition-all duration-1000" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <UserMinus className="text-red-500" size={16} />
            </div>
          </div>
        </div>

        <div onClick={() => setModalMode('OUTSIDE')} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all overflow-hidden">
          <div className="flex-grow">
            <span className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">On Field Duty</span>
            <span className="text-4xl font-black text-orange-600 leading-none">{stats.outside}</span>
            <div className="flex items-center gap-1 text-black font-bold text-[9px] uppercase mt-3">
              <Truck size={12} className="text-orange-500" /> Deployment Registry
            </div>
          </div>
          <div className="relative w-16 h-16 shrink-0 ml-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={strokeDash} 
                strokeDashoffset={strokeDash - (strokeDash * stats.outsidePct) / 100} 
                className="text-orange-500 transition-all duration-1000" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Truck className="text-orange-500" size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">Attendance Trend</h3>
            <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-1">Clock-in volume by hour</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-black flex items-center gap-2 border border-gray-100">
              <Calendar size={14} className="text-black" /> Today: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        <div className="relative w-full h-[250px] mt-20">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((p, i) => (
              <line key={i} x1="0" y1={p * chartHeight} x2={chartWidth} y2={p * chartHeight} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
            ))}
            
            {chartData.map((d, i) => {
              const barWidth = 40;
              const x = (i / (chartData.length - 1)) * (chartWidth - barWidth);
              const barHeight = (d.count / maxCount) * chartHeight;
              const y = chartHeight - barHeight;
              return (
                <g key={i} className="group/bar">
                  <rect x={x} y={y} width={barWidth} height={barHeight} className="bar-gradient transition-all duration-500 hover:opacity-80 cursor-pointer" rx="8" />
                  <foreignObject x={x - 20} y={y - 65} width="80" height="60" className="overflow-visible pointer-events-none">
                    <div className="flex flex-col items-center animate-bounce-callout">
                      <div className="bg-black text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-2xl flex flex-col items-center justify-center min-w-[45px] border border-white/20">
                        <span className="text-[7px] leading-none opacity-60 mb-0.5">{d.hour}</span>
                        <span className="leading-none">{d.count}</span>
                      </div>
                      <div className="w-2.5 h-2.5 bg-black transform rotate-45 -mt-1.5 border-r border-b border-white/20"></div>
                    </div>
                  </foreignObject>
                  <text x={x + barWidth / 2} y={chartHeight + 25} textAnchor="middle" className="text-[12px] font-black fill-black uppercase tracking-tighter">{d.hour}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-lg shadow-emerald-200/50">
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-1">Live Efficiency</h4>
            <span className="text-4xl font-black uppercase">{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% Present</span>
          </div>
          <Zap size={44} className="opacity-20 animate-pulse" />
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-lg shadow-slate-200/50">
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-1">System Health</h4>
            <span className="text-4xl font-black uppercase flex items-center gap-3">
              <CheckCircle2 size={32} className="text-emerald-400" /> 
              ACTIVE
            </span>
          </div>
          <RefreshCw size={44} className="opacity-10" />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
