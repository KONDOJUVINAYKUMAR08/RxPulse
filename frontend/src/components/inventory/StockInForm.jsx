import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackagePlus } from 'lucide-react';
import { getAllMedicines } from '../../api/catalogApi';
import { stockIn } from '../../api/inventoryApi';

const StockInForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedName = decodeURIComponent(
    searchParams.get('medicineName') || ''
  );

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medicineId: '',
    medicineName: '',
    category: '',
    unit: '',
    quantity: '',
    supplierName: '',
    batchNumber: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    getAllMedicines({ isActive: true })
      .then((res) => {
        const meds = res.data.data || [];
        setMedicines(meds);

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
              category: matched.category || '',
              unit: matched.unit || '',
              batchNumber: matched.batchNumber || '',
            }));
          }
        }
      })
      .catch(() => {});
  }, [preSelectedName]);

  const handleMedicineChange = (e) => {
    const selectedId = e.target.value;
    const med = medicines.find((m) => m._id === selectedId);
    if (med) {
      setForm((prev) => ({
        ...prev,
        medicineId: med._id,
        medicineName: med.name,
        category: med.category || '',
        unit: med.unit || '',
        batchNumber: med.batchNumber || '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        medicineId: '',
        medicineName: '',
        category: '',
        unit: '',
      }));
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
    setLoading(true);
    try {
      await stockIn({
        medicineId: form.medicineId,
        medicineName: form.medicineName,
        category: form.category,
        unit: form.unit,
        quantity: Number(form.quantity),
        supplierName: form.supplierName,
        batchNumber: form.batchNumber,
        reason: form.reason,
        date: form.date,
      });
      toast.success('Stock in recorded successfully!');
      navigate('/inventory');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to record stock in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <PackagePlus className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Record Stock In
          </h2>
          {form.medicineName && (
            <p className="text-xs text-green-600 font-medium">
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

      {form.medicineName && (
        <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">
          Selected: <strong>{form.medicineName}</strong>
          {form.unit && ` (${form.unit})`}
        </div>
      )}

      <div>
        <label className="form-label">Quantity *</label>
        <input
          type="number"
          name="quantity"
          min="1"
          value={form.quantity}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="Enter quantity received"
        />
      </div>

      <div>
        <label className="form-label">Supplier Name</label>
        <input
          name="supplierName"
          value={form.supplierName}
          onChange={handleChange}
          className="form-input"
          placeholder="Supplier / Vendor name"
        />
      </div>

      <div>
        <label className="form-label">Batch Number</label>
        <input
          name="batchNumber"
          value={form.batchNumber}
          onChange={handleChange}
          className="form-input"
          placeholder="Batch number on package"
        />
      </div>

      <div>
        <label className="form-label">Reason / Notes</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          rows={2}
          className="form-input resize-none"
          placeholder="Optional notes..."
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
          className="btn-success flex-1"
        >
          {loading ? 'Recording...' : 'Record Stock In'}
        </button>
      </div>
    </form>
  );
};

export default StockInForm;