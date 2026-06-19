package domain

type IncomingMessage struct {
	Type           string  `json:"type"`
	ConversationID int64   `json:"conversation_id"`
	RecipientID    int64   `json:"recipient_id"`
	Content        string  `json:"content"`
	MediaURL       *string `json:"media_url,omitempty"`
}

type OutgoingMessage struct {
	Type    string      `json:"type"`
	Message interface{} `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}
