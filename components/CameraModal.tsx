
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, CheckCircle2, RefreshCcw, Loader2, QrCode, Grid3X3, Cpu, Fingerprint, Keyboard } from 'lucide-react';
import { dataService } from '../services/dataService';
import { fingerprintService } from '../services/fingerprintService';
import { AttendanceAction, Employee } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  onAuthSuccess?: (employee: Employee, duration?: string, actualAction?: AttendanceAction, autoClosedGatePass?: boolean) => void;
  onAuthError?: (error: string) => void;
  title: string;
  isProcessing: boolean;
  status?: 'success' | 'error' | 'idle';
  statusMessage?: string;
}

type AuthMode = 'PIN' | 'BIO';

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  onAuthSuccess,
  title, 
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('BIO');
  const [pin, setPin] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const isGatePass = title.includes('GATE');
  
  useEffect(() => {
    if (isOpen) {
      resetAuth();
      // Auto-initiate biometric scan when modal opens, but do it silently
      handleBiometricAuth(true);
    } else {
      resetAuth();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pin.length === 4 && authStatus === 'idle') {
      handleVerification(pin);
    }
  }, [pin]);

  const resetAuth = () => {
    setPin('');
    setAuthStatus('idle');
    setFeedback('');
    setAuthMode('BIO');
  };

  const handleBiometricAuth = async (isInitial: boolean = false) => {
    setAuthStatus('processing');
    setFeedback("Awaiting hardware scan...");
    
    const result = await fingerprintService.captureTemplate();
    
    if (result.success && result.template) {
      const employees = await dataService.getEmployees();
      const matchedEmployee = employees.find(e => String(e.fingerprintHash).trim() === String(result.template).trim());
      
      if (matchedEmployee) {
        await processAuth(matchedEmployee);
      } else {
        setAuthStatus('error');
        setFeedback("Personnel Not Found");
        setTimeout(() => setAuthStatus('idle'), 4000);
      }
    } else {
      // If it's the initial call and it failed (e.g. server down), don't show the scary red screen
      // unless the user specifically retried or it's a real hardware error
      if (isInitial || (result.error && result.error.toLowerCase().includes('canceled'))) {
        setAuthStatus('idle');
        setFeedback('');
      } else {
        setAuthStatus('error');
        setFeedback(result.error || "Biometric Error");
        setTimeout(() => setAuthStatus('idle'), 4000);
      }
    }
  };

  const handleVerification = async (value: string) => {
    if (!value || value.length < 4) return;
    setAuthStatus('processing');
    setFeedback('Checking Credentials...');
    try {
      const employees = await dataService.getEmployees();
      const emp = employees.find(e => String(e.pin).trim() === String(value).trim());
      if (!emp) {
        setAuthStatus('error');
        setFeedback("Incorrect PIN");
        setPin(''); 
        setTimeout(() => setAuthStatus('idle'), 3000);
        return;
      }
      await processAuth(emp);
    } catch (e) {
      setAuthStatus('error');
      setFeedback("Cloud Link Offline");
    }
  };

  const processAuth = async (employee: Employee) => {
    let res;
    let action: AttendanceAction;

    if (isGatePass) {
       // Logic for Gate Pass: Ensure they are clocked into the building first
       res = await dataService.processInformalLog(employee);
       action = (res as any).action || AttendanceAction.GATE_OUT;
    } else {
       const last = await dataService.getUserLastAction(employee.id);
       action = last === AttendanceAction.LOGIN ? AttendanceAction.LOGOUT : AttendanceAction.LOGIN;
       res = await dataService.processVerification(employee, action, 1.0);
    }

    if (res?.success) {
       setAuthStatus('success');
       if (onAuthSuccess) onAuthSuccess(employee, (res as any).duration, action);
    } else {
       setAuthStatus('error');
       setFeedback(res?.error || "Registry Access Denied");
       setTimeout(() => setAuthStatus('idle'), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col border border-white/10">
        
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Cpu size={14} className="text-emerald-500" />
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"><X size={20}/></button>
        </div>

        <div className="px-8 py-12 flex flex-col items-center justify-center min-h-[450px]">
          {authMode === 'BIO' ? (
             <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in">
                <div className={`relative w-44 h-44 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${authStatus === 'processing' ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]' : authStatus === 'error' ? 'border-red-500 bg-red-50 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]' : 'border-slate-100 bg-slate-50'}`}>
                   <Fingerprint size={96} className={`transition-colors duration-500 ${authStatus === 'processing' ? 'text-emerald-500 animate-pulse' : authStatus === 'error' ? 'text-red-500' : 'text-slate-200'}`} />
                   {authStatus === 'processing' && <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>}
                </div>
                
                <div className="text-center space-y-3">
                   <h2 className="text-3xl font-black uppercase text-black leading-tight">
                      PLACE THUMB
                   </h2>
                   <p className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${authStatus === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                      {feedback || "On Hardware Scanner"}
                   </p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  {authStatus === 'error' && (
                     <button onClick={() => handleBiometricAuth(false)} className="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <RefreshCcw size={14}/> Retry Biometric Scan
                     </button>
                  )}
                  <button 
                    onClick={() => setAuthMode('PIN')}
                    className="flex items-center justify-center gap-2 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-black hover:border-black transition-all"
                  >
                    <Keyboard size={16}/> Use PIN Fallback
                  </button>
                </div>
             </div>
          ) : (
            <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4">
              <div className="flex gap-3 mb-10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-black border-black scale-110 shadow-lg' : 'border-gray-200'}`}></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-8">
                {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
                  <button 
                    key={k} 
                    onClick={() => { 
                      if (k === 'C') setPin(''); 
                      else if (k === '⌫') setPin(pin.slice(0, -1)); 
                      else if (pin.length < 4) setPin(p => p + k); 
                    }} 
                    className="aspect-square rounded-2xl bg-gray-50 hover:bg-black hover:text-white text-xl font-black transition-all active:scale-90 border border-gray-100 flex items-center justify-center shadow-sm"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className={`text-[11px] font-black uppercase tracking-widest ${authStatus === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                  {feedback || "Enter Secure Registry PIN"}
                </p>
                <button onClick={() => { setAuthMode('BIO'); handleBiometricAuth(true); }} className="text-[10px] font-black uppercase text-emerald-600 underline">Switch back to Fingerprint</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 text-center border-t border-gray-100">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Biometric Station v4.2</p>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
