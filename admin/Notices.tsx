
import React, { useState } from 'react';
import { Megaphone, Plus, Save, Loader2, Trash2, Bell, Info, AlertTriangle, Zap, Star, Construction, Power, Clock, CheckCircle2, History } from 'lucide-react';
import { Notice } from '../types';

const visualOptions = [
  { type: 'emoji', value: '📢' },
  { type: 'emoji', value: '🚨' },
  { type: 'emoji', value: '⚠️' },
  { type: 'emoji', value: '🔥' },
  { type: 'emoji', value: '🛑' },
  { type: 'emoji', value: '💡' },
  { type: 'emoji', value: '🗓️' },
  { type: 'emoji', value: '🎉' },
  { type: 'emoji', value: '🍕' },
  { type: 'emoji', value: '☕' },
  { type: 'emoji', value: '🚧' },
  { type: 'emoji', value: '✅' },
  { type: 'icon', value: 'Bell' },
  { type: 'icon', value: 'Info' },
  { type: 'icon', value: 'AlertTriangle' },
  { type: 'icon', value: 'Zap' },
  { type: 'icon', value: 'Star' },
  { type: 'icon', value: 'Construction' },
];

interface NoticesProps {
  notices: Notice[];
  onAdd: (notice: Omit<Notice, 'id'>) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (notice: Notice) => Promise<void>;
}

const Notices: React.FC<NoticesProps> = ({ notices, onAdd, onToggle, onDelete }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [newNotice, setNewNotice] = useState<Omit<Notice, 'id'>>({
    content: '',
    isActive: true,
    updatedAt: Date.now(),
    icon: '📢'
  });

  const handleAddNotice = async () => {
    if (!newNotice.content.trim()) return;
    setIsPublishing(true);
    await onAdd(newNotice);
    setNewNotice({
      content: '',
      isActive: true,
      updatedAt: Date.now(),
      icon: '📢'
    });
    setIsPublishing(false);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bell': return <Bell size={18} />;
      case 'Info': return <Info size={18} />;
      case 'AlertTriangle': return <AlertTriangle size={18} />;
      case 'Zap': return <Zap size={18} />;
      case 'Star': return <Star size={18} />;
      case 'Construction': return <Construction size={18} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      
      {/* Creation Header */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl">
              <Megaphone size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tight">Active Broadcasts</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-2">Manage live terminal announcements</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase text-[10px] shadow-sm">
            <CheckCircle2 size={14} />
            Real-time Sync Active
          </div>
        </div>

        <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-6">Create New Announcement</h4>
          <div className="space-y-6">
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
              {visualOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewNotice({...newNotice, icon: opt.value})}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${newNotice.icon === opt.value ? 'bg-black text-white border-black scale-110 shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  {opt.type === 'emoji' ? (
                    <span className="text-xl">{opt.value}</span>
                  ) : (
                    renderIcon(opt.value) || <Megaphone size={18} />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <input 
                value={newNotice.content}
                onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                placeholder="Enter urgent broadcast text..."
                maxLength={80}
                className="flex-grow px-6 py-5 bg-white border border-gray-200 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-black"
              />
              <button 
                onClick={handleAddNotice}
                disabled={!newNotice.content.trim() || isPublishing}
                className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Publish Notice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Notices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notices.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300 font-black uppercase tracking-widest italic flex flex-col items-center gap-4">
            <Megaphone size={40} className="opacity-20" />
            No active broadcasts in registry
          </div>
        ) : (
          notices.map((n) => (
            <div 
              key={n.id} 
              className={`p-8 bg-white border-2 rounded-[2.5rem] transition-all group flex flex-col justify-between ${n.isActive ? 'border-emerald-100 shadow-md ring-4 ring-emerald-50' : 'border-gray-100 opacity-60 grayscale'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${n.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {n.icon && visualOptions.find(o => o.value === n.icon)?.type === 'emoji' ? (
                    <span>{n.icon}</span>
                  ) : (
                    renderIcon(n.icon || 'Megaphone') || <Megaphone size={24} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => n.id && onToggle(n.id, !n.isActive)}
                    className={`p-3 rounded-xl transition-all ${n.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-black hover:text-white'}`}
                    title={n.isActive ? "Deactivate" : "Activate"}
                   >
                     <Power size={18} />
                   </button>
                   <button 
                    onClick={() => onDelete(n)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    title="Archive Notice"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-lg font-black uppercase tracking-tight text-black leading-tight">
                  {n.content}
                </p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                    <Clock size={12} />
                    Published: {new Date(n.updatedAt).toLocaleTimeString()}
                  </div>
                  {n.isActive && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                      <CheckCircle2 size={10} />
                      Live Feed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Archive Note */}
      <div className="flex items-center justify-center gap-4 py-8 opacity-40">
        <History size={16} />
        <p className="text-[10px] font-black uppercase tracking-widest">Deleted notices are automatically archived to system history</p>
      </div>
    </div>
  );
};

export default Notices;
