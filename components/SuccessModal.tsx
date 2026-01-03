
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

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

  const isGate = action.includes('GATE');
  const isReturn = !!duration;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-10 md:p-12 text-center shadow-2xl max-w-lg w-full animate-in zoom-in duration-500 scale-110 border border-emerald-50">
        <div className="text-8xl mb-8 animate-bounce">{isGate ? (isReturn ? '🏠' : '🚗') : '👍'}</div>
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        
        <h2 className="text-2xl font-black text-black uppercase tracking-tighter leading-none mb-2">
          {isGate ? (isReturn ? 'Welcome Back' : 'Safe Trip') : 'Success'}
        </h2>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-6">
           {isGate ? 'Gate Pass Recorded' : `${action} Recorded`}
        </p>

        {/* Warning Badge for Dirty Logouts */}
        {warning && (
           <div className="mb-6 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl inline-flex items-center gap-2 animate-pulse">
              <AlertTriangle className="text-amber-600" size={14} />
              <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-none">{warning}</p>
           </div>
        )}
        
        {isReturn && (
           <div className="mb-6 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl inline-flex items-center gap-3">
              <Clock className="text-emerald-600" size={18} />
              <div className="text-left">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Time Outside</p>
                <p className="text-lg font-black text-emerald-600 leading-none uppercase">{duration}</p>
              </div>
           </div>
        )}

        <div className="h-px w-12 bg-gray-100 mx-auto mb-6"></div>
        <h3 className="text-4xl md:text-5xl font-black text-emerald-600 uppercase mb-4 break-words leading-tight">{name}</h3>
        <p className="text-base font-medium text-gray-400">
          {isGate ? (isReturn ? 'Glad to have you back!' : 'Please drive carefully.') : 'Have a wonderful day!'}
        </p>
        
        <button 
          onClick={onClose}
          className="mt-8 px-10 py-3 bg-black text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
