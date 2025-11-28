import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus } from 'lucide-react';

export default function BusinessTicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.roles.includes('BusinessOperator')) {
      navigate('/business/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (!user || !user.roles.includes('BusinessOperator')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">管理票券</h1>
          <p className="text-gray-400">建立和管理您的票券</p>
        </div>

        <button
          onClick={() => navigate('/business/tickets/create')}
          className="btn-primary mb-6 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>建立新票券</span>
        </button>

        <div className="text-center py-20 text-gray-400">
          <Ticket className="mx-auto mb-4 text-gray-600" size={48} />
          <p>票券管理功能開發中</p>
        </div>
      </div>
    </div>
  );
}

