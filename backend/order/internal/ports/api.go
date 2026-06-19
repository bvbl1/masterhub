package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain"
)

type APIPort interface {
	CreateOrder(ctx context.Context, order domain.Order, street, city, region string, lat, lng float64) (domain.Order, error)

	GetOrder(ctx context.Context, id int64) (domain.Order, error) // method for both customer and provider
	ListOrders(ctx context.Context) ([]domain.Order, error)       // method for provider

	AcceptOrder(ctx context.Context, id int64) (domain.Order, error)                         // method for provider
	RejectOrder(ctx context.Context, id int64, rejectionReason string) (domain.Order, error) // method for provider
	MarkComplete(ctx context.Context, id int64) (domain.Order, error)                        //method for provider

	PayOrder(ctx context.Context, id int64) (clientSecret string, err error)                              // method for customer
	CancelOrder(ctx context.Context, id int64) error                                                      // method for both customer and provider
	ConfirmComplete(ctx context.Context, id int64) (domain.Order, error)                                  // method for customer
	DisputeOrder(ctx context.Context, id int64, reason string, photo_urls []string) (domain.Order, error) // reason added

	UpdateOrderStatus(ctx context.Context, id int64, status domain.OrderStatus) (domain.Order, error) // UpdateOrderStatus — internal, called by payment-service

	// Dispute management — admin only
	ListDisputedOrders(ctx context.Context) ([]domain.DisputedOrder, error)
	ResolveDispute(ctx context.Context, orderID int64, resolution domain.OrderStatus) (domain.Order, error)

	GetAnalytics(ctx context.Context) (*domain.OrderAnalytics, error)
}
