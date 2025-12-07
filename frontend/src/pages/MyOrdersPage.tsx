import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, payOrder, cancelOrder, createReview, createCase, Order } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Calendar, CreditCard, X, Check, Star, AlertCircle } from 'lucide-react';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [casingOrderId, setCasingOrderId] = useState<number | null>(null);
  const [caseType, setCaseType] = useState<'Fraud' | 'Delivery' | 'Refund' | 'Other'>('Other');
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});
  const lastRefreshTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  // 計算剩餘時間並更新倒計時
  useEffect(() => {
    if (orders.length === 0) {
      setTimeRemaining({});
      return;
    }

    const calculateTimeRemaining = () => {
      // 使用 UTC 时间戳，避免时区问题
      const now = Date.now(); // 这已经是 UTC 时间戳（毫秒）
      const newTimeRemaining: Record<number, number> = {};

      orders.forEach((order) => {
        if (order.status === 'Pending') {
          // 确保 createdAt 是有效的日期字符串
          // PostgreSQL 返回的时间是 UTC 时间（ISO 8601 格式，以 Z 结尾）
          let createdAtTime: number;
          try {
            // 确保 createdAt 是字符串格式
            const createdAtStr = typeof order.createdAt === 'string' 
              ? order.createdAt 
              : order.createdAt?.toString() || '';
            
            // 直接解析为 Date 对象，JavaScript 会自动处理 UTC 时间
            const createdAt = new Date(createdAtStr);
            if (isNaN(createdAt.getTime())) {
              // 如果日期無效，跳過
              return;
            }
            
            // 使用 getTime() 获取 UTC 时间戳（毫秒）
            createdAtTime = createdAt.getTime();
          } catch (error) {
            return;
          }

          const fiveMinutes = 5 * 60 * 1000; // 5 分鐘（毫秒）
          const elapsed = now - createdAtTime;
          
          // 如果 elapsed 是负数或异常大（超过 1 小时），可能是时区问题
          // 这种情况下，我们假设订单刚创建，剩余时间为 5 分钟
          if (elapsed < 0 || elapsed > 60 * 60 * 1000) {
            // 假设订单刚创建，剩余时间为 5 分钟
            newTimeRemaining[order.orderId] = fiveMinutes;
          } else {
            const remaining = Math.max(0, fiveMinutes - elapsed);
            newTimeRemaining[order.orderId] = remaining;
          }
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      calculateTimeRemaining();
      
      // 檢查是否有訂單超時，如果有則刷新訂單列表（但避免頻繁刷新）
      const hasExpired = orders.some((order) => {
        if (order.status === 'Pending') {
          const createdAt = new Date(order.createdAt);
          if (isNaN(createdAt.getTime())) {
            return false;
          }
          const createdAtTime = createdAt.getTime();
          const fiveMinutes = 5 * 60 * 1000;
          // 檢查是否剛好超過 5 分鐘（允許 10 秒的緩衝時間）
          return now - createdAtTime >= fiveMinutes && now - createdAtTime < fiveMinutes + 10000;
        }
        return false;
      });
      
      // 只有在有超時訂單且距離上次刷新超過 10 秒時才刷新
      if (hasExpired && now - lastRefreshTimeRef.current > 10000) {
        lastRefreshTimeRef.current = now;
        // 使用 setTimeout 延遲刷新，避免在 useEffect 中直接調用
        setTimeout(() => {
          fetchOrders();
        }, 100);
      }
    }, 1000); // 每秒更新一次

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(data.orders);
      // 重置倒计时状态
      setTimeRemaining({});
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

  const handleSubmitReview = async (orderId: number, sellerId: number) => {
    if (!reviewScore || reviewScore < 1 || reviewScore > 5) {
      alert('請選擇評分（1-5 分）');
      return;
    }

    try {
      setProcessingId(orderId);
      await createReview({
        orderId,
        revieweeId: sellerId,
        score: reviewScore,
        comment: reviewComment.trim() || '',
      });
      alert('評價成功！');
      setReviewingOrderId(null);
      setReviewScore(5);
      setReviewComment('');
      fetchOrders();
    } catch (error: any) {
      alert(error.message || '評價失敗');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitCase = async (orderId: number) => {
    if (!caseType) {
      alert('請選擇申訴類型');
      return;
    }

    try {
      setProcessingId(orderId);
      await createCase({
        orderId,
        type: caseType,
      });
      alert('申訴案件已提交！');
      setCasingOrderId(null);
      setCaseType('Other');
      fetchOrders();
    } catch (error: any) {
      alert(error.message || '提交申訴失敗');
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
                    <div className="space-y-4">
                      {order.hasReviewed ? (
                        <div className="flex items-center justify-end text-green-400">
                          <Check size={18} className="mr-2" />
                          <span>交易已完成 · 已評價</span>
                        </div>
                      ) : reviewingOrderId === order.orderId ? (
                        <div className="p-4 rounded-xl bg-[#1a1a25] border border-gray-700">
                          <h4 className="text-white font-medium mb-4">評價賣家</h4>
                          <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">評分</label>
                            <div className="flex items-center space-x-2">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => setReviewScore(score)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    reviewScore >= score
                                      ? 'text-yellow-400 bg-yellow-400/20'
                                      : 'text-gray-600 bg-gray-800'
                                  }`}
                                >
                                  <Star
                                    size={24}
                                    className={reviewScore >= score ? 'fill-current' : ''}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-gray-400 text-sm">
                                {reviewScore} 分
                              </span>
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">評論（選填）</label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="分享您的購買體驗..."
                              className="w-full px-4 py-2 bg-[#12121a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                              rows={3}
                              maxLength={200}
                            />
                            <p className="text-gray-500 text-xs mt-1">
                              {reviewComment.length}/200
                            </p>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setReviewingOrderId(null);
                                setReviewScore(5);
                                setReviewComment('');
                              }}
                              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => {
                                const sellerId = order.items[0]?.sellerId;
                                if (sellerId) {
                                  handleSubmitReview(order.orderId, sellerId);
                                } else {
                                  alert('無法獲取賣家資訊');
                                }
                              }}
                              disabled={processingId === order.orderId || !order.items[0]?.sellerId}
                              className="btn-primary px-4 py-2 disabled:opacity-50"
                            >
                              {processingId === order.orderId ? '提交中...' : '提交評價'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-4">
                          <div className="flex items-center text-green-400">
                            <Check size={18} className="mr-2" />
                            <span>交易已完成</span>
                          </div>
                          <button
                            onClick={() => setReviewingOrderId(order.orderId)}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <Star size={18} />
                            <span>評價賣家</span>
                          </button>
                        </div>
                      )}

                      {/* Case Section */}
                      {order.hasCase ? (
                        <div className="flex items-center justify-end text-blue-400">
                          <AlertCircle size={18} className="mr-2" />
                          <span>已提交申訴案件</span>
                        </div>
                      ) : casingOrderId === order.orderId ? (
                        <div className="p-4 rounded-xl bg-[#1a1a25] border border-gray-700">
                          <h4 className="text-white font-medium mb-4">提交申訴案件</h4>
                          <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">申訴類型 *</label>
                            <select
                              value={caseType}
                              onChange={(e) => setCaseType(e.target.value as 'Fraud' | 'Delivery' | 'Refund' | 'Other')}
                              className="w-full px-4 py-2 bg-[#12121a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                            >
                              <option value="Fraud">詐欺</option>
                              <option value="Delivery">配送問題</option>
                              <option value="Refund">退款</option>
                              <option value="Other">其他</option>
                            </select>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setCasingOrderId(null);
                                setCaseType('Other');
                              }}
                              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSubmitCase(order.orderId)}
                              disabled={processingId === order.orderId}
                              className="btn-primary px-4 py-2 disabled:opacity-50"
                            >
                              {processingId === order.orderId ? '提交中...' : '提交申訴'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setCasingOrderId(order.orderId)}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <AlertCircle size={18} />
                            <span>提出申訴</span>
                          </button>
                        </div>
                      )}
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

