// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email_or_phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  first_name: string;
  second_name: string;
  phone: string;
  password: string;
}

export type UserRole = "customer" | "provider" | "admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  secondName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  user_id: string | number;
  first_name: string;
  second_name: string;
  email: string;
  phone: string;
  role: UserRole;
}

/** POST /user/provider — новый JWT с role: provider */
export interface PromoteResponse {
  token: string;
  role: UserRole;
}

export type ProviderApplicationStatus = "pending" | "approved" | "rejected";

/** GET /user/provider/application — заявка текущего пользователя */
export interface ProviderApplication {
  id: string;
  userId: string;
  status: ProviderApplicationStatus;
  documentUrls: string[];
  rejectionReason?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat (REST через gateway + WS напрямую на chat-service) ────────────────

/** Нормализованный диалог после ответа API */
export interface ChatConversationDTO {
  id: number;
  customerId: number;
  providerId: number;
  createdAt: string;
  lastMessageAt?: string | null;
}

export interface ChatMessageDTO {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  mediaUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
  /** react-icons id (e.g. hi2:HiOutlineHome) or legacy image URL */
  icon?: string;
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServiceProviderSummary {
  firstName: string;
  secondName: string;
  avatarUrl?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  priceStart: number;
  categoryId: string;
  photoUrls?: string[];

  providerId: string;
  /** Заполняется на клиенте (GET /users/:id) для карточек каталога. */
  provider?: ServiceProviderSummary;
  isActive: boolean;
  /** Когда gateway начнёт отдавать город (или локацию), фильтр по городу начнёт работать на клиенте. */
  city?: string;
}

export interface ServiceFilters {
  category_id?: number;
  provider_id?: number;
}

export interface CreateServiceRequest {
  title: string;
  description: string;
  price_start: number;
  category_id: number;
  /** Город оказания услуги (фильтр каталога). */
  city: string;
  photo_urls?: string[];
}

export interface CreateServiceResponse {
  id: number;
  title: string;
}

export interface UpdateServiceRequest {
  /** Некоторые бэкенды ожидают id и в теле PUT (совместимо с Postman). */
  id?: string | number;
  title: string;
  description: string;
  price_start: number;
  is_active: boolean;
  city: string;
  photo_urls_to_add?: string[];
  photo_urls_to_remove?: string[];
}

export interface SuccessResponse {
  success: true;
}

// ─── Job requests (Flow 2: post → bids → accept → order) ────────────────────

export type JobRequestStatus = "open" | "closed" | "cancelled";

export type JobRequestResponseStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface JobRequest {
  id: number;
  customerId: number;
  categoryId: number;
  title: string;
  description: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  scheduledAt: string;
  status: JobRequestStatus;
  responseCount: number;
  createdAt?: string;
  updatedAt?: string;
  photoUrls?: string[];
}

export interface JobRequestResponse {
  id: number;
  jobRequestId: number;
  providerId: number;
  proposedPrice: number;
  comment: string;
  estimatedDays: number;
  status: JobRequestResponseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobRequestPayload {
  category_id: number;
  title: string;
  description: string;
  city: string;
  budget_min: number;
  budget_max: number;
  scheduled_at: string;
  photo_urls?: string[];
}

export interface RespondToJobRequestPayload {
  proposed_price: number;
  comment: string;
  estimated_days: number;
}

export interface AcceptJobRequestBidPayload {
  street: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  scheduled_at: string;
}

export interface AcceptJobRequestBidResult {
  jobRequest: JobRequest;
  orderId: number;
}

export interface JobRequestListFilters {
  status?: string;
  category_id?: number;
  city?: string;
  limit?: number;
  offset?: number;
}

// ─── Locations ───────────────────────────────────────────────────────────────

export interface CreateLocationRequest {
  city: string;
  street: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface CreateLocationResponse {
  id: number;
  city: string;
  street: string;
}

export interface Location {
  id: number;
  city: string;
  street: string;
  region: string;
  latitude: number;
  longitude: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending_provider_acceptance"
  | "pending_payment"
  | "in_progress"
  | "pending_customer_confirmation"
  | "completed"
  | "reviewed"
  | "cancelled"
  | "rejected_by_provider"
  | "disputed";

export interface CreateOrderRequest {
  agreed_price: number;
  city: string;
  latitude: number;
  longitude: number;
  provider_id: number;
  region: string;
  scheduled_at: string;
  service_id: number;
  street: string;
  photo_urls?: string[];
}

export interface CreateOrderResponse {
  id: number;
  status: "pending_provider_acceptance";
}

export interface Order {
  id: number;
  service_id: number;
  provider_id: number;
  customer_id: number;
  address_id: number;
  scheduled_at: string;
  agreed_price: number;
  status: OrderStatus;
  photoUrls?: string[];
}

/** Элемент GET /admin/orders/disputed (обёртка спора + заказ). */
export interface DisputedOrderListEntry {
  disputeId: number;
  orderId: number;
  order: Order;
  disputeReason: string;
  raisedBy: number;
  createdAt?: string;
  photoUrls?: string[];
}

export interface RejectOrderRequest {
  reason: string;
}

export interface DisputeOrderRequest {
  reason: string;
  photo_urls?: string[];
}

export interface ResolveDisputeRequest {
  resolution: string;
}

export interface OrderStatusResponse {
  status: OrderStatus;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface CreatePaymentRequest {
  order_id: number;
}

export type PaymentStatus = "paid" | "pending" | "failed";

export interface PaymentStatusResponse {
  status: PaymentStatus;
}

/** POST /v1/orders/{id}/pay — Stripe PaymentIntent client secret */
export interface PayOrderResponse {
  client_secret?: string;
  clientSecret?: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

/** POST /v1/reviews — service_id берётся с заказа на бэкенде */
export interface CreateReviewRequest {
  order_id: number | string;
  rating: number;
  comment: string;
  /** Returned URLs from POST /media/upload/batch with context review_photos */
  photoUrls?: string[];
}

export interface Review {
  id?: string;
  orderId?: string;
  serviceId?: string;
  reviewerId?: string;
  rating: number;
  comment: string;
  created_at: string;
  photoUrls?: string[];
}

/** GET /v1/reviews/service/:serviceId */
export interface ServiceReviewItemApi {
  id?: string;
  orderId?: string;
  serviceId?: string;
  reviewerId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  photoUrls?: string[];
  photo_urls?: string[];
}

export interface ServiceReviewsApiResponse {
  reviews: ServiceReviewItemApi[];
  avgRating: number;
}

export interface ServiceReviewsResult {
  reviews: Review[];
  avgRating: number;
}

export interface ReviewFilters {
  service_id?: number;
  provider_id?: number;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}
