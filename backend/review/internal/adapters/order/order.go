package order

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/review/internal/ports"
	orderpb "github.com/bvbl1/masterhub-proto/golang/order"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	order orderpb.OrderServiceClient
}

func NewAdapter(orderServiceUrl string) (*Adapter, error) {
	conn, err := grpc.NewClient(orderServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Adapter{
		order: orderpb.NewOrderServiceClient(conn),
	}, nil
}

func (a *Adapter) GetOrderById(ctx context.Context, orderId int64) (ports.Order, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ports.Order{}, fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	res, err := a.order.GetOrder(outCtx, &orderpb.GetOrderRequest{
		Id: orderId,
	})
	if err != nil {
		return ports.Order{}, err
	}

	return ports.Order{
		CustomerId: res.Order.CustomerId,
		ProviderId: res.Order.ProviderId,
		ServiceId:  res.Order.ServiceId,
		Status:     res.Order.Status,
	}, nil
}

func (a *Adapter) ChangeOrderStatus(ctx context.Context, orderId int64, status string) error {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return fmt.Errorf("missing metadata")
	}

	outCtx := metadata.NewOutgoingContext(ctx, md)

	_, err := a.order.UpdateOrderStatus(outCtx, &orderpb.UpdateOrderStatusRequest{
		OrderId: orderId,
		Status:  status,
	})
	if err != nil {
		return err
	}

	return nil
}
