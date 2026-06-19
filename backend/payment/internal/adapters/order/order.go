package order

import (
	"context"
	"log"

	"github.com/Rask1lll/masterhub/backend/payment/internal/ports"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type OrderAdapter struct {
	client orderpb.OrderServiceClient
}

func NewAdapter(orderServiceURL string) (*OrderAdapter, error) {
	conn, err := grpc.NewClient(orderServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &OrderAdapter{
		client: orderpb.NewOrderServiceClient(conn),
	}, nil
}

func (a *OrderAdapter) GetOrder(ctx context.Context, orderID int64) (*ports.OrderInfo, error) {
	resp, err := a.client.GetOrder(forwardAuth(ctx), &orderpb.GetOrderRequest{Id: orderID})
	if err != nil {
		return nil, err
	}
	return &ports.OrderInfo{
		ID:          resp.Order.Id,
		Status:      resp.Order.Status,
		AgreedPrice: resp.Order.AgreedPrice,
	}, nil
}

func (a *OrderAdapter) UpdateOrderStatus(ctx context.Context, orderID int64, newStatus string) error {
	_, err := a.client.UpdateOrderStatus(ctx, &orderpb.UpdateOrderStatusRequest{
		OrderId: orderID,
		Status:  newStatus,
	})
	return err
}

func forwardAuth(ctx context.Context) context.Context {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		log.Printf("forwardAuth: no incoming metadata")
		return ctx
	}

	auth := md.Get("authorization")
	if len(auth) == 0 {
		log.Printf("forwardAuth: no authorization header in metadata")
		return ctx
	}

	return metadata.NewOutgoingContext(ctx, metadata.Pairs("authorization", auth[0]))
}
