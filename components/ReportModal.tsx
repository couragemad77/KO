
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Download, Printer, Calendar, ShieldCheck, Loader2, FileCheck, Users, Zap, Briefcase } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { dataService } from '../services/dataService';
import { AttendanceSession, AttendanceLog } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: AttendanceLog[];
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, title, data }) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    } else {
      setIsCompiling(false);
      setProgress(0);
    }
  }, [isOpen, data]);

  const loadSessions = async () => {
    const s = await dataService.getAttendanceSessions(data);
    setSessions(s);
  };

  const reportStats = useMemo(() => {
    const total = sessions.length;
    const stillIn = sessions.filter(s => s.timeOut === 'Still in premise').length;
    const completed = total - stillIn;
    return { total, stillIn, completed };
  }, [sessions]);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsCompiling(true);
    setProgress(10);
    
    const filename = `Official_Report_${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    try {
      setProgress(20);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.scrollWidth,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-document-body');
          if (el) el.style.boxShadow = 'none';
        }
      });
      
      setProgress(60);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setProgress(90);
      pdf.save(`${filename}.pdf`);
      setProgress(100);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setTimeout(() => setIsCompiling(false), 500);
    }
  };

  const handlePrint = () => {
    const printContent = reportRef.current?.innerHTML;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - ${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; padding: 0; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="p-8">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[1200px] h-[94vh] flex flex-col animate-in zoom-in duration-300 overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
              <FileCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-black uppercase tracking-tight">Intelligence Report</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Official Document Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-5 py-2.5 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all flex items-center gap-2 font-black uppercase text-[10px] text-gray-500 shadow-sm">
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          {/* Summary Panel */}
          <div className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex flex-col gap-6 shrink-0">
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
                <span className="text-[8px] font-black uppercase text-emerald-800 block mb-1 tracking-widest">Integrity Seal</span>
                <p className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-2">
                   <ShieldCheck size={12}/> System Verified
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[8px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Registry Data</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Total</span>
                    <span className="text-[10px] font-black text-black">{reportStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">On-Site</span>
                    <span className="text-[10px] font-black text-orange-600">{reportStats.stillIn}</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDownloadPDF}
              disabled={isCompiling}
              className="mt-auto w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all tracking-widest"
            >
              {isCompiling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isCompiling ? `${progress}%` : 'Save as PDF'}
            </button>
          </div>

          {/* Report Sheet */}
          <div className="flex-grow p-4 md:p-8 bg-slate-100 overflow-auto flex justify-center items-start">
            <div 
              id="report-document-body"
              ref={reportRef} 
              className="bg-white w-[210mm] shadow-2xl p-12 md:p-16 min-h-[297mm] flex flex-col text-slate-900 border border-gray-100 relative overflow-hidden"
            >
               {/* Watermark */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none rotate-[-30deg]">
                  <img src="https://i.ibb.co/DPPY7V1y/knockout-brand-logo-new-ped9bkln64voz9pspi7vvchdoed9chy3bbtm7aviee.png" alt="Logo" className="w-[800px] grayscale"/>
               </div>

               {/* Letterhead */}
               <div className="flex justify-between items-start border-b-8 border-black pb-10 mb-10">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-black rounded-3xl shadow-lg flex items-center gap-6">
                      <img src="https://i.ibb.co/YM5b3Ny/matina.png" alt="Matina" className="h-10 w-auto object-contain invert"/>
                      <img src="https://i.ibb.co/DPPY7V1y/knockout-brand-logo-new-ped9bkln64voz9pspi7vvchdoed9chy3bbtm7aviee.png" alt="Knockout" className="h-10 w-auto object-contain invert"/>
                      <img src="https://i.ibb.co/KRGPG28/brilliant-chemical-logo-ollk04m5z92plr7shhb2ucypq3dw4edq2t01ppwfl0.png" alt="Brilliant Chemical" className="h-10 w-auto object-contain invert"/>
                    </div>
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">KNOCKOUT INDUSTRIES GROUP</h1>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em]">Biometric Security & Logistics Division</p>
                      <p className="text-[8px] text-black font-black uppercase mt-2 tracking-widest flex items-center gap-2">
                        <Zap size={10} className="text-emerald-500" /> BIO-SECURE PROTOCOL v4.2
                      </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 inline-block">CONFIDENTIAL</div>
                    <h2 className="text-lg font-black uppercase text-black leading-none">ATTENDANCE LOG</h2>
                    <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">{title}</p>
                 </div>
               </div>

               {/* Metadata */}
               <div className="grid grid-cols-4 gap-4 mb-10">
                 {[
                   { icon: Calendar, label: 'CERTIFICATION DATE', value: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                   { icon: ShieldCheck, label: 'INTEGRITY STATUS', value: 'SYSTEM VERIFIED' },
                   { icon: Users, label: 'TOTAL PERSONNEL', value: `${reportStats.total}` },
                   { icon: Briefcase, label: 'REGISTRY TYPE', value: 'MASTER LOG' }
                 ].map((stat, i) => (
                   <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5">
                     <div className="flex items-center gap-2">
                       <stat.icon size={11} className="text-emerald-600" />
                       <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                     </div>
                     <span className="text-[11px] font-black text-black uppercase tracking-tight">{stat.value}</span>
                   </div>
                 ))}
               </div>

               {/* Registry Table */}
               <div className="flex-grow">
                 <table className="w-full text-left border-collapse border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                   <thead className="bg-black text-white">
                     <tr>
                       <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.1em] border-r border-white/10">Date</th>
                       <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.1em] border-r border-white/10">Identity</th>
                       <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.1em] border-r border-white/10">Unit</th>
                       <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.1em] text-center border-r border-white/10 w-24">Entry</th>
                       <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.1em] text-center w-24">Exit</th>
                     </tr>
                   </thead>
                   <tbody>
                     {sessions.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-32 text-center text-slate-200 font-black uppercase tracking-[0.4em] bg-slate-50/30 italic">
                           ZERO RECORDS IDENTIFIED
                         </td>
                       </tr>
                     ) : (
                       sessions.map((session, i) => (
                         <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                           <td className="px-4 py-3 text-[9px] font-bold text-slate-500 uppercase">{session.date}</td>
                           <td className="px-4 py-3 text-[10px] font-black text-black uppercase tracking-tight">{session.name}</td>
                           <td className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-tighter">{session.department}</td>
                           <td className="px-4 py-3 text-[10px] font-black text-emerald-600 text-center bg-emerald-50/10 border-l border-r border-slate-50">{session.timeIn}</td>
                           <td className={`px-4 py-3 text-[10px] font-black text-center ${session.timeOut === 'Still in premise' ? 'text-red-400 italic bg-red-50/10' : 'text-orange-600 bg-orange-50/10'}`}>
                             {session.timeOut === 'Still in premise' ? 'PENDING' : session.timeOut}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Footer */}
               <div className="mt-16 pt-10 border-t-4 border-black flex justify-between items-end">
                  <div className="flex gap-10">
                    <div className="space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-black tracking-widest">Authentication</p>
                          <p className="text-[7px] text-gray-400 font-bold uppercase tracking-tight">ID: KO-RT-{Math.floor(Math.random()*100000)}</p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <div className="w-40 h-px bg-slate-200 mb-2"></div>
                        <p className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-4">
                     <div className="flex flex-col items-end gap-1">
                        <span className="bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-widest">CERTIFIED</span>
                        <p className="text-[8px] font-black text-black uppercase tracking-tight">Generated by Knockout AI Terminal</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.2em]">End of Official Transcript</p>
                        <p className="text-[9px] font-black text-black">PAGE 1 / 1</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
