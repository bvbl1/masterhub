package domain

type ServiceFilter struct {
	ProviderID *int64
	CategoryID *int64
	OnlyActive bool
	City       *string
}
