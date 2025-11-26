import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, Event } from '../services/api';
import { Calendar, MapPin, Search, Filter } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Scheduled: 'bg-green-500/20 text-green-400',
      Finished: 'bg-gray-500/20 text-gray-400',
      Cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      Scheduled: '即將舉行',
      Finished: '已結束',
      Cancelled: '已取消',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            探索活動
          </h1>
          <p className="text-gray-400">
            瀏覽所有即將舉行的演唱會與活動
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="搜尋活動、藝人或場館..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-12 pr-8 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">全部狀態</option>
              <option value="Scheduled">即將舉行</option>
              <option value="Finished">已結束</option>
              <option value="Cancelled">已取消</option>
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-800"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">找不到活動</h3>
            <p className="text-gray-400">
              {searchTerm ? '嘗試使用不同的關鍵字搜尋' : '目前沒有任何活動'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <Link
                key={event.eventId}
                to={`/events/${event.eventId}`}
                className="group card-hover rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-48 bg-gradient-to-br from-primary-900/50 to-accent-900/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-display font-bold text-white/20 mb-2">
                      {event.artist.charAt(0)}
                    </div>
                    <div className="text-sm text-gray-500">{event.venue.city}</div>
                  </div>
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(event.status)}
                  </div>
                  {event.availableTickets > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                      {event.availableTickets} 張可售
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{event.artist}</p>
                  <div className="space-y-2 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{formatDate(event.eventDate)}</span>
                      <span className="text-gray-600">|</span>
                      <span>{event.startTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} />
                      <span>{event.venue.name}</span>
                    </div>
                  </div>
                  {event.priceRange.min && (
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                      <div>
                        <span className="text-gray-500 text-sm">票價從</span>
                        <span className="text-primary-400 font-semibold ml-2">
                          NT$ {event.priceRange.min.toLocaleString()}
                        </span>
                      </div>
                      {event.priceRange.max && event.priceRange.max !== event.priceRange.min && (
                        <div className="text-gray-500 text-sm">
                          ~ NT$ {event.priceRange.max.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

