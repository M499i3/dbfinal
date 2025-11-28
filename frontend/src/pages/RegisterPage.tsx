import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, Building2, Users } from 'lucide-react';

export default function RegisterPage() {
  const { register, registerBusinessOperator } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'user' | 'business'>('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    setLoading(true);

    try {
      if (userType === 'business') {
        await registerBusinessOperator(
          formData.name,
          formData.email,
          formData.phone,
          formData.password
        );
      } else {
        await register(formData.name, formData.email, formData.phone, formData.password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Side - Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-900/30 to-accent-900/30 items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-8 animate-float">
            <span className="text-white font-display font-bold text-6xl">E</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            加入 Encore
          </h2>
          <p className="text-gray-400 max-w-md">
            成為我們社群的一份子，享受安全便捷的票券交易體驗
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            返回首頁
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              建立帳戶
            </h1>
            <p className="text-gray-400">註冊成為 Encore 會員</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-3">選擇帳戶類型</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('user')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  userType === 'user'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 bg-[#12121a] hover:border-gray-600'
                }`}
              >
                <Users className="mx-auto mb-2 text-primary-400" size={24} />
                <div className="text-white font-medium">一般使用者</div>
                <div className="text-gray-500 text-xs mt-1">查詢、購買、管理票券</div>
              </button>
              <button
                type="button"
                onClick={() => setUserType('business')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  userType === 'business'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 bg-[#12121a] hover:border-gray-600'
                }`}
              >
                <Building2 className="mx-auto mb-2 text-primary-400" size={24} />
                <div className="text-white font-medium">業務經營者</div>
                <div className="text-gray-500 text-xs mt-1">管理活動、場館、票券</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm mb-2">姓名</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="您的姓名"
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">電子郵件</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">電話號碼</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="至少 6 個字元"
                  required
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">確認密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="再次輸入密碼"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                '建立帳戶'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            已經有帳戶？{' '}
            <Link to="/login" className="text-primary-400 hover:underline">
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

