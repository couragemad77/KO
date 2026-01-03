
import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  subtext?: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, subtext, type, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  
  // Keep the latest onClose reference without re-triggering the timer effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Show immediately on mount
    setIsVisible(true);
    
    // Set timer to hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // Set timer to call close callback after exit animation
    const closeTimer = setTimeout(() => {
      onCloseRef.current();
    }, duration + 500); // Wait for transition duration
    
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [duration]); // Only re-run if duration changes, not when parent re-renders onClose

  return (
    <div className="fixed top-6 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <div 
        className={`
          pointer-events-auto
          min-w-[280px] md:min-w-[450px] px-8 py-5
          bg-slate-900 text-white rounded-[2.5rem] shadow-2xl
          flex items-center gap-6 transition-all duration-500 ease-out
          border border-white/20 backdrop-blur-2xl
          ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90'}
        `}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}>
          {type === 'success' ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
        </div>
        <div className="flex flex-col">
          <span className="font-black uppercase tracking-tight text-lg leading-none mb-1.5">{message}</span>
          {subtext && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{subtext}</span>}
        </div>
      </div>
    </div>
  );
};

export default Notification;
