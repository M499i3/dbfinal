import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, X, Search, Filter } from 'lucide-react';

interface Listing {
  listing_id: number;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  created_at: string;
  expires_at: string;
  status: string;
  approval_status: string;
  ticket_count: number;
  total_price: number;
}

export default function BusinessListingsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchListings();
  }, [user, navigate, statusFilter, approvalFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (approvalFilter) params.append('approvalStatus', approvalFilter);
      const url = `/api/business/listings${params.toString() ? '?' + params.toString() : ''}`;
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

  const handleApprove = async (listingId: number, action: 'approve' | 'reject') => {
    const confirmMsg = action === 'approve' 
      ? '確定要審核通過此上架嗎？通過後其他用戶將可以瀏覽和購買。'
      : '確定要拒絕此上架嗎？';
    
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`/api/business/listings/${listingId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        alert(action === 'approve' ? '上架已審核通過' : '上架已拒絕');
        fetchListings();
      } else {
        const error = await response.json();
        alert(error.error || '操作失敗');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('操作失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-green-500/20 text-green-400',
      Sold: 'bg-blue-500/20 text-blue-400',
      Expired: 'bg-gray-500/20 text-gray-400',
      Cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Active: '進行中',
      Sold: '已售出',
      Expired: '已過期',
      Cancelled: '已取消',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getApprovalBadge = (approvalStatus: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-500/20 text-yellow-400',
      Approved: 'bg-green-500/20 text-green-400',
      Rejected: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Pending: '待審核',
      Approved: '已通過',
      Rejected: '已拒絕',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[approvalStatus] || ''}`}>
        {labels[approvalStatus] || approvalStatus}
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
              <option value="Active">進行中</option>
              <option value="Sold">已售出</option>
              <option value="Expired">已過期</option>
              <option value="Cancelled">已取消</option>
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="input-field pr-12 pl-4 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">全部審核狀態</option>
              <option value="Pending">待審核</option>
              <option value="Approved">已通過</option>
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
                      {getApprovalBadge(listing.approval_status)}
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
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/business/listings/${listing.listing_id}`)}
                      className="btn-secondary text-sm py-2 px-4 flex items-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>查看詳情</span>
                    </button>
                    {listing.approval_status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(listing.listing_id, 'approve')}
                          className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm py-2 px-4 flex items-center space-x-1 hover:bg-green-500/30 transition-colors"
                        >
                          <span>✓ 通過</span>
                        </button>
                        <button
                          onClick={() => handleApprove(listing.listing_id, 'reject')}
                          className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm py-2 px-4 flex items-center space-x-1 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={16} />
                          <span>拒絕</span>
                        </button>
                      </>
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

