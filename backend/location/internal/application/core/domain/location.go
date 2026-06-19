package domain

import "github.com/golang-jwt/jwt/v5"

type Location struct {
	ID        int64   `json:"id"`
	UserID    int64   `json:"user_id"`
	Street    string  `json:"street"`
	City      string  `json:"city"`
	Region    string  `json:"region"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
type Claims struct {
	jwt.RegisteredClaims
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
}
