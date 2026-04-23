import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AlertCard from '../../components/admin/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAlerts, resolveAlert } from '../../api/inventoryApi';

const FILTERS = ['All', 'LOW_STOCK', 'EXPIRY', 'Resolved'];

export default function ManageAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data?.data?.alerts || res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleResolve = async (id) => {
    try { await resolveAlert(id); showToast('Alert resolved.'); fetchAlerts(); }
    catch { showToast('Error resolving alert.', 'error'); }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Resolved') return a.isResolved;
    return !a.isResolved && a.alertType === filter;
  });

  const counts = {
    All: alerts.length,
    LOW_STOCK: alerts.filter((a) => !a.isResolved && a.alertType === 'LOW_STOCK').length,
    EXPIRY: alerts.filter((a) => !a.isResolved && a.alertType === 'EXPIRY').length,
    Resolved: alerts.filter((a) => a.isResolved).length,
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto ml-60">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Manage Alerts</h1>
        <p className="text-sm text-[#6B7280] mb-6">Monitor and resolve inventory alerts</p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              id={`alert-filter-${f.toLowerCase().replace('_', '-')}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#E0E0E0] text-[#6B7280] hover:border-[#2D6A4F]'
              }`}
            >
              {f === 'LOW_STOCK' ? 'Low Stock' : f === 'EXPIRY' ? 'Expiry' : f}
              <span className={`ml-2 text-xs font-bold ${filter === f ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" text="Loading alerts..." /></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[#6B7280] text-lg mb-1">No alerts found</p>
            <p className="text-sm text-[#9CA3AF]">
              {filter === 'All' ? 'All clear! No alerts at the moment.' : `No ${filter.toLowerCase().replace('_', ' ')} alerts.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onResolve={!alert.isResolved ? handleResolve : null}
              />
            ))}
          </div>
        )}

        {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.msg}</div></div>}
      </main>
    </div>
  );
}
