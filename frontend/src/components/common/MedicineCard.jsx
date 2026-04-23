import { Pill, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CATEGORY_COLORS = {
  Antibiotics:       { bg: '#FFF3E0', icon: '#F57C00' },
  Painkillers:       { bg: '#FCE4EC', icon: '#C2185B' },
  Vitamins:          { bg: '#E8F5E9', icon: '#2D6A4F' },
  Antidiabetics:     { bg: '#E3F2FD', icon: '#1565C0' },
  Antihypertensives: { bg: '#F3E5F5', icon: '#6A1B9A' },
  Antacids:          { bg: '#E0F7FA', icon: '#00838F' },
  Antihistamines:    { bg: '#FFF8E1', icon: '#F9A825' },
  Syrups:            { bg: '#F1F8E9', icon: '#558B2F' },
};

function getStockLabel(qty, unit) {
  if (qty === null || qty === undefined) return { label: 'In Stock', color: 'text-green-600', dot: 'bg-green-500' };
  if (qty <= 0) return { label: 'Out of Stock', color: 'text-red-500', dot: 'bg-red-500' };

  const u = (unit || 'tablets').toLowerCase();

  if (u === 'ml') {
    return { label: `${qty} ml left`, color: 'text-green-600', dot: 'bg-green-500' };
  }

  if (u === 'capsules') {
    const strips = Math.floor(qty / 10);
    const rem = qty % 10;
    if (strips > 0) {
      return {
        label: rem > 0 ? `${strips} strip${strips > 1 ? 's' : ''} + ${rem}` : `${strips} strip${strips > 1 ? 's' : ''}`,
        color: 'text-green-600',
        dot: 'bg-green-500'
      };
    }
    return { label: `${qty} capsules`, color: 'text-amber-600', dot: 'bg-amber-500' };
  }

  if (u === 'tablets') {
    const strips = Math.floor(qty / 10);
    const rem = qty % 10;
    if (strips > 0) {
      return {
        label: rem > 0 ? `${strips} strip${strips > 1 ? 's' : ''} + ${rem}` : `${strips} strip${strips > 1 ? 's' : ''}`,
        color: 'text-green-600',
        dot: 'bg-green-500'
      };
    }
    return { label: `${qty} tablets`, color: 'text-amber-600', dot: 'bg-amber-500' };
  }

  return { label: `${qty} ${u} left`, color: 'text-green-600', dot: 'bg-green-500' };
}

export default function MedicineCard({ medicine, stock, onAddToCart }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isInCart, getQuantity } = useCart();

  const qty = stock?.currentQuantity ?? null;
  const unit = stock?.unit || medicine?.unit || 'tablets';
  const inStock = qty === null ? true : qty > 0;
  const inCart = isInCart(medicine._id);
  const cartQty = getQuantity(medicine._id);

  const stockInfo = getStockLabel(qty, unit);
  const catStyle = CATEGORY_COLORS[medicine.category] || { bg: '#F5F5F5', icon: '#9E9E9E' };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(medicine, stock);
  };

  return (
    <div
      className="medicine-card flex flex-col cursor-pointer"
      onClick={() => navigate(`/medicines/${medicine._id}`)}
    >
      {/* Image Area */}
      <div
        className="h-44 flex items-center justify-center rounded-t-xl overflow-hidden relative"
        style={{ backgroundColor: catStyle.bg }}
      >
        {medicine.imageUrl ? (
          <img
            src={medicine.imageUrl}
            alt={medicine.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.querySelector('.fallback-icon').style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className="fallback-icon absolute inset-0 flex items-center justify-center"
          style={{ display: medicine.imageUrl ? 'none' : 'flex' }}
        >
          <div className="flex flex-col items-center gap-2">
            <Pill
              size={52}
              style={{ color: catStyle.icon }}
              className="opacity-70"
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider opacity-60"
              style={{ color: catStyle.icon }}
            >
              {medicine.unit || 'tablets'}
            </span>
          </div>
        </div>

        {medicine.requiresPrescription && (
          <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Rx
          </span>
        )}

        <span className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-[10px] font-semibold text-[#1A1A1A] px-2 py-0.5 rounded-full">
          {medicine.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <h3 className="font-bold text-[#1A1A1A] text-sm leading-tight line-clamp-2">
          {medicine.name}
        </h3>
        <p className="text-xs text-[#6B7280]">{medicine.genericName}</p>
        <p className="text-[11px] text-[#9CA3AF]">{medicine.manufacturer}</p>

        <div className="mt-auto pt-3 border-t border-[#F0F0F0]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-[#1A1A1A]">
              ₹{medicine.unitPrice?.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${stockInfo.dot}`} />
              <span className={`text-xs font-medium ${stockInfo.color}`}>
                {stockInfo.label}
              </span>
            </div>
          </div>

          <button
            id={`add-cart-${medicine._id}`}
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95
              ${!inStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : inCart
                  ? 'bg-[#E8F5E9] text-[#2D6A4F] border border-[#2D6A4F]'
                  : 'bg-[#2D6A4F] text-white hover:bg-[#245A42]'
              }`}
          >
            <ShoppingCart size={15} />
            {inCart ? `In Cart (${cartQty})` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
