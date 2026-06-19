package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
)

type APIPort interface {
	GetOrCreateConversation(ctx context.Context, customerID, providerID int64) (domain.Conversation, error)
	ListConversations(ctx context.Context, userID int64) ([]domain.Conversation, error)
	GetMessages(ctx context.Context, conversationID int64, limit, offset int32) ([]domain.Message, error)
	MarkAsRead(ctx context.Context, conversationID int64) error

	// for WebSocket handler
	SendMessage(ctx context.Context, message domain.Message) (domain.Message, error)
}
