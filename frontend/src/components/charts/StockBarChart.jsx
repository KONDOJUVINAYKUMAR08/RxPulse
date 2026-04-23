import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function StockBarChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = MONTHS.map((month, i) => {
    const found = safeData.find(
      (d) =>
        d?._id?.month === i + 1 ||
        d?.month === i + 1
    );
    return {
      month,
      stockIn: found?.totalIn || found?.stockIn || 0,
      stockOut: found?.totalOut || found?.stockOut || 0,
    };
  });

  const hasData = chartData.some(
    (d) => d.stockIn > 0 || d.stockOut > 0
  );

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-[#1A1A1A] mb-5 text-sm">
        Monthly Stock Movement
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-[#6B7280]">
            No movement data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                border: '1px solid #F0F0F0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              cursor={{ fill: '#F5F5F5' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar
              dataKey="stockIn"
              name="Stock In"
              fill="#2D6A4F"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="stockOut"
              name="Stock Out"
              fill="#95D5B2"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
