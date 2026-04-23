import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StockBarChart({ data = [] }) {
  const chartData = MONTHS.map((month, i) => {
    const found = data.find((d) => d._id?.month === i + 1);
    return { month, stockIn: found?.totalIn || 0, stockOut: found?.totalOut || 0 };
  });

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-[#1A1A1A] mb-5 text-sm">Monthly Stock Movement</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ border: '1px solid #F0F0F0', borderRadius: '8px', fontSize: '12px' }}
            cursor={{ fill: '#F5F5F5' }}
          />
          <Bar dataKey="stockIn" name="Stock In" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="stockOut" name="Stock Out" fill="#E8F5E9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
