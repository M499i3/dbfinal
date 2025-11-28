import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getAvailableTickets, EventDetail, Ticket } from '../services/api';
import { Calendar, MapPin, Clock, ChevronLeft, Ticket as TicketIcon, Star } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [eventData, ticketData] = await Promise.all([
          getEventById(parseInt(id)),
          getAvailableTickets({ eventId: id.toString() }),
        ]);
        setEvent(eventData);
        setTickets(ticketData.tickets);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const filteredTickets = selectedZone
    ? tickets.filter((t) => Number(t.zone.zoneId) === Number(selectedZone))
    : tickets;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">找不到活動</h2>
          <Link to="/events" className="text-primary-400 hover:underline">
            返回活動列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/events"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回活動列表</span>
        </Link>

        {/* Event Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden h-64">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-900/50 to-accent-900/50 flex items-end p-8">
                  <div className="absolute top-8 right-8 text-8xl font-display font-bold text-white/10">
                    {event.artist.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                    {event.title}
                  </h1>
                  <p className="text-xl text-primary-400">{event.artist}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#12121a] border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">活動資訊</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-primary-400 mt-1" />
                <div>
                  <p className="text-white">{formatDate(event.eventDate)}</p>
                  <p className="text-gray-500 text-sm">活動日期</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary-400 mt-1" />
                <div>
                  <p className="text-white">
                    {event.startTime} - {event.endTime}
                  </p>
                  <p className="text-gray-500 text-sm">活動時間</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-400 mt-1" />
                <div>
                  <p className="text-white">{event.venue.name}</p>
                  <p className="text-gray-500 text-sm">{event.venue.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Zones */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-6">座位區域</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedZone(null)}
              className={`p-4 rounded-xl border transition-all ${
                selectedZone === null
                  ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                  : 'bg-[#12121a] border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="text-sm font-medium">全部區域</div>
              <div className="text-lg font-semibold mt-1">{tickets.length} 張</div>
            </button>
            {event.seatZones.map((zone) => (
              <button
                key={zone.zoneId}
                onClick={() => setSelectedZone(zone.zoneId)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedZone === zone.zoneId
                    ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                    : 'bg-[#12121a] border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{zone.name}</div>
                <div className="text-lg font-semibold mt-1">
                  {zone.availableTickets} 張
                </div>
                {zone.priceRange.min && (
                  <div className="text-xs text-gray-500 mt-1">
                    NT$ {zone.priceRange.min.toLocaleString()} 起
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Available Tickets */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            可購買票券 ({filteredTickets.length})
          </h2>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#12121a] border border-gray-800">
              <TicketIcon className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400">此區域目前沒有可購買的票券</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.ticketId}
                  className="card-hover rounded-2xl bg-[#12121a] border border-gray-800 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium mb-2">
                        {ticket.zone.name}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        座位 {ticket.seatLabel}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-400">
                        NT$ {ticket.listing.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        原價 NT$ {ticket.faceValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                        {ticket.listing.seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-white">{ticket.listing.seller.name}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star size={12} className="text-yellow-500 mr-1" />
                          <span>{ticket.listing.seller.rating}</span>
                          <span className="mx-1">·</span>
                          <span>{ticket.listing.seller.reviewCount} 則評價</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/tickets?eventId=${event.eventId}&ticketId=${ticket.ticketId}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      購買
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

