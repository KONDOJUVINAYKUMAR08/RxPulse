import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AlertCard from '../../components/admin/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getStocks, stockIn, stockOut, updateThreshold, getActiveAlerts, resolveAlert } from '../../api/inventoryApi';

export default function ManageInventory() {
  const [stocks, setStocks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [form, setForm] = useState({ quantity: '', reason: '', supplierName: '', threshold: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    try {
      const [stockRes, alertRes] = await Promise.all([getStocks(), getActiveAlerts()]);
      setStocks(stockRes.data?.data?.stocks || stockRes.data?.data || []);
      setAlerts(alertRes.data?.data?.alerts || alertRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (stock, type) => {
    setSelectedStock(stock);
    setForm({ quantity: '', reason: '', supplierName: '', threshold: stock.threshold?.toString() || '' });
    setModal(type);
  };
  const closeModal = () => { setModal(null); setSelectedStock(null); };

  const handleStockIn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stockIn({ medicineName: selectedStock.medicineName, quantity: parseInt(form.quantity), reason: form.reason, supplierName: form.supplierName, performedBy: 'admin', performedByName: 'Admin User' });
      showToast('Stock added successfully.');
      closeModal(); fetchData();
    } catch { showToast('Error adding stock.', 'error'); }
    finally { setSaving(false); }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stockOut({ medicineName: selectedStock.medicineName, quantity: parseInt(form.quantity), reason: form.reason, performedBy: 'admin', performedByName: 'Admin User' });
      showToast('Stock removed successfully.');
      closeModal(); fetchData();
    } catch { showToast('Error removing stock.', 'error'); }
    finally { setSaving(false); }
  };

  const handleThreshold = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateThreshold(selectedStock._id, { threshold: parseInt(form.threshold) });
      showToast('Threshold updated.');
      closeModal(); fetchData();
    } catch { showToast('Error updating threshold.', 'error'); }
    finally { setSaving(false); }
  };

  const handleResolve = async (id) => {
    try { await resolveAlert(id); fetchData(); showToast('Alert resolved.'); } catch {}
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Manage Inventory</h1>
        <p className="text-sm text-[#6B7280] mb-6">Monitor and update stock levels</p>

        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="card overflow-x-auto mb-8">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Medicine</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Stock</th>
                    <th className="table-th">Threshold</th>
                    <th className="table-th">Location</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s) => (
                    <tr key={s._id} className="hover:bg-[#FAFAFA]">
                      <td className="table-td font-semibold text-sm">{s.medicineName}</td>
                      <td className="table-td"><span className="badge-green text-[10px]">{s.category}</span></td>
                      <td className="table-td font-bold text-[#1A1A1A]">{s.currentQuantity} <span className="text-xs font-normal text-[#6B7280]">{s.unit}</span></td>
                      <td className="table-td text-sm text-[#6B7280]">{s.threshold}</td>
                      <td className="table-td text-sm text-[#6B7280]">{s.location}</td>
                      <td className="table-td">
                        <span className={`badge text-[10px] ${s.isLowStock ? 'badge-red' : 'badge-green'}`}>
                          {s.isLowStock ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          <button onClick={() => openModal(s, 'in')} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#E8F5E9] text-[#2D6A4F] font-semibold hover:bg-[#2D6A4F] hover:text-white transition-colors">In</button>
                          <button onClick={() => openModal(s, 'out')} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-colors">Out</button>
                          <button onClick={() => openModal(s, 'threshold')} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-[#6B7280] font-semibold hover:bg-gray-200 transition-colors">Threshold</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="font-semibold text-[#1A1A1A] mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.length === 0 ? <p className="text-sm text-[#6B7280]">No active alerts.</p>
                : alerts.map((a) => <AlertCard key={a._id} alert={a} onResolve={handleResolve} />)}
            </div>
          </>
        )}

        {/* Modal */}
        {modal && selectedStock && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-box p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1A1A1A]">
                  {modal === 'in' ? 'Stock In' : modal === 'out' ? 'Stock Out' : 'Update Threshold'} — {selectedStock.medicineName}
                </h2>
                <button onClick={closeModal} className="text-[#6B7280]"><X size={18} /></button>
              </div>
              <form onSubmit={modal === 'in' ? handleStockIn : modal === 'out' ? handleStockOut : handleThreshold} className="space-y-4">
                {modal !== 'threshold' ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280] mb-1 block">Quantity *</label>
                      <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input-field text-sm" required />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6B7280] mb-1 block">Reason *</label>
                      <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field text-sm" required />
                    </div>
                    {modal === 'in' && (
                      <div>
                        <label className="text-xs font-medium text-[#6B7280] mb-1 block">Supplier</label>
                        <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="input-field text-sm" />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] mb-1 block">New Threshold *</label>
                    <input type="number" min="1" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="input-field text-sm" required />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Confirm'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.msg}</div></div>}
      </main>
    </div>
  );
}
