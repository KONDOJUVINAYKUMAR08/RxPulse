import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Search, Shield, Truck, Clock } from 'lucide-react';
import { getMedicines, getCategories } from '../api/catalogApi';
import { getStocks } from '../api/inventoryApi';
import MedicineCard from '../components/common/MedicineCard';
import LoginPromptModal from '../components/common/LoginPromptModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORY_ICONS = {
  Antibiotics: '🛡️', Painkillers: '💊', Vitamins: '☀️', Antidiabetics: '📊',
  Antihypertensives: '❤️', Antacids: '💧', Antihistamines: '🌬️', Syrups: '🧴',
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, catRes, stockRes] = await Promise.all([getMedicines(), getCategories(), getStocks()]);
        const meds = medRes.data?.data?.medicines || medRes.data?.data || [];
        const cats = catRes.data?.data?.categories || catRes.data?.data || [];
        const stocks = stockRes.data?.data?.stocks || stockRes.data?.data || [];
        const map = {};
        stocks.forEach((s) => { map[s.medicineName] = s; });
        setMedicines(meds.slice(0, 8));
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

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (medicine, stock) => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    addToCart(medicine, 1, stock?.currentQuantity || 999);
    showToast(`${medicine.name} added to cart!`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A1A1A] text-white py-20">
        <div className="page-container flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block badge bg-[#2D6A4F]/20 text-[#74C69D] mb-4">🏥 Trusted Pharmacy Platform</span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              Your Health,<br /><span className="text-[#2D6A4F]">Our Priority</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Browse 200+ authentic medicines from verified manufacturers. No prescription needed to explore — order with confidence.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link to="/shop" id="hero-shop-btn" className="btn-primary flex items-center gap-2 text-base px-7 py-3.5">
                <ShoppingBag size={18} /> Shop Now
              </Link>
              <Link to="/shop" id="hero-browse-btn" className="flex items-center gap-2 text-base px-7 py-3.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all duration-200">
                Browse Categories <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 max-w-xs lg:max-w-sm">
            {[
              { icon: Shield, label: 'Verified Medicines', sub: '100% authentic' },
              { icon: Truck, label: 'Fast Delivery', sub: 'Pan India shipping' },
              { icon: Search, label: 'Easy Search', sub: 'Find in seconds' },
              { icon: Clock, label: '24/7 Support', sub: 'Always available' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
                <Icon size={24} className="text-[#2D6A4F] mx-auto mb-2" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 border-b border-[#F0F0F0]">
        <div className="page-container">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.name}`}
                id={`cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#F0F0F0] rounded-full text-sm font-medium text-[#1A1A1A] hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-[#E8F5E9] transition-all duration-200"
              >
                <span>{CATEGORY_ICONS[cat.name] || '💊'}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Medicines */}
      <section className="py-14">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Popular Medicines</h2>
              <p className="text-sm text-[#6B7280] mt-1">Most searched and ordered products</p>
            </div>
            <Link to="/shop" className="flex items-center gap-1.5 text-sm font-semibold text-[#2D6A4F] hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading medicines..." /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {medicines.map((med) => (
                <MedicineCard key={med._id} medicine={med} stock={stockMap[med.name]} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 bg-[#FAFAFA]">
        <div className="page-container">
          <h2 className="section-title text-center mb-3">How It Works</h2>
          <p className="text-center text-[#6B7280] text-sm mb-12">Order medicines in 3 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Search, title: 'Browse Medicines', desc: 'Search from 200+ authentic medicines across 8 categories. No login needed to browse.' },
              { step: '02', icon: ShoppingBag, title: 'Add to Cart', desc: 'Select the medicines you need, set quantity and add to cart. Login required to add items.' },
              { step: '03', icon: Truck, title: 'Place Order', desc: 'Review your cart, confirm your order and get medicines delivered to your doorstep.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="w-16 h-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center">
                    <Icon size={28} className="text-[#2D6A4F]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#1A1A1A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14">
        <div className="page-container">
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-gray-400 mb-6">Create a free account and start ordering medicines today.</p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
