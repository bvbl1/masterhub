package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
)

type UserServicePort interface {
	GetUserById(ctx context.Context, id int64) (domain.User, error)
}
