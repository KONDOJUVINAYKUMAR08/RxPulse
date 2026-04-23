export default function StatCard({ title, value, icon: Icon, color = 'green', subtitle = '' }) {
  const colors = {
    green: 'bg-[#E8F5E9] text-[#2D6A4F]',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-[#6B7280] font-medium">{title}</p>
        <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
        {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
