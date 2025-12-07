import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TicketsPage from './pages/TicketsPage';
import SellerProfilePage from './pages/SellerProfilePage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyListingsPage from './pages/MyListingsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CheckoutPage from './pages/CheckoutPage';
import BusinessOperatorDashboard from './pages/BusinessOperatorDashboard';
import BusinessEventsPage from './pages/BusinessEventsPage';
import BusinessCreateEventPage from './pages/BusinessCreateEventPage';
import BusinessEditEventPage from './pages/BusinessEditEventPage';
import BusinessVenuesPage from './pages/BusinessVenuesPage';
import BusinessCreateVenuePage from './pages/BusinessCreateVenuePage';
import BusinessEditVenuePage from './pages/BusinessEditVenuePage';
import BusinessTicketsPage from './pages/BusinessTicketsPage';
import BusinessListingsPage from './pages/BusinessListingsPage';
import BusinessListingDetailPage from './pages/BusinessListingDetailPage';
import BusinessUsersPage from './pages/BusinessUsersPage';
import BusinessOrdersPage from './pages/BusinessOrdersPage';
import BusinessCasesPage from './pages/BusinessCasesPage';
import BusinessCaseDetailPage from './pages/BusinessCaseDetailPage';
import BusinessLogsPage from './pages/BusinessLogsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="sellers/:sellerId" element={<SellerProfilePage />} />
        <Route path="my-tickets" element={<MyTicketsPage />} />
        <Route path="my-listings" element={<MyListingsPage />} />
        <Route path="my-orders" element={<MyOrdersPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="business/dashboard" element={<BusinessOperatorDashboard />} />
        <Route path="business/events" element={<BusinessEventsPage />} />
        <Route path="business/events/create" element={<BusinessCreateEventPage />} />
        <Route path="business/events/:id/edit" element={<BusinessEditEventPage />} />
        <Route path="business/venues" element={<BusinessVenuesPage />} />
        <Route path="business/venues/create" element={<BusinessCreateVenuePage />} />
        <Route path="business/venues/:id/edit" element={<BusinessEditVenuePage />} />
        <Route path="business/tickets" element={<BusinessTicketsPage />} />
        <Route path="business/listings" element={<BusinessListingsPage />} />
        <Route path="business/listings/:id" element={<BusinessListingDetailPage />} />
        <Route path="business/users" element={<BusinessUsersPage />} />
        <Route path="business/orders" element={<BusinessOrdersPage />} />
        <Route path="business/cases" element={<BusinessCasesPage />} />
        <Route path="business/cases/:id" element={<BusinessCaseDetailPage />} />
        <Route path="business/logs" element={<BusinessLogsPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;

