package grpc

import (
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/review/config"
	"github.com/Rask1lll/masterhub/backend/review/internal/ports"
	reviewpb "github.com/bvbl1/masterhub-proto/golang/review"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	reviewpb.UnimplementedReviewServiceServer
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
		log.Fatalf("review service failed to listen on the port: %d, error: %v", a.port, err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	reviewpb.RegisterReviewServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}

	log.Printf("review service running on port %d", a.port)
	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("review service failed to serve: %v", err)
	}
}
