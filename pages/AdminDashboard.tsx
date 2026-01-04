
import React, { useState, useEffect, useMemo } from 'react';
import { Lock, RefreshCcw, ShieldAlert, X, Loader2, Menu } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Employee, AttendanceLog, SystemSettings, Notice, Department, InformalLog } from '../types';
import AdminSidebar, { AdminTab } from '../components/AdminSidebar';
import ReportModal from '../components/ReportModal';
import Notification from '../components/Notification';

import AdminOverview from '../admin/AdminOverview';
import StaffDirectory from '../admin/StaffDirectory';
import StaffLogs from '../admin/StaffLogs';
import VisitorLogs from '../admin/VisitorLogs';
import GateLog from '../admin/GateLog';
import Notices from '../admin/Notices';
import Settings from '../admin/Settings';
import OutsideWork from '../admin/OutsideWork';

interface AdminDashboardProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isAuthenticated, onLogin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [password, setPassword] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<AttendanceLog[]>([]);
  const [informalLogs, setInformalLogs] = useState<InformalLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EARLY' | 'LATE'>('ALL');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const [adminNotification, setAdminNotification] = useState<{id: number, msg: string, sub: string, type: 'success' | 'error'} | null>(null);
  
  useEffect(() => {
    loadSettingsOnly();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, activeTab]);

  const loadSettingsOnly = async () => {
    try {
      const s = await dataService.getSettings();
      setSettings(s);
    } catch (err) { console.error(err); }
  };

  const loadData = async () => {
    console.log(`[DASHBOARD] Refreshing all data registers...`);
    setIsRefreshing(true);
    try {
      const [s, n, e, d, l, vl, i] = await Promise.all([
        dataService.getSettings(), 
        dataService.getNotices(),
        dataService.getEmployees(),
        dataService.getDepartments(),
        dataService.getLogs(),
        dataService.getVisitorLogs(),
        dataService.getInformalLogs()
      ]);
      setSettings(s);
      setNotices(n);
      setEmployees(e);
      setDepartments(d);
      setLogs(l);
      setVisitorLogs(vl);
      setInformalLogs(i);
      
      console.log(`[DASHBOARD_SYNC] Success. Employee Logs: ${l.length}, Visitor Logs: ${vl.length}, Gate Passes: ${i.length}`);
    } catch (err) { 
      console.error(`[DASHBOARD_SYNC] Failed to fetch registers:`, err);
    }
    setIsRefreshing(false);
  };

  const handleWipeLogs = async () => {
    if (purgePassword === settings?.adminPassword) {
      setIsPurging(true);
      try {
        await dataService.wipeLogs();
        setLogs([]);
        setVisitorLogs([]);
        setInformalLogs([]);
        setAdminNotification({ id: Date.now(), msg: "Database Purged", sub: "All logs wiped successfully", type: 'success' });
        setShowPurgeModal(false);
        setPurgePassword('');
      } catch (e) {
        setAdminNotification({ id: Date.now(), msg: "Purge Failed", sub: "System error during wipe", type: 'error' });
      } finally {
        setIsPurging(false);
      }
    } else {
      setAdminNotification({ id: Date.now(), msg: "ACCESS DENIED", sub: "Incorrect purge credentials", type: 'error' });
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (settings?.adminPassword || 'admin123')) {
      onLogin();
      setPassword(''); 
    } else {
      setAdminNotification({ id: Date.now(), msg: 'ACCESS DENIED', sub: 'Incorrect credentials', type: 'error' });
    }
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
  };

  const handleAddEmployee = async (newEmp: any) => {
    try {
      const added = await dataService.addEmployee(newEmp);
      setEmployees(prev => [...prev, added]);
      setAdminNotification({ id: Date.now(), msg: "Employee Added", sub: `${added.name} saved`, type: 'success' });
    } catch (err) {
      setAdminNotification({ id: Date.now(), msg: "Registration Failed", sub: "Please try again", type: 'error' });
    }
  };

  const handleUpdateEmployee = async (id: string, updatedData: Partial<Employee>) => {
    try {
      await dataService.updateEmployee(id, updatedData);
      setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
      setAdminNotification({ id: Date.now(), msg: "Employee Updated", sub: "Success", type: 'success' });
    } catch (err) {
      setAdminNotification({ id: Date.now(), msg: "Update Failed", sub: "Error", type: 'error' });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await dataService.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setAdminNotification({ id: Date.now(), msg: "Employee Deleted", sub: "Removed permanently", type: 'success' });
    } catch (err) {
      setAdminNotification({ id: Date.now(), msg: "Delete Failed", sub: "Error", type: 'error' });
    }
  };

  const handleAddDepartment = async (name: string) => {
    try {
      const added = await dataService.addDepartment(name);
      setDepartments(prev => [...prev, added].sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) { console.error(err); }
  };

  const handleUpdateDepartment = async (id: string, name: string) => {
    try {
      await dataService.updateDepartment(id, name);
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, name } : d).sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) { console.error(err); }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await dataService.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSaveSettings = async (updatedSettings: SystemSettings) => {
    await dataService.updateSettings(updatedSettings);
    setSettings(updatedSettings);
    setAdminNotification({ id: Date.now(), msg: "Settings Saved", sub: "Updated", type: 'success' });
  };

  const handleAddNotice = async (notice: Omit<Notice, 'id'>) => {
    try {
      const added = await dataService.addNotice(notice);
      setNotices(prev => [added, ...prev]);
    } catch (e) { console.error(e); }
  };

  const handleUpdateNotice = async (id: string, updated: Partial<Notice>) => {
    try {
      await dataService.updateNotice(id, updated);
      setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updated, updatedAt: Date.now() } : n));
    } catch (e) { console.error(e); }
  };

  const handleDeleteNotice = async (notice: Notice) => {
    try {
      await dataService.deleteNotice(notice);
      setNotices(prev => prev.filter(n => n.id !== notice.id));
    } catch (e) { console.error(e); }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'ADD_STAFF': setActiveTab('EMPLOYEES'); break;
      case 'NOTICE': setActiveTab('NOTICES'); break;
      case 'REPORT': setIsReportOpen(true); break;
      case 'SYNC': loadData(); break;
    }
  };

  const filteredReportLogs = useMemo(() => {
    if (activeTab === 'VISITOR_LOGS') return visitorLogs;
    if (activeTab === 'STAFF_LOGS') return logs;
    return [...logs, ...visitorLogs];
  }, [activeTab, logs, visitorLogs]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white text-slate-900 overflow-hidden relative">
      {adminNotification && (
        <Notification 
          key={adminNotification.id}
          message={adminNotification.msg} 
          subtext={adminNotification.sub} 
          type={adminNotification.type} 
          onClose={() => setAdminNotification(null)}
          duration={3000}
        />
      )}

      {!isAuthenticated ? (
        <div className="flex items-center justify-center w-full min-h-screen bg-gray-100 p-6">
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-200 shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-xl"><Lock size={40} /></div>
            <h2 className="text-3xl font-black text-center text-black mb-2 uppercase">Admin Login</h2>
            <form onSubmit={handleAuth} className="space-y-4 mt-8">
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-lg font-bold" />
              <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-sm shadow-xl active:scale-95 transition-all">Login</button>
              <button type="button" onClick={() => window.location.hash = ''} className="w-full py-4 text-gray-400 hover:text-black font-bold uppercase text-xs">Terminal</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in">
              <div className="w-72 h-full">
                <AdminSidebar activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} onExit={() => { onLogout(); setIsMobileMenuOpen(false); }} />
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-lg"><X size={24}/></button>
            </div>
          )}

          {showPurgeModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-xl animate-in fade-in">
              <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm"><ShieldAlert size={40}/></div>
                <h3 className="text-2xl font-black text-center uppercase mb-8">Confirm Purge</h3>
                <div className="space-y-4">
                  <input type="password" placeholder="Admin Password" value={purgePassword} onChange={e => setPurgePassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowPurgeModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
                    <button onClick={handleWipeLogs} disabled={isPurging} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">{isPurging ? 'Purging...' : 'Confirm'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="hidden md:block">
            <AdminSidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} onExit={onLogout} />
          </div>
          
          <main className="flex-grow flex flex-col h-full overflow-hidden">
            <header className="px-10 py-4 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-50">
              <div className="flex items-center gap-4">
                <Menu onClick={() => setIsMobileMenuOpen(true)} className="md:hidden cursor-pointer" />
                <h2 className="text-lg font-black uppercase tracking-tight text-black">{activeTab.replace('_', ' ')}</h2>
              </div>
              <button onClick={loadData} className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </header>

            <div className="flex-grow overflow-auto p-4 md:p-8 bg-slate-50/30">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'OVERVIEW' && settings && <AdminOverview employees={employees} logs={logs} onQuickAction={handleQuickAction} settings={settings} />}
                {activeTab === 'EMPLOYEES' && <StaffDirectory employees={employees} departments={departments} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} searchQuery={searchQuery} setSearchQuery={setSearchQuery} highlightedId={highlightedId} handleSuggestionClick={handleSuggestionClick} />}
                {activeTab === 'OUTSIDE_WORK' && <OutsideWork employees={employees} departments={departments} onRefresh={loadData} />}
                {activeTab === 'STAFF_LOGS' && <StaffLogs logs={logs} employees={employees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeFilter={activeFilter} setActiveFilter={setActiveFilter} onReportOpen={() => setIsReportOpen(true)} onWipeLogs={() => setShowPurgeModal(true)} highlightedId={highlightedId} handleSuggestionClick={handleSuggestionClick} />}
                {activeTab === 'GATE_LOG' && <GateLog logs={informalLogs} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReportOpen={() => setIsReportOpen(true)} />}
                {activeTab === 'VISITOR_LOGS' && <VisitorLogs logs={visitorLogs} employees={employees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onReportOpen={() => setIsReportOpen(true)} highlightedId={highlightedId} handleSuggestionClick={handleSuggestionClick} />}
                {activeTab === 'NOTICES' && <Notices notices={notices} onAdd={handleAddNotice} onToggle={(id, active) => handleUpdateNotice(id, { isActive: active })} onDelete={handleDeleteNotice} />}
                {activeTab === 'SETTINGS' && <Settings settings={settings} setSettings={setSettings} departments={departments} onAddDepartment={handleAddDepartment} onUpdateDepartment={handleUpdateDepartment} onDeleteDepartment={handleDeleteDepartment} onSave={handleSaveSettings} />}
              </div>
            </div>

            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title={activeTab} data={filteredReportLogs} />
          </main>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
