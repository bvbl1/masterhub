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
	Type   string `json:"type"` //"new job_request", "job_request_accepted", "job_request_completed"
}
