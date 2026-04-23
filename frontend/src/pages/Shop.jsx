import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { getMedicines, getCategories } from '../api/catalogApi';
import { getStocks } from '../api/inventoryApi';
import MedicineCard from '../components/common/MedicineCard';
import SearchBar from '../components/common/SearchBar';
import LoginPromptModal from '../components/common/LoginPromptModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const PAGE_SIZE = 12;

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [medRes, catRes, stockRes] = await Promise.all([getMedicines(), getCategories(), getStocks()]);
        const meds = medRes.data?.data?.medicines || medRes.data?.data || [];
        const cats = catRes.data?.data?.categories || catRes.data?.data || [];
        const stocks = stockRes.data?.data?.stocks || stockRes.data?.data || [];
        const map = {};
        stocks.forEach((s) => { map[s.medicineName] = s; });
        setMedicines(meds);
        setCategories(cats);
        setStockMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = [...medicines];
    if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.genericName?.toLowerCase().includes(search.toLowerCase()));
    if (selectedCat) list = list.filter((m) => m.category === selectedCat);
    if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'price-asc') list.sort((a, b) => a.unitPrice - b.unitPrice);
    else if (sort === 'price-desc') list.sort((a, b) => b.unitPrice - a.unitPrice);
    return list;
  }, [medicines, search, selectedCat, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (medicine, stock) => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    addToCart(medicine, 1, stock?.currentQuantity || 999);
    showToast(`${medicine.name} added to cart!`);
  };

  const handleCategoryClick = (cat) => {
    setSelectedCat(cat === selectedCat ? '' : cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#F0F0F0] py-6">
        <div className="page-container">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Browse Medicines</h1>
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            onClear={() => { setSearch(''); setPage(1); }}
            placeholder="Search medicines, health products..."
          />
        </div>
      </div>

      <div className="page-container py-6">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            <button
              onClick={() => handleCategoryClick('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCat === '' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E0E0E0] text-[#6B7280] hover:border-[#2D6A4F]'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                id={`filter-${c.name}`}
                onClick={() => handleCategoryClick(c.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCat === c.name ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-[#E0E0E0] text-[#6B7280] hover:border-[#2D6A4F]'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <SlidersHorizontal size={16} className="text-[#6B7280]" />
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm w-auto pr-8"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-[#6B7280] mb-5">{filtered.length} medicine{filtered.length !== 1 ? 's' : ''} found</p>

        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" text="Loading medicines..." /></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#6B7280] text-lg mb-2">No medicines found</p>
            <p className="text-sm text-[#9CA3AF]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((med) => (
              <MedicineCard key={med._id} medicine={med} stock={stockMap[med.name]} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-[#E0E0E0] text-sm font-medium disabled:opacity-40 hover:border-[#2D6A4F] transition-colors">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#2D6A4F] text-white' : 'border border-[#E0E0E0] hover:border-[#2D6A4F]'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-[#E0E0E0] text-sm font-medium disabled:opacity-40 hover:border-[#2D6A4F] transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
