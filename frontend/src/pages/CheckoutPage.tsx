import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  Wallet, 
  CheckCircle,
  Ticket,
  Calendar,
  MapPin,
  User,
  Shield,
  DollarSign
} from 'lucide-react';

interface TicketData {
  ticketId: number;
  seatLabel: string;
  faceValue: number;
  event: {
    eventId: number;
    artist: string;
    title: string;
    eventDate: string;
    startTime: string;
  };
  zone: {
    zoneId: number;
    name: string;
  };
  listing: {
    listingId: number;
    price: number;
    seller: {
      sellerId: number;
      name: string;
      rating: string;
      reviewCount: number;
    };
  };
}

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');
  const ticketId = searchParams.get('ticketId');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'Bank' | 'Wallet'>('CreditCard');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listingId || !ticketId) {
      navigate('/tickets');
      return;
    }
    fetchTicketData();
  }, [listingId, ticketId, user]);

  const fetchTicketData = async () => {
    try {
      const response = await fetch(`/api/tickets?listingId=${listingId}&ticketId=${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.tickets && data.tickets.length > 0) {
          setTicketData(data.tickets[0]);
        } else {
          alert('票券不存在或已售出');
          navigate('/tickets');
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('載入失敗');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!ticketData) return;
    
    setProcessing(true);
    
    try {
      // Step 1: Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{
            listingId: ticketData.listing.listingId,
            ticketId: ticketData.ticketId,
          }],
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        alert(error.error || '建立訂單失敗');
        setProcessing(false);
        return;
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.orderId;

      // Step 2: Process payment
      const paymentResponse = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: paymentMethod,
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        alert(error.error || '付款失敗');
        setProcessing(false);
        return;
      }

      // Success!
      alert('購買成功！');
      navigate('/my-orders');
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('購買失敗，請稍後再試');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">票券不存在</p>
          <button onClick={() => navigate('/tickets')} className="btn-primary">
            返回票券列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: '確認訂單' },
              { num: 2, label: '選擇付款方式' },
              { num: 3, label: '完成付款' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.num 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white/5 text-gray-500'
                } font-medium`}>
                  {currentStep > step.num ? <CheckCircle size={20} /> : step.num}
                </div>
                <span className={`ml-3 text-sm ${
                  currentStep >= step.num ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.num ? 'bg-primary-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Order Confirmation */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">確認訂單資訊</h2>
            
            {/* Ticket Details */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary-400" />
                票券資訊
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-lg">{ticketData.event.title}</p>
                    <p className="text-gray-400 text-sm">{ticketData.event.artist}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300">
                      {new Date(ticketData.event.eventDate).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300">{ticketData.zone.name}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">座位</span>
                    <span className="text-white font-medium">{ticketData.seatLabel}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">面額</span>
                    <span className="text-gray-300">NT$ {ticketData.faceValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">售價</span>
                    <span className="text-primary-400 font-bold text-xl">
                      NT$ {ticketData.listing.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                賣家資訊
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{ticketData.listing.seller.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400">
                      {'⭐'.repeat(Math.round(parseFloat(ticketData.listing.seller.rating)))}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {ticketData.listing.seller.rating} ({ticketData.listing.seller.reviewCount} 評價)
                    </span>
                  </div>
                </div>
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 backdrop-blur-sm rounded-lg border border-primary-500/30 p-6">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">訂單總額</span>
                <span className="text-primary-400 font-bold text-3xl">
                  NT$ {ticketData.listing.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-lg font-medium text-lg hover:from-primary-600 hover:to-accent-600 transition-all"
            >
              繼續
            </button>
          </div>
        )}

        {/* Step 2: Payment Method Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">選擇付款方式</h2>

            {/* Payment Methods */}
            <div className="space-y-4">
              <button
                onClick={() => setPaymentMethod('CreditCard')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'CreditCard'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'CreditCard' ? 'bg-primary-500' : 'bg-white/10'
                  }`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">信用卡 / 金融卡</p>
                    <p className="text-gray-400 text-sm">Visa, Mastercard, JCB</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('Bank')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'Bank'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'Bank' ? 'bg-primary-500' : 'bg-white/10'
                  }`}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">銀行轉帳</p>
                    <p className="text-gray-400 text-sm">ATM 轉帳、網路銀行</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('Wallet')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'Wallet'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'Wallet' ? 'bg-primary-500' : 'bg-white/10'
                  }`}>
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">電子錢包</p>
                    <p className="text-gray-400 text-sm">Line Pay, 街口支付, Apple Pay</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card Details (if credit card selected) */}
            {paymentMethod === 'CreditCard' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 space-y-4">
                <h3 className="text-white font-medium mb-4">信用卡資訊</h3>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">卡號</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={19}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">持卡人姓名</label>
                  <input
                    type="text"
                    placeholder="WANG DA MING"
                    value={cardDetails.cardName}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">有效期限</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiryDate}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">安全碼 (CVV)</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-lg font-medium hover:bg-white/10 transition-all"
              >
                上一步
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 transition-all"
              >
                繼續
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">確認付款</h2>

            {/* Order Summary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">訂單摘要</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">活動</span>
                  <span className="text-white">{ticketData.event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">座位</span>
                  <span className="text-white">{ticketData.zone.name} {ticketData.seatLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">賣家</span>
                  <span className="text-white">{ticketData.listing.seller.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">付款方式</span>
                  <span className="text-white">
                    {paymentMethod === 'CreditCard' && '信用卡'}
                    {paymentMethod === 'Bank' && '銀行轉帳'}
                    {paymentMethod === 'Wallet' && '電子錢包'}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/10">
                  <span className="text-white font-medium">應付金額</span>
                  <span className="text-primary-400 font-bold text-xl">
                    NT$ {ticketData.listing.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-400 font-medium mb-1">安全交易保障</p>
                  <p className="text-green-400/70">
                    您的付款由平台保管，確認收到票券後才會轉給賣家
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>注意事項：</strong>
              </p>
              <ul className="text-yellow-400/80 text-sm mt-2 space-y-1 ml-4">
                <li>• 付款後無法取消，請確認資訊正確</li>
                <li>• 票券將在付款後24小時內轉移</li>
                <li>• 如有問題請在7天內提出申訴</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={processing}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-lg font-medium hover:bg-white/10 transition-all disabled:opacity-50"
              >
                上一步
              </button>
              <button
                onClick={handlePurchase}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    處理中...
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    確認付款
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


