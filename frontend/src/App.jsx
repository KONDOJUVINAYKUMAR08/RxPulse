import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';

import Home from './pages/Home';
import Shop from './pages/Shop';
import MedicineDetail from './pages/MedicineDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageMedicines from './pages/admin/ManageMedicines';
import ManageInventory from './pages/admin/ManageInventory';
import ManageAlerts from './pages/admin/ManageAlerts';

// Layout for public pages (with Navbar + Footer)
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
            <Route path="/medicines/:id" element={<PublicLayout><MedicineDetail /></PublicLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected customer routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <PublicLayout><Cart /></PublicLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={<RoleGuard role="admin"><AdminDashboard /></RoleGuard>}
            />
            <Route
              path="/admin/medicines"
              element={<RoleGuard role="admin"><ManageMedicines /></RoleGuard>}
            />
            <Route
              path="/admin/inventory"
              element={<RoleGuard role="admin"><ManageInventory /></RoleGuard>}
            />
            <Route
              path="/admin/alerts"
              element={<RoleGuard role="admin"><ManageAlerts /></RoleGuard>}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
