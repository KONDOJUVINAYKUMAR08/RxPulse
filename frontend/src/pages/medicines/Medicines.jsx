import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import MedicineTable from '../../components/medicines/MedicineTable';
import MedicineForm from '../../components/medicines/MedicineForm';
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine, getAllCategories } from '../../api/catalogApi';
import { canManageMedicines } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';

const Medicines = () => {
  const { role } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medRes, catRes] = await Promise.all([getAllMedicines(), getAllCategories()]);
      setMedicines(medRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch { toast.error('Failed to load medicines.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = medicines.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.genericName?.toLowerCase().includes(search.toLowerCase()) || m.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleEdit = (med) => { setEditMedicine(med); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try { await deleteMedicine(id); toast.success('Medicine deleted.'); fetchData(); }
    catch { toast.error('Failed to delete medicine.'); }
  };

  const handleSubmit = async (form) => {
    setFormLoading(true);
    try {
      if (editMedicine) { await updateMedicine(editMedicine._id, form); toast.success('Medicine updated.'); }
      else { await createMedicine(form); toast.success('Medicine added.'); }
      setShowForm(false); setEditMedicine(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed.'); }
    finally { setFormLoading(false); }
  };

  return (
    <div>
      <Navbar title="Medicines" subtitle="Manage your medicine catalog" />
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9"
                placeholder="Search medicines..."
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input w-40">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {canManageMedicines(role) && (
            <button onClick={() => { setEditMedicine(null); setShowForm(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-3">{filtered.length} medicine{filtered.length !== 1 ? 's' : ''} found</p>
        <MedicineTable medicines={filtered} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {showForm && (
        <MedicineForm
          medicine={editMedicine}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditMedicine(null); }}
          loading={formLoading}
        />
      )}
    </div>
  );
};

export default Medicines;
