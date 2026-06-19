package ports

import "context"

type OrderPort interface {
	GetOrderById(ctx context.Context, orderId int64) (Order, error)
	ChangeOrderStatus(ctx context.Context, orderId int64, status string) error
}

type Order struct {
	CustomerId int64  `json:"customer_id"`
	ProviderId int64  `json:"provider_id"`
	ServiceId  int64  `json:"service_id"`
	Status     string `json:"status"`
}
