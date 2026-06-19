package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/domain"
)

type LocationRepository interface {
	CreateLocation(ctx context.Context, location domain.Location) (domain.Location, error)
	GetLocationByID(ctx context.Context, id int64) (domain.Location, error)
}
