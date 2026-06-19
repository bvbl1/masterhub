package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
)

type DBPort interface {
	// GetOrCreateConversation needs these two:
	GetConversationByParticipants(ctx context.Context, customerID, providerID int64) (domain.Conversation, error)
	CreateConversation(ctx context.Context, customerID, providerID int64) (domain.Conversation, error)

	// ListConversations
	ListConversations(ctx context.Context, userID int64) ([]domain.Conversation, error)

	// GetMessages
	GetMessages(ctx context.Context, conversationID int64, limit, offset int32) ([]domain.Message, error)

	// MarkAsRead
	MarkAsRead(ctx context.Context, conversationID int64) error

	//websocket related
	CreateMessage(ctx context.Context, message domain.Message) (domain.Message, error)
	UpdateLastMessageAt(ctx context.Context, conversationID int64) error
}
