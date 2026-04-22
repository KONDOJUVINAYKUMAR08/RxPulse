import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';
import Sidebar from './components/common/Sidebar';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Medicines from './pages/medicines/Medicines';
import MedicineDetail from './pages/medicines/MedicineDetail';
import Inventory from './pages/inventory/Inventory';
import StockIn from './pages/inventory/StockIn';
import StockOut from './pages/inventory/StockOut';
import Movements from './pages/movements/Movements';
import Alerts from './pages/alerts/Alerts';
import Reports from './pages/reports/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 ml-64 min-h-screen bg-white">
      {children}
    </main>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <AppLayout><Medicines /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines/:id"
            element={
              <ProtectedRoute>
                <AppLayout><MedicineDetail /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <AppLayout><Inventory /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-in"
            element={
              <ProtectedRoute>
                <AppLayout><StockIn /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-out"
            element={
              <ProtectedRoute>
                <AppLayout><StockOut /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/movements"
            element={
              <ProtectedRoute>
                <AppLayout><Movements /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AppLayout><Alerts /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RoleGuard allowedRoles={['manager', 'admin']} fallback={<Navigate to="/dashboard" replace />}>
                    <Reports />
                  </RoleGuard>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RoleGuard allowedRoles={['admin']} fallback={<Navigate to="/dashboard" replace />}>
                    <AdminDashboard />
                  </RoleGuard>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RoleGuard allowedRoles={['admin']} fallback={<Navigate to="/dashboard" replace />}>
                    <UserManagement />
                  </RoleGuard>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
