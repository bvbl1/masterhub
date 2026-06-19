package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
	chatpb "github.com/bvbl1/masterhub-proto/golang/chat"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) GetOrCreateConversation(ctx context.Context, req *chatpb.GetOrCreateConversationRequest) (*chatpb.GetOrCreateConversationResponse, error) {
	customerID := ctx.Value("user_id").(int64)

	conv, err := a.api.GetOrCreateConversation(ctx, customerID, req.ProviderId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get or create conversation: %v", err)
	}

	return &chatpb.GetOrCreateConversationResponse{
		Conversation: toProtoConversation(conv),
	}, nil
}

func (a *Adapter) ListConversations(ctx context.Context, req *chatpb.ListConversationsRequest) (*chatpb.ListConversationsResponse, error) {
	userID := ctx.Value("user_id").(int64)

	convs, err := a.api.ListConversations(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list conversations: %v", err)
	}

	pbConvs := make([]*chatpb.Conversation, len(convs))
	for i, c := range convs {
		pbConvs[i] = toProtoConversation(c)
	}

	return &chatpb.ListConversationsResponse{Conversations: pbConvs}, nil
}

func (a *Adapter) GetMessages(ctx context.Context, req *chatpb.GetMessagesRequest) (*chatpb.GetMessagesResponse, error) {
	msgs, err := a.api.GetMessages(ctx, req.ConversationId, req.Limit, req.Offset)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get messages: %v", err)
	}

	pbMsgs := make([]*chatpb.Message, len(msgs))
	for i, m := range msgs {
		pbMsgs[i] = toProtoMessage(m)
	}

	return &chatpb.GetMessagesResponse{Messages: pbMsgs}, nil
}

func (a *Adapter) MarkAsRead(ctx context.Context, req *chatpb.MarkAsReadRequest) (*chatpb.MarkAsReadResponse, error) {
	err := a.api.MarkAsRead(ctx, req.ConversationId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "mark as read: %v", err)
	}

	return &chatpb.MarkAsReadResponse{Success: true}, nil
}

// helpers
func toProtoConversation(c domain.Conversation) *chatpb.Conversation {
	conv := &chatpb.Conversation{
		Id:         c.ID,
		CustomerId: c.CustomerID,
		ProviderId: c.ProviderID,
		CreatedAt:  c.CreatedAt.String(),
	}
	if c.LastMessageAt != nil {
		conv.LastMessageAt = c.LastMessageAt.String()
	}
	return conv
}

func toProtoMessage(m domain.Message) *chatpb.Message {
	msg := &chatpb.Message{
		Id:             m.ID,
		ConversationId: m.ConversationID,
		SenderId:       m.SenderID,
		Content:        m.Content,
		IsRead:         m.IsRead,
		CreatedAt:      m.CreatedAt.String(),
	}
	if m.MediaURL != nil {
		msg.MediaUrl = m.MediaURL
	}
	return msg
}
