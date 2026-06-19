package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
)

type APIPort interface {
	SendNotification(ctx context.Context, n domain.Notification, emailAddr string) (domain.Notification, error)
	ListNotifications(ctx context.Context) ([]domain.Notification, error)
	MarkNotificationRead(ctx context.Context, id int64) error
	SendTelegramMessage(ctx context.Context, chatID int64, text string) error
}
