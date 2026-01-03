
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, X, CheckCircle, AlertCircle, LogIn, LogOut, ShieldCheck, Globe, Search, ArrowRight, Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { LogStatus, AttendanceAction } from '../types';

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VisitorStep = 'action' | 'form' | 'capture' | 'success';

const VisitorModal: React.FC<VisitorModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<VisitorStep>('action');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [reason, setReason] = useState('Meeting');
  const [identityType, setIdentityType] = useState<'ZIM_ID' | 'PASSPORT'>('ZIM_ID');
  const [identityNumber, setIdentityNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<AttendanceAction>(AttendanceAction.LOGIN);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // Search state for Time Out
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVisitors, setActiveVisitors] = useState<{id: string, name: string}[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (action === AttendanceAction.LOGOUT) loadActiveVisitors();
    } else {
      reset();
      stopCamera();
    }
  }, [isOpen, action]);

  const loadActiveVisitors = async () => {
    const list = await dataService.getActiveVisitors();
    setActiveVisitors(list);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setValidationError("Camera access denied. Photo is mandatory for entry.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(data);
      stopCamera();
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return activeVisitors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, activeVisitors]);

  const handleNextStep = () => {
    if (action === AttendanceAction.LOGOUT) {
      setStep('form');
      return;
    }

    if (step === 'form') {
      if (!firstName.trim() || !lastName.trim() || !identityNumber.trim()) {
        setValidationError("All fields are mandatory.");
        return;
      }
      setValidationError(null);
      setStep('capture');
      startCamera();
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);
    setIsSubmitting(true);
    
    const fullName = action === AttendanceAction.LOGIN ? `${firstName} ${lastName}` : searchQuery;
    const subjectId = action === AttendanceAction.LOGIN ? `visitor-${identityNumber.toUpperCase()}` : selectedVisitorId!;

    try {
      await dataService.addLog({
        subjectId, 
        subjectName: fullName, 
        timestamp: Date.now(),
        status: LogStatus.SUCCESS, 
        action, 
        confidence: 1, 
        type: 'VISITOR'
      });
      setStep('success');
      setTimeout(() => { onClose(); reset(); }, 2500);
    } catch (err) {
      setValidationError("System Error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFirstName(''); 
    setLastName(''); 
    setIdentityNumber(''); 
    setIdentityType('ZIM_ID');
    setStep('action'); 
    setReason('Meeting'); 
    setAction(AttendanceAction.LOGIN);
    setValidationError(null); 
    setSearchQuery(''); 
    setSelectedVisitorId(null);
    setCapturedPhoto(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg"><User size={24} /></div>
            <div>
              <h3 className="text-xl font-black uppercase text-gray-900 tracking-tight">Visitor Protocol</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest leading-none">Identity Verification System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"><X /></button>
        </div>

        <div className="p-8 min-h-[400px] flex flex-col justify-center">
          
          {step === 'action' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="text-center space-y-2 mb-8">
                  <h4 className="text-sm font-black uppercase text-slate-400">Welcome to Knockout</h4>
                  <p className="text-lg font-black uppercase">Identify your activity</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setAction(AttendanceAction.LOGIN); setStep('form'); }}
                    className="flex flex-col items-center gap-4 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] hover:bg-emerald-100 transition-all group"
                  >
                     <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <LogIn size={32} />
                     </div>
                     <span className="font-black uppercase tracking-widest text-xs text-emerald-700">Check In</span>
                  </button>
                  <button 
                    onClick={() => { setAction(AttendanceAction.LOGOUT); loadActiveVisitors(); setStep('form'); }}
                    className="flex flex-col items-center gap-4 p-8 bg-orange-50 border-2 border-orange-100 rounded-[2.5rem] hover:bg-orange-100 transition-all group"
                  >
                     <div className="w-16 h-16 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <LogOut size={32} />
                     </div>
                     <span className="font-black uppercase tracking-widest text-xs text-orange-700">Check Out</span>
                  </button>
               </div>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {action === AttendanceAction.LOGIN ? (
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2">First Name</label>
                      <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Tendai" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Surname</label>
                      <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Moyo" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Identity Number</label>
                    <input required value={identityNumber} onChange={e => setIdentityNumber(e.target.value)} placeholder="ID or Passport Number" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Reason for Visit</label>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black uppercase outline-none focus:ring-2 focus:ring-black">
                      <option value="Meeting">Official Meeting</option>
                      <option value="Delivery">Package Delivery</option>
                      <option value="Interview">Job Interview</option>
                      <option value="Personal">Personal Visit</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-gray-400 ml-2 mb-2">Search Registered Name</label>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        autoFocus
                        value={searchQuery} 
                        onChange={e => { setSearchQuery(e.target.value); setSelectedVisitorId(null); }} 
                        placeholder="Type to find your entry..." 
                        className={`w-full pl-12 pr-5 py-4 bg-gray-50 border ${selectedVisitorId ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-gray-100'} rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black transition-all`} 
                      />
                    </div>
                    {filteredSuggestions.length > 0 && !selectedVisitorId && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                        {filteredSuggestions.map(v => (
                          <button 
                            key={v.id} 
                            type="button" 
                            onClick={() => { setSelectedVisitorId(v.id); setSearchQuery(v.name); }} 
                            className="w-full px-6 py-4 text-left hover:bg-emerald-50 border-b border-gray-50 flex items-center justify-between group transition-colors"
                          >
                            <span className="text-sm font-bold text-gray-900 uppercase">{v.name}</span>
                            <ArrowRight size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {validationError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase leading-tight">{validationError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('action')} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Back</button>
                <button 
                  onClick={action === AttendanceAction.LOGIN ? handleNextStep : handleSubmit}
                  disabled={action === AttendanceAction.LOGOUT && !selectedVisitorId}
                  className={`flex-[2] py-5 ${action === AttendanceAction.LOGIN ? 'bg-emerald-600' : 'bg-orange-600'} text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30`}
                >
                   {action === AttendanceAction.LOGIN ? 'Next: Capture Photo' : isSubmitting ? <Loader2 className="animate-spin" /> : 'Record Exit'}
                </button>
              </div>
            </div>
          )}

          {step === 'capture' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="relative aspect-square w-full max-w-[300px] mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100">
                  {!capturedPhoto ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/20 border-dashed rounded-full"></div>
                      </div>
                    </>
                  ) : (
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                  )}
               </div>

               <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Mandatory Identity Capture for Registry
               </p>

               <div className="flex gap-3">
                  {!capturedPhoto ? (
                    <button 
                      onClick={capturePhoto} 
                      className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all"
                    >
                      <Camera size={20} /> Take Photo
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setCapturedPhoto(null); startCamera(); }} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <RefreshCcw size={16} /> Retake
                      </button>
                      <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Entry'}
                      </button>
                    </>
                  )}
               </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 flex flex-col items-center animate-in zoom-in duration-500">
              <CheckCircle size={64} className="text-emerald-500 mb-6 drop-shadow-lg" />
              <h4 className="text-2xl font-black text-gray-900 uppercase">Registry Updated</h4>
              <p className="text-gray-500 text-sm font-bold mt-2 uppercase tracking-widest">Safe {action === AttendanceAction.LOGIN ? 'Arrival' : 'Departure'} Recorded</p>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VisitorModal;
