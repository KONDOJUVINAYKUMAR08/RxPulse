import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, totalItems, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const [ordered, setOrdered] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePlaceOrder = () => {
    clearCart();
    setOrdered(true);
    showToast('Order placed successfully! You will receive confirmation shortly.', 'success');
  };

  if (ordered) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-5">
            <Package size={36} className="text-[#2D6A4F]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Order Placed!</h1>
          <p className="text-[#6B7280] text-sm mb-7">Thank you for your order. Your medicines will be delivered soon.</p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            <ShoppingCart size={16} /> Continue Shopping
          </Link>
        </div>
        {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.msg}</div></div>}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingCart size={36} className="text-[#9CA3AF]" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Your cart is empty</h1>
          <p className="text-[#6B7280] text-sm mb-7">Add medicines to your cart and they'll appear here.</p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="page-container py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">
          Shopping Cart <span className="text-[#6B7280] font-normal text-base">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.medicineId} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-[#E8F5E9] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={22} className="text-[#2D6A4F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{item.medicineName}</h3>
                  <p className="text-xs text-[#6B7280]">{item.genericName}</p>
                  <p className="text-sm font-bold text-[#1A1A1A] mt-1">₹{item.price?.toFixed(2)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg border border-[#E0E0E0] flex items-center justify-center hover:border-[#2D6A4F] transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                    disabled={item.quantity >= item.availableStock}
                    className="w-7 h-7 rounded-lg border border-[#E0E0E0] flex items-center justify-center hover:border-[#2D6A4F] transition-colors disabled:opacity-40">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <p className="font-bold text-[#1A1A1A]">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button id={`remove-${item.medicineId}`} onClick={() => removeFromCart(item.medicineId)}
                  className="text-[#9CA3AF] hover:text-red-500 transition-colors ml-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-[#1A1A1A] mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Items ({totalItems})</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Delivery</span>
                  <span className="text-[#2D6A4F] font-semibold">FREE</span>
                </div>
                <div className="border-t border-[#F0F0F0] pt-3 flex justify-between font-bold text-[#1A1A1A] text-base">
                  <span>Grand Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <button id="place-order-btn" onClick={handlePlaceOrder} className="btn-primary w-full mt-5 py-3.5 text-base">
                Place Order
              </button>
              <p className="text-center text-xs text-[#9CA3AF] mt-3">Secure checkout · Free delivery</p>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.msg}</div></div>}
    </div>
  );
}
