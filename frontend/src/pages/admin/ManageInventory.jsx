import { useEffect, useState } from 'react';
import { X, PackagePlus, PackageMinus, Settings } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AlertCard from '../../components/admin/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  getStocks,
  stockIn,
  stockOut,
  updateThreshold,
  getActiveAlerts,
  resolveAlert,
} from '../../api/inventoryApi';

export default function ManageInventory() {
  const [stocks, setStocks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [form, setForm] = useState({
    quantity: '',
    reason: '',
    supplierName: '',
    threshold: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [stockRes, alertRes] = await Promise.all([
        getStocks(),
        getActiveAlerts(),
      ]);
      const stocksData = stockRes.data?.data;
      const stks = Array.isArray(stocksData)
        ? stocksData
        : Array.isArray(stocksData?.stocks)
        ? stocksData.stocks
        : [];
      const alertsData = alertRes.data?.data;
      const alts = Array.isArray(alertsData)
        ? alertsData
        : Array.isArray(alertsData?.alerts)
        ? alertsData.alerts
        : [];
      setStocks(stks);
      setAlerts(alts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (stock, type) => {
    setSelectedStock(stock);
    setForm({
      quantity: '',
      reason: '',
      supplierName: '',
      threshold: stock.threshold?.toString() || '',
    });
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedStock(null);
  };

  // Business Logic Checks
  const canStockIn = (stock) => {
    // Can stock in only when below threshold
    return stock.currentQuantity < stock.threshold;
  };

  const canStockOut = (stock) => {
    // Can stock out only when above 0 and above threshold
    return stock.currentQuantity > 0 && stock.currentQuantity > stock.threshold;
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!canStockIn(selectedStock)) {
      showToast(
        `Stock is already at or above threshold (${selectedStock.threshold}). No restocking needed.`,
        'error'
      );
      return;
    }
    setSaving(true);
    try {
      await stockIn({
        medicineId: selectedStock.medicineId,
        medicineName: selectedStock.medicineName,
        category: selectedStock.category,
        unit: selectedStock.unit,
        quantity: parseInt(form.quantity),
        reason: form.reason,
        supplierName: form.supplierName,
        batchNumber: '',
      });
      showToast('Stock added successfully.');
      closeModal();
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Error adding stock.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    if (!canStockOut(selectedStock)) {
      showToast(
        `Stock is at or below threshold (${selectedStock.threshold}). Cannot dispense.`,
        'error'
      );
      return;
    }
    const qty = parseInt(form.quantity);
    if (qty > selectedStock.currentQuantity) {
      showToast(
        `Cannot dispense ${qty}. Only ${selectedStock.currentQuantity} available.`,
        'error'
      );
      return;
    }
    setSaving(true);
    try {
      await stockOut({
        medicineId: selectedStock.medicineId,
        medicineName: selectedStock.medicineName,
        quantity: qty,
        reason: form.reason,
      });
      showToast('Stock removed successfully.');
      closeModal();
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Error removing stock.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleThreshold = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateThreshold(selectedStock._id, {
        threshold: parseInt(form.threshold),
      });
      showToast('Threshold updated.');
      closeModal();
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Error updating threshold.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      fetchData();
      showToast('Alert resolved.');
    } catch {
      showToast('Error resolving alert.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto ml-60">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            Manage Inventory
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Monitor and update stock levels
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stock Table */}
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
                  {stocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-td text-center text-[#6B7280] py-8">
                        No stock records found.
                      </td>
                    </tr>
                  ) : (
                    stocks.map((s) => (
                      <tr
                        key={s._id}
                        className={`hover:bg-[#FAFAFA] transition-colors border-b border-[#F0F0F0] last:border-0 ${
                          s.isLowStock ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <td className="table-td font-semibold text-sm">
                          {s.medicineName}
                        </td>
                        <td className="table-td">
                          <span className="badge-green text-[10px]">
                            {s.category}
                          </span>
                        </td>
                        <td className="table-td">
                          <span
                            className={`font-bold ${
                              s.isLowStock
                                ? 'text-red-600'
                                : 'text-[#1A1A1A]'
                            }`}
                          >
                            {s.currentQuantity}
                          </span>
                          <span className="text-xs font-normal text-[#6B7280] ml-1">
                            {s.unit}
                          </span>
                        </td>
                        <td className="table-td text-sm text-[#6B7280]">
                          {s.threshold}
                        </td>
                        <td className="table-td text-sm text-[#6B7280]">
                          {s.location}
                        </td>
                        <td className="table-td">
                          <span
                            className={`badge text-[10px] ${
                              s.isLowStock ? 'badge-red' : 'badge-green'
                            }`}
                          >
                            {s.isLowStock ? 'Low Stock' : 'OK'}
                          </span>
                        </td>
                        <td className="table-td">
                          <div className="flex gap-1.5">
                            {/* Stock IN - only show when below threshold */}
                            <button
                              onClick={() => openModal(s, 'in')}
                              disabled={!canStockIn(s)}
                              title={
                                !canStockIn(s)
                                  ? `Stock (${s.currentQuantity}) is at or above threshold (${s.threshold})`
                                  : 'Stock In'
                              }
                              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                                canStockIn(s)
                                  ? 'bg-[#E8F5E9] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white cursor-pointer'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <PackagePlus size={12} /> In
                            </button>

                            {/* Stock OUT - only show when above threshold */}
                            <button
                              onClick={() => openModal(s, 'out')}
                              disabled={!canStockOut(s)}
                              title={
                                !canStockOut(s)
                                  ? `Stock (${s.currentQuantity}) is at or below threshold (${s.threshold}). Cannot dispense.`
                                  : 'Stock Out'
                              }
                              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                                canStockOut(s)
                                  ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <PackageMinus size={12} /> Out
                            </button>

                            {/* Threshold */}
                            <button
                              onClick={() => openModal(s, 'threshold')}
                              title="Update Threshold"
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-[#6B7280] font-semibold hover:bg-gray-200 transition-colors"
                            >
                              <Settings size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Active Alerts */}
            <div className="mb-2">
              <h2 className="font-semibold text-[#1A1A1A] mb-4 text-sm">
                Active Alerts ({alerts.length})
              </h2>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="card p-6 text-center text-[#6B7280] text-sm">
                    No active alerts 🎉
                  </div>
                ) : (
                  alerts.map((a) => (
                    <AlertCard
                      key={a._id}
                      alert={a}
                      onResolve={handleResolve}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal */}
        {modal && selectedStock && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[#1A1A1A]">
                    {modal === 'in'
                      ? '📦 Stock In'
                      : modal === 'out'
                      ? '📤 Stock Out'
                      : '⚙️ Update Threshold'}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {selectedStock.medicineName}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Current stock info */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl mb-4 text-sm ${
                  selectedStock.isLowStock
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-[#E8F5E9] border border-[#B7E4C7]'
                }`}
              >
                <span className="text-[#6B7280] font-medium">
                  Current Stock
                </span>
                <span
                  className={`font-bold ${
                    selectedStock.isLowStock
                      ? 'text-red-600'
                      : 'text-[#2D6A4F]'
                  }`}
                >
                  {selectedStock.currentQuantity} {selectedStock.unit}
                </span>
              </div>

              {modal === 'in' && (
                <div className="mb-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  ℹ️ Stock In allowed because current stock ({selectedStock.currentQuantity}) is below threshold ({selectedStock.threshold})
                </div>
              )}

              {modal === 'out' && (
                <div className="mb-3 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                  ⚠️ Stock Out allowed because current stock ({selectedStock.currentQuantity}) is above threshold ({selectedStock.threshold})
                </div>
              )}

              <form
                onSubmit={
                  modal === 'in'
                    ? handleStockIn
                    : modal === 'out'
                    ? handleStockOut
                    : handleThreshold
                }
                className="space-y-4"
              >
                {modal !== 'threshold' ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[#1A1A1A] mb-1.5 block">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={
                          modal === 'out'
                            ? selectedStock.currentQuantity - selectedStock.threshold
                            : undefined
                        }
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({ ...form, quantity: e.target.value })
                        }
                        className="input-field text-sm"
                        placeholder={
                          modal === 'out'
                            ? `Max: ${Math.max(0, selectedStock.currentQuantity - selectedStock.threshold)}`
                            : 'Enter quantity'
                        }
                        required
                      />
                      {modal === 'out' && (
                        <p className="text-xs text-[#6B7280] mt-1">
                          Max dispensable: {Math.max(0, selectedStock.currentQuantity - selectedStock.threshold)} {selectedStock.unit} (keeping threshold safe)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#1A1A1A] mb-1.5 block">
                        Reason *
                      </label>
                      <input
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                        className="input-field text-sm"
                        placeholder={
                          modal === 'in'
                            ? 'e.g. Monthly restock'
                            : 'e.g. Dispensed to patient'
                        }
                        required
                      />
                    </div>
                    {modal === 'in' && (
                      <div>
                        <label className="text-xs font-semibold text-[#1A1A1A] mb-1.5 block">
                          Supplier Name
                        </label>
                        <input
                          value={form.supplierName}
                          onChange={(e) =>
                            setForm({ ...form, supplierName: e.target.value })
                          }
                          className="input-field text-sm"
                          placeholder="e.g. MedCorp India"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1.5 block">
                      New Threshold *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.threshold}
                      onChange={(e) =>
                        setForm({ ...form, threshold: e.target.value })
                      }
                      className="input-field text-sm"
                      required
                    />
                    <p className="text-xs text-[#6B7280] mt-1">
                      Current threshold: {selectedStock.threshold}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1"
                  >
                    {saving ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type}`}>{toast.msg}</div>
          </div>
        )}
      </main>
    </div>
  );
}
