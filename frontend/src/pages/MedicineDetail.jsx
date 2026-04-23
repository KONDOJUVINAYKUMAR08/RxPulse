import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, ShoppingCart, AlertTriangle, Minus, Plus } from 'lucide-react';
import { getMedicineById, getMedicines } from '../api/catalogApi';
import { getStocks } from '../api/inventoryApi';
import MedicineCard from '../components/common/MedicineCard';
import LoginPromptModal from '../components/common/LoginPromptModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MedicineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, isInCart, getQuantity } = useCart();

  const [medicine, setMedicine] = useState(null);
  const [stock, setStock] = useState(null);
  const [related, setRelated] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [medRes, stockRes] = await Promise.all([getMedicineById(id), getStocks()]);
        const med = medRes.data?.data?.medicine || medRes.data?.data;
        const stocks = stockRes.data?.data?.stocks || stockRes.data?.data || [];
        const map = {};
        stocks.forEach((s) => { map[s.medicineName] = s; });
        const foundStock = map[med?.name];
        setMedicine(med);
        setStock(foundStock || null);
        setStockMap(map);
        if (med) {
          const relRes = await getMedicines();
          const all = relRes.data?.data?.medicines || relRes.data?.data || [];
          setRelated(all.filter((m) => m.category === med.category && m._id !== id).slice(0, 4));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setQty(1);
  }, [id]);

  const available = stock?.currentQuantity ?? 999;
  const inStock = available > 0;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    addToCart(medicine, qty, available);
    showToast(`${medicine.name} × ${qty} added to cart!`);
  };

  const handleRelatedCart = (med, s) => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    addToCart(med, 1, s?.currentQuantity || 999);
    showToast(`${med.name} added to cart!`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading..." /></div>;
  if (!medicine) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#6B7280]">Medicine not found.</p></div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="page-container py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="card overflow-hidden">
            <div className="h-72 lg:h-96 bg-[#E8F5E9] flex items-center justify-center">
              {medicine.imageUrl ? (
                <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-full object-contain p-8" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <Pill size={80} className="text-[#2D6A4F] opacity-50" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge-green">{medicine.category}</span>
                {medicine.requiresPrescription && (
                  <span className="badge badge-yellow">
                    <AlertTriangle size={10} className="mr-1" /> Prescription Required
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1A1A] mb-1">{medicine.name}</h1>
              <p className="text-[#6B7280]">{medicine.genericName}</p>
              <p className="text-sm text-[#9CA3AF] mt-1">{medicine.manufacturer}</p>
            </div>

            <div className="text-3xl font-extrabold text-[#1A1A1A]">₹{medicine.unitPrice?.toFixed(2)}
              <span className="text-base font-normal text-[#6B7280] ml-1">/ {medicine.unit}</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 p-3.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
              <div className={`w-2.5 h-2.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                {inStock ? `In Stock (${available === 999 ? 'Available' : available + ' units'})` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            {inStock && (
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-[#E0E0E0] flex items-center justify-center hover:border-[#2D6A4F] transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-semibold text-[#1A1A1A]">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(available, q + 1))} className="w-9 h-9 rounded-lg border border-[#E0E0E0] flex items-center justify-center hover:border-[#2D6A4F] transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            <button id="detail-add-cart" onClick={handleAddToCart} disabled={!inStock}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 active:scale-95 ${!inStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#2D6A4F] text-white hover:bg-[#245A42]'}`}>
              <ShoppingCart size={20} />
              {isInCart(medicine._id) ? `Update Cart (${getQuantity(medicine._id)} in cart)` : 'Add to Cart'}
            </button>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Batch No.', medicine.batchNumber],
                ['Expiry Date', medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'],
                ['Unit', medicine.unit],
                ['Category', medicine.category],
              ].map(([label, value]) => (
                <div key={label} className="p-3 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
                  <p className="text-xs text-[#6B7280]">{label}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 mb-12">
          <h2 className="font-bold text-[#1A1A1A] mb-3">About this Medicine</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">{medicine.description}</p>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title mb-6">Related Medicines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((med) => (
                <MedicineCard key={med._id} medicine={med} stock={stockMap[med.name]} onAddToCart={handleRelatedCart} />
              ))}
            </div>
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
