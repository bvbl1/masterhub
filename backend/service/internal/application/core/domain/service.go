package domain

type Service struct {
	Id               int64    `json:"id"`
	ProviderId       int64    `json:"provider_id"`
	CategoryId       int64    `json:"category_id"`
	Title            string   `json:"title"`
	Description      string   `json:"description"`
	PriceStart       float64  `json:"price_start"`
	IsActive         bool     `json:"is_active"`
	PhotoUrls        []string `json:"photo_urls"`
	PhotoUrlsToAdd   []string `json:"photo_urls_to_add"`
	PhotoUrlsToRemove []string `json:"photo_urls_to_remove"`
	City             string   `json:"city"`
}
