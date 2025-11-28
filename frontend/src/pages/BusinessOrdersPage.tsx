import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Search, Calendar } from 'lucide-react';

interface Order {
  orderId: number;
  buyerId: number;
  buyerName: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
}

export default function BusinessOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      Pending: { label: '待付款', color: 'bg-yellow-500/20 text-yellow-400' },
      Paid: { label: '已付款', color: 'bg-blue-500/20 text-blue-400' },
      Completed: { label: '已完成', color: 'bg-green-500/20 text-green-400' },
      Cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.buyerName.toLowerCase().includes(searchLower) ||
      order.orderId.toString().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">交易監控</h1>
          <p className="text-gray-400">查詢訂單與付款狀態</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="搜尋訂單編號或買家姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">訂單編號</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">買家</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">建立時間</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">金額</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">訂單狀態</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">付款狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-900/30">
                      <td className="px-6 py-4 text-white font-medium">#{order.orderId}</td>
                      <td className="px-6 py-4 text-white">{order.buyerName}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-white">NT$ {order.totalAmount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'Success' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.paymentStatus === 'Success' ? '已付款' : '未付款'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

