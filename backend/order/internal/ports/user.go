package ports

import "context"

type UserPort interface {
	GetUserByID(ctx context.Context, userID int64) (User, error)
}

type User struct {
	ID    int64  `json:"id"`
	Role  string `json:"role"` // "customer" | "provider" | "admin"
	Email string `json:"email"`
}
