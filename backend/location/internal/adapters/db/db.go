package db

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Location struct {
	gorm.Model
	UserID    int64   `gorm:"not null"`
	Street    string  `gorm:"type:text;not null"`
	City      string  `gorm:"type:text;not null"`
	Region    string  `gorm:"type:text"`
	Latitude  float64 `gorm:"not null"`
	Longitude float64 `gorm:"not null"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsu string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsu), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Location{})
	if err != nil {
		return nil, err
	}
	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, location domain.Location) (domain.Location, error) {
	model := toDBModel(location)
	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Location{}, err
	}
	return toDomain(model), nil
}

func (a *Adapter) GetByID(ctx context.Context, id int64) (domain.Location, error) {
	var model Location
	if err := a.db.WithContext(ctx).First(&model, id).Error; err != nil {
		return domain.Location{}, err
	}
	return toDomain(model), nil
}

// helper functiuons
func toDBModel(location domain.Location) Location {
	return Location{
		UserID:    location.UserID,
		Street:    location.Street,
		City:      location.City,
		Region:    location.Region,
		Latitude:  location.Latitude,
		Longitude: location.Longitude,
	}
}

func toDomain(location Location) domain.Location {
	return domain.Location{
		ID:        int64(location.ID),
		UserID:    location.UserID,
		Street:    location.Street,
		City:      location.City,
		Region:    location.Region,
		Latitude:  location.Latitude,
		Longitude: location.Longitude,
	}
}
