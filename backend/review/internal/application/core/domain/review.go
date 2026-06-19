package domain

import "time"

type Review struct {
	ID         int64     `json:"id"`
	OrderId    int64     `json:"order_id"`
	ServiceId  int64     `json:"service_id"`
	ReviewerId int64     `json:"reviewer_id"`
	ProviderId int64     `json:"provider_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	PhotoURLs  []string  `json:"photo_urls"`
	CreatedAt  time.Time `json:"created_at"`
}
