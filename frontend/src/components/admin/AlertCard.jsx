import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function AlertCard({ alert, onResolve }) {
  const isCritical = alert.severity === 'CRITICAL';
  const isExpiry = alert.alertType === 'EXPIRY';

  return (
    <div className={`card p-4 flex items-start gap-3 ${isCritical ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className={`mt-0.5 flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
        {isExpiry ? <Clock size={18} /> : <AlertTriangle size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge text-[10px] ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {alert.severity}
          </span>
          <span className="badge bg-gray-100 text-gray-600 text-[10px]">{alert.alertType}</span>
        </div>
        <p className="text-sm font-semibold text-[#1A1A1A]">{alert.medicineName}</p>
        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
      {!alert.isResolved && onResolve && (
        <button
          id={`resolve-alert-${alert._id}`}
          onClick={() => onResolve(alert._id)}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] hover:text-[#245A42] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#E8F5E9]"
        >
          <CheckCircle size={14} /> Resolve
        </button>
      )}
    </div>
  );
}
