package api

import (
	"context"
	"fmt"
	"log"
	"strconv"

	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/order/internal/ports"
)

type OrderService struct {
	db           ports.DBPort
	user         ports.UserPort
	service      ports.ServicePort
	location     ports.LocationPort
	notification ports.NotificationPort
	payment      ports.PaymentPort
}

func NewOrderService(
	db ports.DBPort,
	user ports.UserPort,
	service ports.ServicePort,
	location ports.LocationPort,
	notification ports.NotificationPort,
	payment ports.PaymentPort,
) *OrderService {
	return &OrderService{
		db:           db,
		user:         user,
		service:      service,
		location:     location,
		notification: notification,
		payment:      payment,
	}
}

func (s *OrderService) sendNotification(ctx context.Context, req ports.SendNotificationRequest) {
	if err := s.notification.SendNotification(ctx, req); err != nil {
		log.Printf("[Notification] failed to send %s to user %d: %v", req.Type, req.UserID, err)
	}
}

func (s *OrderService) CreateOrder(ctx context.Context, order domain.Order, street, city, region string, lat, lng float64) (domain.Order, error) {
	// 1. Verify caller is a customer
	customer, err := s.user.GetUserByID(ctx, order.CustomerID)
	if err != nil {
		return domain.Order{}, fmt.Errorf("customer not found: %w", err)
	}
	if customer.Role != "customer" {
		return domain.Order{}, fmt.Errorf("only customers can create orders")
	}

	// 2. Flow 1 (customer picks a service listing) vs Flow 2 (job-request bid accepted)
	//
	// Flow 1: service_id is set → validate the service and derive provider_id from it
	// Flow 2: service_id is 0  → provider_id is already set by job-request-service
	//         (it was validated there when the provider placed their bid)
	if order.ServiceID != 0 {
		// Flow 1: verify service is active and belongs to this provider
		svc, err := s.service.GetService(ctx, order.ServiceID)
		if err != nil {
			return domain.Order{}, fmt.Errorf("service not found: %w", err)
		}
		if !svc.IsActive {
			return domain.Order{}, fmt.Errorf("service is not active")
		}

		// derive provider from the service listing
		provider, err := s.user.GetUserByID(ctx, svc.ProviderID)
		if err != nil {
			return domain.Order{}, fmt.Errorf("provider not found: %w", err)
		}
		if provider.Role != "provider" {
			return domain.Order{}, fmt.Errorf("invalid provider role")
		}

		order.ProviderID = provider.ID

		order.Status = domain.StatusPendingProviderAcceptance
	} else {
		// Flow 2: provider_id must be explicitly supplied by the caller
		if order.ProviderID == 0 {
			return domain.Order{}, fmt.Errorf("provider_id is required when service_id is not set")
		}

		// still verify the provider exists and has the correct role
		provider, err := s.user.GetUserByID(ctx, order.ProviderID)
		if err != nil {
			return domain.Order{}, fmt.Errorf("provider not found: %w", err)
		}
		if provider.Role != "provider" {
			return domain.Order{}, fmt.Errorf("invalid provider role")
		}

		order.Status = domain.StatusPendingPayment // skip provider acceptance step in Flow 2 since provider was pre-selected in job request flow
	}

	// 3. Create location
	locationID, err := s.location.CreateLocation(ctx, ports.CreateLocationRequest{
		Street:    street,
		City:      city,
		Region:    region,
		Latitude:  lat,
		Longitude: lng,
	})
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to create location: %w", err)
	}

	order.AddressID = locationID

	// 4. Persist
	created, err := s.db.Create(ctx, order)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to create order in database: %w", err)
	}

	// 5. Notify provider asynchronously
	provider, _ := s.user.GetUserByID(ctx, order.ProviderID)

	notificationBody := "You have a new service request. Please review order #" + strconv.Itoa(int(created.ID))
	if order.Status == domain.StatusPendingPayment {
		notificationBody = "Your bid was accepted! Waiting for customer payment. Order #" + strconv.Itoa(int(created.ID))
	}

	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: provider.ID,
		Title:  "New Order",
		Body:   notificationBody,
		Type:   "new_order_request",
		Email:  provider.Email,
	})

	return created, nil
}

func (s *OrderService) GetOrder(ctx context.Context, id int64) (domain.Order, error) {
	return s.db.GetByID(ctx, id)
}

// Returns all orders belonging to the authenticated user (provider)
func (s *OrderService) ListOrders(ctx context.Context) ([]domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return []domain.Order{}, fmt.Errorf("unauthenticated")
	}
	return s.db.ListByUserID(ctx, callerID)
}

// Only the assigned provider can accept
func (s *OrderService) AcceptOrder(ctx context.Context, id int64) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.ProviderID != callerID {
		return domain.Order{}, fmt.Errorf("you are not the provider of this order")
	}

	if !order.CanTransitionTo(domain.StatusPendingPayment) {
		return domain.Order{}, fmt.Errorf("cannot accept order in current status")
	}

	updated, err := s.db.UpdateStatus(ctx, id, domain.StatusPendingPayment)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	customer, _ := s.user.GetUserByID(ctx, order.CustomerID)

	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.CustomerID,
		Title:  "Order Accepted",
		Body:   "The provider has accepted your order #" + strconv.Itoa(int(id)) + ". Please proceed to payment.",
		Type:   "order_accepted",
		Email:  customer.Email,
	})

	return updated, nil
}

func (s *OrderService) RejectOrder(ctx context.Context, id int64, rejectionReason string) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.ProviderID != callerID {
		return domain.Order{}, fmt.Errorf("you are not the provider of this order")
	}

	if !order.CanTransitionTo(domain.StatusRejectedByProvider) {
		return domain.Order{}, fmt.Errorf("cannot reject order in current status")
	}

	updated, err := s.db.UpdateStatusWithReason(ctx, id, domain.StatusRejectedByProvider, rejectionReason)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	customer, _ := s.user.GetUserByID(ctx, order.CustomerID)

	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.CustomerID,
		Title:  "Order Rejected",
		Body:   "The provider has rejected your order #" + strconv.Itoa(int(id)),
		Type:   "order_rejected",
		Email:  customer.Email,
	})

	return updated, nil
}

func (s *OrderService) MarkComplete(ctx context.Context, id int64) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.ProviderID != callerID {
		return domain.Order{}, fmt.Errorf("you are not the provider of this order")
	}

	if !order.CanTransitionTo(domain.StatusPendingCustomerConfirmation) {
		return domain.Order{}, fmt.Errorf("cannot mark job as complete in current status")
	}

	updated, err := s.db.UpdateStatus(ctx, id, domain.StatusPendingCustomerConfirmation)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	customer, _ := s.user.GetUserByID(ctx, order.CustomerID)

	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.CustomerID,
		Title:  "Job Marked Complete",
		Body:   "The provider has marked order #" + strconv.Itoa(int(id)) + " as completed. Please confirm.",
		Type:   "job_completed",
		Email:  customer.Email,
	})

	return updated, nil
}

// Only the customer can pay
func (s *OrderService) PayOrder(ctx context.Context, id int64) (clientSecret string, err error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return "", fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("order not found: %w", err)
	}

	if order.CustomerID != callerID {
		return "", fmt.Errorf("you are not the customer of this order")
	}

	if order.Status != domain.StatusPendingPayment {
		return "", fmt.Errorf("order must be in pending_payment status to pay")
	}

	// create PaymentIntent in Stripe through payment-service.
	// when stripe confirms the payment (payment_intent.succeeded).
	clientSecret, err = s.payment.InitiatePayment(ctx, id)
	if err != nil {
		return "", fmt.Errorf("failed to initiate payment: %w", err)
	}

	return clientSecret, nil
}

// Can be called by customer or provider (depending on current status)
func (s *OrderService) CancelOrder(ctx context.Context, id int64) error {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	if order.CustomerID != callerID {
		return fmt.Errorf("only the customer can cancel an order")
	}
	if !order.CanTransitionTo(domain.StatusCancelled) {
		return fmt.Errorf("cannot cancel order in current status")
	}

	_, err = s.db.UpdateStatus(ctx, id, domain.StatusCancelled)
	if err != nil {
		return fmt.Errorf("failed to cancel order: %w", err)
	}

	customer, _ := s.user.GetUserByID(ctx, order.CustomerID)
	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.ProviderID,
		Title:  "Order Cancelled",
		Body:   "Customer has cancelled order #" + strconv.Itoa(int(id)),
		Type:   "order_cancelled",
		Email:  customer.Email,
	})

	return err
}

// Only the customer can confirm
func (s *OrderService) ConfirmComplete(ctx context.Context, id int64) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.CustomerID != callerID {
		return domain.Order{}, fmt.Errorf("you are not the customer of this order")
	}

	if !order.CanTransitionTo(domain.StatusCompleted) {
		return domain.Order{}, fmt.Errorf("cannot confirm completion in current status")
	}

	updated, err := s.db.UpdateStatus(ctx, id, domain.StatusCompleted)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	provider, _ := s.user.GetUserByID(ctx, order.ProviderID)
	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.ProviderID,
		Title:  "Order Confirmed Complete",
		Body:   "Customer has confirmed completion of order #" + strconv.Itoa(int(id)),
		Type:   "order_confirmed",
		Email:  provider.Email,
	})

	return updated, nil
}

// Can be raised by either participant
func (s *OrderService) DisputeOrder(ctx context.Context, id int64, reason string, photo_urls []string) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.CustomerID != callerID && order.ProviderID != callerID {
		return domain.Order{}, fmt.Errorf("you are not a participant of this order")
	}

	if !order.CanTransitionTo(domain.StatusDisputed) {
		return domain.Order{}, fmt.Errorf("cannot raise dispute in current status")
	}

	updated, err := s.db.UpdateStatus(ctx, id, domain.StatusDisputed)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	// store dispute record — log failure, never fail the primary operation
	_, err = s.db.CreateDisputedOrder(ctx, domain.DisputedOrder{
		OrderID:       id,
		RaisedBy:      callerID,
		DisputeReason: reason,
		PhotoUrls:     photo_urls,
	})
	if err != nil {
		log.Printf("failed to create dispute record for order %d: %v", id, err)
	}

	callerUser, _ := s.user.GetUserByID(ctx, callerID)
	if callerUser.Role == "customer" {
		provider, _ := s.user.GetUserByID(ctx, order.ProviderID)
		s.sendNotification(ctx, ports.SendNotificationRequest{
			UserID: order.ProviderID,
			Title:  "Order disputed",
			Body:   "Customer has disputed order #" + strconv.Itoa(int(id)),
			Type:   "order_disputed",
			Email:  provider.Email,
		})
	} else {
		customer, _ := s.user.GetUserByID(ctx, order.CustomerID)
		s.sendNotification(ctx, ports.SendNotificationRequest{
			UserID: order.CustomerID,
			Title:  "Order disputed",
			Body:   "Provider has disputed order #" + strconv.Itoa(int(id)),
			Type:   "order_disputed",
			Email:  customer.Email,
		})
	}

	return updated, nil
}

// Used by payment-service webhook only
func (s *OrderService) UpdateOrderStatus(ctx context.Context, id int64, status domain.OrderStatus) (domain.Order, error) {
	order, err := s.db.GetByID(ctx, id)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if status == domain.StatusInProgress && order.Status != domain.StatusPendingPayment {
		return domain.Order{}, fmt.Errorf("cannot set in_progress: order status is %s, expected pending_payment", order.Status)
	}

	_, err = s.db.UpdateStatus(ctx, id, status)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to update order status: %w", err)
	}

	return order, nil
}

func (s *OrderService) ListDisputedOrders(ctx context.Context) ([]domain.DisputedOrder, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}

	caller, err := s.user.GetUserByID(ctx, callerID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify caller: %w", err)
	}
	if caller.Role != "admin" {
		return nil, fmt.Errorf("only admins can view disputed orders")
	}

	return s.db.ListDisputedOrders(ctx)
}

func (s *OrderService) ResolveDispute(ctx context.Context, orderID int64, resolution domain.OrderStatus) (domain.Order, error) {
	callerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Order{}, fmt.Errorf("unauthenticated")
	}

	caller, err := s.user.GetUserByID(ctx, callerID)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to verify caller: %w", err)
	}
	if caller.Role != "admin" {
		return domain.Order{}, fmt.Errorf("only admins can resolve disputes")
	}

	if resolution != domain.StatusCompleted && resolution != domain.StatusCancelled {
		return domain.Order{}, fmt.Errorf("resolution must be 'completed' or 'cancelled'")
	}

	order, err := s.db.GetByID(ctx, orderID)
	if err != nil {
		return domain.Order{}, fmt.Errorf("order not found: %w", err)
	}

	if order.Status != domain.StatusDisputed {
		return domain.Order{}, fmt.Errorf("order is not in disputed status")
	}

	updated, err := s.db.UpdateStatus(ctx, orderID, resolution)
	if err != nil {
		return domain.Order{}, fmt.Errorf("failed to resolve dispute: %w", err)
	}

	// notify both parties of the resolution
	customer, _ := s.user.GetUserByID(ctx, order.CustomerID)
	provider, _ := s.user.GetUserByID(ctx, order.ProviderID)

	resolvedMsg := "Order #" + strconv.Itoa(int(orderID)) + " dispute resolved: " + string(resolution)
	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.CustomerID,
		Title:  "Dispute resolved",
		Body:   resolvedMsg,
		Type:   "dispute_resolved",
		Email:  customer.Email,
	})
	s.sendNotification(ctx, ports.SendNotificationRequest{
		UserID: order.ProviderID,
		Title:  "Dispute resolved",
		Body:   resolvedMsg,
		Type:   "dispute_resolved",
		Email:  provider.Email,
	})

	return updated, nil
}

func (s *OrderService) GetAnalytics(ctx context.Context) (*domain.OrderAnalytics, error) {
	userRole, ok := ctx.Value("role").(string)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}
	if userRole != "admin" {
		return nil, fmt.Errorf("only admins can access analytics")
	}

	return s.db.GetAnalytics(ctx)
}
