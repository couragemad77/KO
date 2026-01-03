
import React from 'react';
import { 
  Users, 
  Settings, 
  LogOut,
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Megaphone,
  BarChart3,
  Truck,
  DoorOpen
} from 'lucide-react';

export type AdminTab = 'OVERVIEW' | 'EMPLOYEES' | 'OUTSIDE_WORK' | 'STAFF_LOGS' | 'VISITOR_LOGS' | 'GATE_LOG' | 'NOTICES' | 'SETTINGS';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExit: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, onExit }) => {
  const navigation = [
    { id: 'OVERVIEW' as const, icon: BarChart3, label: 'Dashboard' },
    { id: 'EMPLOYEES' as const, icon: Users, label: 'Employee List' },
    { id: 'OUTSIDE_WORK' as const, icon: Truck, label: 'Outside Work' },
    { id: 'STAFF_LOGS' as const, icon: Briefcase, label: 'Attendance Logs' },
    { id: 'GATE_LOG' as const, icon: DoorOpen, label: 'Gate Log' },
    { id: 'VISITOR_LOGS' as const, icon: UserCheck, label: 'Visitor Logs' },
    { id: 'NOTICES' as const, icon: Megaphone, label: 'Announcements' },
    { id: 'SETTINGS' as const, icon: Settings, label: 'Settings' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white h-screen sticky top-0 left-0 border-r border-slate-800 shadow-2xl flex-shrink-0">
      <div className="p-8 border-b border-slate-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none uppercase tracking-tighter">Admin</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {navigation.map(item => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg font-bold text-sm tracking-tight transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg translate-x-1' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <button 
          onClick={onExit}
          className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-red-400 font-bold text-sm tracking-tight transition-all duration-200 rounded-lg hover:bg-red-400/5"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
