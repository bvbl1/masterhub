package location

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/order/internal/ports"
	locationpb "github.com/bvbl1/masterhub-proto/golang/location"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	location locationpb.LocationServiceClient
}

func NewAdapter(locationServiceUrl string) (*Adapter, error) {
	conn, err := grpc.NewClient(locationServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Adapter{
		location: locationpb.NewLocationServiceClient(conn),
	}, nil
}

func (a *Adapter) CreateLocation(ctx context.Context, req ports.CreateLocationRequest) (int64, error) {
	// extract token from incoming context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return 0, fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	res, err := a.location.CreateLocation(outCtx, &locationpb.CreateLocationRequest{
		Street:    req.Street,
		City:      req.City,
		Region:    req.Region,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
	})
	if err != nil {
		return 0, err
	}
	return res.Location.Id, nil
}
