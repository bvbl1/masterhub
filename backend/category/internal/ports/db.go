package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, category domain.Category) (domain.Category, error)
	GetByID(ctx context.Context, id int64) (domain.Category, error)
	List(ctx context.Context) ([]domain.Category, error)
	Update(ctx context.Context, category domain.Category) error
	Delete(ctx context.Context, id int64) error
}
