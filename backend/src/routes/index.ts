import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { getAllEvents, getEventById } from '../controllers/eventController.js';
import { getAvailableTickets, getMyTickets, createTicket } from '../controllers/ticketController.js';
import { createListing, getMyListings, cancelListing } from '../controllers/listingController.js';
import { createOrder, getMyOrders, payOrder, cancelOrder } from '../controllers/orderController.js';
import { createReview, getUserReviews } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ==================== 認證路由 ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', authenticate, getProfile);

// ==================== 活動路由 ====================
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);

// ==================== 票券路由 ====================
router.get('/tickets', getAvailableTickets);
router.get('/tickets/my', authenticate, getMyTickets);
router.post('/tickets', authenticate, createTicket);

// ==================== 上架路由 ====================
router.post('/listings', authenticate, createListing);
router.get('/listings/my', authenticate, getMyListings);
router.delete('/listings/:id', authenticate, cancelListing);

// ==================== 訂單路由 ====================
router.post('/orders', authenticate, createOrder);
router.get('/orders/my', authenticate, getMyOrders);
router.post('/orders/:id/pay', authenticate, payOrder);
router.post('/orders/:id/cancel', authenticate, cancelOrder);

// ==================== 評價路由 ====================
router.post('/reviews', authenticate, createReview);
router.get('/users/:userId/reviews', getUserReviews);

// ==================== 健康檢查 ====================
router.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

