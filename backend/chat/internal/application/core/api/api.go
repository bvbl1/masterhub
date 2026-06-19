package api

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/chat/internal/ports"
)

type Adapter struct {
	db ports.DBPort
}

func NewAdapter(db ports.DBPort) *Adapter {
	return &Adapter{db: db}
}

func (a *Adapter) GetOrCreateConversation(ctx context.Context, customerID, providerID int64) (domain.Conversation, error) {
	// try to find existing first
	conversation, err := a.db.GetConversationByParticipants(ctx, customerID, providerID)
	if err == nil {
		return conversation, nil // already exists, return it
	}

	// not found, create new one
	conversation, err = a.db.CreateConversation(ctx, customerID, providerID)
	if err != nil {
		return domain.Conversation{}, fmt.Errorf("create conversation: %w", err)
	}
	return conversation, nil
}

func (a *Adapter) ListConversations(ctx context.Context, userID int64) ([]domain.Conversation, error) {
	res, err := a.db.ListConversations(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list conversations: %w", err)
	}
	return res, nil
}

func (a *Adapter) GetMessages(ctx context.Context, conversationID int64, limit, offset int32) ([]domain.Message, error) {
	res, err := a.db.GetMessages(ctx, conversationID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get messages: %w", err)
	}
	return res, nil
}

func (a *Adapter) MarkAsRead(ctx context.Context, conversationID int64) error {
	err := a.db.MarkAsRead(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("mark as read: %w", err)
	}
	return nil
}

func (a *Adapter) SendMessage(ctx context.Context, message domain.Message) (domain.Message, error) {
	res, err := a.db.CreateMessage(ctx, message)
	if err != nil {
		return domain.Message{}, fmt.Errorf("send message: %w", err)
	}

	if err := a.db.UpdateLastMessageAt(ctx, message.ConversationID); err != nil {
		return domain.Message{}, fmt.Errorf("update last message at: %w", err)
	}

	return res, nil
}
