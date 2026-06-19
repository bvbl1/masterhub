package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/location/internal/application/core/domain"
)

type Database interface {
	Create(ctx context.Context, location domain.Location) (domain.Location, error)
	GetByID(ctx context.Context, id int64) (domain.Location, error)
}
