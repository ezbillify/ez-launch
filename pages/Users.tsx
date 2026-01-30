
import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  MoreVertical,
  ExternalLink,
  Shield,
  Clock,
  QrCode
} from 'lucide-react';
import { supabase } from '../supabase';

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStaff: 0,
    avgScans: 0,
    progress: 0,
    totalScans: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: logs, error } = await supabase.from('onboarding_logs').select('*');
      if (error) throw error;

      if (logs) {
        const userMap: Record<string, any> = {};
        logs.forEach(log => {
          const email = log.user_email || 'Anonymous';
          if (!userMap[email]) {
            userMap[email] = {
              id: email,
              email: email,
              full_name: email.split('@')[0],
              total_scans: 0,
              last_login: log.scanned_at
            };
          }
          userMap[email].total_scans += 1;
          if (new Date(log.scanned_at) > new Date(userMap[email].last_login)) {
            userMap[email].last_login = log.scanned_at;
          }
        });

        const userList = Object.values(userMap).sort((a, b) => b.total_scans - a.total_scans);
        setUsers(userList);

        const activeCount = userList.length;
        const total = logs.length;
        setStats({
          activeStaff: activeCount,
          avgScans: activeCount > 0 ? Math.round(total / activeCount) : 0,
          progress: Math.min(Math.round((total / 1000) * 100), 100),
          totalScans: total
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mobile App Users</h1>
          <p className="text-slate-500">Manage field staff and track their onboarding performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {users.length > 0 ? users.map((user) => (
                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white ring-2 ring-blue-50">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-slate-800">
                      <h3 className="font-bold group-hover:text-blue-600 transition-colors">{user.full_name}</h3>
                      {user.total_scans > 10 && <Shield size={14} className="text-blue-500" fill="currentColor" />}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="hidden lg:block text-right px-4">
                    <div className="flex items-center gap-1.5 justify-end text-sm font-bold text-slate-700">
                      <QrCode size={14} className="text-slate-400" /> {user.total_scans.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Scans Completed</p>
                  </div>
                  <div className="text-right px-4 min-w-[100px]">
                    <p className="text-sm font-medium text-slate-600">{new Date(user.last_login).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Last Activity</p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">No users found</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
            <h3 className="text-lg font-bold mb-4">Onboarding Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-blue-100">
                <span className="text-sm">Active Staff</span>
                <span className="text-xl font-bold text-white">{stats.activeStaff}</span>
              </div>
              <div className="flex items-center justify-between text-blue-100">
                <span className="text-sm">Avg Scans/User</span>
                <span className="text-xl font-bold text-white">{stats.avgScans}</span>
              </div>
              <div className="pt-4 border-t border-blue-400/30">
                <p className="text-xs text-blue-100 mb-2">Team Target Progress ({stats.totalScans}/1000)</p>
                <div className="w-full bg-blue-900/40 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <span>Current: {stats.progress}%</span>
                  <span>Goal: 1000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Top Performers</h3>
            <div className="space-y-4">
              {users.slice(0, 3).map((user, i) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-600'
                    }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.total_scans} scans</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
