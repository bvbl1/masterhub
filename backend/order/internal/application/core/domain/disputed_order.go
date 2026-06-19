// domain/disputed_order.go
package domain

import "time"

type DisputedOrder struct {
	ID            int64     `json:"id"`
	OrderID       int64     `json:"order_id"`
	Order         Order     `json:"order"`
	DisputeReason string    `json:"dispute_reason"`
	RaisedBy      int64     `json:"raised_by"` // user_id from JWT
	CreatedAt     time.Time `json:"created_at"`
	PhotoUrls     []string  `json:"photo_urls,omitempty"`
}
