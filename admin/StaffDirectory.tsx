
import React, { useState, useMemo } from 'react';
import { Search, Trash2, Edit3, X, AlertCircle, Loader2, QrCode, Download, Fingerprint, Key, Filter, SortAsc, SortDesc, Cpu } from 'lucide-react';
import { Employee, Department } from '../types';
import { db } from '../backend/firebase';
import { collection, addDoc } from 'firebase/firestore';
import QRCode from 'qrcode';

interface StaffDirectoryProps {
  employees: Employee[];
  departments: Department[];
  onAddEmployee: (emp: { name: string; email: string; department: string; pin: string; fingerprintHash: string }) => void;
  onUpdateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  highlightedId: string | null;
  handleSuggestionClick: (name: string) => void;
}

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ 
  employees, 
  departments,
  onAddEmployee, 
  onUpdateEmployee,
  onDeleteEmployee,
  searchQuery, 
  setSearchQuery, 
  highlightedId,
  handleSuggestionClick 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '', pin: '', fingerprintHash: '' });
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'A-Z' | 'Z-A'>('A-Z');
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<{msg: string, loading: boolean} | null>(null);

  const availableDepartments = useMemo(() => {
    return departments.map(d => d.name).sort();
  }, [departments]);

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
      return matchSearch && matchDept;
    });

    result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'A-Z') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [employees, searchQuery, selectedDeptFilter, sortOrder]);

  const handleDeviceEnroll = async (pin: string) => {
    if (!pin) {
        setBiometricStatus({ msg: 'Error: User must have a numeric PIN', loading: false });
        return;
    }
    setBiometricStatus({ msg: 'Queuing Enrollment Command...', loading: true });
    try {
      await addDoc(collection(db, 'device_commands'), {
        pin: pin,
        status: 'PENDING',
        createdAt: Date.now()
      });
      setBiometricStatus({ msg: 'Success! Look at the F22 Device Screen now.', loading: false });
      setTimeout(() => setBiometricStatus(null), 5000);
    } catch (e) {
      setBiometricStatus({ msg: 'Cloud Connection Failed', loading: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEmployee(newEmp);
    setNewEmp({ name: '', email: '', department: '', pin: '', fingerprintHash: '' });
    setShowAddForm(false);
  };

  const downloadQrCode = async (employee: Employee) => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 480, 630);

    const qrDataUrl = await QRCode.toDataURL(employee.qrCodeData, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise(r => qrImg.onload = r);
    ctx.drawImage(qrImg, 50, 50);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '700 28px Inter';
    ctx.fillText(employee.name.toUpperCase(), 250, 510);
    ctx.font = '600 16px Inter';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(employee.department.toUpperCase(), 250, 540);
    ctx.fillStyle = '#059669';
    ctx.font = '700 14px Inter';
    ctx.fillText(`ID: ${employee.pin}`, 250, 575);
    ctx.fillStyle = '#000000';
    ctx.font = '600 10px Inter';
    ctx.fillText("KNOCKOUT SECURE BIOMETRIC ACCESS", 250, 610);

    const link = document.createElement('a');
    link.download = `BIO_PASS_${employee.name.replace(/\s/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {editingEmployee && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in border border-white/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Edit3 size={20} /></div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-black">Personnel Management</h3>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateEmployee(editingEmployee.id, editingEmployee); setEditingEmployee(null); }} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Full Name</label>
                  <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" value={editingEmployee.name} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Unit</label>
                    <select required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={editingEmployee.department} onChange={e => setEditingEmployee({...editingEmployee, department: e.target.value})}>
                      {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Device PIN (ID)</label>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" value={editingEmployee.pin} onChange={e => setEditingEmployee({...editingEmployee, pin: e.target.value})} />
                  </div>
                </div>
                
                <div className="p-6 bg-slate-900 rounded-[2rem] flex flex-col gap-4 shadow-xl border border-white/5">
                   <div className="flex justify-between items-center text-white">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Hardware Actions</span>
                     <Fingerprint size={16} className="text-emerald-500 animate-pulse" />
                   </div>
                   
                   <button type="button" onClick={() => handleDeviceEnroll(editingEmployee.pin)} className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
                      <Cpu size={18}/> Initiate Remote Enrollment
                   </button>
                   <p className="text-[8px] text-white/30 text-center uppercase font-bold tracking-[0.2em]">The F22 will prompt for 3 finger scans</p>

                   {biometricStatus && (
                     <div className={`p-3 rounded-xl border text-center text-[10px] font-bold uppercase ${biometricStatus.msg.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {biometricStatus.loading && <Loader2 size={12} className="inline animate-spin mr-2"/>}
                        {biometricStatus.msg}
                     </div>
                   )}
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 hover:bg-slate-800 transition-all mt-2 tracking-widest">Commit Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Main UI Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-50">
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input placeholder="Search Personnel..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
          </div>
          
          <select 
            value={selectedDeptFilter} 
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-tight appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">ALL UNITS</option>
            {availableDepartments.map(dept => <option key={dept} value={dept}>{dept.toUpperCase()}</option>)}
          </select>

          <button onClick={() => setSortOrder(prev => prev === 'A-Z' ? 'Z-A' : 'A-Z')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
            {sortOrder === 'A-Z' ? <SortAsc size={16} /> : <SortDesc size={16} />} {sortOrder}
          </button>
        </div>
        
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all tracking-wider">
          {showAddForm ? 'Close Registration' : 'New Enrollment'}
        </button>
      </div>

      {showAddForm && (
        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 animate-in slide-in-from-top-4 shadow-sm">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Name</label>
              <input required placeholder="Full Name" className="w-full p-4 bg-white border-slate-200 border rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-black outline-none" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Assigned Unit</label>
              <select required className="w-full p-4 bg-white border-slate-200 border rounded-2xl text-sm font-bold shadow-sm outline-none" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})}>
                <option value="">Select Department</option>
                {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Hardware ID (PIN)</label>
              <input required placeholder="Numeric ID (e.g. 101)" className="w-full p-4 bg-white border-slate-200 border rounded-2xl text-sm font-black shadow-sm focus:ring-2 focus:ring-black outline-none" value={newEmp.pin} onChange={e => setNewEmp({...newEmp, pin: e.target.value})} />
            </div>
            <div className="lg:col-span-3">
              <button onClick={handleSubmit} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all tracking-widest">Register User</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest">Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest">Auth Data</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-center">QR Pass</th>
              <th className="px-8 py-5 text-[10px] font-black text-black uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                  <div className="text-[16px] font-black text-slate-900 uppercase tracking-tight mb-1">{emp.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.department}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <Fingerprint size={14}/> {emp.fingerprintHash ? 'ZK-ACTIVE' : 'READY-FOR-SYNC'}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest">
                      <Key size={14}/> ID: {emp.pin}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <button onClick={() => downloadQrCode(emp)} className="p-3 bg-slate-100 hover:bg-black hover:text-white rounded-2xl transition-all border border-slate-200 inline-flex items-center gap-3 group/qr shadow-sm">
                    <QrCode size={18} />
                    <Download size={12} className="opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                  </button>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingEmployee(emp)} className="p-2.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => setShowDeleteConfirm(emp.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDirectory;
