import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const defaultForm = {
  name: '', genericName: '', manufacturer: '', category: '',
  batchNumber: '', expiryDate: '', unitPrice: '', unit: 'tablets',
  requiresPrescription: false, description: '', isActive: true,
};

const MedicineForm = ({ medicine, categories, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (medicine) {
      setForm({
        ...medicine,
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [medicine]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {medicine ? 'Edit Medicine' : 'Add Medicine'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Medicine Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="form-input" placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Generic Name</label>
            <input name="genericName" value={form.genericName} onChange={handleChange} className="form-input" placeholder="e.g. Acetaminophen" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Manufacturer *</label>
            <input name="manufacturer" value={form.manufacturer} onChange={handleChange} required className="form-input" placeholder="Manufacturer name" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Category *</label>
            <select name="category" value={form.category} onChange={handleChange} required className="form-input">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Batch Number *</label>
            <input name="batchNumber" value={form.batchNumber} onChange={handleChange} required className="form-input" placeholder="Batch no." />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Expiry Date *</label>
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required className="form-input" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Unit Price (₹) *</label>
            <input name="unitPrice" type="number" step="0.01" min="0" value={form.unitPrice} onChange={handleChange} required className="form-input" placeholder="0.00" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Unit</label>
            <select name="unit" value={form.unit} onChange={handleChange} className="form-input">
              {['tablets', 'capsules', 'ml', 'mg', 'strips'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="form-input resize-none" placeholder="Optional description..." />
          </div>
          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="requiresPrescription" checked={form.requiresPrescription} onChange={handleChange} className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-sm text-slate-700">Requires Prescription</span>
            </label>
            {medicine && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 rounded accent-blue-500" />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            )}
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;
