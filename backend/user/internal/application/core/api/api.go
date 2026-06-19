package api

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/user/internal/ports"
	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Application struct {
	db            ports.DBPort
	JWTSecret     string
	JWTExpiration time.Duration
	oauthConfig   *oauth2.Config
}

func NewApplication(db ports.DBPort, secret string, exp time.Duration, oauthCfg *oauth2.Config) *Application {
	return &Application{
		db:            db,
		JWTSecret:     secret,
		JWTExpiration: exp,
		oauthConfig:   oauthCfg,
	}
}

func (a *Application) RegisterUser(ctx context.Context, user domain.User) (string, domain.User, error) {
	// log.Println("REGISTER password BEFORE hash:", user.Password)

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return "", domain.User{}, err
	}
	user.Password = string(hashed)

	count, err := a.db.Count(ctx)
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to count users: %w", err)
	}
	if count == 0 {
		user.Role = domain.RoleAdmin
	} else {
		user.Role = domain.RoleCustomer
	}

	saveErr := a.db.Create(ctx, &user)
	if saveErr != nil {
		return "", domain.User{}, err
	}

	token, err := a.generateJWT(user)
	if err != nil {
		return "", domain.User{}, err
	}
	return token, user, nil
}

func (a *Application) LoginUser(ctx context.Context, emailOrPhone, password string) (string, domain.User, error) {
	var user domain.User
	var err error

	if strings.Contains(emailOrPhone, "@") {
		user, err = a.db.GetByEmail(ctx, emailOrPhone)
	} else {
		user, err = a.db.GetByPhone(ctx, emailOrPhone)
	}
	if err != nil {
		return "", domain.User{}, fmt.Errorf("user not found")
	}

	// log.Printf("LOGIN password RAW: '%s'", password)
	// log.Printf("LOGIN password BYTES: %v", []byte(password))
	// log.Printf("HASH FROM DB: '%s'", user.Password)

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", domain.User{}, fmt.Errorf("invalid password")
	}

	token, err := a.generateJWT(user)
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to generate token")
	}
	return token, user, nil
}

// for admin
func (a *Application) GetUserById(ctx context.Context, id int64) (domain.User, error) {
	user, err := a.db.GetById(ctx, id)
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by id: %w", err)
	}
	return user, nil
}

func (a *Application) GetUserByEmail(ctx context.Context, email string) (domain.User, error) {
	user, err := a.db.GetByEmail(ctx, email)
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by email: %w", err)
	}
	return user, nil
}

func (a *Application) GetUserByPhone(ctx context.Context, phone string) (domain.User, error) {
	user, err := a.db.GetByPhone(ctx, phone)
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by phone: %w", err)
	}
	return user, err
}

func (a *Application) GetMe(ctx context.Context) (domain.User, error) {
	userId, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.User{}, fmt.Errorf("invalid user id in context")
	}

	return a.db.GetById(ctx, userId)
}

// for admin
func (a *Application) ListUsers(ctx context.Context, limit, offset int) ([]domain.User, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	users, err := a.db.List(ctx, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}

	return users, nil
}

// for admin
func (a *Application) UpdateUser(ctx context.Context, user domain.User) (domain.User, error) {
	userId, ok := ctx.Value("user_id").(int64)
	if !ok {
		return domain.User{}, fmt.Errorf("invalid id in context")
	}

	role, ok := ctx.Value("role").(string)
	if !ok {
		return domain.User{}, fmt.Errorf("invalid role in context")
	}

	if role != domain.RoleAdmin && userId != user.UserId {
		return domain.User{}, fmt.Errorf("only admins or users itself are allowed to call UpdateUser!")
	}

	if user.UserId == 0 {
		return domain.User{}, fmt.Errorf("cannot update user with empty id")
	}

	uniquePhone, errPhone := a.db.GetByPhone(ctx, user.Phone)
	uniqueEmail, errEmail := a.db.GetByEmail(ctx, user.Email)

	if errEmail == nil && uniqueEmail.UserId != 0 && uniqueEmail.UserId != user.UserId {
		return domain.User{}, fmt.Errorf("email already in use by another user")
	}
	if errPhone == nil && uniquePhone.UserId != 0 && uniquePhone.UserId != user.UserId {
		return domain.User{}, fmt.Errorf("phone already in use by another user")
	}

	err := a.db.Update(ctx, &user)
	if err != nil {
		return domain.User{}, fmt.Errorf("update user %d failed: %w", user.UserId, err)
	}

	return user, nil
}

func (a *Application) PromoteToProvider(ctx context.Context) (string, string, error) {
	userID, ok := ctx.Value("user_id").(int64)
	if !ok || userID == 0 {
		return "", "", fmt.Errorf("user_id not found in context")
	}

	user, err := a.db.GetById(ctx, userID)
	if err != nil {
		return "", "", fmt.Errorf("failed to get user: %w", err)
	}

	if user.Role == domain.RoleAdmin {
		return "", "", status.Error(codes.PermissionDenied, "admins cannot become providers")
	}

	user.Role = domain.RoleProvider

	if err := a.db.Update(ctx, &user); err != nil {
		return "", "", fmt.Errorf("failed to update user role: %w", err)
	}

	newToken, err := a.generateJWT(user)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate new token: %w", err)
	}

	return string(user.Role), newToken, nil
}

func (a *Application) GetGoogleAuthURL(ctx context.Context) (string, error) {
	// state is a random string to prevent CSRF
	// in production use crypto/rand, for now a fixed string is fine to test
	state := "random-state-string"
	url := a.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return url, nil
}

func (a *Application) GoogleAuthCallback(ctx context.Context, code, state string) (string, domain.User, error) {
	// 1. Verify state (CSRF check)
	if state != "random-state-string" {
		return "", domain.User{}, fmt.Errorf("invalid state parameter")
	}

	// 2. Exchange code for tokens
	oauthToken, err := a.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to exchange code: %w", err)
	}

	// 3. Verify and decode the id_token
	provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to get oidc provider: %w", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: a.oauthConfig.ClientID})
	rawIDToken, ok := oauthToken.Extra("id_token").(string)
	if !ok {
		return "", domain.User{}, fmt.Errorf("no id_token in response")
	}

	idToken, err := verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to verify id_token: %w", err)
	}

	// 4. Extract claims
	var claims struct {
		Sub        string `json:"sub"` // Google's unique user ID
		Email      string `json:"email"`
		GivenName  string `json:"given_name"`
		FamilyName string `json:"family_name"`
		Picture    string `json:"picture"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return "", domain.User{}, fmt.Errorf("failed to parse claims: %w", err)
	}

	// 5. Find or create user
	user, err := a.db.GetUserByGoogleId(ctx, claims.Sub)
	if err != nil {
		// Not found by google_id — try by email (existing local account)
		user, err = a.db.GetByEmail(ctx, claims.Email)
		if err != nil {
			// No account at all — create new one
			user = domain.User{
				FirstName:    claims.GivenName,
				SecondName:   claims.FamilyName,
				Email:        claims.Email,
				Role:         domain.RoleCustomer,
				GoogleId:     claims.Sub,
				AvatarUrl:    claims.Picture,
				AuthProvider: "google",
			}

			count, err := a.db.Count(ctx)
			if err != nil {
				return "", domain.User{}, fmt.Errorf("failed to count users: %w", err)
			}
			if count == 0 {
				user.Role = domain.RoleAdmin
			}

			if err := a.db.Create(ctx, &user); err != nil {
				return "", domain.User{}, fmt.Errorf("failed to create user: %w", err)
			}
		} else {
			// Existing local account with same email — link Google to it
			user.GoogleId = claims.Sub
			user.AvatarUrl = claims.Picture
			user.AuthProvider = "google"
			if err := a.db.Update(ctx, &user); err != nil {
				return "", domain.User{}, fmt.Errorf("failed to link google account: %w", err)
			}
		}
	}

	// 6. Issue your JWT (same as existing login)
	token, err := a.generateJWT(user)
	if err != nil {
		return "", domain.User{}, fmt.Errorf("failed to generate token: %w", err)
	}

	return token, user, nil
}

func (a *Application) UpdateAvatar(ctx context.Context, avatarUrl string) (bool, error) {
	userId, ok := ctx.Value("user_id").(int64)
	if !ok {
		return false, fmt.Errorf("invalid user id in context")
	}

	user, err := a.db.GetById(ctx, userId)
	if err != nil {
		return false, fmt.Errorf("failed to get user: %w", err)
	}
	user.AvatarUrl = avatarUrl
	err = a.db.Update(ctx, &user)
	if err != nil {
		return false, fmt.Errorf("failed to update user avatar: %w", err)
	}
	return true, nil
}

func (a *Application) SubmitProviderApplication(ctx context.Context, documents []string) (domain.ProviderRequest, error) {
	userID := ctx.Value("user_id").(int64)

	existing, err := a.db.GetProviderRequestByUserId(ctx, userID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return domain.ProviderRequest{}, fmt.Errorf("failed to check existing request: %w", err)
	}

	if err == nil {
		// record exists — check status
		if existing.Status == domain.ProviderRequestStatusPending {
			return domain.ProviderRequest{}, fmt.Errorf("you already have a pending application")
		}
		if existing.Status == domain.ProviderRequestStatusApproved {
			return domain.ProviderRequest{}, fmt.Errorf("your application has already been approved")
		}
		// rejected — allow re-apply, fall through to create
	}

	if len(documents) == 0 {
		return domain.ProviderRequest{}, fmt.Errorf("at least one document is required")
	}

	request := domain.ProviderRequest{
		UserID:       userID,
		DocumentURLs: documents,
		Status:       domain.ProviderRequestStatusPending,
	}
	return a.db.CreateProviderRequest(ctx, &request)
}

func (a *Application) GetMyProviderRequest(ctx context.Context) (domain.ProviderRequest, error) {
	userId := ctx.Value("user_id").(int64)

	request, err := a.db.GetProviderRequestByUserId(ctx, userId)
	if err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("failed to get provider request: %w", err)
	}
	return request, nil
}

func (a *Application) ListProviderRequests(ctx context.Context, status string, limit, offset int) ([]domain.ProviderRequest, error) {
	role := ctx.Value("role").(string)
	if role != domain.RoleAdmin {
		return nil, fmt.Errorf("only admins can list provider requests")
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return a.db.ListProviderRequests(ctx, status, limit, offset)
}

func (a *Application) ApproveProviderRequest(ctx context.Context, requestID int64) (domain.ProviderRequest, error) {
	adminID := ctx.Value("user_id").(int64)
	role := ctx.Value("role").(string)
	if role != domain.RoleAdmin {
		return domain.ProviderRequest{}, fmt.Errorf("only admins can approve provider requests")
	}

	request, err := a.db.GetProviderRequestById(ctx, requestID) // correct method
	if err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("provider request not found: %w", err)
	}
	if request.Status != domain.ProviderRequestStatusPending {
		return domain.ProviderRequest{}, fmt.Errorf("only pending requests can be approved, current status: %s", request.Status)
	}

	request.Status = domain.ProviderRequestStatusApproved
	request.ReviewedBy = adminID

	updatedRequest, err := a.db.UpdateProviderRequest(ctx, &request)
	if err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("failed to update provider request: %w", err)
	}

	customerId := request.UserID
	customer, err := a.db.GetById(ctx, customerId)
	if err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("request approved but failed to get user: %w", err)
	}
	customer.Role = domain.RoleProvider

	if err := a.db.Update(ctx, &customer); err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("request approved but failed to update user role: %w", err)
	}

	return updatedRequest, nil
}

func (a *Application) RejectProviderRequest(ctx context.Context, requestID int64, reason string) (domain.ProviderRequest, error) {
	adminID := ctx.Value("user_id").(int64)
	role := ctx.Value("role").(string)
	if role != domain.RoleAdmin {
		return domain.ProviderRequest{}, fmt.Errorf("only admins can reject provider requests")
	}
	if reason == "" {
		return domain.ProviderRequest{}, fmt.Errorf("rejection reason is required")
	}

	request, err := a.db.GetProviderRequestById(ctx, requestID)
	if err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("provider request not found: %w", err)
	}
	if request.Status != domain.ProviderRequestStatusPending {
		return domain.ProviderRequest{}, fmt.Errorf("only pending requests can be rejected, current status: %s", request.Status)
	}

	request.Status = domain.ProviderRequestStatusRejected
	request.RejectionReason = reason
	request.ReviewedBy = adminID

	return a.db.UpdateProviderRequest(ctx, &request)
}

// private method for jwt generation
func (a *Application) generateJWT(u domain.User) (string, error) {
	claims := u.ToClaims()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(a.JWTSecret))
}

func (a *Application) GenerateTelegramToken(ctx context.Context, userId int64) (string, error) {
	log.Printf("GenerateTelegramToken called for userId: %d", userId)
	token := generateSecureToken()
	err := a.db.SetTelegramToken(ctx, userId, token)
	if err != nil {
		log.Printf("SetTelegramToken error: %v", err)
		return "", err
	}
	log.Printf("Token generated successfully: %s", token)
	return token, nil
}

func (a *Application) LinkTelegramByToken(ctx context.Context, token string, chatId int64) (domain.User, error) {
	return a.db.LinkTelegramByToken(ctx, token, chatId)
}

func (a *Application) GetUserByTelegramChatId(ctx context.Context, chatId int64) (domain.User, error) {
	return a.db.GetByTelegramChatId(ctx, chatId)
}

func generateSecureToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func (a *Application) GenerateJWTForUser(ctx context.Context, userId int64) (string, error) {
	user, err := a.db.GetById(ctx, userId)
	if err != nil {
		return "", fmt.Errorf("get user by id: %w", err)
	}
	return a.generateJWT(user)
}

//customer favorites

func (a *Application) AddFavoriteProvider(ctx context.Context, providerID int64) (bool, error) {
	customerId := ctx.Value("user_id").(int64)

	provider, err := a.db.GetById(ctx, providerID)
	if err != nil {
		return false, fmt.Errorf("provider not found: %w", err)
	}
	if provider.Role != "provider" {
		return false, fmt.Errorf("user is not a provider")
	}

	err = a.db.CreateFavorite(ctx, &domain.CustomerFavorite{
		CustomerID: customerId,
		ProviderID: providerID,
	})
	if err != nil {
		return false, fmt.Errorf("failed to add favorite: %w", err)
	}

	return true, nil
}

func (a *Application) RemoveFavoriteProvider(ctx context.Context, providerID int64) (bool, error) {
	customerId := ctx.Value("user_id").(int64)

	err := a.db.DeleteFavorite(ctx, customerId, providerID)
	if err != nil {
		return false, fmt.Errorf("failed to remove favorite: %w", err)
	}

	return true, nil
}

func (a *Application) ListFavoriteProviders(ctx context.Context, limit, offset int) ([]domain.FavoriteProvider, error) {
	customerId := ctx.Value("user_id").(int64)

	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	return a.db.ListFavorites(ctx, customerId, limit, offset)
}

func (a *Application) IsProviderFavorite(ctx context.Context, providerID int64) (bool, error) {
	customerId := ctx.Value("user_id").(int64)
	return a.db.IsFavorite(ctx, customerId, providerID)
}

func (a *Application) GetAnalytics(ctx context.Context) (*domain.UserAnalytics, error) {
	role, ok := ctx.Value("role").(string)
	if !ok {
		return nil, fmt.Errorf("role not found in context")
	}
	if role != domain.RoleAdmin {
		return nil, fmt.Errorf("only admins can access analytics")
	}

	return a.db.GetAnalytics(ctx)
}
