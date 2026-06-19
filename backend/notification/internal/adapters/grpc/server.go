package grpc

import (
	"context"
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/notification/config"
	"github.com/Rask1lll/masterhub/backend/notification/internal/ports"
	notificationpb "github.com/bvbl1/masterhub-proto/golang/notification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	notificationpb.UnimplementedNotificationServiceServer
}

func NewAdapter(api ports.APIPort, port int) *Adapter {
	return &Adapter{api: api, port: port}
}

func (a *Adapter) Run() {
	listen, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		log.Fatalf("notification service failed to listen on port %d: %v", a.port, err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	notificationpb.RegisterNotificationServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}

	log.Printf("notification service running on port %d", a.port)
	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("failed to serve grpc on port %d: %v", a.port, err)
	}
}

func (a *Adapter) SendTelegramNotification(
	ctx context.Context,
	req *notificationpb.SendTelegramRequest,
) (*notificationpb.SendTelegramResponse, error) {
	err := a.api.SendTelegramMessage(ctx, req.ChatId, req.Text)
	if err != nil {
		return nil, err
	}
	return &notificationpb.SendTelegramResponse{Success: true}, nil
}
