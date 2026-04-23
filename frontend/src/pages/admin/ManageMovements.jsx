import { useEffect, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMovements } from '../../api/inventoryApi';

export default function ManageMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchMovements = async () => {
    try {
      const res = await getMovements();
      const data = res.data?.data;
      const movs = Array.isArray(data)
        ? data
        : Array.isArray(data?.movements)
        ? data.movements
        : [];
      setMovements(movs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filtered =
    filter === 'ALL'
      ? movements
      : movements.filter((m) => m.type === filter);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto ml-60">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            Stock Movements
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Complete history of all stock movements
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'STOCK_IN', 'STOCK_OUT'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#E0E0E0] text-[#6B7280] hover:border-[#2D6A4F]'
              }`}
            >
              {f === 'ALL'
                ? `All (${movements.length})`
                : f === 'STOCK_IN'
                ? `Stock In (${movements.filter((m) => m.type === 'STOCK_IN').length})`
                : `Stock Out (${movements.filter((m) => m.type === 'STOCK_OUT').length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" text="Loading movements..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <ArrowUpDown size={40} className="text-[#E0E0E0] mx-auto mb-3" />
            <p className="text-[#6B7280]">No movements found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Medicine</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Quantity</th>
                  <th className="table-th">Reason</th>
                  <th className="table-th">Supplier</th>
                  <th className="table-th">By</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m._id}
                    className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]"
                  >
                    <td className="table-td font-semibold text-sm">
                      {m.medicineName}
                    </td>
                    <td className="table-td">
                      <span
                        className={`badge text-[10px] ${
                          m.type === 'STOCK_IN'
                            ? 'badge-green'
                            : 'badge-red'
                        }`}
                      >
                        {m.type === 'STOCK_IN' ? '↑ IN' : '↓ OUT'}
                      </span>
                    </td>
                    <td className="table-td font-bold text-[#1A1A1A]">
                      {m.type === 'STOCK_IN' ? '+' : '-'}
                      {m.quantity}
                    </td>
                    <td className="table-td text-sm text-[#6B7280]">
                      {m.reason || '—'}
                    </td>
                    <td className="table-td text-sm text-[#6B7280]">
                      {m.supplierName || '—'}
                    </td>
                    <td className="table-td text-sm text-[#6B7280]">
                      {m.performedByName || 'Admin'}
                    </td>
                    <td className="table-td text-xs text-[#9CA3AF]">
                      {new Date(m.date || m.createdAt).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
