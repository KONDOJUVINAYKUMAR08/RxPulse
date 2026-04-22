import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar title="Admin Panel" subtitle="System administration and configuration" />
      <div className="page-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <button
            onClick={() => navigate('/admin/users')}
            className="card p-6 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <Users className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-slate-800">User Management</h3>
            <p className="text-sm text-slate-500 mt-1">Add, edit, and manage system users</p>
          </button>

          <div className="card p-6 opacity-60">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800">System Settings</h3>
            <p className="text-sm text-slate-500 mt-1">Configure system preferences</p>
            <span className="badge badge-slate mt-2">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
