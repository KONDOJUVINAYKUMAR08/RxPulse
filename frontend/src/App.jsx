import ManageMovements from './pages/admin/ManageMovements';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function CustomerRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
            <Route path="/medicines/:id" element={<PublicLayout><MedicineDetail /></PublicLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Cart: only for logged in NON-admin users */}
            <Route
              path="/cart"
              element={
                <CustomerRoute>
                  <PublicLayout><Cart /></PublicLayout>
                </CustomerRoute>
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
	    <Route
  	      path="/admin/movements"
  	      element={<RoleGuard role="admin"><ManageMovements /></RoleGuard>}
	    />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
