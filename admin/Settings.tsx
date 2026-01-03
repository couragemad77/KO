
import React, { useState } from 'react';
import { Save, Settings as SettingsIcon, Building2, Plus, Trash2, Edit2, Check, X, Clock, ShieldCheck, Briefcase, Lock } from 'lucide-react';
import { SystemSettings, Department } from '../types';

interface SettingsProps {
  settings: SystemSettings | null;
  setSettings: (settings: SystemSettings) => void;
  departments: Department[];
  onAddDepartment: (name: string) => Promise<void>;
  onUpdateDepartment: (id: string, name: string) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
  onSave: (settings: SystemSettings) => Promise<void>;
}

type SettingsTab = 'TIME' | 'DEPARTMENTS' | 'COMPANY' | 'SECURITY';

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  setSettings, 
  departments, 
  onAddDepartment, 
  onUpdateDepartment, 
  onDeleteDepartment, 
  onSave 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('TIME');
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  
  // Security form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!settings) return null;

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    await onAddDepartment(newDeptName);
    setNewDeptName('');
  };

  const startEditing = (dept: Department) => {
    setEditingDeptId(dept.id);
    setEditingDeptName(dept.name);
  };

  const cancelEditing = () => {
    setEditingDeptId(null);
    setEditingDeptName('');
  };

  const saveDeptEdit = async (id: string) => {
    if (!editingDeptName.trim()) return;
    await onUpdateDepartment(id, editingDeptName);
    cancelEditing();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    await onSave({ ...settings, adminPassword: newPassword });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Tabs */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-8 pb-0">
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight">System Controls</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configure global operational parameters</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'TIME' as const, icon: Clock, label: 'Work Schedule' },
            { id: 'DEPARTMENTS' as const, icon: Building2, label: 'Units Registry' },
            { id: 'COMPANY' as const, icon: Briefcase, label: 'Branding & Info' },
            { id: 'SECURITY' as const, icon: Lock, label: 'Security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-5 text-xs font-black uppercase tracking-tight transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full animate-in fade-in"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-10 min-h-[400px]">
        {activeTab === 'TIME' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <ShieldCheck size={16} /> Global Work Day
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Day Start</label>
                    <input type="time" value={settings.dayStart} onChange={e => setSettings({...settings, dayStart: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Day End</label>
                    <input type="time" value={settings.dayEnd} onChange={e => setSettings({...settings, dayEnd: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-relaxed px-2">
                  Adjusting these times will rebuild the analytics chart scope. Standard start is usually 06:00 AM.
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <Clock size={16} /> Attendance Compliance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Early Bound</label>
                    <input type="time" value={settings.earlyThreshold} onChange={e => setSettings({...settings, earlyThreshold: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Late Bound</label>
                    <input type="time" value={settings.lateThreshold} onChange={e => setSettings({...settings, lateThreshold: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-relaxed px-2">
                  Logs between these bounds are marked "ON-TIME". After "Late Bound" is marked "LATE".
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2 mb-6">
                <Save size={16} /> Field Duty Auto-Log Times
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Auto Clock-In</label>
                    <input type="time" value={settings.outsideLogin} onChange={e => setSettings({...settings, outsideLogin: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Auto Clock-Out</label>
                    <input type="time" value={settings.outsideLogout} onChange={e => setSettings({...settings, outsideLogout: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                <div className="flex items-center">
                   <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed border-l-2 border-orange-100 pl-6 py-2 italic">
                     These times are used when marking staff for "Outside Work". The system will pre-generate records using these specific timestamps for each day of deployment.
                   </p>
                </div>
              </div>
            </div>

            <button onClick={() => onSave(settings)} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest">
               <Check size={18}/> Commit Schedule Updates
            </button>
          </div>
        )}

        {activeTab === 'DEPARTMENTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-4">
              <input 
                placeholder="Department Name (e.g. Sales)" 
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                className="flex-grow px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black"
              />
              <button 
                onClick={handleAddDept}
                className="px-10 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2 active:scale-95 transition-all tracking-widest"
              >
                <Plus size={16}/> Register Unit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {departments.map(dept => (
                <div key={dept.id} className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-between group hover:border-black hover:bg-white transition-all">
                  {editingDeptId === dept.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        autoFocus
                        className="flex-grow px-4 py-2 bg-white border border-black rounded-xl text-sm font-black outline-none"
                        value={editingDeptName}
                        onChange={e => setEditingDeptName(e.target.value)}
                      />
                      <button onClick={() => saveDeptEdit(dept.id)} className="p-2.5 bg-black text-white rounded-xl shadow-sm"><Check size={16}/></button>
                      <button onClick={cancelEditing} className="p-2.5 bg-gray-200 text-gray-600 rounded-xl"><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-black text-black uppercase tracking-tight">{dept.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(dept)} className="p-2.5 bg-white text-gray-400 hover:text-black rounded-xl shadow-sm border border-gray-100 transition-all"><Edit2 size={16}/></button>
                        <button onClick={() => onDeleteDepartment(dept.id)} className="p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {departments.length === 0 && (
              <div className="text-center py-20 text-gray-300 font-black uppercase text-[10px] tracking-[0.4em] italic bg-gray-50 rounded-[2.5rem]">
                No departments found
              </div>
            )}
          </div>
        )}

        {activeTab === 'COMPANY' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Vision Statement / Motto</label>
                <input value={settings.companyMotto} onChange={e => setSettings({...settings, companyMotto: e.target.value})} className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Global Contact Information</label>
                <input value={settings.companyContact} onChange={e => setSettings({...settings, companyContact: e.target.value})} className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <button onClick={() => onSave(settings)} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest">
               <Save size={18}/> Update Profile
            </button>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg mx-auto">
             <div className="text-center mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-4 mx-auto shadow-sm">
                  <Lock size={32} />
                </div>
                <h4 className="text-lg font-black text-black uppercase tracking-tight">Access Control</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Update administrative login credentials</p>
             </div>
             
             <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">New Admin Password</label>
                  <input 
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Confirm Password</label>
                  <input 
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black" 
                  />
                </div>
                <button 
                  disabled={!newPassword || newPassword !== confirmPassword}
                  className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest disabled:opacity-30"
                >
                   <ShieldCheck size={18}/> Update System Key
                </button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
