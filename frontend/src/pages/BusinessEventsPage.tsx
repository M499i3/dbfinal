import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';

interface Event {
  event_id: number;
  venue_id: number;
  artist: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
  venue_name?: string;
}

export default function BusinessEventsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchEvents();
  }, [user, navigate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/business/events', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">管理活動</h1>
          <p className="text-gray-400">建立和管理您的活動</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/business/events/create')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>建立新活動</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
            <p>尚無活動</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.event_id}
                className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                <p className="text-gray-400 mb-4">{event.artist}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <p>日期: {new Date(event.event_date).toLocaleDateString('zh-TW')}</p>
                  <p>時間: {event.start_time} - {event.end_time}</p>
                  {event.venue_name && <p>場館: {event.venue_name}</p>}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/business/events/${event.event_id}/edit`)}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
                  >
                    <Edit size={16} />
                    <span>編輯</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

