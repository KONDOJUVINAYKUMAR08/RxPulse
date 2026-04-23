import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      navigate('/shop', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-400' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-amber-400' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: 'bg-green-500' };
    return { label: 'Medium', color: 'bg-yellow-400' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] items-center justify-center p-12">
        <div className="text-center text-white max-w-sm">
          <div className="w-20 h-20 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Pill size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Join RxPulse</h1>
          <p className="text-gray-400 leading-relaxed">Create your account to order medicines, track health and get personalised care.</p>
          <div className="mt-8 space-y-3 text-left">
            {['Browse 200+ authentic medicines', 'Easy cart and checkout', 'Admin tools for pharmacy staff'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle size={16} className="text-[#2D6A4F] flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
              <Pill size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">RxPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Create account</h2>
          <p className="text-[#6B7280] mb-8 text-sm">Fill in your details to get started</p>

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-lg mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange}
                className="input-field" placeholder="Ravi Kumar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email address <span className="text-red-500">*</span></label>
              <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Phone (optional)</label>
              <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input id="reg-password" name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="input-field pr-11" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.label === 'Too short' ? 'w-1/4' : strength.label === 'Weak' ? 'w-2/4' : strength.label === 'Medium' ? 'w-3/4' : 'w-full'}`} />
                  </div>
                  <span className="text-xs text-[#6B7280]">{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
              <input id="reg-confirm" name="confirm" type="password" value={form.confirm} onChange={handleChange}
                className="input-field" placeholder="Re-enter password" />
            </div>
            <button id="register-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2D6A4F] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
