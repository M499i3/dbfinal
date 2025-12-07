import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft } from 'lucide-react';
import { createVenue } from '../services/api';

export default function BusinessCreateVenuePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createVenue({
        name: formData.name,
        city: formData.city,
        address: formData.address,
      });

      // 成功後返回場館列表
      navigate('/business/venues');
    } catch (err: any) {
      setError(err.response?.data?.error || '建立場館失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/business/venues')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回場館列表
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">建立新場館</h1>
          <p className="text-gray-400">新增演出場地資訊</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* 場館名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                場館名稱 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例：台北小巨蛋"
                />
              </div>
            </div>

            {/* 城市 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                城市 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例：台北市"
                />
              </div>
            </div>

            {/* 地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                地址 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例：松山區南京東路四段2號"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/business/venues')}
                className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-white font-medium hover:from-primary-600 hover:to-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '建立中...' : '建立場館'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

