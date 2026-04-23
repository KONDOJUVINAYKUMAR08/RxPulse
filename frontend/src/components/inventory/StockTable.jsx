import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, PackageMinus, Settings } from 'lucide-react';
import { canManageMedicines } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ isLowStock }) => (
  <span className={isLowStock ? 'badge badge-red' : 'badge badge-green'}>
    {isLowStock ? 'LOW STOCK' : 'OK'}
  </span>
);

const StockTable = ({ stocks, loading, onUpdateThreshold }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card p-8 text-center text-slate-400 text-sm">Loading inventory...</div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400 text-sm">No stock records found.</p>
        <p className="text-xs text-slate-300 mt-1">Record a stock-in transaction to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Medicine</th>
              <th className="table-header">Category</th>
              <th className="table-header">Current Stock</th>
              <th className="table-header">Threshold</th>
              <th className="table-header">Status</th>
              <th className="table-header">Location</th>
              <th className="table-header">Last Updated</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock._id} className={`table-row ${stock.isLowStock ? 'bg-red-50/50' : ''}`}>
                <td className="table-cell font-medium text-slate-800">{stock.medicineName}</td>
                <td className="table-cell">
                  {stock.category ? <span className="badge badge-blue">{stock.category}</span> : '—'}
                </td>
                <td className="table-cell">
                  <span className={`font-semibold ${stock.isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                    {stock.currentQuantity}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">{stock.unit}</span>
                </td>
                <td className="table-cell">{stock.threshold}</td>
                <td className="table-cell"><StatusBadge isLowStock={stock.isLowStock} /></td>
                <td className="table-cell text-slate-500">{stock.location}</td>
                <td className="table-cell text-slate-500">
                  {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleDateString() : '—'}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/stock-in?medicineId=${stock._id}&medicineName=${encodeURIComponent(stock.medicineName)}`)}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                      title="Stock In"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/stock-out?medicineId=${stock._id}&medicineName=${encodeURIComponent(stock.medicineName)}`)}
                      className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                      title="Stock Out"
                    >
                      <PackageMinus className="w-4 h-4" />
                    </button>
                    {canManageMedicines(role) && (
                      <button
                        onClick={() => onUpdateThreshold(stock)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Set Threshold"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTable;
