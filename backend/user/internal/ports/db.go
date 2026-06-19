package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
)

type DBPort interface {
	Create(ctx context.Context, user *domain.User) error
	Update(ctx context.Context, user *domain.User) error

	GetById(ctx context.Context, id int64) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByPhone(ctx context.Context, phone string) (domain.User, error)
	GetByTelegramChatId(ctx context.Context, chatId int64) (domain.User, error)
	LinkTelegramByToken(ctx context.Context, token string, chatId int64) (domain.User, error)
	SetTelegramToken(ctx context.Context, userId int64, token string) error
	List(ctx context.Context, limit, offset int) ([]domain.User, error)
	Count(ctx context.Context) (int64, error)

	GetUserByGoogleId(ctx context.Context, googleId string) (domain.User, error)

	CreateProviderRequest(ctx context.Context, request *domain.ProviderRequest) (domain.ProviderRequest, error)
	GetProviderRequestById(ctx context.Context, requestID int64) (domain.ProviderRequest, error)
	GetProviderRequestByUserId(ctx context.Context, userId int64) (domain.ProviderRequest, error)
	ListProviderRequests(ctx context.Context, status string, limit, offset int) ([]domain.ProviderRequest, error)
	UpdateProviderRequest(ctx context.Context, request *domain.ProviderRequest) (domain.ProviderRequest, error)

	CreateFavorite(ctx context.Context, favorite *domain.CustomerFavorite) error
	DeleteFavorite(ctx context.Context, customerId, providerId int64) error
	ListFavorites(ctx context.Context, customerId int64, limit, offset int) ([]domain.FavoriteProvider, error)
	IsFavorite(ctx context.Context, customerId, providerId int64) (bool, error)

	GetAnalytics(ctx context.Context) (*domain.UserAnalytics, error)
}
