import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Pill, Package, Bell, Pill as PillIcon } from 'lucide-react';

const links = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Medicines', href: '/admin/medicines', icon: Pill },
  { label: 'Inventory', href: '/admin/inventory', icon: Package },
  { label: 'Alerts', href: '/admin/alerts', icon: Bell },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-[#F0F0F0] flex flex-col py-6 px-3">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
          <PillIcon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1A1A1A]">RxPulse</p>
          <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">Admin Panel</p>
        </div>
      </div>

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

      <Link to="/shop" className="sidebar-link mt-4 text-xs text-[#6B7280]">
        ← Back to Shop
      </Link>
    </aside>
  );
}
