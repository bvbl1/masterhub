package ports

import "context"

type NotificationPort interface {
	SendNotification(ctx context.Context, req SendNotificationRequest) error
}

type SendNotificationRequest struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	Type   string `json:"type"` //"new_order", "order_accepted", "payment_received"
}
