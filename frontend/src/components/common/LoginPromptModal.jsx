import { X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPromptModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-[#2D6A4F]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Login Required</h2>
        <p className="text-[#6B7280] mb-7 text-sm leading-relaxed">
          Please login to add items to your cart and continue shopping.
        </p>
        <div className="flex gap-3">
          <button
            id="modal-login-btn"
            onClick={() => { onClose(); navigate('/login'); }}
            className="btn-primary flex-1"
          >
            Login
          </button>
          <button
            id="modal-register-btn"
            onClick={() => { onClose(); navigate('/register'); }}
            className="btn-secondary flex-1"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
