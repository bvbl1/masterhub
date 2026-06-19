package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, n domain.Notification) (domain.Notification, error)
	ListByUserID(ctx context.Context, userID int64) ([]domain.Notification, error)
	MarkRead(ctx context.Context, id int64) error
}
