package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, order domain.Order) (domain.Order, error)

	GetByID(ctx context.Context, id int64) (domain.Order, error)
	ListByUserID(ctx context.Context, userID int64) ([]domain.Order, error)

	UpdateStatus(ctx context.Context, id int64, status domain.OrderStatus) (domain.Order, error)
	UpdateStatusWithReason(ctx context.Context, id int64, status domain.OrderStatus, reason string) (domain.Order, error)

	//disputed orders
	CreateDisputedOrder(ctx context.Context, d domain.DisputedOrder) (domain.DisputedOrder, error)
	GetDisputedOrder(ctx context.Context, orderID int64) (domain.DisputedOrder, error)
	ListDisputedOrders(ctx context.Context) ([]domain.DisputedOrder, error)

	GetAnalytics(ctx context.Context) (*domain.OrderAnalytics, error)
}
