import { Link } from 'react-router-dom';
import { Pill, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
                <Pill size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">RxPulse</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted online pharmacy. Authentic medicines delivered with care and precision.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['Home', '/'], ['Shop Medicines', '/shop'], ['Login', '/login'], ['Register', '/register']].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail size={14} className="text-[#2D6A4F]" /> support@rxpulse.com
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Phone size={14} className="text-[#2D6A4F]" /> +91 99999 00000
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <MapPin size={14} className="text-[#2D6A4F]" /> Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} RxPulse Pharmacy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
