package db

import (
	"context"
	"log"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
	"github.com/lib/pq"
	"github.com/shopspring/decimal"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Service struct {
	gorm.Model
	ProviderId  int64           `gorm:"not null"`
	CategoryId  int64           `gorm:"not null"`
	Title       string          `gorm:"type:varchar(255);not null"`
	Description string          `gorm:"type:text"`
	PriceStart  decimal.Decimal `gorm:"type:numeric(10,2);not null"`
	IsActive    bool            `gorm:"not null"`
	PhotoUrls   pq.StringArray  `gorm:"type:text[]"`
	City        string          `gorm:"type:varchar(255);not null"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Service{})
	if err != nil {
		return nil, err
	}

	if err := seedServices(db); err != nil {
		log.Printf("Warning: failed to seed services: %v", err)
	}

	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, service domain.Service) (domain.Service, error) {
	model := toDBModel(service)
	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Service{}, err
	}
	return toDomain(model), nil
}

func (a *Adapter) GetByID(ctx context.Context, id int64) (domain.Service, error) {
	var model Service
	if err := a.db.WithContext(ctx).First(&model, id).Error; err != nil {
		return domain.Service{}, err
	}
	return toDomain(model), nil
}

func (a *Adapter) List(ctx context.Context, filter domain.ServiceFilter) ([]domain.Service, error) {
	var models []Service

	query := a.db.WithContext(ctx).Model(&Service{})

	if filter.ProviderID != nil {
		query = query.Where("provider_id = ?", *filter.ProviderID)
	}
	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}
	if filter.OnlyActive {
		query = query.Where("is_active = ?", true)
	}
	if filter.City != nil {
		query = query.Where("city = ?", *filter.City)
	}
	if err := query.Find(&models).Error; err != nil {
		return nil, err
	}

	services := make([]domain.Service, len(models))
	for i, m := range models {
		services[i] = toDomain(m)
	}
	return services, nil
}

func (a *Adapter) Update(ctx context.Context, service domain.Service) (domain.Service, error) {
	var model Service
	if err := a.db.WithContext(ctx).First(&model, service.Id).Error; err != nil {
		return domain.Service{}, err
	}

	model.CategoryId = service.CategoryId
	model.Title = service.Title
	model.Description = service.Description
	model.PriceStart = decimal.NewFromFloat(service.PriceStart)
	model.IsActive = service.IsActive

	// Handle photo additions and removals
	if len(service.PhotoUrlsToAdd) > 0 || len(service.PhotoUrlsToRemove) > 0 {
		currentPhotos := make(map[string]bool)
		for _, url := range model.PhotoUrls {
			currentPhotos[url] = true
		}

		// Add new photos
		for _, url := range service.PhotoUrlsToAdd {
			currentPhotos[url] = true
		}

		// Remove specified photos
		for _, url := range service.PhotoUrlsToRemove {
			delete(currentPhotos, url)
		}

		// Rebuild photo URLs array
		updatedPhotos := make([]string, 0, len(currentPhotos))
		for url := range currentPhotos {
			updatedPhotos = append(updatedPhotos, url)
		}
		model.PhotoUrls = pq.StringArray(updatedPhotos)
	}

	// ProviderId is intentionally not updated — ownership cannot change

	if err := a.db.WithContext(ctx).Save(&model).Error; err != nil {
		return domain.Service{}, err
	}
	return toDomain(model), nil
}

func (a *Adapter) Delete(ctx context.Context, id int64) error {
	res := a.db.WithContext(ctx).Delete(&Service{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (a *Adapter) ListCities(ctx context.Context) ([]string, error) {
	var cities []string
	if err := a.db.WithContext(ctx).Model(&Service{}).Distinct().Pluck("city", &cities).Error; err != nil {
		return nil, err
	}
	return cities, nil
}

func (a *Adapter) AvgPrice(ctx context.Context, categoryID int64) (float64, error) {
	var avg decimal.Decimal

	err := a.db.WithContext(ctx).
		Model(&Service{}).
		Where("category_id = ?", categoryID).
		Select("COALESCE(AVG(price_start), 0)").
		Scan(&avg).Error

	if err != nil {
		return 0, err
	}

	avgFloat, _ := avg.Float64()
	return avgFloat, nil
}

// helper functions to convert between domain and db models
func toDBModel(s domain.Service) Service {
	photoUrls := pq.StringArray{}
	if len(s.PhotoUrls) > 0 {
		photoUrls = pq.StringArray(s.PhotoUrls)
	}

	return Service{
		ProviderId:  s.ProviderId,
		CategoryId:  s.CategoryId,
		Title:       s.Title,
		Description: s.Description,
		PriceStart:  decimal.NewFromFloat(s.PriceStart),
		IsActive:    s.IsActive,
		PhotoUrls:   photoUrls,
		City:        s.City,
	}
}
func toDomain(s Service) domain.Service {
	price, _ := s.PriceStart.Float64()
	return domain.Service{
		Id:          int64(s.ID),
		ProviderId:  s.ProviderId,
		CategoryId:  s.CategoryId,
		Title:       s.Title,
		Description: s.Description,
		PriceStart:  price,
		IsActive:    s.IsActive,
		PhotoUrls:   []string(s.PhotoUrls),
		City:        s.City,
	}
}
