import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Pill, Package, PackagePlus, PackageMinus,
  ArrowLeftRight, Bell, BarChart3, Settings, LogOut, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canViewReports, canManageUsers } from '../../utils/roleHelpers';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/medicines', label: 'Medicines', icon: Pill, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/stock-in', label: 'Stock In', icon: PackagePlus, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/stock-out', label: 'Stock Out', icon: PackageMinus, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/movements', label: 'Movements', icon: ArrowLeftRight, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/alerts', label: 'Alerts', icon: Bell, roles: ['pharmacist', 'manager', 'admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['manager', 'admin'] },
  { path: '/admin', label: 'Admin Panel', icon: Settings, roles: ['admin'] },
];

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="text-base font-bold text-slate-800 leading-tight">RxPulse</p>
          <p className="text-xs text-slate-400 truncate" title="Real-time monitoring of pharmacy operations">Real-time monitoring of pharmacy operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5 sidebar-icon flex-shrink-0" size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-blue-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
