
import React, { useMemo, useState, useEffect } from 'react';
import { Search, ArrowRight, Download, CheckCircle2, AlertCircle, Truck, Calendar, Trash2, Filter, ChevronDown, LogIn, LogOut, Clock } from 'lucide-react';
import { AttendanceLog, AttendanceSession, AttendanceAction, LogStatus } from '../types';
import { dataService } from '../services/dataService';

interface StaffLogsProps {
  logs: AttendanceLog[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: 'ALL' | 'EARLY' | 'LATE';
  setActiveFilter: (f: 'ALL' | 'EARLY' | 'LATE') => void;
  onReportOpen: () => void;
  onWipeLogs: () => void;
  highlightedId: string | null;
  handleSuggestionClick: (name: string) => void;
}

type DateRange = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

const StaffLogs: React.FC<StaffLogsProps> = ({ 
  logs, 
  searchQuery, 
  setSearchQuery, 
  activeFilter, 
  setActiveFilter, 
  onReportOpen,
  onWipeLogs,
  highlightedId,
  handleSuggestionClick
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const s = await dataService.getAttendanceSessions(logs);
      setSessions(s.filter(sess => sess.type === 'EMPLOYEE'));
    };
    fetchSessions();
  }, [logs]);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = startOfToday - (now.getDay() * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sessions.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchDate = true;
      const [d, m, y] = s.date.split('/').map(Number);
      const sessTime = new Date(y, m - 1, d).getTime();
      
      if (dateRange === 'TODAY') matchDate = sessTime >= startOfToday;
      else if (dateRange === 'YESTERDAY') matchDate = sessTime >= startOfYesterday && sessTime < startOfToday;
      else if (dateRange === 'THIS_WEEK') matchDate = sessTime >= startOfWeek;
      else if (dateRange === 'THIS_MONTH') matchDate = sessTime >= startOfMonth;

      return matchSearch && matchDate;
    });
  }, [sessions, searchQuery, dateRange]);

  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    return sessions
      .map(s => s.name)
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [searchQuery, sessions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative w-full md:w-80">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></div>
            <input 
              placeholder="Search Personnel..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-black outline-none transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[60] overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { handleSuggestionClick(s); setShowSuggestions(false); }} className="w-full px-6 py-3 text-left text-xs font-bold uppercase tracking-tight hover:bg-emerald-50 hover:text-emerald-700 border-b border-gray-50 flex items-center justify-between">
                    {s} <ArrowRight size={12}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
            {[
              { id: 'ALL', label: 'History' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'THIS_WEEK', label: 'Week' },
              { id: 'THIS_MONTH', label: 'Month' }
            ].map(range => (
              <button 
                key={range.id}
                onClick={() => setDateRange(range.id as DateRange)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${dateRange === range.id ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-white/50'}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onReportOpen} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">
            <Download size={14}/> Generate Report
          </button>
          
          <button onClick={onWipeLogs} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all ml-auto xl:ml-0">
            <Trash2 size={14}/> Purge Database
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest w-32">Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest">Personnel Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center w-40">Entry (In)</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center w-40">Exit (Out)</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-right w-32">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSessions.map((sess, idx) => (
              <tr key={idx} className={`transition-all duration-300 hover:bg-slate-50/50`}>
                <td className="px-8 py-5">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{sess.date}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-black uppercase tracking-tight">{sess.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{sess.department}</div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <LogIn size={14} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-900">{sess.timeIn}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <LogOut size={14} className={sess.timeOut === 'ONSITE' ? 'text-orange-300 animate-pulse' : 'text-orange-600'} />
                      {sess.timeOut === 'ONSITE' ? (
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                          ONSITE
                        </span>
                      ) : (
                        <span className="text-sm font-black text-slate-900">{sess.timeOut}</span>
                      )}
                   </div>
                </td>
                <td className="px-8 py-5 text-right">
                  {sess.timeOut === 'ONSITE' ? (
                    <div className="flex items-center justify-end gap-1.5 text-orange-500 font-black text-[10px] uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div> Active
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                      <CheckCircle2 size={14} /> Completed
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSessions.length === 0 && (
          <div className="py-24 text-center text-gray-300 font-black uppercase tracking-[0.3em] italic bg-slate-50/20">
            No Attendance Sessions Identified
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffLogs;
