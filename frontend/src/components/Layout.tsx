import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Ticket, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShoppingBag, 
  Tag,
  Home,
  Building2
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: '首頁', icon: Home },
    { to: '/events', label: '探索活動', icon: Calendar },
    { to: '/tickets', label: '瀏覽票券', icon: Ticket },
  ];

  const isBusinessOperator = user?.roles?.includes('BusinessOperator');
  const isRegularUser = user?.roles?.includes('User') && !isBusinessOperator;

  const userLinks = user ? (
    isBusinessOperator
      ? [{ to: '/business/dashboard', label: '業務儀表板', icon: Building2 }]
      : [
          { to: '/my-tickets', label: '我的票券', icon: Ticket },
          { to: '/my-listings', label: '我的上架', icon: Tag },
          { to: '/my-orders', label: '我的訂單', icon: ShoppingBag },
        ]
  ) : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="font-display font-bold text-xl text-white">Encore</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-1">
                    {userLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive(link.to)
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <link.icon size={16} />
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="h-6 w-px bg-gray-700"></div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <User size={18} />
                      <span className="text-sm">{user.name}</span>
                      {isBusinessOperator && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400">
                          業務經營者
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                      title="登出"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white transition-colors px-4 py-2"
                  >
                    登入
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    註冊
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive(link.to)
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
              {user && (
                <>
                  <div className="h-px bg-gray-800 my-2"></div>
                  {userLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                        isActive(link.to)
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5"
                  >
                    <LogOut size={20} />
                    <span>登出</span>
                  </button>
                </>
              )}
              {!user && (
                <>
                  <div className="h-px bg-gray-800 my-2"></div>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-300"
                  >
                    登入
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-primary-400"
                  >
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
              <span className="font-display font-semibold text-white">Encore</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Encore. 二手票券交易平台 - 資料庫管理期末專案
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

