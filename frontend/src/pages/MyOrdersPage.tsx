import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, payOrder, cancelOrder, Order } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Calendar, CreditCard, X, Check } from 'lucide-react';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      Pending: 'bg-yellow-500/20 text-yellow-400',
      Paid: 'bg-blue-500/20 text-blue-400',
      Completed: 'bg-green-500/20 text-green-400',
      Cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Pending: '待付款',
      Paid: '已付款',
      Completed: '已完成',
      Cancelled: '已取消',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handlePay = async (orderId: number) => {
    try {
      setProcessingId(orderId);
      await payOrder(orderId, 'CreditCard');
      alert('付款成功！票券已轉移至您的帳戶');
      fetchOrders();
    } catch (error: any) {
      alert(error.message || '付款失敗');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm('確定要取消此訂單嗎？')) return;

    try {
      setProcessingId(orderId);
      await cancelOrder(orderId);
      alert('訂單已取消');
      fetchOrders();
    } catch (error: any) {
      alert(error.message || '取消失敗');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            我的訂單
          </h1>
          <p className="text-gray-400">查看您的購買紀錄</p>
        </div>

        {/* Orders */}
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
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">還沒有訂單</h3>
            <p className="text-gray-400 mb-6">您目前還沒有任何訂單</p>
            <Link to="/tickets" className="btn-primary">
              瀏覽票券
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.orderId}
                className="rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(order.status)}
                    <span className="text-gray-400 text-sm">
                      訂單編號 #{order.orderId}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar size={14} className="mr-2" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-4 mb-6">
                    {order.items.map((item) => (
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
                          <p className="text-gray-500 text-xs mt-1">
                            賣家: {item.sellerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-400 font-bold text-lg">
                            NT$ {item.unitPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 rounded-xl bg-[#1a1a25] mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm">付款方式</p>
                        <p className="text-white">{order.payment.method || '待選擇'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">付款狀態</p>
                        <p
                          className={
                            order.payment.status === 'Success'
                              ? 'text-green-400'
                              : order.payment.status === 'Failed'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          {order.payment.status === 'Success'
                            ? '已付款'
                            : order.payment.status === 'Failed'
                            ? '付款失敗'
                            : '待付款'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">總金額</p>
                        <p className="text-2xl font-bold text-white">
                          NT${' '}
                          {(order.payment.amount || order.items.reduce((sum, i) => sum + i.unitPrice, 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {order.payment.paidAt && (
                      <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-500">
                        付款時間: {formatDate(order.payment.paidAt)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {order.status === 'Pending' && (
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleCancel(order.orderId)}
                        disabled={processingId === order.orderId}
                        className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <X size={18} />
                        <span>取消訂單</span>
                      </button>
                      <button
                        onClick={() => handlePay(order.orderId)}
                        disabled={processingId === order.orderId}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                      >
                        {processingId === order.orderId ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CreditCard size={18} />
                            <span>立即付款</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {order.status === 'Completed' && (
                    <div className="flex items-center justify-end text-green-400">
                      <Check size={18} className="mr-2" />
                      <span>交易已完成</span>
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

