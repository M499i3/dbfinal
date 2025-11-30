import { Router } from 'express';
import {
  register,
  registerUser,
  registerBusinessOperator,
  login,
  getProfile,
} from '../controllers/authController.js';
import { getAllEvents, getEventById } from '../controllers/eventController.js';
import { getAvailableTickets, getMyTickets, createTicket } from '../controllers/ticketController.js';
import { createListing, getMyListings, cancelListing } from '../controllers/listingController.js';
import { createOrder, getMyOrders, payOrder, cancelOrder } from '../controllers/orderController.js';
import { createReview, getUserReviews } from '../controllers/reviewController.js';
import { getSellerProfile } from '../controllers/userController.js';
import {
  createVenue,
  getMyVenues,
  updateVenue,
  createEvent,
  getMyEvents,
  updateEvent,
  createSeatZone,
  getSeatZonesByVenue,
  createTicketForBusiness,
  getBusinessStats,
} from '../controllers/businessController.js';
import {
  getAllListings,
  getListingDetails,
  takeDownListing,
  getAllUsers,
  getUserDetails,
  addToBlacklist,
  removeFromBlacklist,
  createRiskEvent,
  getAllOrders,
  getOrderDetails,
  getTransactionStats,
  createCase,
  getAllCases,
  updateCaseStatus,
  getSystemLogs,
} from '../controllers/businessManagementController.js';
import { authenticate, requireBusinessOperator } from '../middleware/auth.js';

const router = Router();

// ==================== 認證路由 ====================
router.post('/auth/register', register); // 通用註冊（向後兼容）
router.post('/auth/register/user', registerUser); // 一般使用者註冊
router.post('/auth/register/business', registerBusinessOperator); // 業務經營者註冊
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
router.get('/sellers/:sellerId', getSellerProfile); // 獲取賣家資料

// ==================== 申訴案件路由 ====================
router.post('/cases', authenticate, createCase);

// ==================== 業務經營者路由 ====================
// 場館管理
router.post('/business/venues', authenticate, requireBusinessOperator, createVenue);
router.get('/business/venues', authenticate, requireBusinessOperator, getMyVenues);
router.put('/business/venues/:id', authenticate, requireBusinessOperator, updateVenue);

// 活動管理
router.post('/business/events', authenticate, requireBusinessOperator, createEvent);
router.get('/business/events', authenticate, requireBusinessOperator, getMyEvents);
router.put('/business/events/:id', authenticate, requireBusinessOperator, updateEvent);

// 座位區域管理
router.post('/business/seat-zones', authenticate, requireBusinessOperator, createSeatZone);
router.get('/business/venues/:venueId/seat-zones', authenticate, requireBusinessOperator, getSeatZonesByVenue);

// 票券管理
router.post('/business/tickets', authenticate, requireBusinessOperator, createTicketForBusiness);

// 統計資料
router.get('/business/stats', authenticate, requireBusinessOperator, getBusinessStats);

// ==================== 業務經營者管理路由 ====================
// 票券與刊登管理
router.get('/business/listings', authenticate, requireBusinessOperator, getAllListings);
router.get('/business/listings/:id', authenticate, requireBusinessOperator, getListingDetails);
router.post('/business/listings/:id/take-down', authenticate, requireBusinessOperator, takeDownListing);

// 用戶與風險管理
router.get('/business/users', authenticate, requireBusinessOperator, getAllUsers);
router.get('/business/users/:id', authenticate, requireBusinessOperator, getUserDetails);
router.post('/business/users/:userId/blacklist', authenticate, requireBusinessOperator, addToBlacklist);
router.delete('/business/users/:userId/blacklist', authenticate, requireBusinessOperator, removeFromBlacklist);
router.post('/business/risk-events', authenticate, requireBusinessOperator, createRiskEvent);

// 交易與付款監控
router.get('/business/orders', authenticate, requireBusinessOperator, getAllOrders);
router.get('/business/orders/:id', authenticate, requireBusinessOperator, getOrderDetails);
router.get('/business/transactions/stats', authenticate, requireBusinessOperator, getTransactionStats);

// 申訴案件管理
router.get('/business/cases', authenticate, requireBusinessOperator, getAllCases);
router.put('/business/cases/:id/status', authenticate, requireBusinessOperator, updateCaseStatus);

// 系統紀錄查詢
router.get('/business/logs', authenticate, requireBusinessOperator, getSystemLogs);

// ==================== 健康檢查 ====================
router.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

