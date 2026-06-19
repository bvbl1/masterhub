package ports

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/domain"
)

type AIProvider interface {
	Chat(ctx context.Context, req domain.AIChatRequest) (*domain.AIChatResponse, error)
}
