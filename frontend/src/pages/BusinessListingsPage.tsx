import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, X, Search, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface RiskFlag {
  type: string;
  reason: string;
}

interface Listing {
  listing_id: number;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  created_at: string;
  expires_at: string;
  status: string;
  ticket_count: number;
  total_price: number;
  risk_flags?: RiskFlag[];
}

export default function BusinessListingsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // Default to all statuses

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchListings();
  }, [user, navigate, statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/business/listings?status=${statusFilter}`
        : '/api/business/listings';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: number) => {
    if (!confirm('確定要批准此上架嗎？')) return;

    try {
      const response = await fetch(`/api/business/listings/${listingId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('上架已批准');
        fetchListings();
      } else {
        const error = await response.json();
        alert(error.error || '批准失敗');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('批准失敗');
    }
  };

  const handleReject = async (listingId: number) => {
    const reason = prompt('請輸入拒絕原因：');
    if (!reason) return;

    try {
      const response = await fetch(`/api/business/listings/${listingId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('上架已拒絕');
        fetchListings();
      } else {
        const error = await response.json();
        alert(error.error || '拒絕失敗');
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('拒絕失敗');
    }
  };

  const handleTakeDown = async (listingId: number) => {
    if (!confirm('確定要下架此上架嗎？')) return;

    try {
      const response = await fetch(`/api/business/listings/${listingId}/take-down`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: '管理員下架' }),
      });

      if (response.ok) {
        alert('上架已下架');
        fetchListings();
      } else {
        const error = await response.json();
        alert(error.error || '下架失敗');
      }
    } catch (error) {
      console.error('Error taking down listing:', error);
      alert('下架失敗');
    }
  };

  const getRiskFlagColor = (type: string) => {
    switch (type) {
      case 'HighPrice':
        return 'text-orange-400 bg-orange-400/10';
      case 'LowPrice':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'NewSeller':
        return 'text-blue-400 bg-blue-400/10';
      case 'HighQuantity':
        return 'text-purple-400 bg-purple-400/10';
      case 'BlacklistedSeller':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRiskFlagLabel = (type: string) => {
    switch (type) {
      case 'HighPrice':
        return '高價風險';
      case 'LowPrice':
        return '低價風險';
      case 'NewSeller':
        return '新賣家';
      case 'HighQuantity':
        return '大量上架';
      case 'BlacklistedSeller':
        return '黑名單賣家';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-500/20 text-yellow-400',
      Active: 'bg-green-500/20 text-green-400',
      Sold: 'bg-blue-500/20 text-blue-400',
      Expired: 'bg-gray-500/20 text-gray-400',
      Cancelled: 'bg-red-500/20 text-red-400',
      Rejected: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Pending: '待審核',
      Active: '進行中',
      Sold: '已售出',
      Expired: '已過期',
      Cancelled: '已取消',
      Rejected: '已拒絕',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">審核上架</h1>
          <p className="text-gray-400">審核與管理使用者上架的票券</p>
        </div>

        {/* Pending Count Alert */}
        {!loading && listings.filter((l) => l.status === 'Pending').length > 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">
                  有 {listings.filter((l) => l.status === 'Pending').length} 筆上架等待審核
                </p>
                <p className="text-yellow-400/70 text-sm">
                  請檢查風險標記並決定批准或拒絕上架
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋上架..."
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
              <option value="Pending">待審核</option>
              <option value="Active">進行中</option>
              <option value="Sold">已售出</option>
              <option value="Expired">已過期</option>
              <option value="Cancelled">已取消</option>
              <option value="Rejected">已拒絕</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="mx-auto mb-4 text-gray-600" size={48} />
            <p>尚無上架</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.listing_id}
                className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        上架 #{listing.listing_id}
                      </h3>
                      {getStatusBadge(listing.status)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <span className="text-gray-500">賣家：</span>
                        {listing.seller_name} ({listing.seller_email})
                      </p>
                      <p>
                        <span className="text-gray-500">票券數量：</span>
                        {listing.ticket_count} 張
                      </p>
                      <p>
                        <span className="text-gray-500">總價：</span>
                        NT$ {parseFloat(listing.total_price || '0').toLocaleString()}
                      </p>
                      <p>
                        <span className="text-gray-500">建立時間：</span>
                        {new Date(listing.created_at).toLocaleString('zh-TW')}
                      </p>
                      {listing.expires_at && (
                        <p>
                          <span className="text-gray-500">到期時間：</span>
                          {new Date(listing.expires_at).toLocaleString('zh-TW')}
                        </p>
                      )}
                      
                      {/* Risk Flags */}
                      {listing.risk_flags && listing.risk_flags.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-medium text-sm">風險標記：</span>
                          </div>
                          <div className="space-y-2">
                            {listing.risk_flags.map((flag, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskFlagColor(flag.type)}`}>
                                  {getRiskFlagLabel(flag.type)}
                                </span>
                                <span className="text-xs text-gray-400">{flag.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => navigate(`/business/listings/${listing.listing_id}`)}
                      className="btn-secondary text-sm py-2 px-4 flex items-center justify-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>查看詳情</span>
                    </button>
                    
                    {listing.status === 'Pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(listing.listing_id)}
                          className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm py-2 px-3 flex items-center justify-center space-x-1 hover:bg-green-500/30 transition-colors"
                        >
                          <CheckCircle size={16} />
                          <span>批准</span>
                        </button>
                        <button
                          onClick={() => handleReject(listing.listing_id)}
                          className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm py-2 px-3 flex items-center justify-center space-x-1 hover:bg-red-500/30 transition-colors"
                        >
                          <XCircle size={16} />
                          <span>拒絕</span>
                        </button>
                      </div>
                    )}
                    
                    {listing.status === 'Active' && (
                      <button
                        onClick={() => handleTakeDown(listing.listing_id)}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-1 hover:bg-red-500/30 transition-colors"
                      >
                        <X size={16} />
                        <span>下架</span>
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

