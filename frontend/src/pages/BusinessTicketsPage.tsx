import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, Search, Filter } from 'lucide-react';

interface TicketData {
  ticket_id: number;
  event_id: number;
  event_title: string;
  artist: string;
  event_date: string;
  zone_id: number;
  zone_name: string;
  seat_label: string;
  face_value: number;
  original_vendor: string;
  serial_no: string;
  ticket_status: string;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  listing_status: string | null;
  listing_price: number | null;
  order_status: string | null;
}

export default function BusinessTicketsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getDisplayStatus = (ticket: TicketData) => {
    // Check if ticket has been sold (order completed/paid)
    if (ticket.order_status === 'Completed' || ticket.order_status === 'Paid') {
      return { text: '已售出', color: 'text-blue-400 bg-blue-400/10' };
    }
    // Check if ticket is currently listed for sale
    if (ticket.listing_status === 'Active') {
      return { text: '上架中', color: 'text-yellow-400 bg-yellow-400/10' };
    }
    // Otherwise show ticket status
    switch (ticket.ticket_status) {
      case 'Valid':
        return { text: '有效', color: 'text-green-400 bg-green-400/10' };
      case 'Transferred':
        return { text: '已轉移', color: 'text-purple-400 bg-purple-400/10' };
      case 'Cancelled':
        return { text: '已取消', color: 'text-red-400 bg-red-400/10' };
      default:
        return { text: ticket.ticket_status, color: 'text-gray-400 bg-gray-400/10' };
    }
  };

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchTickets();
  }, [user, navigate]);

  useEffect(() => {
    filterTickets();
  }, [searchTerm, statusFilter, tickets]);

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
          <p className="text-gray-400">查看和管理系統中的所有票券</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            <input
              type="text"
              placeholder="搜尋活動、藝人、座位、擁有者或序號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="all">所有狀態</option>
              <option value="Valid">有效</option>
              <option value="Listed">上架中</option>
              <option value="Sold">已售出</option>
              <option value="Transferred">已轉移</option>
              <option value="Cancelled">已取消</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">總票券數</p>
            <p className="text-2xl font-bold text-white">{tickets.length}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">有效票券</p>
            <p className="text-2xl font-bold text-green-400">
              {tickets.filter((t) => t.ticket_status === 'Valid').length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">上架中</p>
            <p className="text-2xl font-bold text-yellow-400">
              {tickets.filter((t) => t.listing_status === 'Active').length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">已售出/轉移</p>
            <p className="text-2xl font-bold text-blue-400">
              {tickets.filter((t) => t.order_status === 'Completed' || t.order_status === 'Paid' || t.ticket_status === 'Transferred').length}
            </p>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Ticket className="mx-auto mb-4 text-gray-600" size={48} />
            <p>{searchTerm || statusFilter !== 'all' ? '找不到符合條件的票券' : '尚無票券'}</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      票券ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      活動
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      座位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      面額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      擁有者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      序號
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      狀態
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.ticket_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        #{ticket.ticket_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-white font-medium">{ticket.event_title}</div>
                        <div className="text-gray-400 text-xs">{ticket.artist}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(ticket.event_date).toLocaleDateString('zh-TW')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-white">{ticket.zone_name}</div>
                        <div className="text-gray-400 text-xs">{ticket.seat_label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        ${ticket.face_value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-white">{ticket.owner_name}</div>
                        <div className="text-gray-400 text-xs">{ticket.owner_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {ticket.serial_no || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getDisplayStatus(ticket).color}`}
                        >
                          {getDisplayStatus(ticket).text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination info */}
        {filteredTickets.length > 0 && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            顯示 {filteredTickets.length} 筆票券資料
          </div>
        )}
      </div>
    </div>
  );
}

