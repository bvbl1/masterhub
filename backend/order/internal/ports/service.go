package ports

import "context"

type ServicePort interface {
	GetService(ctx context.Context, serviceID int64) (Service, error)
}

type Service struct {
	ID         int64   `json:"id"`
	ProviderID int64   `json:"provider_id"`
	CategoryID int64   `json:"category_id"`
	Title      string  `json:"title"`
	IsActive   bool    `json:"is_active"`
	PriceStart float64 `json:"price_start"`
}
