import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/shop';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] items-center justify-center p-12">
        <div className="text-center text-white max-w-sm">
          <div className="w-20 h-20 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Pill size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">RxPulse</h1>
          <p className="text-gray-400 leading-relaxed">Your trusted pharmacy platform. Authentic medicines, fast delivery, expert care.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['200+', 'Medicines'], ['3', 'Services'], ['24/7', 'Support']].map(([v, l]) => (
              <div key={l} className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-[#2D6A4F]">{v}</div>
                <div className="text-xs text-gray-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
              <Pill size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">RxPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Welcome back</h2>
          <p className="text-[#6B7280] mb-8 text-sm">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-lg mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email address</label>
              <input id="login-email" name="email" type="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="input-field pr-11" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2D6A4F] font-semibold hover:underline">Create account</Link>
          </p>

          <div className="mt-6 p-4 bg-[#F9FAFB] rounded-xl text-xs text-[#6B7280]">
            <p className="font-semibold text-[#1A1A1A] mb-1.5">Demo Credentials</p>
            <p>Admin: <span className="font-mono">admin@rxpulse.com</span> / <span className="font-mono">Admin@123</span></p>
            <p className="mt-1">Customer: <span className="font-mono">ravi@example.com</span> / <span className="font-mono">User@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
