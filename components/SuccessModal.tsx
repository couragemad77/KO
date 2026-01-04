
import React from 'react';
import { CheckCircle2, Clock, DoorOpen, ShieldCheck } from 'lucide-react';
import { AttendanceAction } from '../types';

interface SuccessModalProps {
  isOpen: boolean;
  name: string;
  action: string;
  duration?: string;
  warning?: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, name, action, duration, warning, onClose }) => {
  if (!isOpen) return null;

  const isGate = action === AttendanceAction.GATE_OUT || action === AttendanceAction.GATE_IN;
  const isReturn = action === AttendanceAction.GATE_IN;
  const themeColor = isGate ? 'indigo' : 'emerald';

  const icons = {
    emerald: <CheckCircle2 size={48} className="text-emerald-600" />,
    indigo: <DoorOpen size={48} className="text-indigo-600" />
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className={`bg-white rounded-[3.5rem] p-12 text-center shadow-2xl max-w-lg w-full animate-in zoom-in duration-500 border border-${themeColor}-50`}>
        <div className="text-8xl mb-10 animate-bounce">
            {isGate ? (isReturn ? '🏢' : '🚙') : (action === 'LOGIN' ? '☀️' : '🌙')}
        </div>
        
        <div className={`w-24 h-24 bg-${themeColor}-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner`}>
          {icons[themeColor as keyof typeof icons]}
        </div>
        
        <h2 className={`text-3xl font-black text-black uppercase tracking-tight leading-none mb-3`}>
          {isGate ? (isReturn ? 'Welcome Back' : 'Pass Recorded') : 'Identity Verified'}
        </h2>
        <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em] mb-8">
           {isGate ? (isReturn ? 'Staff Return Captured' : 'Off-Site Mission Active') : `${action} Processed`}
        </p>

        {isReturn && duration && (
           <div className="mb-8 px-8 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl inline-flex items-center gap-4 shadow-sm">
              <Clock className="text-emerald-600" size={24} />
              <div className="text-left">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Time Elapsed</p>
                <p className="text-2xl font-black text-emerald-600 leading-none uppercase">{duration}</p>
              </div>
           </div>
        )}

        <div className="h-px w-16 bg-gray-100 mx-auto mb-8"></div>
        <h3 className={`text-5xl font-black text-${themeColor}-600 uppercase mb-4 break-words leading-tight`}>{name}</h3>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {isGate ? (isReturn ? 'Glad to have you back on deck.' : 'Please follow safety protocols while out.') : 'Have a productive work session.'}
        </p>
        
        <button 
          onClick={onClose}
          className={`mt-10 px-12 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all tracking-[0.2em]`}
        >
          Close Terminal
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
