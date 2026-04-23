import { Pill, ShoppingCart, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function MedicineCard({ medicine, stock, onAddToCart }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isInCart, getQuantity } = useCart();

  const qty = stock?.currentQuantity ?? null;
  const inStock = qty === null ? true : qty > 0;
  const inCart = isInCart(medicine._id);
  const cartQty = getQuantity(medicine._id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(medicine, stock);
  };

  return (
    <div
      className="medicine-card flex flex-col"
      onClick={() => navigate(`/medicines/${medicine._id}`)}
    >
      {/* Image Area */}
      <div className="h-40 bg-[#E8F5E9] flex items-center justify-center rounded-t-xl overflow-hidden relative">
        {medicine.imageUrl ? (
          <img
            src={medicine.imageUrl}
            alt={medicine.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${medicine.imageUrl ? 'hidden' : 'flex'}`}>
          <Pill size={48} className="text-[#2D6A4F] opacity-60" />
        </div>
        {medicine.requiresPrescription && (
          <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Rx
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <span className="badge-green text-[10px] self-start">{medicine.category}</span>
        <h3 className="font-bold text-[#1A1A1A] text-sm leading-tight line-clamp-2">{medicine.name}</h3>
        <p className="text-xs text-[#6B7280]">{medicine.genericName}</p>
        <p className="text-xs text-[#9CA3AF]">{medicine.manufacturer}</p>

        <div className="mt-auto pt-3 border-t border-[#F0F0F0]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-[#1A1A1A]">₹{medicine.unitPrice?.toFixed(2)}</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                {qty === null ? 'In Stock' : inStock ? `${qty} left` : 'Out of Stock'}
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
