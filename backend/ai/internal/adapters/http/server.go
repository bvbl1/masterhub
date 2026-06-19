package httpadapter

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/api"
	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/domain"
)

type Server struct {
	service *api.Service
}

func New(service *api.Service) *Server {
	return &Server{
		service: service,
	}
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/v1/ai/chat", s.handleAIChat)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "ai",
	})
}

func (s *Server) handleAIChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "missing authorization token",
		})
		return
	}

	var req domain.AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid json",
		})
		return
	}

	resp, err := s.service.Chat(r.Context(), req)
	if err != nil {
		log.Printf("[ai] chat error: %v", err)

		if strings.Contains(err.Error(), "quota") ||
			strings.Contains(err.Error(), "429") {
			writeJSON(w, http.StatusTooManyRequests, map[string]string{
				"error": "AI quota limit exceeded. Try again later.",
			})
			return
		}

		if strings.Contains(err.Error(), "503") ||
			strings.Contains(err.Error(), "unavailable") ||
			strings.Contains(err.Error(), "high demand") {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"error": "AI model is overloaded. Try again later.",
			})
			return
		}

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "ai processing failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
