import React, { useEffect, useState } from 'react';
import { Package, TrendingDown, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import StockBarChart from '../../components/charts/StockBarChart';
import CategoryPieChart from '../../components/charts/CategoryPieChart';
import AlertCard from '../../components/common/AlertCard';
import { getStats, getMonthlyReport, getActiveAlerts, resolveAlert } from '../../api/inventoryApi';
import { getAllMedicines, getExpiringMedicines } from '../../api/catalogApi';
import { getMovements } from '../../api/inventoryApi';
import { canResolveAlerts } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState({ totalStocks: 0, lowStockCount: 0, activeAlerts: 0, todayMovements: 0 });
  const [expiringCount, setExpiringCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [statsRes, monthRes, alertsRes, movRes, expRes, medRes] = await Promise.all([
        getStats(),
        getMonthlyReport(new Date().getFullYear(), new Date().getMonth() + 1),
        getActiveAlerts(),
        getMovements({ limit: 5 }),
        getExpiringMedicines(30),
        getAllMedicines(),
      ]);
      setStats(statsRes.data.data);
      setMonthlyData(monthRes.data.data?.dailyData || []);
      setAlerts(alertsRes.data.data?.slice(0, 5) || []);
      setRecentMovements(movRes.data.data || []);
      setExpiringCount(expRes.data.data?.length || 0);

      // Category distribution from medicine list
      const meds = medRes.data.data || [];
      const catMap = {};
      meds.forEach((m) => {
        catMap[m.category] = (catMap[m.category] || 0) + 1;
      });
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success('Alert resolved.');
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      toast.error('Failed to resolve alert.');
    }
  };

  return (
    <div>
      <Navbar title="Dashboard" subtitle="Overview of your pharmacy inventory" />
      <div className="page-container">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Medicines" value={loading ? '…' : stats.totalStocks} icon={Package} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <StatCard title="Low Stock Items" value={loading ? '…' : stats.lowStockCount} icon={TrendingDown} iconBg="bg-red-100" iconColor="text-red-600" />
          <StatCard title="Expiring Soon" value={loading ? '…' : expiringCount} icon={AlertTriangle} iconBg="bg-yellow-100" iconColor="text-yellow-600" />
          <StatCard title="Movements Today" value={loading ? '…' : stats.todayMovements} icon={ArrowLeftRight} iconBg="bg-green-100" iconColor="text-green-600" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <StockBarChart data={monthlyData} title="Monthly Stock Movement (This Month)" />
          </div>
          <CategoryPieChart data={categoryData} title="Medicine by Category" />
        </div>

        {/* Recent Alerts */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Active Alerts</h2>
          {alerts.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-sm">No active alerts</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard key={alert._id} alert={alert} canResolve={canResolveAlerts(role)} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Movements</h2>
          <div className="card overflow-hidden">
            {recentMovements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No movements recorded yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Medicine</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">By</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((mv) => (
                    <tr key={mv._id} className="table-row">
                      <td className="table-cell font-medium">{mv.medicineName}</td>
                      <td className="table-cell">
                        <span className={mv.type === 'STOCK_IN' ? 'badge badge-green' : 'badge badge-red'}>
                          {mv.type === 'STOCK_IN' ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td className="table-cell">{mv.quantity}</td>
                      <td className="table-cell">{mv.performedByName || '—'}</td>
                      <td className="table-cell text-slate-500">{new Date(mv.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
