package domain

import "time"

type Conversation struct {
	ID            int64      `json:"id"`
	CustomerID    int64      `json:"customer_id"`
	ProviderID    int64      `json:"provider_id"`
	CreatedAt     time.Time  `json:"created_at"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`
}

type Message struct {
	ID             int64     `json:"id"`
	ConversationID int64     `json:"conversation_id"`
	SenderID       int64     `json:"sender_id"`
	Content        string    `json:"content"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
	MediaURL       *string   `json:"media_url,omitempty"`
}
