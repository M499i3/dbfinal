import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Search } from 'lucide-react';

interface Case {
  caseId: number;
  orderId: number;
  complainantId: number;
  complainantName: string;
  respondentId: number;
  respondentName: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function BusinessCasesPage() {
  const { token } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/cases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      Open: { label: '處理中', color: 'bg-yellow-500/20 text-yellow-400' },
      Resolved: { label: '已解決', color: 'bg-green-500/20 text-green-400' },
      Closed: { label: '已結案', color: 'bg-gray-500/20 text-gray-400' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredCases = cases.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.caseId.toString().includes(searchTerm) ||
      c.complainantName.toLowerCase().includes(searchLower) ||
      c.respondentName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">申訴案件</h1>
          <p className="text-gray-400">處理爭議交易與申訴</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋案件編號、申訴人或被申訴人..."
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
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-[#12121a] border border-gray-800">
            <AlertTriangle className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">目前沒有申訴案件</h3>
            <p className="text-gray-400">所有案件都已處理完成</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((c) => (
              <div key={c.caseId} className="rounded-2xl bg-[#12121a] border border-gray-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">案件 #{c.caseId}</h3>
                      {getStatusBadge(c.status)}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">訂單編號: #{c.orderId}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-gray-500">申訴人: </span>
                        <span className="text-white">{c.complainantName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">被申訴人: </span>
                        <span className="text-white">{c.respondentName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">{formatDate(c.createdAt)}</div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="text-gray-500">類型: </span>
                    {c.type}
                  </p>
                  <p className="text-white">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

