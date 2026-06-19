package db

import (
	"context"
	"time"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Conversation struct {
	gorm.Model
	CustomerID    int64      `gorm:"not null;index"`
	ProviderID    int64      `gorm:"not null;index"`
	LastMessageAt *time.Time `gorm:"default:null"`
	Messages      []Message  `gorm:"foreignKey:ConversationID;constraint:OnDelete:CASCADE;"`
}

type Message struct {
	gorm.Model
	ConversationID int64        `gorm:"not null;index"`
	Conversation   Conversation `gorm:"constraint:OnDelete:CASCADE;"`
	SenderID       int64        `gorm:"not null"`
	Content        string       `gorm:"type:text;not null"`
	IsRead         bool         `gorm:"default:false"`
	MediaURL       *string      `gorm:"type:text;default:null"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Conversation{}, &Message{})
	if err != nil {
		return nil, err
	}

	return &Adapter{db: db}, nil
}

func (a *Adapter) GetConversationByParticipants(ctx context.Context, customerID, providerID int64) (domain.Conversation, error) {
	var model Conversation
	err := a.db.WithContext(ctx).
		Where("customer_id = ? AND provider_id = ?", customerID, providerID).
		First(&model).Error
	if err != nil {
		return domain.Conversation{}, err
	}
	return toConversationDomain(model), nil
}

func (a *Adapter) CreateConversation(ctx context.Context, customerID, providerID int64) (domain.Conversation, error) {
	model := Conversation{
		CustomerID: customerID,
		ProviderID: providerID,
	}
	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Conversation{}, err
	}
	return toConversationDomain(model), nil
}

func (a *Adapter) ListConversations(ctx context.Context, userID int64) ([]domain.Conversation, error) {
	var models []Conversation
	err := a.db.WithContext(ctx).
		Where("customer_id = ? OR provider_id = ?", userID, userID).
		Order("last_message_at DESC NULLS LAST").
		Find(&models).Error
	if err != nil {
		return nil, err
	}

	conversations := make([]domain.Conversation, len(models))
	for i, m := range models {
		conversations[i] = toConversationDomain(m)
	}
	return conversations, nil
}

func (a *Adapter) GetMessages(ctx context.Context, conversationID int64, limit, offset int32) ([]domain.Message, error) {
	var models []Message
	err := a.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Limit(int(limit)).
		Offset(int(offset)).
		Find(&models).Error
	if err != nil {
		return nil, err
	}

	messages := make([]domain.Message, len(models))
	for i, m := range models {
		messages[i] = toMessageDomain(m)
	}
	return messages, nil
}

func (a *Adapter) MarkAsRead(ctx context.Context, conversationID int64) error {
	return a.db.WithContext(ctx).
		Model(&Message{}).
		Where("conversation_id = ? AND is_read = false", conversationID).
		Update("is_read", true).Error
}

func (a *Adapter) CreateMessage(ctx context.Context, message domain.Message) (domain.Message, error) {
	model := Message{
		ConversationID: message.ConversationID,
		SenderID:       message.SenderID,
		Content:        message.Content,
		MediaURL:       message.MediaURL,
		IsRead:         false,
	}
	if err := a.db.WithContext(ctx).Create(&model).Error; err != nil {
		return domain.Message{}, err
	}
	return toMessageDomain(model), nil
}

func (a *Adapter) UpdateLastMessageAt(ctx context.Context, conversationID int64) error {
	now := time.Now()
	return a.db.WithContext(ctx).
		Model(&Conversation{}).
		Where("id = ?", conversationID).
		Update("last_message_at", now).Error
}

// helpers
func toConversationDomain(m Conversation) domain.Conversation {
	c := domain.Conversation{
		ID:         int64(m.ID),
		CustomerID: m.CustomerID,
		ProviderID: m.ProviderID,
		CreatedAt:  m.CreatedAt,
	}
	if m.LastMessageAt != nil {
		c.LastMessageAt = m.LastMessageAt
	}
	return c
}

func toMessageDomain(m Message) domain.Message {
	return domain.Message{
		ID:             int64(m.ID),
		ConversationID: m.ConversationID,
		SenderID:       m.SenderID,
		Content:        m.Content,
		MediaURL:       m.MediaURL,
		IsRead:         m.IsRead,
		CreatedAt:      m.CreatedAt,
	}
}
