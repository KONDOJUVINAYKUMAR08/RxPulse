import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { canManageMedicines, canDeleteMedicines } from '../../utils/roleHelpers';
import { useAuth } from '../../context/AuthContext';

const isExpiringSoon = (dateStr) => {
  const expiry = new Date(dateStr);
  const today = new Date();
  const diff = (expiry - today) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

const isExpired = (dateStr) => new Date(dateStr) < new Date();

const MedicineTable = ({ medicines, onEdit, onDelete, loading }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card">
        <div className="p-8 text-center text-slate-400 text-sm">Loading medicines...</div>
      </div>
    );
  }

  if (!medicines || medicines.length === 0) {
    return (
      <div className="card">
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">No medicines found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Generic Name</th>
              <th className="table-header">Category</th>
              <th className="table-header">Manufacturer</th>
              <th className="table-header">Expiry Date</th>
              <th className="table-header">Price</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med) => {
              const expired = isExpired(med.expiryDate);
              const expiring = !expired && isExpiringSoon(med.expiryDate);
              return (
                <tr key={med._id} className="table-row">
                  <td className="table-cell font-medium text-slate-800">{med.name}</td>
                  <td className="table-cell text-slate-500">{med.genericName || '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{med.category}</span>
                  </td>
                  <td className="table-cell">{med.manufacturer}</td>
                  <td className="table-cell">
                    <span className={expired ? 'text-red-600 font-semibold' : expiring ? 'text-yellow-600 font-semibold' : 'text-slate-700'}>
                      {new Date(med.expiryDate).toLocaleDateString()}
                    </span>
                    {expired && <span className="ml-1 badge badge-red">Expired</span>}
                    {expiring && <span className="ml-1 badge badge-yellow">Expiring</span>}
                  </td>
                  <td className="table-cell">₹{med.unitPrice?.toFixed(2)}</td>
                  <td className="table-cell">
                    <span className={med.isActive ? 'badge badge-green' : 'badge badge-slate'}>
                      {med.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/medicines/${med._id}`)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canManageMedicines(role) && (
                        <button
                          onClick={() => onEdit(med)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteMedicines(role) && (
                        <button
                          onClick={() => onDelete(med._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineTable;
