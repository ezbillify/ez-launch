
import React, { useState, useEffect } from 'react';
import {
  Package,
  Users as UsersIcon,
  QrCode,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../supabase';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { label: 'Total Products', value: '0', icon: <Package className="text-blue-600" />, trend: '...', trendUp: true },
    { label: 'Registered Users', value: '0', icon: <UsersIcon className="text-purple-600" />, trend: '...', trendUp: true },
    { label: "Today's Scans", value: '0', icon: <QrCode className="text-emerald-600" />, trend: '...', trendUp: false },
    { label: 'Completion Rate', value: '0%', icon: <TrendingUp className="text-amber-600" />, trend: '...', trendUp: true },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get Total Products
      const { count: productCount } = await supabase
        .from('product_master')
        .select('*', { count: 'exact', head: true });

      // 2. Get Today's Scans
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayScans } = await supabase
        .from('onboarding_logs')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', todayStart.toISOString());

      // 3. Get Registered Users (Distinct emails from logs)
      const { data: userData } = await supabase
        .from('onboarding_logs')
        .select('user_email');

      const uniqueUsersSet = new Set(userData?.map(u => u.user_email).filter(Boolean));
      const uniqueUsers = uniqueUsersSet.size;

      // 4. Calculate Completion Rate
      const { data: logs } = await supabase
        .from('onboarding_logs')
        .select('status');

      const totalLogs = logs?.length || 0;
      const foundLogs = logs?.filter(l => l.status === 'found' || l.status === 'added').length || 0;
      const rate = totalLogs > 0 ? ((foundLogs / totalLogs) * 100).toFixed(1) : '0';

      setStats([
        { label: 'Total Products', value: (productCount || 0).toLocaleString(), icon: <Package className="text-blue-600" />, trend: 'Live', trendUp: true },
        { label: 'Registered Users', value: uniqueUsers.toString(), icon: <UsersIcon className="text-purple-600" />, trend: 'Active', trendUp: true },
        { label: "Today's Scans", value: (todayScans || 0).toString(), icon: <QrCode className="text-emerald-600" />, trend: 'Today', trendUp: true },
        { label: 'Completion Rate', value: `${rate}%`, icon: <TrendingUp className="text-amber-600" />, trend: 'Overall', trendUp: true },
      ]);

      // 5. Fetch Recent Activity
      const { data: recentLogs } = await supabase
        .from('onboarding_logs')
        .select('*')
        .order('scanned_at', { ascending: false })
        .limit(5);

      if (recentLogs) {
        setRecentActivity(recentLogs.map(log => ({
          id: log.id,
          user: log.user_email || 'Anonymous',
          action: log.status === 'found' ? 'Scanned product' : log.status === 'added' ? 'Added new product' : 'Scan failed',
          target: log.barcode,
          time: new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: log.status
        })));
      }

      // 6. Chart Data (Last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7DaysData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];

        const { count } = await supabase
          .from('onboarding_logs')
          .select('*', { count: 'exact', head: true })
          .gte('scanned_at', `${dateStr}T00:00:00`)
          .lte('scanned_at', `${dateStr}T23:59:59`);

        last7DaysData.push({ name: dayName, scans: count || 0 });
      }
      setChartData(last7DaysData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
          <p className="text-slate-500">Welcome back, here's what's happening with EzLaunch.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {stat.trend}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Scan Activity</h2>
              <p className="text-sm text-slate-500">Scan volume over the last 7 days</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="scans" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
          </div>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activity.status === 'found' ? 'bg-emerald-50 text-emerald-600' :
                    activity.status === 'not_found' ? 'bg-rose-50 text-rose-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                    {activity.status === 'found' ? <CheckCircle2 size={18} /> :
                      activity.status === 'not_found' ? <AlertCircle size={18} /> :
                        <Package size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{activity.user}</p>
                    <p className="text-xs text-slate-500">{activity.action}: <span className="font-medium text-slate-700">{activity.target}</span></p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
