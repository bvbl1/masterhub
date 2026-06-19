package domain

type OrderStatusCount struct {
	Status string
	Count  int64
}

type OrderAnalytics struct {
	TotalOrders      int64
	OrdersThisMonth  int64
	ByStatus         []OrderStatusCount
	TotalRevenue     float64
	RevenueThisMonth float64
	AvgOrderValue    float64
	CompletionRate   float64
}
