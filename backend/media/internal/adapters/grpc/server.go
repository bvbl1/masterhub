package grpc

import (
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/media/config"
	"github.com/Rask1lll/masterhub/backend/media/internal/ports"
	mediapb "github.com/bvbl1/masterhub-proto/golang/media"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	mediapb.UnimplementedMediaServiceServer
}

func NewAdapter(api ports.APIPort, port int) *Adapter {
	return &Adapter{api: api, port: port}
}

func (a *Adapter) Run() {
	listen, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		log.Fatalf("media service failed to listen on port %d: %v", a.port, err)
	}
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	mediapb.RegisterMediaServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}

	log.Printf("media service running on port %d", a.port)
	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("failed to serve grpc on port %d: %v", a.port, err)
	}
}
