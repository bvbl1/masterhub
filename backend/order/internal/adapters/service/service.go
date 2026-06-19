package service

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/order/internal/ports"
	servicepb "github.com/bvbl1/masterhub-proto/golang/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	service servicepb.ServiceServiceClient
}

func NewAdapter(serviceServiceUrl string) (*Adapter, error) {
	conn, err := grpc.NewClient(serviceServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Adapter{
		service: servicepb.NewServiceServiceClient(conn),
	}, nil
}

func (a *Adapter) GetService(ctx context.Context, serviceID int64) (ports.Service, error) {
	// extract token from incoming context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ports.Service{}, fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	res, err := a.service.GetService(outCtx, &servicepb.GetServiceRequest{
		Id: serviceID,
	})
	if err != nil {
		return ports.Service{}, err
	}

	return ports.Service{
		ID:         res.Service.Id,
		ProviderID: res.Service.ProviderId,
		CategoryID: res.Service.CategoryId,
		Title:      res.Service.Title,
		IsActive:   res.Service.IsActive,
		PriceStart: res.Service.PriceStart,
	}, nil
}
