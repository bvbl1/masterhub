package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, review domain.Review) (domain.Review, error)
	Get(ctx context.Context, reviewId int64) (domain.Review, error)
	ListByService(ctx context.Context, serviceId int64, limit, offset int32) ([]domain.Review, float64, error)
	ListByProvider(ctx context.Context, providerId int64, limit, offset int32) ([]domain.Review, float64, error)
	List(ctx context.Context, limit, offset int32) ([]domain.Review, float64, error)

	IsReviewLeft(userId, orderId int64) (bool, error)
}
