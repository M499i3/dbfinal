import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, Calendar, DollarSign, Ticket } from 'lucide-react';

interface RiskFlag {
  type: string;
  reason: string;
}

interface TicketDetail {
  ticketId: number;
  eventTitle: string;
  artist: string;
  eventDate: string;
  zoneName: string;
  seatLabel: string;
  faceValue: number;
  price: number;
  serialNo: string;
}

interface ListingDetail {
  listing_id: number;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  created_at: string;
  expires_at: string;
  status: string;
  risk_flags: RiskFlag[];
  tickets: TicketDetail[];
}

export default function BusinessListingDetailPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchListingDetail();
  }, [user, navigate, id]);

  const fetchListingDetail = async () => {
    try {
      const response = await fetch(`/api/business/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setListing(data.listing);
      }
    } catch (error) {
      console.error('Error fetching listing detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('確定要批准此上架嗎？')) return;

    try {
      const response = await fetch(`/api/business/listings/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('上架已批准');
        navigate('/business/listings');
      } else {
        const error = await response.json();
        alert(error.error || '批准失敗');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('批准失敗');
    }
  };

  const handleReject = async () => {
    const reason = prompt('請輸入拒絕原因：');
    if (!reason) return;

    try {
      const response = await fetch(`/api/business/listings/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('上架已拒絕');
        navigate('/business/listings');
      } else {
        const error = await response.json();
        alert(error.error || '拒絕失敗');
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('拒絕失敗');
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

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/business/listings')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上架列表
          </button>
          <div className="text-center py-20 text-gray-400">
            <p>上架不存在</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = listing.tickets.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/business/listings')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          返回上架列表
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-display font-bold text-white">上架詳情 #{listing.listing_id}</h1>
            {getStatusBadge(listing.status)}
          </div>
          <p className="text-gray-400">查看上架的完整資訊與風險評估</p>
        </div>

        {/* Risk Flags Alert */}
        {listing.risk_flags && listing.risk_flags.length > 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-yellow-400 font-medium text-lg mb-2">風險警告</h3>
                <p className="text-yellow-400/70 text-sm mb-4">
                  此上架被標記為高風險，請仔細審核以下風險因素後再決定是否批准
                </p>
                <div className="space-y-3">
                  {listing.risk_flags.map((flag, index) => (
                    <div key={index} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getRiskFlagColor(flag.type)}`}>
                          {getRiskFlagLabel(flag.type)}
                        </span>
                        <span className="text-sm text-gray-300">{flag.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seller Info */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                賣家資訊
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">賣家姓名</span>
                  <span className="text-white">{listing.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">電子郵件</span>
                  <span className="text-white">{listing.seller_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">賣家ID</span>
                  <span className="text-white">#{listing.seller_id}</span>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                票券清單 ({listing.tickets.length} 張)
              </h2>
              <div className="space-y-4">
                {listing.tickets.map((ticket) => (
                  <div key={ticket.ticketId} className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-medium">{ticket.eventTitle}</h3>
                        <p className="text-gray-400 text-sm">{ticket.artist}</p>
                      </div>
                      <span className="text-xs text-gray-500">票券 #{ticket.ticketId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">日期：</span>
                        <span className="text-gray-300">{new Date(ticket.eventDate).toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">座位：</span>
                        <span className="text-gray-300">{ticket.zoneName} {ticket.seatLabel}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">面額：</span>
                        <span className="text-gray-300">NT$ {ticket.faceValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">售價：</span>
                        <span className="text-white font-medium">NT$ {ticket.price.toLocaleString()}</span>
                        {ticket.price !== ticket.faceValue && (
                          <span className={`ml-2 text-xs ${ticket.price > ticket.faceValue ? 'text-orange-400' : 'text-green-400'}`}>
                            ({ticket.price > ticket.faceValue ? '+' : ''}{Math.round((ticket.price - ticket.faceValue) / ticket.faceValue * 100)}%)
                          </span>
                        )}
                      </div>
                      {ticket.serialNo && (
                        <div className="col-span-2">
                          <span className="text-gray-500">序號：</span>
                          <span className="text-gray-300 font-mono text-xs">{ticket.serialNo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                上架摘要
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400 text-sm">總票數</span>
                  <p className="text-2xl font-bold text-white">{listing.tickets.length} 張</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">總金額</span>
                  <p className="text-2xl font-bold text-white">NT$ {totalPrice.toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">建立時間</span>
                  </div>
                  <p className="text-white">{new Date(listing.created_at).toLocaleString('zh-TW')}</p>
                </div>
                {listing.expires_at && (
                  <div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">到期時間</span>
                    </div>
                    <p className="text-white">{new Date(listing.expires_at).toLocaleString('zh-TW')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {listing.status === 'Pending' && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">審核操作</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-green-500/30 transition-colors font-medium"
                  >
                    <CheckCircle size={20} />
                    <span>批准上架</span>
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-colors font-medium"
                  >
                    <XCircle size={20} />
                    <span>拒絕上架</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

