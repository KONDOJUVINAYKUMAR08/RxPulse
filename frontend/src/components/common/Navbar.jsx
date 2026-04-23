import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, ShoppingCart, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#F0F0F0] shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
              <Pill size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A]">RxPulse</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={isActive('/') ? 'nav-link-active' : 'nav-link'}>Home</Link>
            <Link to="/shop" className={isActive('/shop') ? 'nav-link-active' : 'nav-link'}>Shop</Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className={location.pathname.startsWith('/admin') ? 'nav-link-active' : 'nav-link'}>
                Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/cart" id="cart-link" className="relative p-2 text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
                  <ShoppingCart size={22} />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="w-7 h-7 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                      <User size={14} className="text-[#2D6A4F]" />
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A] hidden sm:block max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="text-[#6B7280]" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#F0F0F0] rounded-xl shadow-lg py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-[#F0F0F0]">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{user?.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" id="login-btn" className="btn-ghost text-sm py-2 px-4">Login</Link>
                <Link to="/register" id="register-btn" className="btn-primary text-sm py-2 px-4">Register</Link>
              </div>
            )}
            <button className="md:hidden p-2 text-[#6B7280]" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#F0F0F0] py-3 space-y-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F5F5]">Home</Link>
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F5F5]">Shop</Link>
            {isAuthenticated && (
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F5F5]">
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#2D6A4F] hover:bg-[#E8F5E9]">Admin Panel</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
