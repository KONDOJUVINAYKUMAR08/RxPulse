import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import AlertCard from '../../components/common/AlertCard';
import { getAllAlerts, resolveAlert } from '../../api/inventoryApi';
import { canResolveAlerts } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { label: 'All', filter: {} },
  { label: 'Low Stock', filter: { alertType: 'LOW_STOCK', isResolved: false } },
  { label: 'Expiry', filter: { alertType: 'EXPIRY', isResolved: false } },
  { label: 'Resolved', filter: { isResolved: true } },
];

const Alerts = () => {
  const { role } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getAllAlerts(TABS[activeTab].filter);
      setAlerts(res.data.data || []);
    } catch { toast.error('Failed to load alerts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [activeTab]);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success('Alert resolved.');
      fetchAlerts();
    } catch { toast.error('Failed to resolve alert.'); }
  };

  return (
    <div>
      <Navbar title="Alerts" subtitle="Monitor low stock and expiry notifications" />
      <div className="page-container">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-400 text-sm">No alerts in this category.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                canResolve={canResolveAlerts(role)}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
