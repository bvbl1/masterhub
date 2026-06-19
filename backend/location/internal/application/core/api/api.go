package api

import (
	"context"
	"fmt"
	"log"

	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/location/internal/ports"
)

type Application struct {
	db ports.Database
}

func NewApplication(db ports.Database) *Application {
	return &Application{
		db: db,
	}
}

func (a *Application) CreateLocation(ctx context.Context, location domain.Location) (domain.Location, error) {
	val := ctx.Value("user_id")
	log.Printf("DEBUG api: user_id from ctx = %v (type: %T)", val, val)

	if userID, ok := val.(int64); ok {
		location.UserID = userID
	}
	log.Printf("DEBUG api: final location with UserID = %d", location.UserID)

	res, err := a.db.Create(ctx, location)
	if err != nil {
		return domain.Location{}, fmt.Errorf("create location: %w", err)
	}
	return res, nil
}

func (a *Application) GetLocationByID(ctx context.Context, id int64) (domain.Location, error) {
	res, err := a.db.GetByID(ctx, id)
	if err != nil {
		return domain.Location{}, fmt.Errorf("get location: %w", err)
	}

	return res, nil
}
