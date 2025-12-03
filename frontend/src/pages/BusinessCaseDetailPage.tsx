import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, User, ShoppingCart, Calendar, CheckCircle, PlayCircle, Ban, DollarSign, MessageSquare, Send } from 'lucide-react';

interface CaseNote {
  note_id: number;
  note_type: string;
  content: string;
  is_internal: boolean;
  operator_name: string;
  created_at: string;
}

interface CaseDetail {
  case_id: number;
  order_id: number;
  reporter_id: number;
  reporter_name: string;
  reporter_email: string;
  type: string;
  description: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  resolution: string | null;
  order_details: {
    buyer_id: number;
    buyer_name: string;
    buyer_email: string;
    seller_id: number;
    seller_name: string;
    seller_email: string;
    total_amount: number;
    order_status: string;
    created_at: string;
  };
  tickets: Array<{
    ticket_id: number;
    event_title: string;
    seat_label: string;
    price: number;
  }>;
}

export default function BusinessCaseDetailPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    refundAmount: '',
    refundReason: '',
    refundType: 'full',
  });
  const [noteForm, setNoteForm] = useState({
    noteType: 'Investigation',
    content: '',
    isInternal: true,
  });

  useEffect(() => {
    fetchCaseDetail();
    fetchNotes();
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      const response = await fetch(`/api/business/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCaseData(data.case);
        // Pre-fill refund amount with order total
        if (data.case.order_details?.total_amount) {
          setRefundForm(prev => ({
            ...prev,
            refundAmount: data.case.order_details.total_amount.toString(),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/business/cases/${id}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleStartProcessing = async () => {
    if (!confirm('確定要開始處理此案件嗎？')) return;

    try {
      const response = await fetch(`/api/business/cases/${id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('案件已標記為處理中');
        fetchCaseDetail();
      }
    } catch (error) {
      console.error('Error starting case:', error);
      alert('操作失敗');
    }
  };

  const handleClose = async () => {
    const resolution = prompt('請輸入結案說明：');
    if (!resolution) return;

    try {
      const response = await fetch(`/api/business/cases/${id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        alert('案件已結案');
        navigate('/business/cases');
      }
    } catch (error) {
      console.error('Error closing case:', error);
      alert('結案失敗');
    }
  };

  const handleRefund = async () => {
    if (!refundForm.refundAmount || !refundForm.refundReason) {
      alert('請填寫退款金額和原因');
      return;
    }

    if (!confirm(`確定要退款 NT$${refundForm.refundAmount} 給買家嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/business/cases/${id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(refundForm),
      });

      if (response.ok) {
        alert('退款處理成功');
        setShowRefundModal(false);
        fetchCaseDetail();
        fetchNotes();
      } else {
        const error = await response.json();
        alert(error.error || '退款失敗');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('退款失敗');
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) {
      alert('請輸入備註內容');
      return;
    }

    try {
      const response = await fetch(`/api/business/cases/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteForm),
      });

      if (response.ok) {
        setNoteForm({ noteType: 'Investigation', content: '', isInternal: true });
        fetchNotes();
      } else {
        const error = await response.json();
        alert(error.error || '新增備註失敗');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('新增備註失敗');
    }
  };

  const handleAddToBlacklist = async (userId: number, userName: string) => {
    const reason = prompt(`確定要將 ${userName} 加入黑名單嗎？請輸入原因：`);
    if (!reason) return;

    try {
      const response = await fetch(`/api/business/users/${userId}/blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('已加入黑名單');
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      alert('操作失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      Open: { label: '待處理', color: 'bg-yellow-500/20 text-yellow-400' },
      InProgress: { label: '處理中', color: 'bg-blue-500/20 text-blue-400' },
      Closed: { label: '已結案', color: 'bg-gray-500/20 text-gray-400' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getCaseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      Fraud: '詐欺',
      Delivery: '交付問題',
      Refund: '退款',
      Other: '其他',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/business/cases')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回案件列表
          </button>
          <div className="text-center py-20 text-gray-400">
            <p>案件不存在</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate('/business/cases')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          返回案件列表
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-display font-bold text-white">案件 #{caseData.case_id}</h1>
            {getStatusBadge(caseData.status)}
          </div>
          <p className="text-gray-400">申訴類型：{getCaseTypeLabel(caseData.type)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Description */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                申訴內容
              </h2>
              <div className="bg-black/20 rounded-lg p-4">
                <p className="text-white leading-relaxed">{caseData.description || '無描述'}</p>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                申訴人資訊
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">姓名</span>
                  <span className="text-white">{caseData.reporter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">電子郵件</span>
                  <span className="text-white">{caseData.reporter_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">用戶ID</span>
                  <span className="text-white">#{caseData.reporter_id}</span>
                </div>
              </div>
              <button
                onClick={() => handleAddToBlacklist(caseData.reporter_id, caseData.reporter_name)}
                className="mt-4 w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-colors"
              >
                <Ban size={16} />
                <span>加入黑名單</span>
              </button>
            </div>

            {/* Order Info - Comprehensive */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                訂單完整資訊
              </h2>
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">訂單編號</span>
                    <span className="text-white font-medium">#{caseData.order_id}</span>
                  </div>
                  {caseData.order_details && (
                    <>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">買家資訊</p>
                          <p className="text-white font-medium">{caseData.order_details.buyer_name}</p>
                          <p className="text-gray-400 text-xs">{caseData.order_details.buyer_email}</p>
                          <p className="text-gray-500 text-xs mt-1">ID: #{caseData.order_details.buyer_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">賣家資訊</p>
                          <p className="text-white font-medium">{caseData.order_details.seller_name}</p>
                          <p className="text-gray-400 text-xs">{caseData.order_details.seller_email}</p>
                          <p className="text-gray-500 text-xs mt-1">ID: #{caseData.order_details.seller_id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 mt-3">
                        <div>
                          <p className="text-gray-500 text-xs">訂單金額</p>
                          <p className="text-white font-bold text-lg">
                            NT$ {caseData.order_details.total_amount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">訂單狀態</p>
                          <p className="text-white">{caseData.order_details.order_status}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10 mt-3">
                        <p className="text-gray-500 text-xs">訂單建立時間</p>
                        <p className="text-gray-300 text-sm">
                          {new Date(caseData.order_details.created_at).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tickets */}
            {caseData.tickets && caseData.tickets.length > 0 && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">涉及票券</h2>
                <div className="space-y-2">
                  {caseData.tickets.map((ticket) => (
                    <div key={ticket.ticket_id} className="bg-black/20 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white">{ticket.event_title}</span>
                        <span className="text-gray-400">#{ticket.ticket_id}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400">{ticket.seat_label}</span>
                        <span className="text-white">NT$ {ticket.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                案件時間軸
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400 text-sm">建立時間</span>
                  <p className="text-white">{new Date(caseData.opened_at).toLocaleString('zh-TW')}</p>
                </div>
                {caseData.closed_at && (
                  <div>
                    <span className="text-gray-400 text-sm">結案時間</span>
                    <p className="text-white">{new Date(caseData.closed_at).toLocaleString('zh-TW')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                內部備註 ({notes.length})
              </h2>
              
              {/* Add Note Form */}
              {caseData.status !== 'Closed' && (
                <div className="mb-4 space-y-3">
                  <select
                    value={noteForm.noteType}
                    onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Investigation">調查紀錄</option>
                    <option value="Communication">溝通紀錄</option>
                    <option value="Decision">決策紀錄</option>
                    <option value="Other">其他</option>
                  </select>
                  
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="輸入備註內容（僅內部可見）..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  
                  <button
                    onClick={handleAddNote}
                    className="w-full bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg py-2 px-4 flex items-center justify-center space-x-2 hover:bg-primary-500/30 transition-colors text-sm"
                  >
                    <Send size={16} />
                    <span>新增備註</span>
                  </button>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">尚無備註</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.note_id} className="bg-black/20 rounded-lg p-3 text-sm border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-primary-400 font-medium">{note.operator_name}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(note.created_at).toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                          {note.note_type}
                        </span>
                        {note.is_internal && (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                            內部
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            {caseData.status !== 'Closed' && (
              <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">處理操作</h2>
                <div className="space-y-3">
                  {caseData.status === 'Open' && (
                    <button
                      onClick={handleStartProcessing}
                      className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-blue-500/30 transition-colors font-medium"
                    >
                      <PlayCircle size={20} />
                      <span>開始處理</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-orange-500/30 transition-colors font-medium"
                  >
                    <DollarSign size={20} />
                    <span>處理退款</span>
                  </button>
                  
                  <button
                    onClick={handleClose}
                    className="w-full bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-green-500/30 transition-colors font-medium"
                  >
                    <CheckCircle size={20} />
                    <span>結案</span>
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-white font-medium mb-3 text-sm">帳號處罰</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToBlacklist(caseData.reporter_id, caseData.reporter_name)}
                      className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-colors"
                    >
                      <Ban size={16} />
                      <span>將申訴人加入黑名單</span>
                    </button>
                    {caseData.order_details && (
                      <>
                        <button
                          onClick={() => handleAddToBlacklist(caseData.order_details.buyer_id, caseData.order_details.buyer_name)}
                          className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-colors"
                        >
                          <Ban size={16} />
                          <span>將買家加入黑名單</span>
                        </button>
                        <button
                          onClick={() => handleAddToBlacklist(caseData.order_details.seller_id, caseData.order_details.seller_name)}
                          className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm py-2 px-4 flex items-center justify-center space-x-2 hover:bg-red-500/20 transition-colors"
                        >
                          <Ban size={16} />
                          <span>將賣家加入黑名單</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2e] rounded-lg border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-white mb-4">處理退款</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">退款類型</label>
                  <select
                    value={refundForm.refundType}
                    onChange={(e) => setRefundForm({ ...refundForm, refundType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="full">全額退款（買家勝訴）</option>
                    <option value="partial">部分退款（協商解決）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">退款金額 (NT$)</label>
                  <input
                    type="number"
                    value={refundForm.refundAmount}
                    onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="輸入退款金額"
                  />
                  {caseData.order_details && (
                    <p className="text-gray-500 text-xs mt-1">
                      訂單總額: NT$ {caseData.order_details.total_amount?.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">退款原因（必填）</label>
                  <textarea
                    value={refundForm.refundReason}
                    onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="請詳細說明退款原因，確保公平性..."
                  />
                  <p className="text-yellow-400 text-xs mt-2">
                    ⚠️ 退款原因將記錄在系統中，請確保處理公平
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-white hover:bg-white/10 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRefund}
                    className="flex-1 bg-orange-500 rounded-lg py-2 text-white font-medium hover:bg-orange-600 transition-colors"
                  >
                    確認退款
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

