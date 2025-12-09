import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Search, Calendar } from 'lucide-react';
import { useSearchHistory } from '../hooks/useSearchHistory';

interface Log {
  logId: number;
  action: string;
  userId: number;
  userName: string;
  details: string;
  createdAt: string;
}

export default function BusinessLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  // 記錄搜索歷史
  useSearchHistory(searchTerm, 'business-logs');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.userName.toLowerCase().includes(searchLower) ||
      log.details.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">系統紀錄</h1>
          <p className="text-gray-400">查看系統活動紀錄</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋操作、使用者或詳情..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-12"
            />
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">時間</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">操作</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">使用者</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">詳情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-900/30">
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{log.userName}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{log.details}</td>
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

