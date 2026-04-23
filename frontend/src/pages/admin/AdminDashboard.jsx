import { useEffect, useState } from 'react';
import { Pill, Package, Bell, ArrowUpDown } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatCard from '../../components/admin/StatCard';
import AlertCard from '../../components/admin/AlertCard';
import StockBarChart from '../../components/charts/StockBarChart';
import CategoryPieChart from '../../components/charts/CategoryPieChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMedicines } from '../../api/catalogApi';
import { getStocks, getActiveAlerts, resolveAlert, getMovements, getMonthlyReport } from '../../api/inventoryApi';

export default function AdminDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [medRes, stockRes, alertRes, movRes] = await Promise.all([
        getMedicines(), getStocks(), getActiveAlerts(), getMovements()
      ]);
      setMedicines(medRes.data?.data?.medicines || medRes.data?.data || []);
      setStocks(stockRes.data?.data?.stocks || stockRes.data?.data || []);
      setAlerts(alertRes.data?.data?.alerts || alertRes.data?.data || []);
      setMovements(movRes.data?.data?.movements || movRes.data?.data || []);
      try {
        const monthRes = await getMonthlyReport();
        setMonthlyData(monthRes.data?.data || []);
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleResolve = async (id) => {
    try { await resolveAlert(id); fetchAll(); } catch {}
  };

  const lowStockCount = stocks.filter((s) => s.isLowStock).length;
  const today = new Date().toDateString();
  const todayMovements = movements.filter((m) => new Date(m.date || m.createdAt).toDateString() === today).length;

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Overview of your pharmacy operations</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Medicines" value={medicines.length} icon={Pill} color="green" />
              <StatCard title="Low Stock Items" value={lowStockCount} icon={Package} color="red" subtitle="Need restocking" />
              <StatCard title="Active Alerts" value={alerts.length} icon={Bell} color="amber" />
              <StatCard title="Movements Today" value={todayMovements} icon={ArrowUpDown} color="blue" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <StockBarChart data={monthlyData} />
              <CategoryPieChart stocks={stocks} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <div>
                <h2 className="font-semibold text-[#1A1A1A] mb-4 text-sm">Active Alerts</h2>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="card p-6 text-center text-[#6B7280] text-sm">No active alerts 🎉</div>
                  ) : alerts.slice(0, 5).map((a) => (
                    <AlertCard key={a._id} alert={a} onResolve={handleResolve} />
                  ))}
                </div>
              </div>

              {/* Recent Movements */}
              <div>
                <h2 className="font-semibold text-[#1A1A1A] mb-4 text-sm">Recent Movements</h2>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-th">Medicine</th>
                        <th className="table-th">Type</th>
                        <th className="table-th">Qty</th>
                        <th className="table-th">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 8).map((m) => (
                        <tr key={m._id}>
                          <td className="table-td font-medium text-xs">{m.medicineName}</td>
                          <td className="table-td">
                            <span className={`badge text-[10px] ${m.type === 'STOCK_IN' ? 'badge-green' : 'badge-red'}`}>{m.type}</span>
                          </td>
                          <td className="table-td">{m.quantity}</td>
                          <td className="table-td text-xs text-[#6B7280]">
                            {new Date(m.date || m.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
