const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '請求失敗');
  }

  return response.json();
}

// Events
export const getEvents = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI<{ events: Event[] }>(`/events${query}`);
};

export const getEventById = (id: number) =>
  fetchAPI<EventDetail>(`/events/${id}`);

// Tickets
export const getAvailableTickets = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI<{ tickets: Ticket[] }>(`/tickets${query}`);
};

export const getMyTickets = () =>
  fetchAPI<{ tickets: MyTicket[] }>('/tickets/my');

export const createTicket = (data: CreateTicketData) =>
  fetchAPI<{ message: string; ticket: any }>('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Listings
export const createListing = (data: CreateListingData) =>
  fetchAPI<{ message: string; listingId: number }>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyListings = () =>
  fetchAPI<{ listings: Listing[] }>('/listings/my');

export const cancelListing = (id: number) =>
  fetchAPI<{ message: string }>(`/listings/${id}`, { method: 'DELETE' });

// Orders
export const createOrder = (items: { listingId: number; ticketId: number }[]) =>
  fetchAPI<{ message: string; orderId: number; totalAmount: number }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });

export const getMyOrders = () =>
  fetchAPI<{ orders: Order[] }>('/orders/my');

export const payOrder = (id: number, method: string) =>
  fetchAPI<{ message: string }>(`/orders/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ method }),
  });

export const cancelOrder = (id: number) =>
  fetchAPI<{ message: string }>(`/orders/${id}/cancel`, { method: 'POST' });

// Reviews
export const createReview = (data: CreateReviewData) =>
  fetchAPI<{ message: string; reviewId: number }>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getUserReviews = (userId: number) =>
  fetchAPI<UserReviews>(`/users/${userId}/reviews`);

// Types
export interface Event {
  eventId: number;
  artist: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
  imageUrl?: string;
  venue: {
    venueId: number;
    name: string;
    city: string;
    address: string;
  };
  availableTickets: number;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

export interface EventDetail extends Event {
  seatZones: SeatZone[];
}

export interface SeatZone {
  zoneId: number;
  name: string;
  rowCount: number;
  colCount: number;
  notes: string | null;
  availableTickets: number;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

export interface Ticket {
  ticketId: number;
  seatLabel: string;
  faceValue: number;
  originalVendor: string;
  serialNo: string;
  event: {
    eventId: number;
    artist: string;
    title: string;
    eventDate: string;
    startTime: string;
  };
  zone: {
    zoneId: number;
    name: string;
  };
  listing: {
    listingId: number;
    price: number;
    createdAt?: string;
    seller: {
      sellerId: number;
      name: string;
      rating: string;
      reviewCount: number;
    };
  };
}

export interface MyTicket {
  ticketId: number;
  seatLabel: string;
  faceValue: number;
  originalVendor: string;
  serialNo: string;
  status: string;
  event: {
    eventId: number;
    artist: string;
    title: string;
    eventDate: string;
    startTime: string;
    endTime: string;
  };
  zone: {
    zoneId: number;
    name: string;
  };
  venue: {
    name: string;
    city: string;
  };
}

export interface Listing {
  listingId: number;
  createdAt: string;
  expiresAt: string;
  status: string;
  items: {
    ticketId: number;
    seatLabel: string;
    price: number;
    status: string;
    eventTitle: string;
    artist: string;
    eventDate: string;
    zoneName: string;
  }[];
}

export interface Order {
  orderId: number;
  createdAt: string;
  status: string;
  payment: {
    paymentId: number;
    method: string;
    amount: number | null;
    paidAt: string | null;
    status: string;
  };
  items: {
    ticketId: number;
    seatLabel: string;
    unitPrice: number;
    eventTitle: string;
    artist: string;
    eventDate: string;
    zoneName: string;
    sellerName: string;
  }[];
}

export interface CreateTicketData {
  eventId: number;
  zoneId: number;
  seatLabel: string;
  faceValue: number;
  originalVendor: string;
  serialNo: string;
}

export interface CreateListingData {
  ticketIds: number[];
  prices: number[];
  expiresAt: string;
}

export interface CreateReviewData {
  orderId: number;
  revieweeId: number;
  score: number;
  comment: string;
}

export interface UserReviews {
  averageScore: string | null;
  totalCount: number;
  reviews: {
    reviewId: number;
    score: number;
    comment: string;
    createdAt: string;
    reviewer: {
      userId: number;
      name: string;
    };
  }[];
}

