package notification

import (
	"context"
	"fmt"
	"time"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/ports"
	notificationpb "github.com/bvbl1/masterhub-proto/golang/notification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	notification notificationpb.NotificationServiceClient
}

func NewAdapter(notificationServiceUrl string) (*Adapter, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := grpc.DialContext(
		ctx,
		notificationServiceUrl,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		return nil, err
	}

	return &Adapter{
		notification: notificationpb.NewNotificationServiceClient(conn),
	}, nil
}

func (a *Adapter) SendNotification(ctx context.Context, req ports.SendNotificationRequest) error {
	// extract token from incoming context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	_, err := a.notification.SendNotification(outCtx, &notificationpb.SendNotificationRequest{
		UserId: req.UserID,
		Email:  req.Email,
		Title:  req.Title,
		Body:   req.Body,
		Type:   req.Type,
	})
	return err
}
