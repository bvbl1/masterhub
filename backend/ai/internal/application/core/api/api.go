package api

import (
	"context"
	"errors"
	"strings"

	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/ai/internal/ports"
)

type Service struct {
	ai ports.AIProvider
}

func New(ai ports.AIProvider) *Service {
	return &Service{
		ai: ai,
	}
}

func (s *Service) Chat(ctx context.Context, req domain.AIChatRequest) (*domain.AIChatResponse, error) {
	if strings.TrimSpace(req.Message) == "" {
		return nil, errors.New("message is required")
	}

	return s.ai.Chat(ctx, req)
}
