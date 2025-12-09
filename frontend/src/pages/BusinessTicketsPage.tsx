import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, X, Eye, Search, Filter } from 'lucide-react';
import { useSearchHistory } from '../hooks/useSearchHistory';

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

interface Ticket {
  ticket_id: number;
  event_title: string;
  artist: string;
  seat_label: string;
  owner_name: string;
  serial_no: string;
  listing_status: string;
  order_status: string;
  ticket_status: string;
}

export default function BusinessTicketsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('approvalStatus', 'Approved'); // 只显示已审核通过的
      if (statusFilter) params.append('status', statusFilter);
      const url = `/api/business/listings?${params.toString()}`;
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

  const handleTakeDown = async (listingId: number) => {
    if (!confirm('確定要下架此上架嗎？下架後其他用戶將無法瀏覽和購買。')) return;

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

  useEffect(() => {
    filterTickets();
  }, [searchTerm, statusFilter, tickets]);

  // 記錄搜索歷史
  useSearchHistory(searchTerm, 'business-tickets');

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/business/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setFilteredTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.seat_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.serial_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => {
        if (statusFilter === 'Listed') {
          return ticket.listing_status === 'Active';
        } else if (statusFilter === 'Sold') {
          return ticket.order_status === 'Completed' || ticket.order_status === 'Paid';
        } else {
          return ticket.ticket_status === statusFilter;
        }
      });
    }

    setFilteredTickets(filtered);
  };


  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">管理票券</h1>
          <p className="text-gray-400">管理已審核通過的票券上架</p>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋票券..."
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
              <option value="Active">進行中</option>
              <option value="Sold">已售出</option>
              <option value="Expired">已過期</option>
              <option value="Cancelled">已取消</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Ticket className="mx-auto mb-4 text-gray-600" size={48} />
            <p>{searchTerm ? '找不到符合條件的票券' : '尚無票券資料'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {ticket.event_title} - {ticket.artist}
                      </h3>
                      {getStatusBadge(ticket.ticket_status)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <span className="text-gray-500">座位：</span>
                        {ticket.seat_label}
                      </p>
                      <p>
                        <span className="text-gray-500">擁有者：</span>
                        {ticket.owner_name}
                      </p>
                      <p>
                        <span className="text-gray-500">序號：</span>
                        {ticket.serial_no}
                      </p>
                      <p>
                        <span className="text-gray-500">上架狀態：</span>
                        {ticket.listing_status}
                      </p>
                      <p>
                        <span className="text-gray-500">訂單狀態：</span>
                        {ticket.order_status}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="btn-secondary text-sm py-2 px-4 flex items-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>查看詳情</span>
                    </button>
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

