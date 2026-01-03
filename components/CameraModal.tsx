
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, CheckCircle2, RefreshCcw, Hash, Loader2, ArrowRight, QrCode, Grid3X3, Cpu, Fingerprint } from 'lucide-react';
import { dataService } from '../services/dataService';
import { fingerprintService } from '../services/fingerprintService';
import { AttendanceAction, Employee } from '../types';
import jsQR from 'jsqr';

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
  autoCapture?: boolean;
}

type AuthMode = 'PIN' | 'FACE' | 'QR' | 'BIO';

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  onCapture, 
  onAuthSuccess,
  onAuthError,
  title, 
  isProcessing,
  status = 'idle',
  statusMessage,
  autoCapture = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('PIN');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [pin, setPin] = useState('');
  
  const [authStatus, setAuthStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const isGatePass = title.includes('GATE');
  const initialAction = isGatePass ? ('GATE_PASS' as any) : null;

  // Handle Keyboard Input for PIN
  useEffect(() => {
    if (!isOpen || authMode !== 'PIN' || authStatus === 'processing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) setPin(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, authMode, pin, authStatus, onClose]);

  // Auto-submit PIN when 4 digits are reached
  useEffect(() => {
    if (pin.length === 4 && authStatus === 'idle') {
      handleVerification('PIN', pin);
    }
  }, [pin]);

  useEffect(() => {
    if (isOpen) {
      if (authMode === 'FACE' || authMode === 'QR') startCamera();
      else stopCamera();

      if (authMode === 'FACE' && autoCapture && status === 'idle') {
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              capture();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }
      
      if (authMode === 'QR') {
        const qrInterval = setInterval(scanQr, 300);
        return () => clearInterval(qrInterval);
      }

      if (authMode === 'BIO' && authStatus === 'idle') {
        handleBiometricAuth();
      }
    } else {
      stopCamera();
      resetAuth();
    }
  }, [isOpen, authMode, status]);

  const resetAuth = () => {
    setCountdown(3);
    setPin('');
    setAuthStatus('idle');
    setFeedback('');
    setAuthMode('PIN');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setAuthStatus('error');
      setFeedback("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleBiometricAuth = async () => {
    setAuthStatus('processing');
    setFeedback("Place finger on scanner...");
    
    const result = await fingerprintService.captureTemplate();
    
    if (result.success && result.template) {
      setFeedback("Matching Template...");
      const employees = await dataService.getEmployees();
      const matchedEmployee = employees.find(e => e.fingerprintHash === result.template);
      
      if (matchedEmployee) {
        let targetAction = initialAction;
        if (!targetAction) {
           const last = await dataService.getUserLastAction(matchedEmployee.id);
           targetAction = last === AttendanceAction.LOGIN ? AttendanceAction.LOGOUT : AttendanceAction.LOGIN;
        }

        if (targetAction as any === 'GATE_PASS') {
           const res = await dataService.processInformalLog(matchedEmployee);
           if (!res.success) {
              setAuthStatus('error');
              setFeedback(res.error || "Access Denied");
              if (onAuthError) onAuthError(res.error || "Access Denied");
              return;
           }
           setAuthStatus('success');
           if (onAuthSuccess) onAuthSuccess(matchedEmployee, res.duration, AttendanceAction.LOGIN); 
           onClose();
        } else {
          const res = await dataService.processVerification(matchedEmployee, targetAction, 1.0);
          if (res.success) {
            setAuthStatus('success');
            if (onAuthSuccess) onAuthSuccess(matchedEmployee, undefined, targetAction, (res as any).autoClosedGatePass);
            onClose();
          } else {
            setAuthStatus('error');
            setFeedback(res.error || "Registry Conflict");
          }
        }
      } else {
        setAuthStatus('error');
        setFeedback("Fingerprint not recognized.");
        setTimeout(() => setAuthStatus('idle'), 3000);
      }
    } else {
      setAuthStatus('error');
      setFeedback(result.error || "Hardware Error");
      setTimeout(() => setAuthStatus('idle'), 3000);
    }
  };

  const scanQr = () => {
    if (!videoRef.current || !canvasRef.current || authStatus === 'processing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleVerification('QR', code.data);
    }
  };

  const handleVerification = async (mode: 'QR' | 'PIN', value: string) => {
    if (!value || value.length < 4) {
      setFeedback("Please enter a valid PIN");
      return;
    }

    setAuthStatus('processing');
    setFeedback('Checking Registry...');
    
    try {
      const employees = await dataService.getEmployees();
      const emp = employees.find(e => mode === 'PIN' ? e.pin === value : e.qrCodeData === value);
      
      if (!emp) {
        setAuthStatus('error');
        setFeedback("Incorrect Identity Key");
        setPin(''); 
        setTimeout(() => setAuthStatus('idle'), 3000);
        return;
      }

      let targetAction = initialAction;
      if (!targetAction) {
        const last = await dataService.getUserLastAction(emp.id);
        targetAction = last === AttendanceAction.LOGIN ? AttendanceAction.LOGOUT : AttendanceAction.LOGIN;
      }

      let res;
      if (targetAction as any === 'GATE_PASS') {
        res = await dataService.processInformalLog(emp);
      } else {
        res = await dataService.processVerification(emp, targetAction, 1.0);
      }
      
      if (res?.success) {
        setAuthStatus('success');
        if (onAuthSuccess) onAuthSuccess(emp, (res as any).duration, targetAction, (res as any).autoClosedGatePass);
        onClose();
        resetAuth();
      } else {
        setAuthStatus('error');
        const err = res?.error || "Verification Failed";
        setFeedback(err);
        setPin(''); 
        if (onAuthError) onAuthError(err);
        setTimeout(() => {
          setAuthStatus('idle');
          setFeedback('');
        }, 3000);
      }
    } catch (e: any) {
      setAuthStatus('error');
      setFeedback("Connection Interrupted");
      setPin('');
      setTimeout(() => setAuthStatus('idle'), 3000);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current && !isProcessing) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      onCapture(canvas.toDataURL('image/jpeg', 0.85));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg overflow-hidden">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Cpu size={16} className="text-emerald-500" />
              {title}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
          </div>
          
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'PIN', icon: Grid3X3, label: 'PIN' },
              { id: 'FACE', icon: Camera, label: 'Face' },
              { id: 'QR', icon: QrCode, label: 'QR' },
              { id: 'BIO', icon: Fingerprint, label: 'BIO' },
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => setAuthMode(m.id as AuthMode)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${authMode === m.id ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
              >
                <m.icon size={13} />
                <span className="text-[9px] font-black uppercase tracking-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col items-center justify-center flex-grow min-h-0">
          {authMode === 'PIN' && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 w-full max-w-[260px]">
              <div className="flex gap-2.5 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-gray-200'}`}></div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full mb-6">
                {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
                  <button 
                    key={k} 
                    onClick={() => { 
                      if (k === 'C') setPin(''); 
                      else if (k === '⌫') setPin(pin.slice(0, -1)); 
                      else if (pin.length < 4) setPin(p => p + k); 
                    }} 
                    className="aspect-square rounded-2xl bg-gray-50 hover:bg-black hover:text-white text-lg font-black transition-all active:scale-90 border border-gray-100 flex items-center justify-center shadow-sm"
                  >
                    {k}
                  </button>
                ))}
              </div>
              
              <div className="w-full text-center">
                 <p className={`text-[10px] font-black uppercase tracking-widest ${authStatus === 'error' ? 'text-red-600 animate-shake' : 'text-slate-400'}`}>
                    {feedback || (authStatus === 'processing' ? 'Authenticating...' : 'Instant PIN Entry')}
                 </p>
                 {authStatus === 'processing' && <Loader2 className="animate-spin mx-auto mt-2 text-emerald-500" size={20} />}
              </div>
            </div>
          )}

          {authMode === 'BIO' && (
             <div className="flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-300">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${authStatus === 'processing' ? 'border-emerald-500 animate-pulse bg-emerald-50' : authStatus === 'error' ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                   <Fingerprint size={60} className={`${authStatus === 'processing' ? 'text-emerald-500' : authStatus === 'error' ? 'text-red-500' : 'text-slate-200'}`} />
                </div>
                <div className="text-center space-y-2">
                   <p className={`text-xs font-black uppercase tracking-[0.2em] ${authStatus === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                      {feedback || "Waiting for hardware..."}
                   </p>
                   {authStatus === 'error' && (
                     <button onClick={handleBiometricAuth} className="text-[10px] font-black uppercase text-emerald-600 underline flex items-center gap-1 mx-auto">
                        <RefreshCcw size={10}/> Retry Scan
                     </button>
                   )}
                </div>
             </div>
          )}

          {(authMode === 'FACE' || authMode === 'QR') && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="relative aspect-square w-full max-w-[260px] bg-black rounded-3xl overflow-hidden border-2 border-slate-100 flex items-center justify-center shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${(authStatus !== 'idle' || isProcessing) ? 'opacity-30' : ''}`} />
                {authMode === 'QR' && authStatus === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-500/40 rounded-3xl animate-pulse flex items-center justify-center">
                       <QrCode size={40} className="text-emerald-500 opacity-20" />
                    </div>
                  </div>
                )}
                {authMode === 'FACE' && authStatus === 'idle' && !isProcessing && (
                  <div className="absolute top-4 left-4 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">Scan: {countdown}s</div>
                )}
                {(isProcessing || authStatus === 'processing') && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-white animate-spin" size={40} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Processing...</span>
                  </div>
                )}
                {authStatus === 'success' && <CheckCircle2 size={64} className="text-emerald-500 animate-in zoom-in" />}
              </div>
              <div className="h-4 flex items-center">
                <p className={`text-center font-black uppercase text-[10px] tracking-widest ${authStatus === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                  {feedback || (authMode === 'QR' ? "Show Pass QR Code" : "Look directly at camera")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50/50 flex justify-center shrink-0">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Biometric Terminal #KO-01</p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;
