import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Star, Ticket, ArrowLeft } from 'lucide-react';

interface Seller {
  sellerId: number;
  name: string;
  email: string;
  kycLevel: number;
  createdAt: string;
  rating: string;
  reviewCount: number;
}

interface SellerListing {
  ticketId: number;
  seatLabel: string;
  faceValue: number;
  originalVendor: string;
  serialNo: string;
  event: {
    eventId: number;
    artist: string;
    title: string;
    eventDate: string;
    startTime: string;
    imageUrl?: string;
  };
  zone: {
    zoneId: number;
    name: string;
  };
  listing: {
    listingId: number;
    price: number;
    createdAt: string;
    status: string;
  };
}

export default function SellerProfilePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId]);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sellers/${sellerId}`);
      if (!response.ok) {
        throw new Error('無法載入賣家資料');
      }
      const data = await response.json();
      setSeller(data.seller);
      setListings(data.listings);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">找不到賣家</h2>
          <Link to="/tickets" className="text-primary-400 hover:underline">
            返回票券列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/tickets"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>返回票券列表</span>
        </Link>

        {/* Seller Profile */}
        <div className="rounded-2xl bg-[#12121a] border border-gray-800 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white">
                {seller.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  {seller.name}
                </h1>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center text-gray-400">
                    <Star size={16} className="text-yellow-500 mr-1" />
                    <span className="font-semibold text-white">{seller.rating}</span>
                    <span className="ml-1">({seller.reviewCount} 評價)</span>
                  </div>
                  {getKycBadge(seller.kycLevel)}
                </div>
                <p className="text-gray-500 text-sm">
                  加入時間：{formatDate(seller.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            正在出售的票券 ({listings.length})
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-[#12121a] border border-gray-800">
              <Ticket className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">目前沒有出售的票券</h3>
              <p className="text-gray-400">此賣家目前沒有上架的票券</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Link
                  key={listing.ticketId}
                  to={`/events/${listing.event.eventId}`}
                  className="card-hover block rounded-2xl bg-[#12121a] border border-gray-800 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                          {listing.zone.name}
                        </span>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar size={14} className="mr-1" />
                          <span>{formatDate(listing.event.eventDate)}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {listing.event.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">{listing.event.artist}</p>
                      <p className="text-white font-medium">座位 {listing.seatLabel}</p>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-primary-400">
                          NT$ {listing.listing.price.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm line-through ml-2">
                          NT$ {listing.faceValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        面額 NT$ {listing.faceValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

