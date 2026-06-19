package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/review/internal/application/core/domain"
)

type APIPort interface {
	LeaveReview(ctx context.Context, orderId int64, rating int, comment string, photoURLs []string) (domain.Review, error)
	GetReview(ctx context.Context, reviewId int64) (domain.Review, error)
	ListReviewsByService(ctx context.Context, serviceId int64, limit, offset int32) ([]domain.Review, float64, error)
	ListReviewsByProvider(ctx context.Context, providerId int64, limit, offset int32) ([]domain.Review, float64, error)

	IsReviewLeft(ctx context.Context, orderId int64) (bool, error)
	ListReviews(ctx context.Context, limit, offset int32) ([]domain.Review, float64, error)
}
