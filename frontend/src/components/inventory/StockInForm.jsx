import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PackagePlus } from 'lucide-react';
import { getAllMedicines } from '../../api/catalogApi';
import { getAllStocks, stockIn } from '../../api/inventoryApi';

const StockInForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medicineId: searchParams.get('medicineId') || '',
    medicineName: decodeURIComponent(searchParams.get('medicineName') || ''),
    quantity: '',
    supplierName: '',
    batchNumber: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    getAllMedicines({ isActive: true })
      .then((res) => setMedicines(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleMedicineChange = (e) => {
    const med = medicines.find((m) => m._id === e.target.value);
    if (med) {
      setForm((prev) => ({ ...prev, medicineId: med._id, medicineName: med.name, category: med.category, unit: med.unit }));
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicineId || !form.quantity || Number(form.quantity) <= 0) {
      toast.error('Please select a medicine and enter a valid quantity.');
      return;
    }
    setLoading(true);
    try {
      await stockIn({ ...form, quantity: Number(form.quantity) });
      toast.success('Stock in recorded successfully!');
      navigate('/inventory');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record stock in.');
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
        <h2 className="text-lg font-bold text-slate-800">Record Stock In</h2>
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
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Quantity *</label>
        <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleChange} required className="form-input" placeholder="Enter quantity" />
      </div>

      <div>
        <label className="form-label">Supplier Name</label>
        <input name="supplierName" value={form.supplierName} onChange={handleChange} className="form-input" placeholder="Supplier / Vendor name" />
      </div>

      <div>
        <label className="form-label">Batch Number</label>
        <input name="batchNumber" value={form.batchNumber} onChange={handleChange} className="form-input" placeholder="Batch number on package" />
      </div>

      <div>
        <label className="form-label">Reason / Notes</label>
        <textarea name="reason" value={form.reason} onChange={handleChange} rows={2} className="form-input resize-none" placeholder="Optional notes..." />
      </div>

      <div>
        <label className="form-label">Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} className="form-input" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => navigate('/inventory')} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-success flex-1">
          {loading ? 'Recording...' : 'Record Stock In'}
        </button>
      </div>
    </form>
  );
};

export default StockInForm;
