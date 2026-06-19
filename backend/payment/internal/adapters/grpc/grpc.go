package grpc

import (
	"fmt"
	"log"
	"net"

	"github.com/Rask1lll/masterhub/backend/payment/internal/ports"
	paymentpb "github.com/bvbl1/masterhub-proto/golang/payment"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Adapter struct {
	api  ports.APIPort
	port int
}

func NewAdapter(api ports.APIPort, port int) *Adapter {
	return &Adapter{api: api, port: port}
}

func (a *Adapter) Run() {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		log.Fatalf("payment-service: failed to listen on port %d: %v", a.port, err)
	}

	srv := grpc.NewServer()

	paymentpb.RegisterPaymentServiceServer(srv, NewGRPCServer(a.api))
	reflection.Register(srv)

	log.Printf("payment-service: gRPC listening on :%d", a.port)
	if err := srv.Serve(lis); err != nil {
		log.Fatalf("payment-service: failed to serve: %v", err)
	}
}
