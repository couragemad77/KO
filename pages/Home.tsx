
import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Flag, Bell, Calendar, DoorOpen, Fingerprint, Keyboard, Globe, CheckCircle2, Megaphone } from 'lucide-react';
import CameraModal from '../components/CameraModal';
import VisitorModal from '../components/VisitorModal';
import Notification from '../components/Notification';
import SuccessModal from '../components/SuccessModal';
import { dataService } from '../services/dataService';
import { AttendanceAction, Notice } from '../types';

const Home: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<AttendanceAction>(AttendanceAction.LOGIN);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSynced, setIsSynced] = useState(false);
  
  const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
  const [noticeIndex, setNoticeIndex] = useState(0);
  
  const [lastUser, setLastUser] = useState<{name: string, id: string} | null>(null);
  const [lastDuration, setLastDuration] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<{id: number, msg: string, sub: string, type: 'success' | 'error'} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const syncTime = async () => {
      const netTime = await dataService.getHarareTime();
      setCurrentTime(netTime);
      setIsSynced(true);
    };

    syncTime();
    const timer = setInterval(() => setCurrentTime(prev => new Date(prev.getTime() + 1000)), 1000);

    const unsubscribe = dataService.subscribeToLiveScans((log: any) => {
      handleBiometricDetection(log);
    });

    loadNotices();
    const noticeTimer = setInterval(loadNotices, 30000); 

    return () => {
      clearInterval(timer);
      clearInterval(noticeTimer);
      unsubscribe();
    };
  }, []);

  const handleBiometricDetection = (log: any) => {
    setLastUser({ name: log.subjectName || log.name, id: log.subjectId });
    setModalAction(log.action);
    setLastDuration(log.duration);
    setShowSuccessModal(true);
    
    // Auto-close success modal after 6 seconds
    setTimeout(() => {
        setShowSuccessModal(false);
    }, 6000);
  };

  const loadNotices = async () => {
    try {
      const list = await dataService.getNotices();
      const active = list.filter(n => n.isActive && n.content.trim().length > 0);
      setActiveNotices(active);
    } catch (e) { console.error(e); }
  };

  const triggerAuthModal = (specificAction?: AttendanceAction) => {
    setModalAction(specificAction || AttendanceAction.LOGIN);
    setIsModalOpen(true);
  };

  const currentNotice = activeNotices[noticeIndex];
  const activeGradient = ['from-emerald-700 via-emerald-600 to-teal-600', 'from-amber-600 via-amber-500 to-orange-500'][noticeIndex % 2];

  const harareTimeParts = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Harare',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.format(currentTime).split(':');
    return { hh: parts[0] || '00', mm: parts[1] || '00' };
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Harare',
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }).format(currentTime);
  }, [currentTime]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden relative select-none p-4 md:p-6 lg:p-8">
      {notification && (
        <Notification 
          key={notification.id} 
          message={notification.msg} 
          subtext={notification.sub} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
          duration={3000} 
        />
      )}

      <SuccessModal 
        isOpen={showSuccessModal} 
        name={lastUser?.name || ''} 
        action={modalAction} 
        duration={lastDuration}
        onClose={() => setShowSuccessModal(false)} 
      />

      <div className="w-full flex justify-between items-center shrink-0 mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-5 bg-white/50 px-5 py-2.5 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
          <img src="https://i.ibb.co/YM5b3Ny/matina.png" alt="Matina" className="h-6 md:h-10 w-auto object-contain" />
          <div className="w-px h-6 bg-slate-200"></div>
          <img src="https://i.ibb.co/DPPY7V1y/knockout-brand-logo-new-ped9bkln64voz9pspi7vvchdoed9chy3bbtm7aviee.png" alt="Knockout" className="h-6 md:h-10 w-auto object-contain" />
          <div className="w-px h-6 bg-slate-200"></div>
          <img src="https://i.ibb.co/KRGPG28/brilliant-chemical-logo-ollk04m5z92plr7shhb2ucypq3dw4edq2t01ppwfl0.png" alt="Brilliant Chemical" className="h-6 md:h-10 w-auto object-contain" />
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-black font-black text-[10px] uppercase tracking-widest shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-emerald-50" strokeWidth={3} />
            {formattedDate}
          </div>
          {isSynced && (
             <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-1.5 mt-1 pr-2">
               <Globe size={8} className="text-emerald-500" /> System Live
             </span>
           )}
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-4 lg:gap-8 items-stretch overflow-hidden min-h-0">
        <div className="flex-[1.2] flex flex-col items-center justify-center space-y-4 md:space-y-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 lg:p-10 relative">
          
          <div className="flex items-center justify-center gap-2 md:gap-4 font-black text-slate-900">
            <div className="flex gap-1.5 md:gap-3 h-[8vh] md:h-[12vh]">
              <div className="w-[6vh] md:w-[9vh] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-[5vh] md:text-[8vh] text-emerald-600 shadow-inner">{harareTimeParts.hh[0]}</div>
              <div className="w-[6vh] md:w-[9vh] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-[5vh] md:text-[8vh] text-emerald-600 shadow-inner">{harareTimeParts.hh[1]}</div>
            </div>
            <div className="text-emerald-500/20 animate-pulse text-[4vh] md:text-[6vh] font-thin">:</div>
            <div className="flex gap-1.5 md:gap-3 h-[8vh] md:h-[12vh]">
              <div className="w-[6vh] md:w-[9vh] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-[5vh] md:text-[8vh] text-emerald-600 shadow-inner">{harareTimeParts.mm[0]}</div>
              <div className="w-[6vh] md:w-[9vh] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-[5vh] md:text-[8vh] text-emerald-600 shadow-inner">{harareTimeParts.mm[1]}</div>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center gap-6 lg:gap-8 p-10 lg:p-14 border-2 rounded-[3.5rem] bg-emerald-50/10 border-emerald-100 shadow-emerald-100/20 shadow-2xl relative overflow-hidden group">
             {/* Animated Scan Line */}
             <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="scan-line absolute w-full top-0"></div>
             </div>

             <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center bg-white border-4 border-emerald-500 shadow-xl transition-transform group-hover:scale-105">
                <Fingerprint size={80} className="text-emerald-500 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
             </div>
             
             <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border bg-emerald-100 text-emerald-600 border-emerald-200">
                    <CheckCircle2 size={14}/> Terminal Ready
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase text-gray-900 tracking-tight leading-none">
                    Place Thumb
                  </h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600">
                    On Hardware Scanner
                  </p>
                </div>
             </div>

             <button 
                onClick={() => triggerAuthModal()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-black text-white font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 mt-4"
             >
                <Keyboard size={18} /> PIN Fallback
             </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
          <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shrink-0">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
                   <Bell size={14} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-black">Live Broadcasts</h3>
             </div>
             
             {currentNotice ? (
                <div className={`w-full bg-gradient-to-br ${activeGradient} p-6 rounded-[1.5rem] shadow-xl flex flex-col gap-3 animate-in slide-in-from-right-4 duration-700 min-h-[120px] justify-center`}>
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                    <Bell className="text-white w-4 h-4" />
                  </div>
                  <p className="font-black text-white text-sm lg:text-base leading-tight uppercase line-clamp-2">{currentNotice.content}</p>
                </div>
             ) : (
                <div className="w-full h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 opacity-40">
                   <Megaphone size={24} className="text-slate-300" />
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">No active notices</p>
                </div>
             )}
          </div>

          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
             <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => triggerAuthModal(AttendanceAction.GATE_OUT)}
                className="group p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-lg"
               >
                  <DoorOpen size={24} />
                  <div className="text-center">
                    <h4 className="text-xs font-black uppercase tracking-tight">Gate Pass</h4>
                    <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-blue-100/60 mt-0.5">Errands Log</p>
                  </div>
               </button>

               <button 
                onClick={() => setIsVisitorModalOpen(true)}
                className="group p-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-lg"
               >
                  <UserPlus size={24} />
                  <div className="text-center">
                    <h4 className="text-xs font-black uppercase tracking-tight">Visitor</h4>
                    <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-100/60 mt-0.5">Registry Entry</p>
                  </div>
               </button>
             </div>

             <button 
              onClick={() => window.location.hash = '#admin'}
              className="group p-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] flex items-center justify-between transition-all hover:bg-slate-50 active:scale-[0.98] shadow-sm mt-auto"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center border border-slate-200">
                      <Flag size={20} />
                   </div>
                   <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-tight">Administration</h4>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Manager Access</p>
                   </div>
                </div>
                <Keyboard size={14} />
             </button>

             <div className="py-2 text-center">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">Knockout Intelligence Systems v4.2</p>
             </div>
          </div>
        </div>
      </div>

      <CameraModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCapture={() => {}}
        onAuthSuccess={(emp, dur, act) => { 
            setLastUser({name: emp.name, id: emp.id}); 
            setLastDuration(dur);
            setModalAction(act || modalAction);
            setShowSuccessModal(true); 
            setIsModalOpen(false); 
        }}
        title={modalAction === AttendanceAction.GATE_OUT || modalAction === AttendanceAction.GATE_IN ? 'GATE PASS PROTOCOL' : `STAFF AUTHENTICATION`}
        isProcessing={false} status={'idle'}
      />
      <VisitorModal isOpen={isVisitorModalOpen} onClose={() => setIsVisitorModalOpen(false)} />
    </div>
  );
};

export default Home;
