import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getEvents, Event } from '../services/api';
import { 
  Ticket, 
  Shield, 
  Zap, 
  ChevronRight,
  Calendar,
  MapPin,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setFeaturedEvents(data.events.slice(0, 4));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const features = [
    {
      icon: Shield,
      title: '安全可靠',
      description: '完善的身分驗證機制，確保每筆交易安全透明',
    },
    {
      icon: Zap,
      title: '即時交易',
      description: '快速的票券轉移系統，付款後立即完成所有權移轉',
    },
    {
      icon: TrendingUp,
      title: '價格透明',
      description: '清楚標示原價與售價，讓您做出明智的購買決策',
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/80 via-[#0a0a0f] to-accent-950/50"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float delay-300"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-slide-up">
              <span className="gradient-text">Encore</span>
              <br />
              <span className="text-white">二手票券交易平台</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 animate-slide-up delay-100">
              將分散在各大社群媒體上的買賣需求集中起來，
              <br className="hidden sm:block" />
              提供一個透明、便利且值得信賴的票券交易環境。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up delay-200">
              <Link
                to="/tickets"
                className="btn-primary inline-flex items-center justify-center space-x-2"
              >
                <Ticket size={20} />
                <span>瀏覽票券</span>
              </Link>
              <Link
                to="/events"
                className="btn-secondary inline-flex items-center justify-center space-x-2"
              >
                <Calendar size={20} />
                <span>探索活動</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              為什麼選擇 Encore？
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              我們致力於打造最安全、最便捷的二手票券交易體驗
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-hover p-8 rounded-2xl bg-[#12121a] border border-gray-800 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                熱門活動
              </h2>
              <p className="text-gray-400">探索即將舉行的演唱會與活動</p>
            </div>
            <Link
              to="/events"
              className="hidden sm:flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <span>查看全部</span>
              <ChevronRight size={20} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event, index) => (
                <Link
                  key={event.eventId}
                  to={`/events/${event.eventId}`}
                  className="group card-hover rounded-2xl bg-[#12121a] border border-gray-800 overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-900/50 to-accent-900/50">
                    {event.imageUrl && !imageErrors.has(event.eventId) ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(event.eventId));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-display font-bold text-white/20 mb-2">
                            {event.artist.charAt(0)}
                          </div>
                          <div className="text-sm text-gray-500">{event.venue.city}</div>
                        </div>
                      </div>
                    )}
                    {event.availableTickets > 0 && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium backdrop-blur-sm">
                        {event.availableTickets} 張可售
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{event.artist}</p>
                    <div className="flex items-center text-gray-500 text-sm space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mt-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{event.venue.name}</span>
                    </div>
                    {event.priceRange.min && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <span className="text-gray-400 text-sm">票價從</span>
                        <span className="text-primary-400 font-semibold ml-2">
                          NT$ {event.priceRange.min.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="sm:hidden mt-8 text-center">
            <Link
              to="/events"
              className="inline-flex items-center space-x-2 text-primary-400"
            >
              <span>查看全部活動</span>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-900/50 to-accent-900/50 p-12 md:p-20 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
            <div className="relative text-center">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                準備好開始交易了嗎？
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                加入 Encore，成為我們社群的一份子，
                安全便捷地買賣二手票券。
              </p>
              <Link
                to="/register"
                className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4"
              >
                <span>立即註冊</span>
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

