package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
	notificationpb "github.com/bvbl1/masterhub-proto/golang/notification"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) SendNotification(ctx context.Context, req *notificationpb.SendNotificationRequest) (*notificationpb.SendNotificationResponse, error) {
	n := domain.Notification{
		UserID: req.UserId,
		Title:  req.Title,
		Body:   req.Body,
		Type:   req.Type,
	}

	_, err := a.api.SendNotification(ctx, n, req.Email)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "send notification: %v", err)
	}

	return &notificationpb.SendNotificationResponse{Success: true}, nil
}

func (a *Adapter) ListNotifications(ctx context.Context, req *notificationpb.ListNotificationsRequest) (*notificationpb.ListNotificationsResponse, error) {
	notifications, err := a.api.ListNotifications(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list notifications: %v", err)
	}

	pbNotifications := make([]*notificationpb.Notification, len(notifications))
	for i, n := range notifications {
		pbNotifications[i] = toProto(n)
	}

	return &notificationpb.ListNotificationsResponse{
		Notifications: pbNotifications,
	}, nil
}

func (a *Adapter) MarkNotificationRead(ctx context.Context, req *notificationpb.MarkNotificationReadRequest) (*notificationpb.MarkNotificationReadResponse, error) {
	if err := a.api.MarkNotificationRead(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "mark notification read: %v", err)
	}

	return &notificationpb.MarkNotificationReadResponse{Success: true}, nil
}

func toProto(n domain.Notification) *notificationpb.Notification {
	return &notificationpb.Notification{
		Id:        n.ID,
		UserId:    n.UserID,
		Title:     n.Title,
		Body:      n.Body,
		Type:      n.Type,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt.String(),
	}
}
