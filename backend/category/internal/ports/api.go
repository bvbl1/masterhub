package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
)

type APIPort interface {
	CreateCategory(ctx context.Context, category domain.Category) (domain.Category, error)
	GetCategory(ctx context.Context, id int64) (domain.Category, error)
	ListCategories(ctx context.Context) ([]domain.Category, error)
	UpdateCategory(ctx context.Context, id int64, name, description, icon string) (domain.Category, error)
	DeleteCategory(ctx context.Context, id int64) error
}
