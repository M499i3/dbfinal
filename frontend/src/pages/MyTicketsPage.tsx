import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMyTickets, createListing, MyTicket } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Ticket, Calendar, MapPin, Tag, X, Plus } from 'lucide-react';

export default function MyTicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{ ticketId: number; price: string }[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  // Check if URL has action=create-listing parameter
  useEffect(() => {
    if (searchParams.get('action') === 'create-listing') {
      setShowListingModal(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getMyTickets();
      setTickets(data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Valid: 'bg-green-500/20 text-green-400',
      Used: 'bg-gray-500/20 text-gray-400',
      Transferred: 'bg-blue-500/20 text-blue-400',
      Cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Valid: '有效',
      Used: '已使用',
      Transferred: '已轉讓',
      Cancelled: '已取消',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const validTickets = tickets.filter((t) => t.status === 'Valid');

  const toggleTicketSelection = (ticketId: number) => {
    const existing = selectedTickets.find((t) => t.ticketId === ticketId);
    if (existing) {
      setSelectedTickets(selectedTickets.filter((t) => t.ticketId !== ticketId));
    } else {
      setSelectedTickets([...selectedTickets, { ticketId, price: '' }]);
    }
  };

  const updateTicketPrice = (ticketId: number, price: string) => {
    setSelectedTickets(
      selectedTickets.map((t) => (t.ticketId === ticketId ? { ...t, price } : t))
    );
  };

  const handleCreateListing = async () => {
    if (selectedTickets.some((t) => !t.price || parseFloat(t.price) <= 0)) {
      alert('請為所有選擇的票券設定價格');
      return;
    }
    if (!expiresAt) {
      alert('請設定上架到期時間');
      return;
    }

    try {
      setSubmitting(true);
      await createListing({
        ticketIds: selectedTickets.map((t) => t.ticketId),
        prices: selectedTickets.map((t) => parseFloat(t.price)),
        expiresAt: new Date(expiresAt).toISOString(),
      });
      alert('上架成功！');
      setShowListingModal(false);
      setSelectedTickets([]);
      setExpiresAt('');
      navigate('/my-listings');
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
              我的票券
            </h1>
            <p className="text-gray-400">管理您擁有的所有票券</p>
          </div>
          {validTickets.length > 0 && (
            <button
              onClick={() => setShowListingModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Tag size={20} />
              <span>上架票券</span>
            </button>
          )}
        </div>

        {/* Tickets */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#12121a] border border-gray-800 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-800 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">還沒有票券</h3>
            <p className="text-gray-400 mb-6">您目前還沒有任何票券</p>
            <Link to="/tickets" className="btn-primary">
              瀏覽票券
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="card-hover rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-primary-900/50 to-accent-900/50 p-4 flex justify-between items-start">
                  <span className="inline-block px-3 py-1 rounded-full bg-black/30 text-white text-xs font-medium">
                    {ticket.zone.name}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {ticket.event.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{ticket.event.artist}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Calendar size={14} className="mr-2" />
                      <span>{formatDate(ticket.event.eventDate)}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin size={14} className="mr-2" />
                      <span>{ticket.venue.name}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-xs">座位</p>
                      <p className="text-white font-semibold">{ticket.seatLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">票面價值</p>
                      <p className="text-primary-400 font-semibold">
                        NT$ {ticket.faceValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowListingModal(false)}
          ></div>
          <div className="relative w-full max-w-2xl bg-[#12121a] border border-gray-800 rounded-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">上架票券</h2>
              <button
                onClick={() => {
                  setShowListingModal(false);
                  navigate('/my-tickets');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-400 mb-6">選擇要上架的票券並設定售價</p>

              <div className="space-y-4 mb-6">
                {validTickets.map((ticket) => {
                  const selected = selectedTickets.find((t) => t.ticketId === ticket.ticketId);
                  return (
                    <div
                      key={ticket.ticketId}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? 'bg-primary-500/10 border-primary-500'
                          : 'bg-[#1a1a25] border-gray-800 hover:border-gray-700'
                      }`}
                      onClick={() => toggleTicketSelection(ticket.ticketId)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-gray-600'
                            }`}
                          >
                            {selected && <Plus size={14} className="text-white rotate-45" />}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{ticket.event.title}</h4>
                            <p className="text-gray-400 text-sm">
                              {ticket.zone.name} · {ticket.seatLabel}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {formatDate(ticket.event.eventDate)} · {ticket.venue.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">票面價值</p>
                          <p className="text-white">NT$ {ticket.faceValue.toLocaleString()}</p>
                        </div>
                      </div>
                      {selected && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <label className="block text-gray-400 text-sm mb-2">
                            設定售價
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                              NT$
                            </span>
                            <input
                              type="number"
                              value={selected.price}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateTicketPrice(ticket.ticketId, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="0"
                              className="input-field pl-14"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedTickets.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-2">上架到期時間</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowListingModal(false);
                    navigate('/my-tickets');
                  }}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateListing}
                  disabled={selectedTickets.length === 0 || submitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '處理中...' : `上架 ${selectedTickets.length} 張票券`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

