package db

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Rask1lll/masterhub/backend/job-request/internal/application/core/domain"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type JobRequest struct {
	gorm.Model
	CustomerID    int64          `gorm:"not null;index"`
	CategoryID    int64          `gorm:"not null;index"`
	Title         string         `gorm:"type:varchar(255);not null"`
	Description   string         `gorm:"type:text"`
	City          string         `gorm:"type:varchar(255);not null"`
	BudgetMin     float64        `gorm:"type:numeric(10,2);not null"`
	BudgetMax     float64        `gorm:"type:numeric(10,2);not null"`
	ScheduledAt   time.Time      `gorm:"not null"`
	Status        string         `gorm:"type:varchar(50);not null;default:'open';index"`
	ResponseCount int32          `gorm:"not null;default:0"`
	PhotoURLs     pq.StringArray `gorm:"type:text[]"`
}

type JobRequestResponse struct {
	gorm.Model
	JobRequestID  int64      `gorm:"not null;index;constraint:OnDelete:CASCADE"`
	JobRequest    JobRequest `gorm:"foreignKey:JobRequestID"`
	ProviderID    int64      `gorm:"not null;index"`
	ProposedPrice float64    `gorm:"type:numeric(10,2);not null"`
	Comment       string     `gorm:"type:text"`
	EstimatedDays int32      `gorm:"not null;default:0"`
	Status        string     `gorm:"type:varchar(50);not null;default:'pending';index"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&JobRequest{}, &JobRequestResponse{})
	if err != nil {
		return nil, err
	}

	return &Adapter{db: db}, nil
}

//Mapping helpers

func toDBJobRequest(jr domain.JobRequest) JobRequest {
	return JobRequest{
		CustomerID:    jr.CustomerID,
		CategoryID:    jr.CategoryID,
		Title:         jr.Title,
		Description:   jr.Description,
		City:          jr.City,
		BudgetMin:     jr.BudgetMin,
		BudgetMax:     jr.BudgetMax,
		ScheduledAt:   jr.ScheduledAt,
		Status:        string(jr.Status),
		ResponseCount: jr.ResponseCount,
		PhotoURLs:     pq.StringArray(jr.PhotoUrls),
	}
}

func toDomainJobRequest(jr JobRequest) domain.JobRequest {
	return domain.JobRequest{
		ID:            int64(jr.ID),
		CustomerID:    jr.CustomerID,
		CategoryID:    jr.CategoryID,
		Title:         jr.Title,
		Description:   jr.Description,
		City:          jr.City,
		BudgetMin:     jr.BudgetMin,
		BudgetMax:     jr.BudgetMax,
		ScheduledAt:   jr.ScheduledAt,
		Status:        domain.JobRequestStatus(jr.Status),
		ResponseCount: jr.ResponseCount,
		CreatedAt:     jr.CreatedAt,
		UpdatedAt:     jr.UpdatedAt,
		PhotoUrls:     []string(jr.PhotoURLs),
	}
}

func toDBJobRequestResponse(r domain.JobRequestResponse) JobRequestResponse {
	return JobRequestResponse{
		JobRequestID:  r.JobRequestID,
		ProviderID:    r.ProviderID,
		ProposedPrice: r.ProposedPrice,
		Comment:       r.Comment,
		EstimatedDays: r.EstimatedDays,
		Status:        string(r.Status),
	}
}

func toDomainJobRequestResponse(r JobRequestResponse) domain.JobRequestResponse {
	return domain.JobRequestResponse{
		ID:            int64(r.ID),
		JobRequestID:  r.JobRequestID,
		ProviderID:    r.ProviderID,
		ProposedPrice: r.ProposedPrice,
		Comment:       r.Comment,
		EstimatedDays: r.EstimatedDays,
		Status:        domain.JobRequestResponseStatus(r.Status),
		CreatedAt:     r.CreatedAt,
		UpdatedAt:     r.UpdatedAt,
	}
}

//Job Request methods

func (a *Adapter) SaveJobRequest(ctx context.Context, jobRequest domain.JobRequest) (domain.JobRequest, error) {
	row := toDBJobRequest(jobRequest)
	if err := a.db.WithContext(ctx).Create(&row).Error; err != nil {
		return domain.JobRequest{}, fmt.Errorf("SaveJobRequest: %w", err)
	}
	return toDomainJobRequest(row), nil
}

func (a *Adapter) GetJobRequestByID(ctx context.Context, id int64) (domain.JobRequest, error) {
	var row JobRequest
	err := a.db.WithContext(ctx).First(&row, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.JobRequest{}, fmt.Errorf("GetJobRequestByID: %w", domain.ErrNotFound)
		}
		return domain.JobRequest{}, fmt.Errorf("GetJobRequestByID: %w", err)
	}
	return toDomainJobRequest(row), nil
}

func (a *Adapter) ListJobRequests(ctx context.Context, status string, categoryID int64, city string, limit, offset int32) ([]domain.JobRequest, error) {
	query := a.db.WithContext(ctx).Model(&JobRequest{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if categoryID != 0 {
		query = query.Where("category_id = ?", categoryID)
	}
	if city != "" {
		query = query.Where("city = ?", city)
	}
	if limit > 0 {
		query = query.Limit(int(limit))
	}
	if offset > 0 {
		query = query.Offset(int(offset))
	}

	var rows []JobRequest
	if err := query.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("ListJobRequests: %w", err)
	}

	result := make([]domain.JobRequest, len(rows))
	for i, row := range rows {
		result[i] = toDomainJobRequest(row)
	}
	return result, nil
}

func (a *Adapter) UpdateJobRequestStatus(ctx context.Context, id int64, status domain.JobRequestStatus) error {
	res := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("id = ?", id).
		Update("status", string(status))
	if res.Error != nil {
		return fmt.Errorf("UpdateJobRequestStatus: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("UpdateJobRequestStatus: %w", domain.ErrNotFound)
	}
	return nil
}

func (a *Adapter) IncrementResponseCount(ctx context.Context, jobRequestID int64) error {
	res := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("id = ?", jobRequestID).
		UpdateColumn("response_count", gorm.Expr("response_count + 1"))
	if res.Error != nil {
		return fmt.Errorf("IncrementResponseCount: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("IncrementResponseCount: %w", domain.ErrNotFound)
	}
	return nil
}

//Job Request Response methods

func (a *Adapter) SaveJobRequestResponse(ctx context.Context, response domain.JobRequestResponse) (domain.JobRequestResponse, error) {
	row := toDBJobRequestResponse(response)
	if err := a.db.WithContext(ctx).Create(&row).Error; err != nil {
		return domain.JobRequestResponse{}, fmt.Errorf("SaveJobRequestResponse: %w", err)
	}
	return toDomainJobRequestResponse(row), nil
}

func (a *Adapter) GetJobRequestResponseByID(ctx context.Context, id int64) (domain.JobRequestResponse, error) {
	var row JobRequestResponse
	err := a.db.WithContext(ctx).First(&row, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.JobRequestResponse{}, fmt.Errorf("GetJobRequestResponseByID: %w", domain.ErrNotFound)
		}
		return domain.JobRequestResponse{}, fmt.Errorf("GetJobRequestResponseByID: %w", err)
	}
	return toDomainJobRequestResponse(row), nil
}

func (a *Adapter) ListJobRequestResponses(ctx context.Context, jobRequestID int64, limit, offset int32) ([]domain.JobRequestResponse, error) {
	query := a.db.WithContext(ctx).
		Model(&JobRequestResponse{}).
		Where("job_request_id = ?", jobRequestID)

	if limit > 0 {
		query = query.Limit(int(limit))
	}
	if offset > 0 {
		query = query.Offset(int(offset))
	}

	var rows []JobRequestResponse
	if err := query.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("ListJobRequestResponses: %w", err)
	}

	result := make([]domain.JobRequestResponse, len(rows))
	for i, row := range rows {
		result[i] = toDomainJobRequestResponse(row)
	}
	return result, nil
}

func (a *Adapter) UpdateJobRequestResponseStatus(ctx context.Context, id int64, status domain.JobRequestResponseStatus) error {
	res := a.db.WithContext(ctx).
		Model(&JobRequestResponse{}).
		Where("id = ?", id).
		Update("status", string(status))
	if res.Error != nil {
		return fmt.Errorf("UpdateJobRequestResponseStatus: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("UpdateJobRequestResponseStatus: %w", domain.ErrNotFound)
	}
	return nil
}

func (a *Adapter) RejectAllOtherResponses(ctx context.Context, jobRequestID, acceptedResponseID int64) error {
	res := a.db.WithContext(ctx).
		Model(&JobRequestResponse{}).
		Where("job_request_id = ? AND id != ? AND status = ?", jobRequestID, acceptedResponseID, string(domain.StatusPending)).
		Update("status", string(domain.StatusRejected))
	if res.Error != nil {
		return fmt.Errorf("RejectAllOtherResponses: %w", res.Error)
	}
	return nil
}

func (a *Adapter) GetJobRequestAnalytics(ctx context.Context) (*domain.JobRequestAnalytics, error) {
	var analytics domain.JobRequestAnalytics

	now := time.Now().UTC()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Total job requests
	if err := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Count((*int64)(&analytics.TotalJobRequests)).Error; err != nil {
		return nil, err
	}

	// Job requests this month
	if err := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("created_at >= ?", startOfMonth).
		Count((*int64)(&analytics.JobRequestsThisMonth)).Error; err != nil {
		return nil, err
	}

	// Open job requests
	if err := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("status = ?", "open").
		Count((*int64)(&analytics.OpenJobRequests)).Error; err != nil {
		return nil, err
	}

	// Closed job requests
	if err := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("status = ?", "closed").
		Count((*int64)(&analytics.ClosedJobRequests)).Error; err != nil {
		return nil, err
	}

	// Cancelled job requests
	if err := a.db.WithContext(ctx).
		Model(&JobRequest{}).
		Where("status = ?", "cancelled").
		Count((*int64)(&analytics.CancelledJobRequests)).Error; err != nil {
		return nil, err
	}

	// Total responses
	if err := a.db.WithContext(ctx).
		Model(&JobRequestResponse{}).
		Count((*int64)(&analytics.TotalResponses)).Error; err != nil {
		return nil, err
	}

	// Responses this month
	if err := a.db.WithContext(ctx).
		Model(&JobRequestResponse{}).
		Where("created_at >= ?", startOfMonth).
		Count((*int64)(&analytics.ResponsesThisMonth)).Error; err != nil {
		return nil, err
	}

	return &analytics, nil
}
