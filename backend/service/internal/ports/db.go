package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, service domain.Service) (domain.Service, error)
	GetByID(ctx context.Context, id int64) (domain.Service, error)
	List(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, error)
	Update(ctx context.Context, service domain.Service) (domain.Service, error)
	Delete(ctx context.Context, id int64) error

	ListCities(ctx context.Context) ([]string, error)

	AvgPrice(ctx context.Context, category_id int64) (float64, error)
}
