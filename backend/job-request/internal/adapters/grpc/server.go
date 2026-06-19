package grpc

import (
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/job-request/config"
	"github.com/Rask1lll/masterhub/backend/job-request/internal/ports"
	jobrequestpb "github.com/bvbl1/masterhub-proto/golang/job-request"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
	jobrequestpb.UnimplementedJobRequestServiceServer
}

func NewAdapter(api ports.APIPort, port int) *Adapter {
	return &Adapter{api: api, port: port}
}

func (a *Adapter) Run() {
	listen, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		panic(fmt.Sprintf("failed to listen on port %d: %v", a.port, err))
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(AuthInterceptor),
	)

	jobrequestpb.RegisterJobRequestServiceServer(grpcServer, a)
	if config.GetEnv() == "development" {
		reflection.Register(grpcServer)
	}

	log.Printf("job request service running on port %d", a.port)
	if err := grpcServer.Serve(listen); err != nil {
		log.Fatalf("failed to serve grpc on port %d: %v", a.port, err)
	}
}
