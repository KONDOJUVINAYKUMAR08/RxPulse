import React from 'react';

const StatCard = ({ title, value, icon: Icon, iconBg = 'bg-blue-100', iconColor = 'text-blue-600', trend, trendLabel }) => {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
          {trendLabel && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
