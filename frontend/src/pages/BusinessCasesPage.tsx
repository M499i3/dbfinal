import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Search, Eye, CheckCircle, PlayCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchHistory } from '../hooks/useSearchHistory';

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
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  // 記錄搜索歷史
  useSearchHistory(searchTerm, 'business-cases');

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

  const handleStartProcessing = async (caseId: number) => {
    if (!confirm('確定要開始處理此案件嗎？')) return;

    try {
      const response = await fetch(`/api/business/cases/${caseId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('案件已標記為處理中');
        fetchCases();
      } else {
        const error = await response.json();
        alert(error.error || '操作失敗');
      }
    } catch (error) {
      console.error('Error starting case:', error);
      alert('操作失敗');
    }
  };

  const handleCloseCase = async (caseId: number) => {
    const resolution = prompt('請輸入結案說明：');
    if (!resolution) return;

    try {
      const response = await fetch(`/api/business/cases/${caseId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        alert('案件已結案');
        fetchCases();
      } else {
        const error = await response.json();
        alert(error.error || '結案失敗');
      }
    } catch (error) {
      console.error('Error closing case:', error);
      alert('結案失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      Open: { label: '待處理', color: 'bg-yellow-500/20 text-yellow-400' },
      InProgress: { label: '處理中', color: 'bg-blue-500/20 text-blue-400' },
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
    const matchesSearch =
      c.caseId.toString().includes(searchTerm) ||
      c.complainantName.toLowerCase().includes(searchLower) ||
      c.respondentName.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">申訴案件</h1>
          <p className="text-gray-400">處理爭議交易與申訴</p>
        </div>

        {/* Filters and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">待處理</p>
            <p className="text-2xl font-bold text-yellow-400">
              {cases.filter((c) => c.status === 'Open').length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">處理中</p>
            <p className="text-2xl font-bold text-blue-400">
              {cases.filter((c) => c.status === 'InProgress').length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">已結案</p>
            <p className="text-2xl font-bold text-gray-400">
              {cases.filter((c) => c.status === 'Closed').length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">總案件數</p>
            <p className="text-2xl font-bold text-white">{cases.length}</p>
          </div>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋案件編號、申訴人或被申訴人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-12 pl-4 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">全部狀態</option>
              <option value="Open">待處理</option>
              <option value="InProgress">處理中</option>
              <option value="Closed">已結案</option>
            </select>
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
                  <p className="text-white mb-4">{c.description}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/business/cases/${c.caseId}`)}
                      className="flex-1 bg-white/5 text-white border border-white/10 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-white/10 transition-colors"
                    >
                      <Eye size={16} />
                      <span>查看詳情</span>
                    </button>
                    
                    {c.status === 'Open' && (
                      <button
                        onClick={() => handleStartProcessing(c.caseId)}
                        className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-blue-500/30 transition-colors"
                      >
                        <PlayCircle size={16} />
                        <span>開始處理</span>
                      </button>
                    )}
                    
                    {(c.status === 'Open' || c.status === 'InProgress') && (
                      <button
                        onClick={() => handleCloseCase(c.caseId)}
                        className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-green-500/30 transition-colors"
                      >
                        <CheckCircle size={16} />
                        <span>結案</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

