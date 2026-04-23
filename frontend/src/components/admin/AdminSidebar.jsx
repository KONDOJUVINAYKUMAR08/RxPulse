import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Pill, Package,
  Bell, ArrowLeft, LogOut, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Medicines', href: '/admin/medicines', icon: Pill },
  { label: 'Inventory', href: '/admin/inventory', icon: Package },
  { label: 'Movements', href: '/admin/movements', icon: ArrowUpDown },
  { label: 'Alerts', href: '/admin/alerts', icon: Bell },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-white border-r border-[#F0F0F0] flex flex-col py-6 px-3 z-30">
      <Link
        to="/"
        className="flex items-center gap-2.5 px-3 mb-8 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
          <Pill size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1A1A1A]">RxPulse</p>
          <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">
            Admin Panel
          </p>
        </div>
      </Link>

      <nav className="space-y-1 flex-1">
        {links.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            id={`sidebar-${label.toLowerCase()}`}
            className={pathname === href ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <Icon size={18} />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-[#F0F0F0]">
        <Link
          to="/shop"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-[#1A1A1A] truncate">
            {user?.name}
          </p>
          <p className="text-[10px] text-[#6B7280] truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
