import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const severityConfig = {
  CRITICAL: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'badge-red', iconColor: 'text-red-500' },
  WARNING: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'badge-yellow', iconColor: 'text-yellow-500' },
  INFO: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'badge-blue', iconColor: 'text-blue-500' },
};

const AlertCard = ({ alert, onResolve, canResolve }) => {
  const cfg = severityConfig[alert.severity] || severityConfig.WARNING;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${cfg.badge}`}>{alert.severity}</span>
            <span className="badge-slate badge">{alert.alertType.replace('_', ' ')}</span>
            {alert.isResolved && <span className="badge badge-green">RESOLVED</span>}
          </div>
          <p className={`text-sm font-semibold mt-1 ${cfg.text}`}>{alert.medicineName}</p>
          <p className="text-sm text-slate-600 mt-0.5">{alert.message}</p>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(alert.createdAt).toLocaleString()}
            {alert.isResolved && alert.resolvedBy && ` · Resolved by ${alert.resolvedBy}`}
          </p>
        </div>
        {canResolve && !alert.isResolved && (
          <button
            onClick={() => onResolve(alert._id)}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Resolve
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
