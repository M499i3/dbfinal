import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft } from 'lucide-react';
import { getVenueById, updateVenue } from '../services/api';

export default function BusinessEditVenuePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchVenueData();
    }
  }, [id]);

  const fetchVenueData = async () => {
    if (!id) {
      setError('無效的場館ID');
      setFetchLoading(false);
      return;
    }

    try {
      const response = await getVenueById(Number(id));
      const venue = response.venue;
      
      if (venue) {
        setFormData({
          name: venue.name,
          city: venue.city,
          address: venue.address,
        });
      } else {
        setError('場館不存在');
      }
    } catch (err: any) {
      console.error('Error fetching venue:', err);
      setError(err.message || '獲取場館資料失敗');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateVenue(Number(id), {
        name: formData.name,
        city: formData.city,
        address: formData.address,
      });

      // 成功後返回場館列表
      navigate('/business/venues');
    } catch (err: any) {
      setError(err.message || '更新場館失敗');
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

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">編輯場館</h1>
          <p className="text-gray-400">更新場地資訊</p>
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
                {loading ? '更新中...' : '更新場館'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

