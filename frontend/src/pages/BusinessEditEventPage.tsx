import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';

interface Venue {
  venue_id: number;
  name: string;
  city: string;
  address: string;
}

interface Event {
  event_id: number;
  venue_id: number;
  artist: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function BusinessEditEventPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    venueId: '',
    artist: '',
    title: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    status: 'Scheduled',
  });

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchVenues();
    fetchEventData();
  }, [user, navigate, id]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/business/venues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVenues(data.venues || []);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchEventData = async () => {
    if (!id) {
      setError('無效的活動ID');
      setFetchLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/business/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const event = data.event;
        
        if (event) {
          setFormData({
            venueId: event.venue_id.toString(),
            artist: event.artist,
            title: event.title,
            eventDate: event.event_date.split('T')[0], // Format date
            startTime: event.start_time,
            endTime: event.end_time,
            status: event.status,
          });
        } else {
          setError('活動不存在');
        }
      } else {
        setError('獲取活動資料失敗');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('獲取活動資料失敗');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/business/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate('/business/events');
      } else {
        const error = await response.json();
        alert(error.error || '更新活動失敗');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('更新活動失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/business/events')}
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          返回活動列表
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">編輯活動</h1>
          <p className="text-gray-400">更新活動資訊</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">場館 *</label>
            <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
              <select
                value={formData.venueId}
                onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                required
                className="input-field pr-12 appearance-none cursor-pointer"
              >
                <option value="">選擇場館</option>
                {venues.map((venue) => (
                  <option key={venue.venue_id} value={venue.venue_id}>
                    {venue.name} - {venue.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">藝人/團體 *</label>
            <input
              type="text"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              placeholder="例如：五月天"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">活動標題 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：2025 世界巡迴演唱會"
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">活動日期 *</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">狀態 *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="input-field"
              >
                <option value="Scheduled">即將舉行</option>
                <option value="Finished">已結束</option>
                <option value="Cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">開始時間 *</label>
              <div className="relative">
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">結束時間 *</label>
              <div className="relative">
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" size={20} />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/business/events')}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新活動'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

