
import React, { useMemo, useState } from 'react';
import { Search, ArrowRight, Download, CheckCircle2, Clock, DoorOpen, DoorClosed } from 'lucide-react';
import { InformalLog } from '../types';

interface GateLogProps {
  logs: InformalLog[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onReportOpen: () => void;
}

const GateLog: React.FC<GateLogProps> = ({ 
  logs, 
  searchQuery, 
  setSearchQuery, 
  onReportOpen
}) => {
  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></div>
          <input 
            placeholder="Search Gate Pass History..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <button onClick={onReportOpen} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">
          <Download size={14}/> Download Log
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest">Personnel</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center">Departure</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center">Return</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center">Duration</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-all duration-300">
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.employeeName}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{log.date}</div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <DoorOpen size={14} className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-600">{new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <div className="flex flex-col items-center gap-1">
                      <DoorClosed size={14} className={log.timeIn ? "text-emerald-500" : "text-gray-200"} />
                      <span className="text-sm font-bold text-slate-600">
                        {log.timeIn ? new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                  {log.duration ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                       <Clock size={12} /> {log.duration}
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-orange-500 uppercase animate-pulse">Out Now</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {log.timeIn ? (
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                      <CheckCircle2 size={14} /> Completed
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 text-orange-500 font-black text-[10px] uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
                      On Errands
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="py-24 text-center text-gray-300 font-black uppercase tracking-[0.3em] italic bg-slate-50/20">
            No Gate Pass activity found
          </div>
        )}
      </div>
    </div>
  );
};

export default GateLog;
