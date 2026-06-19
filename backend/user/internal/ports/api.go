package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
)

type APIPort interface {
	RegisterUser(ctx context.Context, user domain.User) (string, domain.User, error)
	LoginUser(ctx context.Context, emailOrPhone, password string) (string, domain.User, error)

	GetUserById(ctx context.Context, id int64) (domain.User, error)
	GetUserByEmail(ctx context.Context, email string) (domain.User, error)
	GetUserByPhone(ctx context.Context, phone string) (domain.User, error)
	GetMe(ctx context.Context) (domain.User, error)

	ListUsers(ctx context.Context, limit, offset int) ([]domain.User, error)

	UpdateUser(ctx context.Context, user domain.User) (domain.User, error)
	PromoteToProvider(ctx context.Context) (string, string, error)

	GetGoogleAuthURL(ctx context.Context) (string, error)
	GoogleAuthCallback(ctx context.Context, code, state string) (string, domain.User, error)

	UpdateAvatar(ctx context.Context, avatarUrl string) (bool, error)

	GenerateTelegramToken(ctx context.Context, userId int64) (string, error)
	LinkTelegramByToken(ctx context.Context, token string, chatId int64) (domain.User, error)
	GenerateJWTForUser(ctx context.Context, userId int64) (string, error)

	SubmitProviderApplication(ctx context.Context, documents []string) (domain.ProviderRequest, error)
	GetMyProviderRequest(ctx context.Context) (domain.ProviderRequest, error)
	ListProviderRequests(ctx context.Context, status string, limit, offset int) ([]domain.ProviderRequest, error)
	ApproveProviderRequest(ctx context.Context, requestID int64) (domain.ProviderRequest, error)
	RejectProviderRequest(ctx context.Context, requestID int64, reason string) (domain.ProviderRequest, error)

	AddFavoriteProvider(ctx context.Context, providerID int64) (bool, error)
	RemoveFavoriteProvider(ctx context.Context, providerID int64) (bool, error)
	ListFavoriteProviders(ctx context.Context, limit, offset int) ([]domain.FavoriteProvider, error)
	IsProviderFavorite(ctx context.Context, providerID int64) (bool, error)

	GetAnalytics(ctx context.Context) (*domain.UserAnalytics, error)
}
