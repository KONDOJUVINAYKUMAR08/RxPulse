import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import StockBarChart from '../../components/charts/StockBarChart';
import CategoryPieChart from '../../components/charts/CategoryPieChart';
import { getMonthlyReport } from '../../api/inventoryApi';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getMonthlyReport(year, month);
      setReport(res.data.data);
    } catch { toast.error('Failed to load report.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [year, month]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <Navbar title="Reports" subtitle="Monthly inventory analysis and insights" />
      <div className="page-container">
        {/* Month selector */}
        <div className="flex items-center gap-3 mb-6">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-input w-32">
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="form-input w-24">
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchReport} className="btn-primary">Generate</button>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading report...</div>
        ) : !report ? null : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard title="Total Stock In" value={report.totalIn} icon={TrendingUp} iconBg="bg-green-100" iconColor="text-green-600" />
              <StatCard title="Total Stock Out" value={report.totalOut} icon={TrendingDown} iconBg="bg-red-100" iconColor="text-red-600" />
              <StatCard title="Net Change" value={report.netChange} icon={Activity} iconBg={report.netChange >= 0 ? 'bg-blue-100' : 'bg-orange-100'} iconColor={report.netChange >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            </div>

            {/* Daily movement chart */}
            <div className="mb-6">
              <StockBarChart data={report.dailyData} title={`Daily Stock Movement — ${months[month-1]} ${year}`} />
            </div>

            {/* Top medicines */}
            <div className="card p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 5 Most Used Medicines</h3>
              {report.topMedicines?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={report.topMedicines} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="total" name="Total Quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
