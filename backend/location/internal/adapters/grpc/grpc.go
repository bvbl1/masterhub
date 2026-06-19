package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/domain"
	locationpb "github.com/bvbl1/masterhub-proto/golang/location"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateLocation(ctx context.Context, req *locationpb.CreateLocationRequest) (*locationpb.CreateLocationResponse, error) {
	location := toDomainLocation(req)

	res, err := a.api.CreateLocation(ctx, location)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create location: %v", err)
	}

	return &locationpb.CreateLocationResponse{
		Location: toProtoLocation(res),
	}, nil
}

func (a *Adapter) GetLocation(ctx context.Context, req *locationpb.GetLocationRequest) (*locationpb.GetLocationResponse, error) {
	res, err := a.api.GetLocationByID(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get location: %v", err)
	}
	return &locationpb.GetLocationResponse{
		Location: toProtoLocation(res),
	}, nil
}

// helper functions to convert between proto and domain models
func toDomainLocation(req *locationpb.CreateLocationRequest) domain.Location {
	return domain.Location{
		Street:    req.Street,
		City:      req.City,
		Region:    req.Region,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
	}
}

func toProtoLocation(location domain.Location) *locationpb.Location {
	return &locationpb.Location{
		Id:        location.ID,
		UserId:    location.UserID,
		Street:    location.Street,
		City:      location.City,
		Region:    location.Region,
		Latitude:  location.Latitude,
		Longitude: location.Longitude,
	}
}
