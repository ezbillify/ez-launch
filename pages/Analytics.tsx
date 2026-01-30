
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  AlertTriangle,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabase';

const COLORS = ['#2563EB', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

const Analytics: React.FC = () => {
  const [scanTrendData, setScanTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topUnfoundBarcodes, setTopUnfoundBarcodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      const { data: logs } = await supabase.from('onboarding_logs').select('*').gte('scanned_at', startDateStr);
      const { data: products } = await supabase.from('product_master').select('*');

      if (logs) {
        // 1. Scan Trends
        const trendMap: Record<string, any> = {};
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          trendMap[dateStr] = { date: dateStr, found: 0, notFound: 0 };
        }

        logs.forEach(log => {
          const dateStr = log.scanned_at.split('T')[0];
          if (trendMap[dateStr]) {
            if (log.status === 'found' || log.status === 'added') trendMap[dateStr].found += 1;
            else trendMap[dateStr].notFound += 1;
          }
        });
        setScanTrendData(Object.values(trendMap));

        // 2. Category Breakdown
        const productMap: Record<string, string> = {};
        products?.forEach(p => { productMap[p.barcode] = p.category || 'Other'; });

        const catMap: Record<string, number> = {};
        logs.forEach(log => {
          const cat = productMap[log.barcode] || 'Other';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));

        // 3. Top Unfound
        const unfoundMap: Record<string, number> = {};
        logs.filter(l => l.status === 'not_found').forEach(log => {
          unfoundMap[log.barcode] = (unfoundMap[log.barcode] || 0) + 1;
        });
        setTopUnfoundBarcodes(Object.entries(unfoundMap)
          .map(([barcode, count]) => ({ barcode, count, reason: 'Missing in Master' }))
          .sort((a, b) => b.count - a.count).slice(0, 5));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
          <p className="text-slate-500">Insights and performance tracking based on real data</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${days === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <h3 className="text-lg font-bold mb-8">Scan Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scanTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="found" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} barSize={days > 30 ? 10 : 32} />
                <Bar dataKey="notFound" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={days > 30 ? 10 : 32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <h3 className="text-lg font-bold mb-8">Onboarding by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle size={20} /></div>
          <div><h3 className="text-lg font-bold text-slate-800">Top Products Not Found</h3><p className="text-sm text-slate-500">Missing barcodes for the selected period</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {topUnfoundBarcodes.length > 0 ? topUnfoundBarcodes.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5"><code className="bg-slate-100 px-3 py-1 rounded-md text-slate-700 font-mono text-sm">{item.barcode}</code></td>
                  <td className="px-8 py-5 font-bold text-slate-700">{item.count} scans</td>
                  <td className="px-8 py-5 text-sm text-slate-600">{item.reason}</td>
                </tr>
              )) : <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400">No missing barcodes tracked for this period</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
