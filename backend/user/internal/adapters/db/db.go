package db

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model                        // ID, CreatedAt, UpdatedAt, DeletedAt
	FirstName              string     `gorm:"type:varchar(100);not null"`
	SecondName             string     `gorm:"type:varchar(100);not null"`
	Email                  string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	Phone                  string     `gorm:"type:varchar(20);uniqueIndex"`
	Password               string     `gorm:"type:varchar(255);nullable"`
	Role                   string     `gorm:"type:varchar(50);not null"`
	GoogleId               string     `gorm:"type:varchar(255);nullable"`
	AvatarUrl              string     `gorm:"type:text;nullable"`
	AuthProvider           string     `gorm:"type:varchar(50);not null;default:local"`
	TelegramChatId         int64      `gorm:"default:0"`
	TelegramToken          string     `gorm:"type:varchar(64);nullable"`
	TelegramTokenExpiresAt *time.Time `gorm:"nullable"`
}

type ProviderRequest struct {
	gorm.Model
	UserID          int64          `gorm:"not null;index"`
	User            User           `gorm:"constraint:OnDelete:CASCADE;"`
	DocumentURLs    pq.StringArray `gorm:"type:text[]"`
	Status          string         `gorm:"type:varchar(50);not null;default:'pending';index"`
	RejectionReason string         `gorm:"type:text;nullable"`
	ReviewedBy      int64          `gorm:"nullable"` // admin user_id
}

type CustomerFavorite struct {
	gorm.Model
	CustomerID int64 `gorm:"not null;index"`
	ProviderID int64 `gorm:"not null;index"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsu string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsu), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&User{},
		&ProviderRequest{},
		&CustomerFavorite{},
	)
	if err != nil {
		return nil, err
	}

	if err := db.Exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_provider 
        ON customer_favorites(customer_id, provider_id, deleted_at)
    `).Error; err != nil {
		return nil, fmt.Errorf("failed to create unique index: %w", err)
	}

	if err := seedUsers(db); err != nil {
		log.Printf("Warning: failed to seed users: %v", err)
	}

	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, user *domain.User) error {
	userModel := User{
		FirstName:  user.FirstName,
		SecondName: user.SecondName,
		Email:      user.Email,
		Phone:      user.Phone,
		Password:   user.Password,
		Role:       user.Role,
	}

	res := a.db.Create(&userModel)
	if res.Error != nil {
		return res.Error
	}

	user.UserId = int64(userModel.ID)

	return nil
}

func (a *Adapter) GetById(ctx context.Context, id int64) (domain.User, error) {
	var userEntity User

	res := a.db.First(&userEntity, id)
	if res.Error != nil {
		return domain.User{}, res.Error
	}

	user := domain.User{
		UserId:     int64(userEntity.ID),
		FirstName:  userEntity.FirstName,
		SecondName: userEntity.SecondName,
		Email:      userEntity.Email,
		Phone:      userEntity.Phone,
		Role:       userEntity.Role,
		Password:   userEntity.Password,
		AvatarUrl:  userEntity.AvatarUrl,
	}
	return user, res.Error
}

func (a *Adapter) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	var userEntity User

	err := a.db.Where("email = ?", email).First(&userEntity).Error
	if err != nil {
		return domain.User{}, err
	}

	return domain.User{
		UserId:     int64(userEntity.ID),
		FirstName:  userEntity.FirstName,
		SecondName: userEntity.SecondName,
		Email:      userEntity.Email,
		Phone:      userEntity.Phone,
		Role:       userEntity.Role,
		Password:   userEntity.Password,
		AvatarUrl:  userEntity.AvatarUrl,
	}, nil
}

func (a *Adapter) GetByPhone(ctx context.Context, phone string) (domain.User, error) {
	var userEntity User

	err := a.db.Where("phone = ?", phone).First(&userEntity).Error
	if err != nil {
		return domain.User{}, err
	}

	return domain.User{
		UserId:     int64(userEntity.ID),
		FirstName:  userEntity.FirstName,
		SecondName: userEntity.SecondName,
		Email:      userEntity.Email,
		Phone:      userEntity.Phone,
		Role:       userEntity.Role,
		AvatarUrl:  userEntity.AvatarUrl,
	}, nil
}

func (a *Adapter) List(ctx context.Context, limit, offset int) ([]domain.User, error) {
	var userModels []User

	res := a.db.
		Limit(limit).
		Offset(offset).
		Find(&userModels)

	if res.Error != nil {
		return nil, res.Error
	}

	users := make([]domain.User, 0, len(userModels))
	for _, u := range userModels {
		users = append(users, domain.User{
			UserId:     int64(u.ID),
			FirstName:  u.FirstName,
			SecondName: u.SecondName,
			Email:      u.Email,
			Phone:      u.Phone,
			Role:       u.Role,
			AvatarUrl:  u.AvatarUrl,
		})
	}

	return users, nil
}

// should we add context to every method???
func (a *Adapter) Update(ctx context.Context, user *domain.User) error {
	updates := map[string]interface{}{
		"first_name":  user.FirstName,
		"second_name": user.SecondName,
		"email":       user.Email,
		"phone":       user.Phone,
		"role":        user.Role,
		"avatar_url":  user.AvatarUrl,
	}

	result := a.db.
		Model(&User{}).               // selecting table
		Where("id = ?", user.UserId). // WHERE id = ?
		Updates(updates)              // SET first_name = ?, second_name = ? ...

	if result.Error != nil {
		return fmt.Errorf("update user %d failed: %w", user.UserId, result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user %d not found or no changes made", user.UserId)
	}

	return nil
}

func (a *Adapter) Count(ctx context.Context) (int64, error) {
	var count int64
	err := a.db.WithContext(ctx).Model(&User{}).Count(&count).Error
	if err != nil {
		return 0, nil
	}
	return count, nil
}

func (a *Adapter) GetUserByGoogleId(ctx context.Context, googleId string) (domain.User, error) {
	var userEntity User

	err := a.db.Where("google_id = ?", googleId).First(&userEntity).Error
	if err != nil {
		return domain.User{}, err
	}

	return domain.User{
		UserId:       int64(userEntity.ID),
		FirstName:    userEntity.FirstName,
		SecondName:   userEntity.SecondName,
		Email:        userEntity.Email,
		Phone:        userEntity.Phone,
		Role:         userEntity.Role,
		GoogleId:     userEntity.GoogleId,
		AvatarUrl:    userEntity.AvatarUrl,
		AuthProvider: userEntity.AuthProvider,
	}, nil
}

func (a *Adapter) GetByTelegramChatId(ctx context.Context, chatId int64) (domain.User, error) {
	var userEntity User
	err := a.db.Where("telegram_chat_id = ?", chatId).First(&userEntity).Error
	if err != nil {
		return domain.User{}, err
	}
	return domain.User{
		UserId:         int64(userEntity.ID),
		FirstName:      userEntity.FirstName,
		SecondName:     userEntity.SecondName,
		Email:          userEntity.Email,
		Phone:          userEntity.Phone,
		Role:           userEntity.Role,
		TelegramChatId: userEntity.TelegramChatId,
	}, nil
}

func (a *Adapter) LinkTelegramByToken(ctx context.Context, token string, chatId int64) (domain.User, error) {
	var userEntity User
	err := a.db.Where("telegram_token = ?", token).First(&userEntity).Error
	if err != nil {
		return domain.User{}, fmt.Errorf("invalid or expired token")
	}

	if userEntity.TelegramTokenExpiresAt != nil && time.Now().After(*userEntity.TelegramTokenExpiresAt) {
		return domain.User{}, fmt.Errorf("invalid or expired token")
	}

	result := a.db.Model(&userEntity).Updates(map[string]interface{}{
		"telegram_chat_id":          chatId,
		"telegram_token":            "",
		"telegram_token_expires_at": nil,
	})
	if result.Error != nil {
		return domain.User{}, result.Error
	}

	return domain.User{
		UserId:    int64(userEntity.ID),
		FirstName: userEntity.FirstName,
		Role:      userEntity.Role,
	}, nil
}

func (a *Adapter) SetTelegramToken(ctx context.Context, userId int64, token string) error {
	expiresAt := time.Now().Add(15 * time.Minute)
	result := a.db.Model(&User{}).Where("id = ?", userId).Updates(map[string]interface{}{
		"telegram_token":            token,
		"telegram_token_expires_at": expiresAt,
	})
	return result.Error
}

func (a *Adapter) CreateProviderRequest(ctx context.Context, request *domain.ProviderRequest) (domain.ProviderRequest, error) {
	dbRequest := ProviderRequest{
		UserID:       request.UserID,
		DocumentURLs: pq.StringArray(request.DocumentURLs),
		Status:       string(request.Status),
	}

	if err := a.db.WithContext(ctx).Create(&dbRequest).Error; err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("failed to create provider request: %w", err)
	}

	return toDomainProviderRequest(dbRequest), nil
}

func (a *Adapter) GetProviderRequestById(ctx context.Context, requestID int64) (domain.ProviderRequest, error) {
	var dbRequest ProviderRequest

	err := a.db.WithContext(ctx).
		First(&dbRequest, requestID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ProviderRequest{}, gorm.ErrRecordNotFound
		}
		return domain.ProviderRequest{}, fmt.Errorf("failed to get provider request by id: %w", err)
	}

	return toDomainProviderRequest(dbRequest), nil
}

func (a *Adapter) GetProviderRequestByUserId(ctx context.Context, userID int64) (domain.ProviderRequest, error) {
	var dbRequest ProviderRequest

	err := a.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&dbRequest).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ProviderRequest{}, gorm.ErrRecordNotFound
		}
		return domain.ProviderRequest{}, fmt.Errorf("failed to get provider request by user id: %w", err)
	}

	return toDomainProviderRequest(dbRequest), nil
}

func (a *Adapter) ListProviderRequests(ctx context.Context, status string, limit, offset int) ([]domain.ProviderRequest, error) {
	var dbRequests []ProviderRequest

	query := a.db.WithContext(ctx).Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Limit(limit).Offset(offset).Find(&dbRequests).Error; err != nil {
		return nil, fmt.Errorf("failed to list provider requests: %w", err)
	}

	result := make([]domain.ProviderRequest, len(dbRequests))
	for i, r := range dbRequests {
		result[i] = toDomainProviderRequest(r)
	}

	return result, nil
}

func (a *Adapter) UpdateProviderRequest(ctx context.Context, request *domain.ProviderRequest) (domain.ProviderRequest, error) {
	var dbRequest ProviderRequest

	if err := a.db.WithContext(ctx).First(&dbRequest, request.ID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ProviderRequest{}, gorm.ErrRecordNotFound
		}
		return domain.ProviderRequest{}, fmt.Errorf("failed to find provider request for update: %w", err)
	}

	updates := map[string]any{
		"status":           string(request.Status),
		"rejection_reason": request.RejectionReason,
		"reviewed_by":      request.ReviewedBy,
	}

	if err := a.db.WithContext(ctx).Model(&dbRequest).Updates(updates).Error; err != nil {
		return domain.ProviderRequest{}, fmt.Errorf("failed to update provider request: %w", err)
	}

	return toDomainProviderRequest(dbRequest), nil
}

func toDomainProviderRequest(r ProviderRequest) domain.ProviderRequest {
	return domain.ProviderRequest{
		ID:              int64(r.ID),
		UserID:          r.UserID,
		DocumentURLs:    []string(r.DocumentURLs),
		Status:          r.Status,
		RejectionReason: r.RejectionReason,
		ReviewedBy:      r.ReviewedBy,
		CreatedAt:       r.CreatedAt,
		UpdatedAt:       r.UpdatedAt,
	}
}

//customer favorites

func (a *Adapter) CreateFavorite(ctx context.Context, favorite *domain.CustomerFavorite) error {
	fav := CustomerFavorite{
		CustomerID: favorite.CustomerID,
		ProviderID: favorite.ProviderID,
	}
	return a.db.WithContext(ctx).Create(&fav).Error
}

func (a *Adapter) DeleteFavorite(ctx context.Context, customerId, providerId int64) error {
	return a.db.WithContext(ctx).Where("customer_id = ? AND provider_id = ?", customerId, providerId).
		Delete(&CustomerFavorite{}).Error
}

func (a *Adapter) ListFavorites(ctx context.Context, customerId int64, limit, offset int) ([]domain.FavoriteProvider, error) {
	var users []User
	err := a.db.WithContext(ctx).
		Joins("JOIN customer_favorites ON customer_favorites.provider_id = users.id").
		Where("customer_favorites.customer_id = ? AND customer_favorites.deleted_at IS NULL", customerId).
		Limit(limit).
		Offset(offset).
		Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list favorites: %w", err)
	}

	providers := make([]domain.FavoriteProvider, len(users))
	for i, u := range users {
		providers[i] = domain.FavoriteProvider{
			ID:        int64(u.ID),
			FirstName: u.FirstName,
			LastName:  u.SecondName,
			AvatarUrl: u.AvatarUrl,
			Role:      u.Role,
		}
	}
	return providers, nil
}

func (a *Adapter) IsFavorite(ctx context.Context, customerId, providerId int64) (bool, error) {
	var count int64
	err := a.db.WithContext(ctx).
		Model(&CustomerFavorite{}).
		Where("customer_id = ? AND provider_id = ?", customerId, providerId).
		Count(&count).Error
	return count > 0, err
}

func (a *Adapter) GetAnalytics(ctx context.Context) (*domain.UserAnalytics, error) {
	var analytics domain.UserAnalytics

	// Total users
	if err := a.db.WithContext(ctx).
		Model(&User{}).
		Count(&analytics.TotalUsers).Error; err != nil {
		return nil, err
	}

	// New users this month
	now := time.Now().UTC()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	if err := a.db.WithContext(ctx).
		Model(&User{}).
		Where("created_at >= ?", startOfMonth).
		Count(&analytics.NewUserThisMonth).Error; err != nil {
		return nil, err
	}

	// Total providers
	if err := a.db.WithContext(ctx).
		Model(&User{}).
		Where("role = ?", "provider").
		Count(&analytics.TotalProviders).Error; err != nil {
		return nil, err
	}

	// Total customers
	if err := a.db.WithContext(ctx).
		Model(&User{}).
		Where("role = ?", "customer").
		Count(&analytics.TotalCustomers).Error; err != nil {
		return nil, err
	}

	// Pending provider applications
	if err := a.db.WithContext(ctx).
		Model(&ProviderRequest{}).
		Where("status = ?", "pending").
		Count(&analytics.PendingApplications).Error; err != nil {
		return nil, err
	}

	return &analytics, nil
}
