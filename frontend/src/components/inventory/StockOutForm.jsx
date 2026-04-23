import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackageMinus } from 'lucide-react';
import { getAllMedicines } from '../../api/catalogApi';
import { getAllStocks, stockOut } from '../../api/inventoryApi';

const StockOutForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedName = decodeURIComponent(
    searchParams.get('medicineName') || ''
  );

  const [medicines, setMedicines] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medicineId: '',
    medicineName: '',
    quantity: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    Promise.all([
      getAllMedicines({ isActive: true }),
      getAllStocks(),
    ])
      .then(([medRes, stockRes]) => {
        const meds = medRes.data.data || [];
        const stks = stockRes.data.data || [];
        setMedicines(meds);
        setStocks(stks);

        // Auto select if medicineName passed in URL
        if (preSelectedName) {
          const matched = meds.find(
            (m) => m.name.toLowerCase() === preSelectedName.toLowerCase()
          );
          if (matched) {
            setForm((prev) => ({
              ...prev,
              medicineId: matched._id,
              medicineName: matched.name,
            }));

            // Find stock by medicine name
            const stockRecord = stks.find(
              (s) =>
                s.medicineName.toLowerCase() ===
                matched.name.toLowerCase()
            );
            setCurrentStock(stockRecord || null);
          }
        }
      })
      .catch(() => {});
  }, [preSelectedName]);

  useEffect(() => {
    if (form.medicineName && stocks.length) {
      const stockRecord = stocks.find(
        (s) =>
          s.medicineName.toLowerCase() ===
          form.medicineName.toLowerCase()
      );
      setCurrentStock(stockRecord || null);
    }
  }, [form.medicineName, stocks]);

  const handleMedicineChange = (e) => {
    const selectedId = e.target.value;
    const med = medicines.find((m) => m._id === selectedId);
    if (med) {
      setForm((prev) => ({
        ...prev,
        medicineId: med._id,
        medicineName: med.name,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        medicineId: '',
        medicineName: '',
      }));
      setCurrentStock(null);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicineId) {
      toast.error('Please select a medicine.');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    if (
      currentStock &&
      Number(form.quantity) > currentStock.currentQuantity
    ) {
      toast.error(
        `Cannot dispense more than available stock (${currentStock.currentQuantity} units).`
      );
      return;
    }
    setLoading(true);
    try {
      await stockOut({
        medicineId: form.medicineId,
        medicineName: form.medicineName,
        quantity: Number(form.quantity),
        reason: form.reason,
        date: form.date,
      });
      toast.success('Stock out recorded successfully!');
      navigate('/inventory');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to record stock out.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <PackageMinus className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Record Stock Out
          </h2>
          {form.medicineName && (
            <p className="text-xs text-orange-600 font-medium">
              Auto-selected: {form.medicineName}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="form-label">Select Medicine *</label>
        <select
          value={form.medicineId}
          onChange={handleMedicineChange}
          required
          className="form-input"
        >
          <option value="">Choose medicine...</option>
          {medicines.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} — {m.category}
            </option>
          ))}
        </select>
      </div>

      {currentStock && (
        <div
          className={`p-3 rounded-xl text-sm ${
            currentStock.isLowStock
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          <span>
            Current stock:{' '}
            <strong>
              {currentStock.currentQuantity} {currentStock.unit}
            </strong>
          </span>
          {currentStock.isLowStock && (
            <span className="ml-2 font-semibold">
              ⚠️ LOW STOCK WARNING
            </span>
          )}
        </div>
      )}

      <div>
        <label className="form-label">Quantity to Dispense *</label>
        <input
          type="number"
          name="quantity"
          min="1"
          max={currentStock?.currentQuantity || undefined}
          value={form.quantity}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="Enter quantity to dispense"
        />
      </div>

      <div>
        <label className="form-label">Reason *</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows={2}
          required
          className="form-input resize-none"
          placeholder="Reason for dispensing..."
        />
      </div>

      <div>
        <label className="form-label">Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-danger flex-1"
        >
          {loading ? 'Recording...' : 'Record Stock Out'}
        </button>
      </div>
    </form>
  );
};

export default StockOutForm;