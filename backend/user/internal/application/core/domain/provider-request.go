package domain

import "time"

const (
	ProviderRequestStatusPending  = "pending"
	ProviderRequestStatusApproved = "approved"
	ProviderRequestStatusRejected = "rejected"
)

type ProviderRequest struct {
	ID              int64     `json:"id"`
	UserID          int64     `json:"user_id"`
	DocumentURLs    []string  `json:"document_urls"`
	Status          string    `json:"status"` // "pending", "approved", "rejected"
	RejectionReason string    `json:"rejection_reason,omitempty"`
	ReviewedBy      int64     `json:"reviewed_by,omitempty"` // admin user_id
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func CanTransitionStatus(current, new string) bool {
	switch current {
	case ProviderRequestStatusPending:
		return new == ProviderRequestStatusApproved || new == ProviderRequestStatusRejected
	case ProviderRequestStatusApproved:
		return new == ProviderRequestStatusRejected
	case ProviderRequestStatusRejected:
		return false
	default:
		return false
	}
}
