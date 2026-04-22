import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { getMovements } from '../../api/inventoryApi';

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (typeFilter) params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getMovements(params);
      setMovements(res.data.data || []);
    } catch { toast.error('Failed to load movements.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovements(); }, [typeFilter, startDate, endDate]);

  return (
    <div>
      <Navbar title="Movements" subtitle="Full stock movement history" />
      <div className="page-container">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input w-36">
              <option value="">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" />
          </div>
          {(typeFilter || startDate || endDate) && (
            <button
              onClick={() => { setTypeFilter(''); setStartDate(''); setEndDate(''); }}
              className="btn-secondary text-xs"
            >
              Clear Filters
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-3">{movements.length} movement{movements.length !== 1 ? 's' : ''}</p>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading movements...</div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No movements found for selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Medicine</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Performed By</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Reason</th>
                    <th className="table-header">Supplier / Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mv) => (
                    <tr key={mv._id} className="table-row">
                      <td className="table-cell font-medium text-slate-800">{mv.medicineName}</td>
                      <td className="table-cell">
                        <span className={mv.type === 'STOCK_IN' ? 'badge badge-green' : 'badge badge-red'}>
                          {mv.type === 'STOCK_IN' ? '↑ IN' : '↓ OUT'}
                        </span>
                      </td>
                      <td className="table-cell font-semibold">{mv.quantity}</td>
                      <td className="table-cell">{mv.performedByName || '—'}</td>
                      <td className="table-cell text-slate-500">{new Date(mv.date).toLocaleString()}</td>
                      <td className="table-cell text-slate-500">{mv.reason || '—'}</td>
                      <td className="table-cell text-slate-500">
                        {mv.supplierName && <span>{mv.supplierName}</span>}
                        {mv.batchNumber && <span className="ml-1 text-xs text-slate-400">#{mv.batchNumber}</span>}
                        {!mv.supplierName && !mv.batchNumber && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movements;
