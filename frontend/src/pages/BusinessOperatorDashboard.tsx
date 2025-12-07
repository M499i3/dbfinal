import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Ticket,
  Plus,
  Users,
  DollarSign,
  Shield,
  FileText,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

export default function BusinessOperatorDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalVenues: 0,
    totalTickets: 0,
    transactionVolume: 0,
    activeListings: 0,
    pendingListings: 0,
    openCases: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (user && !user.roles.includes('BusinessOperator')) {
      navigate('/', { replace: true });
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const [statsRes, listingsRes, casesRes, usersRes] = await Promise.all([
        fetch('/api/business/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/business/listings?status=Pending', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/business/cases?status=Open', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/business/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats((prev) => ({
          ...prev,
          ...statsData,
        }));
      }

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setStats((prev) => ({
          ...prev,
          pendingListings: listingsData.listings?.length || 0,
        }));
      }

      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setStats((prev) => ({
          ...prev,
          openCases: casesData.cases?.length || 0,
        }));
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setStats((prev) => ({
          ...prev,
          totalUsers: usersData.users?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  const quickActions = [
    {
      title: '管理場館',
      description: '新增、編輯場館資訊',
      icon: Building2,
      path: '/business/venues',
      color: 'primary',
    },
    {
      title: '管理活動',
      description: '建立、編輯活動資訊',
      icon: Calendar,
      path: '/business/events',
      color: 'accent',
    },
    {
      title: '管理票券',
      description: '建立、管理票券庫存',
      icon: Ticket,
      path: '/business/tickets',
      color: 'green',
    },
    {
      title: '審核上架',
      description: '審核與管理使用者上架',
      icon: FileText,
      path: '/business/listings',
      color: 'blue',
    },
    {
      title: '用戶管理',
      description: '查詢使用者與風險管理',
      icon: Users,
      path: '/business/users',
      color: 'purple',
    },
    {
      title: '交易監控',
      description: '查詢訂單與付款狀態',
      icon: ShoppingBag,
      path: '/business/orders',
      color: 'yellow',
    },
    {
      title: '申訴案件',
      description: '處理爭議交易與申訴',
      icon: AlertTriangle,
      path: '/business/cases',
      color: 'red',
    },
    {
      title: '系統紀錄',
      description: '查看系統活動紀錄',
      icon: Shield,
      path: '/business/logs',
      color: 'gray',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            業務經營者儀表板
          </h1>
          <p className="text-gray-400">管理您的活動、場館、票券與平台運作</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Calendar className="text-primary-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalEvents}</div>
            <div className="text-gray-400 text-sm">總活動數</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Building2 className="text-accent-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalVenues}</div>
            <div className="text-gray-400 text-sm">總場館數</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Ticket className="text-green-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalTickets}</div>
            <div className="text-gray-400 text-sm">總票券數</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <DollarSign className="text-yellow-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              NT$ {stats.transactionVolume.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">交易總額</div>
            <div className="text-gray-500 text-xs mt-1">平台總交易量</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ShoppingBag className="text-green-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.activeListings}</div>
            <div className="text-gray-400 text-sm">活躍上架</div>
            <div className="text-gray-500 text-xs mt-1">目前可購買</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="text-blue-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.pendingListings}</div>
            <div className="text-gray-400 text-sm">待審核上架</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.openCases}</div>
            <div className="text-gray-400 text-sm">待處理申訴</div>
          </div>

          <div className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="text-purple-400" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
            <div className="text-gray-400 text-sm">總使用者數</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">快速操作</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colorClasses: Record<string, string> = {
                primary: 'bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30',
                accent: 'bg-accent-500/20 text-accent-400 group-hover:bg-accent-500/30',
                green: 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30',
                blue: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
                purple: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
                yellow: 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/30',
                red: 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30',
                gray: 'bg-gray-500/20 text-gray-400 group-hover:bg-gray-500/30',
              };

              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800 text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[action.color]} flex items-center justify-center mb-4 transition-colors`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
