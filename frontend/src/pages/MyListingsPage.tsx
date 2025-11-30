import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings, cancelListing, createTicket, createListing, getEvents, getEventById, Listing, Event, EventDetail } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Tag, Calendar, X, AlertCircle, Plus, Search } from 'lucide-react';

export default function MyListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    eventId: '',
    zoneId: '',
    seatLabel: '',
    faceValue: '',
    originalVendor: '',
    serialNo: '',
    price: '',
    expiresAt: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [user, navigate]);

  useEffect(() => {
    if (showUploadModal) {
      fetchEvents();
    }
  }, [showUploadModal]);

  useEffect(() => {
    if (formData.eventId) {
      fetchEventDetails(parseInt(formData.eventId));
    } else {
      setSelectedEvent(null);
    }
  }, [formData.eventId]);

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

  const fetchEvents = async () => {
    try {
      const data = await getEvents({ status: 'Scheduled' });
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchEventDetails = async (eventId: number) => {
    try {
      setLoadingEvent(true);
      const event = await getEventById(eventId);
      setSelectedEvent(event);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoadingEvent(false);
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

  const handleUploadTicket = async () => {
    if (!formData.eventId || !formData.zoneId || !formData.seatLabel || !formData.faceValue || !formData.price || !formData.expiresAt) {
      alert('請填寫所有必填欄位');
      return;
    }

    // 驗證價格為正整數
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0 || !Number.isInteger(price)) {
      alert('售價必須為正整數');
      return;
    }

    try {
      setSubmitting(true);
      
      // 先創建票券
      const ticketResult = await createTicket({
        eventId: parseInt(formData.eventId),
        zoneId: parseInt(formData.zoneId),
        seatLabel: formData.seatLabel,
        faceValue: parseFloat(formData.faceValue),
        originalVendor: formData.originalVendor || '其他',
        serialNo: formData.serialNo || undefined,
      });

      // 然後創建上架
      await createListing({
        ticketIds: [ticketResult.ticket.ticket_id],
        prices: [price],
        expiresAt: formData.expiresAt,
      });

      alert('上架成功！');
      setShowUploadModal(false);
      setFormData({
        eventId: '',
        zoneId: '',
        seatLabel: '',
        faceValue: '',
        originalVendor: '',
        serialNo: '',
        price: '',
        expiresAt: '',
      });
      setSelectedEvent(null);
      fetchListings();
    } catch (error: any) {
      alert(error.message || '上架失敗');
    } finally {
      setSubmitting(false);
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
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>上架新票券</span>
          </button>
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
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              上架新票券
            </button>
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

      {/* Upload Ticket Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowUploadModal(false)}
          ></div>
          <div className="relative w-full max-w-2xl bg-[#12121a] border border-gray-800 rounded-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">上架新票券</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-400">填寫票券資訊並設定售價</p>

              {/* Event Selection */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">活動 *</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value, zoneId: '' })}
                  className="input-field"
                  required
                >
                  <option value="">選擇活動</option>
                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      {event.title} - {event.artist} ({new Date(event.eventDate).toLocaleDateString('zh-TW')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone Selection */}
              {selectedEvent && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">座位區域 *</label>
                  {loadingEvent ? (
                    <div className="text-gray-500">載入中...</div>
                  ) : (
                    <select
                      value={formData.zoneId}
                      onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">選擇座位區域</option>
                      {selectedEvent.seatZones.map((zone) => (
                        <option key={zone.zoneId} value={zone.zoneId}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Seat Label */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">座位標籤 *</label>
                <input
                  type="text"
                  value={formData.seatLabel}
                  onChange={(e) => setFormData({ ...formData, seatLabel: e.target.value })}
                  placeholder="例如：A-12-5 或 搖滾區-15"
                  className="input-field"
                  required
                />
              </div>

              {/* Face Value */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">票面價值 (NT$) *</label>
                <input
                  type="number"
                  value={formData.faceValue}
                  onChange={(e) => setFormData({ ...formData, faceValue: e.target.value })}
                  placeholder="例如：6980"
                  className="input-field"
                  required
                  min="0"
                  step="1"
                />
              </div>

              {/* Original Vendor */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">原始賣家</label>
                <input
                  type="text"
                  value={formData.originalVendor}
                  onChange={(e) => setFormData({ ...formData, originalVendor: e.target.value })}
                  placeholder="例如：拓元售票、KKTIX、其他"
                  className="input-field"
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">票券序號</label>
                <input
                  type="text"
                  value={formData.serialNo}
                  onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                  placeholder="選填，票券的序號"
                  className="input-field"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">售價 (NT$) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 只允許輸入正整數（包括空字串用於清除）
                    if (value === '') {
                      setFormData({ ...formData, price: '' });
                    } else {
                      const num = parseInt(value, 10);
                      if (!isNaN(num) && num > 0 && value === num.toString()) {
                        setFormData({ ...formData, price: value });
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦點時驗證並修正
                    const value = e.target.value;
                    const num = parseInt(value, 10);
                    if (value && (isNaN(num) || num <= 0)) {
                      alert('價格必須為正整數');
                      setFormData({ ...formData, price: '' });
                    }
                  }}
                  placeholder="設定售價（必須為正整數）"
                  className="input-field"
                  required
                  min="1"
                  step="1"
                />
                <p className="text-gray-500 text-xs mt-1">價格必須為正整數（例如：1000）</p>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">上架到期時間 *</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="input-field"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({
                      eventId: '',
                      zoneId: '',
                      seatLabel: '',
                      faceValue: '',
                      originalVendor: '',
                      serialNo: '',
                      price: '',
                      expiresAt: '',
                    });
                    setSelectedEvent(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleUploadTicket}
                  disabled={submitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '處理中...' : '上架票券'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
