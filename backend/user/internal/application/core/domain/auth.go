package domain

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
}

func (u User) ToClaims() Claims {
	return Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", u.UserId),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
		UserID: u.UserId,
		Role:   u.Role,
	}
}
