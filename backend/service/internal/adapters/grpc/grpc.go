package grpc

import (
	"context"
	"log"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
	servicepb "github.com/bvbl1/masterhub-proto/golang/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateService(ctx context.Context, req *servicepb.CreateServiceRequest) (*servicepb.CreateServiceResponse, error) {
	log.Printf("DEBUG: req.PhotoUrls = %v", req.PhotoUrls)
	service := toDomainService(req)
	log.Printf("DEBUG: domain.PhotoUrls = %v", service.PhotoUrls)
	res, err := a.api.CreateService(ctx, service)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create service: %v", err)
	}
	return &servicepb.CreateServiceResponse{
		Service: toProtoService(res),
	}, nil
}

func (a *Adapter) GetService(ctx context.Context, req *servicepb.GetServiceRequest) (*servicepb.GetServiceResponse, error) {
	res, err := a.api.GetService(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get service: %v", err)
	}
	return &servicepb.GetServiceResponse{
		Service: toProtoService(res),
	}, nil
}

func (a *Adapter) ListServices(ctx context.Context, req *servicepb.ListServicesRequest) (*servicepb.ListServicesResponse, error) {
	filter := domain.ServiceFilter{
		OnlyActive: req.OnlyActive,
	}

	if req.City != "" {
		filter.City = &req.City
	}

	if req.ProviderId != 0 {
		filter.ProviderID = &req.ProviderId
	}
	if req.CategoryId != 0 {
		filter.CategoryID = &req.CategoryId
	}

	res, err := a.api.ListServices(ctx, filter)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list services: %v", err)
	}

	services := make([]*servicepb.Service, len(res))
	for i, s := range res {
		services[i] = toProtoService(s)
	}

	return &servicepb.ListServicesResponse{
		Services: services,
	}, nil
}

func (a *Adapter) UpdateService(ctx context.Context, req *servicepb.UpdateServiceRequest) (*servicepb.UpdateServiceResponse, error) {
	service := domain.Service{
		Id:                req.Id,
		Title:             req.Title,
		Description:       req.Description,
		PriceStart:        req.PriceStart,
		IsActive:          req.IsActive,
		City:              req.City,
		PhotoUrlsToAdd:    req.PhotoUrlsToAdd,
		PhotoUrlsToRemove: req.PhotoUrlsToRemove,
	}

	res, err := a.api.UpdateService(ctx, service)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update service: %v", err)
	}

	return &servicepb.UpdateServiceResponse{
		Service: toProtoService(res),
	}, nil
}

func (a *Adapter) DeleteService(ctx context.Context, req *servicepb.DeleteServiceRequest) (*servicepb.DeleteServiceResponse, error) {
	err := a.api.DeleteService(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete service: %v", err)
	}
	return &servicepb.DeleteServiceResponse{}, nil
}

func (a *Adapter) ListMyServices(ctx context.Context, req *servicepb.ListMyServicesRequest) (*servicepb.ListServicesResponse, error) {
	res, err := a.api.ListMyServices(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list services: %v", err)
	}

	services := make([]*servicepb.Service, len(res))
	for i, s := range res {
		services[i] = toProtoService(s)
	}

	return &servicepb.ListServicesResponse{
		Services: services,
	}, nil
}

func (a *Adapter) ListCities(ctx context.Context, req *servicepb.ListCitiesRequest) (*servicepb.ListCitiesResponse, error) {
	cities, err := a.api.ListCities(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list cities: %v", err)
	}
	return &servicepb.ListCitiesResponse{
		Cities: cities,
	}, nil
}

func (a *Adapter) AvgPriceForCategory(ctx context.Context, req *servicepb.AvgPriceForCategoryRequest) (*servicepb.AvgPriceForCategoryResponse, error) {
	avgPrice, err := a.api.AvgPrice(ctx, req.CategoryId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get average price: %v", err)
	}
	return &servicepb.AvgPriceForCategoryResponse{
		AvgPrice: avgPrice,
	}, nil
}

// helper functions to convert between domain and proto models
func toDomainService(req *servicepb.CreateServiceRequest) domain.Service {
	return domain.Service{
		Title:       req.Title,
		Description: req.Description,
		PriceStart:  req.PriceStart,
		CategoryId:  req.CategoryId,
		PhotoUrls:   req.PhotoUrls,
		City:        req.City,
	}
}

func toProtoService(s domain.Service) *servicepb.Service {
	return &servicepb.Service{
		Id:          s.Id,
		ProviderId:  s.ProviderId,
		CategoryId:  s.CategoryId,
		Title:       s.Title,
		Description: s.Description,
		PriceStart:  s.PriceStart,
		IsActive:    s.IsActive,
		PhotoUrls:   s.PhotoUrls,
		City:        s.City,
	}
}
