// adapters/payment/payment_client.go
package payment

import (
	"context"

	paymentpb "github.com/bvbl1/masterhub-proto/golang/payment"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	client paymentpb.PaymentServiceClient
}

func NewAdapter(paymentServiceURL string) (*Adapter, error) {
	conn, err := grpc.NewClient(paymentServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &Adapter{client: paymentpb.NewPaymentServiceClient(conn)}, nil
}

func (a *Adapter) InitiatePayment(ctx context.Context, orderID int64) (string, error) {
	// Forward authorization header to payment service
	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		if auth := md.Get("authorization"); len(auth) > 0 {
			ctx = metadata.NewOutgoingContext(ctx, metadata.Pairs("authorization", auth[0]))
		}
	}

	resp, err := a.client.InitiatePayment(ctx, &paymentpb.InitiatePaymentRequest{
		OrderId: orderID,
	})
	if err != nil {
		return "", err
	}
	return resp.ClientSecret, nil
}
