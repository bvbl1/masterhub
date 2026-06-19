package domain

import "time"

type Notification struct {
	ID        int64
	UserID    int64
	Title     string
	Body      string
	Type      string
	IsRead    bool
	CreatedAt time.Time
}
