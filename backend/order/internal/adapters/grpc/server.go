package grpc

import (
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/order/config"
	"github.com/Rask1lll/masterhub/backend/order/internal/ports"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	orderpb.UnimplementedOrderServiceServer
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
		log.Fatalf("order service failed to listen on the port: %d, error: %v", a.port, err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	orderpb.RegisterOrderServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}
	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("failed to serve grpc on port: %d, error: %v", a.port, err)
	}
}
