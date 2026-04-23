import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMedicines, getCategories, createMedicine, updateMedicine, deleteMedicine } from '../../api/catalogApi';

const EMPTY = { name: '', genericName: '', manufacturer: '', category: '', batchNumber: '', expiryDate: '', unitPrice: '', unit: 'tablets', requiresPrescription: false, description: '', imageUrl: '' };

export default function ManageMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    try {
      const [medRes, catRes] = await Promise.all([getMedicines(), getCategories()]);
      setMedicines(medRes.data?.data?.medicines || medRes.data?.data || []);
      setCategories(catRes.data?.data?.categories || catRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = medicines.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || m.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('add'); };
  const openEdit = (med) => {
    setForm({ ...med, expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '', unitPrice: med.unitPrice?.toString() });
    setEditId(med._id);
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, unitPrice: parseFloat(form.unitPrice) };
      if (modal === 'edit') { await updateMedicine(editId, payload); showToast('Medicine updated.'); }
      else { await createMedicine(payload); showToast('Medicine created.'); }
      closeModal();
      fetchData();
    } catch (err) { showToast(err.response?.data?.message || 'Error saving medicine.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteMedicine(id); showToast('Medicine deleted.'); fetchData(); }
    catch { showToast('Error deleting.', 'error'); }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto ml-60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Manage Medicines</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{medicines.length} total medicines</p>
          </div>
          <button id="add-medicine-btn" onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Medicine
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines..."
              className="input-field pl-9 py-2 text-sm" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" text="Loading medicines..." /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Manufacturer</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Rx</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((med) => (
                  <tr key={med._id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="table-td">
                      <p className="font-semibold text-sm">{med.name}</p>
                      <p className="text-xs text-[#6B7280]">{med.genericName}</p>
                    </td>
                    <td className="table-td"><span className="badge-green text-[10px]">{med.category}</span></td>
                    <td className="table-td text-sm text-[#6B7280]">{med.manufacturer}</td>
                    <td className="table-td font-semibold">₹{med.unitPrice?.toFixed(2)}</td>
                    <td className="table-td">
                      <span className={`badge text-[10px] ${med.requiresPrescription ? 'badge-yellow' : 'badge-gray'}`}>
                        {med.requiresPrescription ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button id={`edit-med-${med._id}`} onClick={() => openEdit(med)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#2D6A4F] hover:bg-[#E8F5E9] transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button id={`del-med-${med._id}`} onClick={() => handleDelete(med._id, med.name)} className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-box max-w-2xl p-6 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#1A1A1A]">{modal === 'edit' ? 'Edit Medicine' : 'Add Medicine'}</h2>
                <button onClick={closeModal} className="text-[#6B7280] hover:text-[#1A1A1A]"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Generic Name</label>
                  <input value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Manufacturer</label>
                  <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field text-sm" required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Price (₹) *</label>
                  <input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="input-field text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field text-sm">
                    {['tablets', 'capsules', 'ml', 'gm', 'strips'].map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Batch Number</label>
                  <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="input-field text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#6B7280] mb-1 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field text-sm" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="rx-check" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} />
                  <label htmlFor="rx-check" className="text-sm text-[#1A1A1A]">Requires Prescription</label>
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Medicine'}</button>
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
