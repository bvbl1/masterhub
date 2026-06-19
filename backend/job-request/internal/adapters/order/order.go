package order

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/ports"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// OrderAdapter implements ports.OrderPort by calling order-service via gRPC.
type OrderAdapter struct {
	client orderpb.OrderServiceClient
}

func NewAdapter(orderServiceUrl string) (*OrderAdapter, error) {
	conn, err := grpc.NewClient(orderServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &OrderAdapter{
		client: orderpb.NewOrderServiceClient(conn),
	}, nil
}

// CreateOrder calls order-service.CreateOrder.
//
// IMPORTANT — context forwarding:
// The ctx passed here must be the original inbound gRPC context from the
// customer's request. This ensures the customer's JWT is present in the
// outgoing gRPC metadata (your auth_interceptor on the order-service side
// will extract user_id from it, exactly as if the customer called directly).
//
// Flow 2 note:
// In Flow 2 there is no service_id — the customer picked a provider from
// bids, not a specific service listing. We pass service_id=0. The
// order-service CreateOrder handler receives this and skips the
// service-service validation step when service_id == 0.
// You must add this guard to order-service/adapters/grpc/server.go:
//
//	if req.ServiceId != 0 {
//	    // existing service validation logic
//	}
func (a *OrderAdapter) CreateOrder(ctx context.Context, req ports.CreateOrderRequest) (ports.CreateOrderResponse, error) {

	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		ctx = metadata.NewOutgoingContext(ctx, md)
	}

	resp, err := a.client.CreateOrder(ctx, &orderpb.CreateOrderRequest{
		ServiceId:   req.ServiceID, // 0 for Flow 2
		ProviderId:  req.ProviderID,
		Street:      req.Street,
		City:        req.City,
		Region:      req.Region,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		ScheduledAt: req.ScheduledAt,
		AgreedPrice: req.AgreedPrice,
	})
	if err != nil {
		return ports.CreateOrderResponse{}, fmt.Errorf("order-service CreateOrder: %w", err)
	}

	return ports.CreateOrderResponse{
		OrderID: resp.Order.Id,
	}, nil
}
