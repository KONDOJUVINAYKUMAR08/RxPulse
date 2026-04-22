import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import StockTable from '../../components/inventory/StockTable';
import { getAllStocks, updateThreshold } from '../../api/inventoryApi';

const Inventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thresholdModal, setThresholdModal] = useState(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await getAllStocks();
      setStocks(res.data.data || []);
    } catch { toast.error('Failed to load inventory.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStocks(); }, []);

  const handleUpdateThreshold = (stock) => {
    setThresholdModal(stock);
    setThresholdValue(stock.threshold.toString());
  };

  const handleSaveThreshold = async () => {
    setSaving(true);
    try {
      await updateThreshold(thresholdModal._id, Number(thresholdValue));
      toast.success('Threshold updated.');
      setThresholdModal(null);
      fetchStocks();
    } catch { toast.error('Failed to update threshold.'); }
    finally { setSaving(false); }
  };

  const lowCount = stocks.filter((s) => s.isLowStock).length;

  return (
    <div>
      <Navbar title="Inventory" subtitle="Track stock levels across all medicines" />
      <div className="page-container">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{stocks.length} total items</span>
            {lowCount > 0 && (
              <span className="badge badge-red">{lowCount} low stock</span>
            )}
          </div>
        </div>
        <StockTable stocks={stocks} loading={loading} onUpdateThreshold={handleUpdateThreshold} />
      </div>

      {/* Threshold Modal */}
      {thresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Update Threshold</h3>
              <button onClick={() => setThresholdModal(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{thresholdModal.medicineName}</p>
            <div>
              <label className="form-label">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="form-input"
              />
              <p className="text-xs text-slate-400 mt-1">Alert will trigger when stock falls at or below this value.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setThresholdModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveThreshold} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
