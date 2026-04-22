import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, Calendar, DollarSign, Tag, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMedicineById } from '../../api/catalogApi';
import { getStockByMedicineId } from '../../api/inventoryApi';

const Detail = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
    {Icon && <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
      <Icon className="w-4 h-4 text-blue-500" />
    </div>}
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const medRes = await getMedicineById(id);
        setMedicine(medRes.data.data);
        try {
          const stockRes = await getStockByMedicineId(id);
          setStock(stockRes.data.data);
        } catch {}
      } catch {
        toast.error('Medicine not found.');
        navigate('/medicines');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!medicine) return null;

  const isExpired = new Date(medicine.expiryDate) < new Date();
  const isExpiring = !isExpired && (new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 30;

  return (
    <div>
      <Navbar title="Medicine Detail" subtitle={medicine.name} />
      <div className="page-container max-w-3xl">
        <button onClick={() => navigate('/medicines')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Medicines
        </button>

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{medicine.name}</h2>
              <p className="text-sm text-slate-500">{medicine.genericName || 'No generic name'}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={medicine.isActive ? 'badge badge-green' : 'badge badge-slate'}>{medicine.isActive ? 'Active' : 'Inactive'}</span>
              {isExpired && <span className="badge badge-red">Expired</span>}
              {isExpiring && <span className="badge badge-yellow">Expiring Soon</span>}
              {medicine.requiresPrescription && <span className="badge badge-purple">Prescription Required</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Detail label="Manufacturer" value={medicine.manufacturer} icon={Building2} />
            <Detail label="Category" value={medicine.category} icon={Tag} />
            <Detail label="Batch Number" value={medicine.batchNumber} icon={Pill} />
            <Detail label="Expiry Date" value={new Date(medicine.expiryDate).toLocaleDateString()} icon={Calendar} />
            <Detail label="Unit Price" value={`₹${medicine.unitPrice?.toFixed(2)}`} icon={DollarSign} />
            <Detail label="Unit" value={medicine.unit} icon={Pill} />
          </div>

          {medicine.description && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700">{medicine.description}</p>
            </div>
          )}
        </div>

        {/* Stock info */}
        {stock ? (
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Current Stock</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Detail label="Quantity" value={`${stock.currentQuantity} ${stock.unit}`} />
              <Detail label="Threshold" value={stock.threshold} />
              <Detail label="Status" value={stock.isLowStock ? '⚠ LOW STOCK' : '✓ OK'} />
              <Detail label="Location" value={stock.location} />
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center text-slate-400 text-sm">No stock record yet. Record a stock-in to start tracking.</div>
        )}
      </div>
    </div>
  );
};

export default MedicineDetail;
