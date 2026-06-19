package grpc

import (
	"fmt"
	"log"
	"net"

	"context"

	"github.com/Rask1lll/masterhub/backend/user/config"
	"github.com/Rask1lll/masterhub/backend/user/internal/ports"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	userpb.UnimplementedUserServiceServer
}

func NewAdapter(api ports.APIPort, port int) *Adapter {
	return &Adapter{
		api:  api,
		port: port,
	}
}

func (a *Adapter) Run() {
	var err error

	listen, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		log.Fatalf("failed to listen on the port: %d, error: %v", a.port, err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	userpb.RegisterUserServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}

	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("failed to serve grpc on port: %d", a.port)
	}
}

func (a *Adapter) GenerateTelegramToken(
	ctx context.Context,
	req *userpb.GenerateTelegramTokenRequest,
) (*userpb.GenerateTelegramTokenResponse, error) {
	token, err := a.api.GenerateTelegramToken(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	return &userpb.GenerateTelegramTokenResponse{Token: token}, nil
}

func (a *Adapter) LinkTelegramByToken(
	ctx context.Context,
	req *userpb.LinkTelegramRequest,
) (*userpb.LinkTelegramResponse, error) {
	user, err := a.api.LinkTelegramByToken(ctx, req.Token, req.ChatId)
	if err != nil {
		return nil, err
	}

	jwtToken, err := a.api.GenerateJWTForUser(ctx, user.UserId)
	if err != nil {
		log.Printf("GenerateJWTForUser error: %v", err)
		return nil, err
	}

	log.Printf("LinkTelegramByToken: userID=%d token=%s", user.UserId, jwtToken)

	return &userpb.LinkTelegramResponse{
		UserId:    user.UserId,
		FirstName: user.FirstName,
		Role:      user.Role,
		Token:     jwtToken,
	}, nil
}
