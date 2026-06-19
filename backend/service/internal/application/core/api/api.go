package api

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/service/internal/ports"
)

type Application struct {
	db       ports.DBPort
	user     ports.UserServicePort
	category ports.Category
}

func NewApplication(db ports.DBPort, user ports.UserServicePort, category ports.Category) *Application {
	return &Application{
		db:       db,
		user:     user,
		category: category,
	}
}

func (a *Application) CreateService(ctx context.Context, service domain.Service) (domain.Service, error) {
	//from grpc call we recieve domain.Service without id, providerId and IsActive.
	// In buciness logic we will get providerId from context and set it to service, because only authenticated provider can create service,
	//  so we can get providerId from context. After that
	//  we will set IsActive to true and then we will call db to create service(gorm will set id of service).
	// After that we will return created service with id, providerId, categoryId and IsActive.
	providerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.Service{}, fmt.Errorf("unauthenticated")
	}

	//we need to make grpc call to user service to get user by providerID and check if user is provider,
	//we need to do UserPort.
	//Same with category, we need to make grpc call to category service to get category by service.CategoryId and check if category exists, we need to do CategoryPort.
	//done below
	user, err := a.user.GetUserById(ctx, providerID)
	if err != nil {
		return domain.Service{}, fmt.Errorf("get user by id: %w", err)
	}
	if user.Role != domain.RoleProvider && user.Role != domain.RoleAdmin {
		return domain.Service{}, fmt.Errorf("forbidden: only providers can create services")
	}

	categoryErr := a.category.GetCategoryById(ctx, service.CategoryId)
	if categoryErr != nil {
		return domain.Service{}, fmt.Errorf("category not found: %w", categoryErr)
	}

	service.ProviderId = providerID
	service.IsActive = true

	res, err := a.db.Create(ctx, service)
	if err != nil {
		return domain.Service{}, fmt.Errorf("create service: %w", err)
	}
	return res, nil
}

func (a *Application) GetService(ctx context.Context, id int64) (domain.Service, error) {
	service, err := a.db.GetByID(ctx, id)
	if err != nil {
		return domain.Service{}, fmt.Errorf("get service by id: %w", err)
	}
	return service, nil
}

func (a *Application) ListServices(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, error) {
	services, err := a.db.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}
	return services, nil
}

func (a *Application) UpdateService(ctx context.Context, service domain.Service) (domain.Service, error) {
	serviceFromDB, err := a.db.GetByID(ctx, service.Id)
	if err != nil {
		return domain.Service{}, fmt.Errorf("get service by id: %w", err)
	}
	if serviceFromDB.ProviderId != ctx.Value("user_id").(int64) {
		return domain.Service{}, fmt.Errorf("forbidden: you can update only your own services")
	}

	updatedService, err := a.db.Update(ctx, service)
	if err != nil {
		return domain.Service{}, fmt.Errorf("update service: %w", err)
	}
	return updatedService, nil
}

func (a *Application) DeleteService(ctx context.Context, id int64) error {
	serviceFromDB, errr := a.db.GetByID(ctx, id)
	if errr != nil {
		return fmt.Errorf("get service by id: %w", errr)
	}
	if serviceFromDB.ProviderId != ctx.Value("user_id").(int64) {
		return fmt.Errorf("forbidden: you can delete only your own services")
	}

	err := a.db.Delete(ctx, id)
	if err != nil {
		return fmt.Errorf("delete service: %w", err)
	}
	return nil
}

func (a *Application) ListMyServices(ctx context.Context) ([]domain.Service, error) {
	providerID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}

	filter := domain.ServiceFilter{
		ProviderID: &providerID,
	}

	services, err := a.db.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}
	return services, nil
}

func (a *Application) ListCities(ctx context.Context) ([]string, error) {
	cities, err := a.db.ListCities(ctx)
	if err != nil {
		return nil, fmt.Errorf("list cities: %w", err)
	}
	return cities, nil
}

func (a *Application) AvgPrice(ctx context.Context, category_id int64) (float64, error) {
	avgPrice, err := a.db.AvgPrice(ctx, category_id)
	if err != nil {
		return 0, fmt.Errorf("avg price: %w", err)
	}
	return avgPrice, nil
}
