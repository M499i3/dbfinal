import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getAvailableTickets, createOrder, Ticket } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Ticket as TicketIcon, Star, Calendar, MapPin, ShoppingCart, X } from 'lucide-react';

export default function TicketsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [cart, setCart] = useState<Ticket[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [searchParams, sortBy]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      const eventId = searchParams.get('eventId');
      if (eventId) params.eventId = eventId;
      if (sortBy) params.sortBy = sortBy;
      const data = await getAvailableTickets(params);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.event.title.toLowerCase().includes(searchLower) ||
      ticket.event.artist.toLowerCase().includes(searchLower) ||
      ticket.zone.name.toLowerCase().includes(searchLower)
    );
  });

  const addToCart = (ticket: Ticket) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!cart.find((t) => t.ticketId === ticket.ticketId)) {
      setCart([...cart, ticket]);
      setShowCart(true);
    }
  };

  const removeFromCart = (ticketId: number) => {
    setCart(cart.filter((t) => t.ticketId !== ticketId));
  };

  const totalAmount = cart.reduce((sum, t) => sum + t.listing.price, 0);

  const handlePurchase = async () => {
    if (!token || cart.length === 0) return;

    try {
      setPurchasing(true);
      const items = cart.map((t) => ({
        listingId: t.listing.listingId,
        ticketId: t.ticketId,
      }));
      const result = await createOrder(items);
      alert(`訂單建立成功！訂單編號: ${result.orderId}\n總金額: NT$ ${result.totalAmount.toLocaleString()}`);
      setCart([]);
      setShowCart(false);
      navigate('/my-orders');
    } catch (error: any) {
      alert(error.message || '購買失敗');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            瀏覽票券
          </h1>
          <p className="text-gray-400">探索所有可購買的二手票券</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
              <input
                type="text"
                placeholder="搜尋活動、藝人或座位區..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pr-12"
              />
            </div>
            <div className="relative flex items-center gap-2">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field pr-12 pl-4 appearance-none cursor-pointer"
              >
                <option value="newest">最新發布</option>
                <option value="price-asc">價格：低到高</option>
                <option value="price-desc">價格：高到低</option>
              </select>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative btn-secondary flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>購物車</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#12121a] border border-gray-800 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-800 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20">
            <TicketIcon className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">找不到票券</h3>
            <p className="text-gray-400">
              {searchTerm ? '嘗試使用不同的關鍵字搜尋' : '目前沒有可購買的票券'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket, index) => {
              const inCart = cart.find((t) => t.ticketId === ticket.ticketId);
              return (
                <div
                  key={ticket.ticketId}
                  className={`card-hover rounded-2xl border p-6 animate-fade-in ${
                    inCart
                      ? 'bg-primary-500/10 border-primary-500'
                      : 'bg-[#12121a] border-gray-800'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Event Info */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                      {ticket.zone.name}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(ticket.event.eventDate)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">
                    {ticket.event.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{ticket.event.artist}</p>
                  <p className="text-white font-medium mb-4">座位 {ticket.seatLabel}</p>

                  {/* Price */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-400">
                        NT$ {ticket.listing.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm line-through ml-2">
                        NT$ {ticket.faceValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <Link
                      to={`/sellers/${ticket.listing.seller.sellerId}`}
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
                        {ticket.listing.seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-white">{ticket.listing.seller.name}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star size={12} className="text-yellow-500 mr-1" />
                          <span>{ticket.listing.seller.rating}</span>
                          <span className="mx-1">·</span>
                          <span>{ticket.listing.seller.reviewCount} 評價</span>
                        </div>
                      </div>
                    </Link>
                    {inCart ? (
                      <button
                        onClick={() => removeFromCart(ticket.ticketId)}
                        className="text-primary-400 text-sm hover:underline"
                      >
                        移除
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(ticket)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        加入購物車
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCart(false)}
          ></div>
          <div className="relative w-full max-w-md bg-[#12121a] border-l border-gray-800 h-full overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">購物車</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">購物車是空的</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((ticket) => (
                      <div
                        key={ticket.ticketId}
                        className="p-4 rounded-xl bg-[#1a1a25] border border-gray-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-white font-medium">{ticket.event.title}</h4>
                            <p className="text-gray-400 text-sm">{ticket.event.artist}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(ticket.ticketId)}
                            className="text-gray-500 hover:text-primary-400"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {ticket.zone.name} · {ticket.seatLabel}
                          </div>
                          <div className="text-primary-400 font-semibold">
                            NT$ {ticket.listing.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-400">總計</span>
                      <span className="text-2xl font-bold text-white">
                        NT$ {totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      {purchasing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ShoppingCart size={20} />
                          <span>確認購買</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

