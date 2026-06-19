package ports

import (
	"context"
)

type OrderInfo struct {
	ID          int64
	Status      string
	AgreedPrice float64
}

type OrderClientPort interface {
	GetOrder(ctx context.Context, orderID int64) (*OrderInfo, error)
	UpdateOrderStatus(ctx context.Context, orderID int64, newStatus string) error
}
