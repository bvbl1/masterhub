package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
)

type APIPort interface {
	CreateService(ctx context.Context, service domain.Service) (domain.Service, error)
	GetService(ctx context.Context, id int64) (domain.Service, error)
	ListServices(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, error)
	UpdateService(ctx context.Context, service domain.Service) (domain.Service, error)
	DeleteService(ctx context.Context, id int64) error
	ListMyServices(ctx context.Context) ([]domain.Service, error)

	ListCities(ctx context.Context) ([]string, error)

	AvgPrice(ctx context.Context, category_id int64) (float64, error)
}
