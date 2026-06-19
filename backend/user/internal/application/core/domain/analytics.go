package domain

type UserAnalytics struct {
	TotalUsers          int64
	NewUserThisMonth    int64
	TotalProviders      int64
	TotalCustomers      int64
	PendingApplications int64
}
