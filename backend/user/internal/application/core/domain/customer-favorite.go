package domain

type CustomerFavorite struct {
	ID         int64 `json:"id"`
	CustomerID int64 `json:"customer_id"`
	ProviderID int64 `json:"provider_id"`
}

type FavoriteProvider struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AvatarUrl string `json:"avatar_url"`
	Role      string `json:"role"`
}
