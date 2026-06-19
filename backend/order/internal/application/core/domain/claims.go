package domain

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	jwt.RegisteredClaims
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
}

const (
	RoleCustomer = "customer"
	RoleProvider = "provider"
	RoleAdmin    = "admin"
)
