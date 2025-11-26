import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings, cancelListing, Listing } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Tag, Calendar, X, AlertCircle } from 'lucide-react';

export default function MyListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getMyListings();
      setListings(data.listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: 'bg-green-500/20 text-green-400',
      Sold: 'bg-blue-500/20 text-blue-400',
      Expired: 'bg-yellow-500/20 text-yellow-400',
      Cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Active: '上架中',
      Sold: '已售出',
      Expired: '已過期',
      Cancelled: '已取消',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleCancel = async (listingId: number) => {
    if (!confirm('確定要取消此上架嗎？')) return;

    try {
      await cancelListing(listingId);
      alert('已取消上架');
      fetchListings();
    } catch (error: any) {
      alert(error.message || '取消失敗');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-4">
              我的上架
            </h1>
            <p className="text-gray-400">管理您上架的票券</p>
          </div>
          <Link to="/my-tickets" className="btn-primary flex items-center space-x-2">
            <Tag size={20} />
            <span>上架新票券</span>
          </Link>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#12121a] border border-gray-800 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">還沒有上架</h3>
            <p className="text-gray-400 mb-6">您目前還沒有上架任何票券</p>
            <Link to="/my-tickets" className="btn-primary">
              前往上架
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div
                key={listing.listingId}
                className="rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(listing.status)}
                    <span className="text-gray-400 text-sm">
                      上架編號 #{listing.listingId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>建立於 {formatDate(listing.createdAt)}</span>
                    </div>
                    {listing.expiresAt && (
                      <div className="flex items-center text-yellow-500">
                        <AlertCircle size={14} className="mr-2" />
                        <span>到期於 {formatDate(listing.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-4">
                    {listing.items.map((item) => (
                      <div
                        key={item.ticketId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#1a1a25] gap-4"
                      >
                        <div>
                          <h4 className="text-white font-medium">{item.eventTitle}</h4>
                          <p className="text-gray-400 text-sm">{item.artist}</p>
                          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                            <span>{item.zoneName}</span>
                            <span>·</span>
                            <span>{item.seatLabel}</span>
                            <span>·</span>
                            <span>{new Date(item.eventDate).toLocaleDateString('zh-TW')}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-6">
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">售價</p>
                            <p className="text-primary-400 font-bold text-lg">
                              NT$ {item.price.toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {listing.status === 'Active' && (
                    <div className="mt-6 pt-6 border-t border-gray-800 flex justify-end">
                      <button
                        onClick={() => handleCancel(listing.listingId)}
                        className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={18} />
                        <span>取消上架</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

