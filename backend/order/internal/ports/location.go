package ports

import "context"

type LocationPort interface {
	CreateLocation(ctx context.Context, req CreateLocationRequest) (int64, error)
}

type CreateLocationRequest struct {
	Street    string  `json:"street"`
	City      string  `json:"city"`
	Region    string  `json:"region"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Location struct {
	ID        int64   `json:"id"`
	UserID    int64   `json:"user_id"`
	Street    string  `json:"street"`
	City      string  `json:"city"`
	Region    string  `json:"region"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
