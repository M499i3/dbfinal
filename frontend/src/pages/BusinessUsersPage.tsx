import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, AlertTriangle, Search, Filter, Ban, CheckCircle } from 'lucide-react';

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  kycLevel: number;
  createdAt: string;
  roles: string[];
  isBlacklisted: boolean;
  riskEventCount: number;
}

export default function BusinessUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [blacklistFilter, setBlacklistFilter] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, [blacklistFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (blacklistFilter) {
        params.append('blacklisted', blacklistFilter);
      }
      const url = `/api/business/users${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (level: number) => {
    const badges = {
      0: { label: '未驗證', color: 'bg-gray-500/20 text-gray-400' },
      1: { label: '基礎驗證', color: 'bg-blue-500/20 text-blue-400' },
      2: { label: '完整驗證', color: 'bg-green-500/20 text-green-400' },
    };
    const badge = badges[level as keyof typeof badges] || badges[0];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const handleAddToBlacklist = async (userId: number, userName: string) => {
    const reason = prompt(`請輸入將 ${userName} 加入黑名單的原因：`);
    if (!reason || reason.trim() === '') {
      return;
    }

    try {
      const response = await fetch(`/api/business/users/${userId}/blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('使用者已加入黑名單');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || '加入黑名單失敗');
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      alert('加入黑名單失敗');
    }
  };

  const handleRemoveFromBlacklist = async (userId: number, userName: string) => {
    if (!confirm(`確定要將 ${userName} 從黑名單移除嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/business/users/${userId}/blacklist`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('使用者已從黑名單移除');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || '移除黑名單失敗');
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('移除黑名單失敗');
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone.includes(searchTerm);
    
    // Blacklist filter is already applied on the backend, but we keep search filter here
    return matchesSearch;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">用戶管理</h1>
          <p className="text-gray-400">查詢使用者與風險管理</p>
          {!loading && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                總使用者數: <span className="text-white font-medium">{users.length}</span>
              </span>
              <span className="text-gray-400">
                已停權: <span className="text-red-400 font-medium">{users.filter(u => u.isBlacklisted).length}</span>
              </span>
              <span className="text-gray-400">
                正常: <span className="text-green-400 font-medium">{users.filter(u => !u.isBlacklisted).length}</span>
              </span>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋使用者姓名、電子郵件或電話..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <select
              value={blacklistFilter}
              onChange={(e) => setBlacklistFilter(e.target.value)}
              className="input-field pr-12 pl-4 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">全部狀態</option>
              <option value="true">已停權（黑名單）</option>
              <option value="false">正常使用者</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">使用者</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">KYC 等級</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">角色</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">風險事件</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">狀態</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-gray-500 text-sm">{user.email}</div>
                          <div className="text-gray-500 text-sm">{user.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getKycBadge(user.kycLevel)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.roles?.map((role) => (
                            <span key={role} className="px-2 py-1 rounded bg-primary-500/20 text-primary-400 text-xs">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.riskEventCount > 0 ? (
                          <span className="flex items-center text-red-400">
                            <AlertTriangle size={16} className="mr-1" />
                            {user.riskEventCount}
                          </span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isBlacklisted ? (
                          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1">
                            <Shield size={14} />
                            已停權（黑名單）
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            正常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isBlacklisted ? (
                          <button
                            onClick={() => handleRemoveFromBlacklist(user.userId, user.name)}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle size={14} />
                            移除黑名單
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToBlacklist(user.userId, user.name)}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
                          >
                            <Ban size={14} />
                            加入黑名單
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

