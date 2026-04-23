import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2D6A4F', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC', '#1B4332', '#40916C'];

export default function CategoryPieChart({ stocks = [] }) {
  const categoryMap = {};
  stocks.forEach((s) => {
    const cat = s.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + s.currentQuantity;
  });
  const data = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="card p-5 flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">No data available</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-[#1A1A1A] mb-5 text-sm">Stock by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value + ' units', name]}
            contentStyle={{ border: '1px solid #F0F0F0', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
