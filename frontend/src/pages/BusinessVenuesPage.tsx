import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit } from 'lucide-react';

interface Venue {
  venue_id: number;
  name: string;
  city: string;
  address: string;
}

export default function BusinessVenuesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
      return;
    }
    fetchVenues();
  }, [user, navigate]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/business/venues', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVenues(data.venues || []);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
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
          <h1 className="text-4xl font-display font-bold text-white mb-2">管理場館</h1>
          <p className="text-gray-400">建立和管理您的場館</p>
        </div>

        <button
          onClick={() => navigate('/business/venues/create')}
          className="btn-primary mb-6 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>建立新場館</span>
        </button>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 className="mx-auto mb-4 text-gray-600" size={48} />
            <p>尚無場館</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue.venue_id}
                className="card-hover p-6 rounded-2xl bg-[#12121a] border border-gray-800"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{venue.name}</h3>
                <p className="text-gray-400 mb-1">{venue.city}</p>
                <p className="text-gray-500 text-sm mb-4">{venue.address}</p>
                <button className="btn-secondary text-sm py-2 w-full flex items-center justify-center space-x-1">
                  <Edit size={16} />
                  <span>編輯</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

